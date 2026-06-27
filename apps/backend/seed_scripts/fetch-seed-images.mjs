/**
 * Fetches costume images via Google Image Search using "<costume_name> cosplay".
 *
 * Configure ONE of these in apps/backend/.env:
 *   SERPER_API_KEY=...          (recommended — https://serper.dev, Google image results)
 *   GOOGLE_CSE_API_KEY=...      (Google Custom Search JSON API)
 *   GOOGLE_CSE_CX=...           (Programmable Search Engine ID with Image Search enabled)
 *
 * Run: npm run seed:images
 */
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { COSTUME_CATALOG } from "./costume-catalog.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

const OUT = join(__dirname, "seed-images.json");
const SEARCH_DELAY_MS = 400;
const DOWNLOAD_DELAY_MS = 300;

const DESCRIPTOR_WORDS = new Set([
  "the", "and", "classic", "mercenary", "armor", "robes", "gown", "onesie", "warrior",
  "explorer", "hacker", "inventor", "noble", "speedster", "wayfinder",
  "saiyan", "asgardian", "kryptonian", "ball", "frozen", "dark", "knight", "mk50",
  "beauty", "beast", "reaper", "skeleton", "nutcracker", "classical",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function primaryQuery(costume) {
  return `${costume.name} cosplay`;
}

function fallbackQueries(costume) {
  const terms = costume.name
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !DESCRIPTOR_WORDS.has(w));

  const queries = [];
  if (terms.length >= 2) queries.push(`${terms.slice(0, 2).join(" ")} cosplay`);
  if (terms.length >= 1) queries.push(`${terms[0]} cosplay`);
  if (costume.theme) queries.push(`${costume.theme} cosplay`);

  return queries.filter((q) => q !== primaryQuery(costume));
}

function googleProvider() {
  if (process.env.SERPER_API_KEY) return "serper";
  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX) return "cse";
  return null;
}

function assertGoogleConfigured() {
  const provider = googleProvider();
  if (!provider) {
    throw new Error(
      "Google image search is not configured. Add SERPER_API_KEY (recommended) or " +
        "GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX to apps/backend/.env"
    );
  }
  return provider;
}

async function searchGoogleImages(query) {
  const provider = assertGoogleConfigured();
  if (provider === "serper") return searchSerperImages(query);
  return searchGoogleCseImages(query);
}

async function searchSerperImages(query) {
  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper Google Images failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.images || []).map((img, index) => ({
    id: `google-${index}-${hashUrl(img.imageUrl)}`,
    title: img.title || "",
    imageUrl: img.imageUrl,
    thumbnailUrl: img.thumbnailUrl,
    rank: index + 1,
    source: "google-serper",
  }));
}

async function searchGoogleCseImages(query) {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_CSE_API_KEY,
    cx: process.env.GOOGLE_CSE_CX,
    q: query,
    searchType: "image",
    num: "10",
    safe: "active",
  });

  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Google CSE failed (${res.status})`);
  }

  return (data.items || []).map((item, index) => ({
    id: `google-${index}-${hashUrl(item.link)}`,
    title: item.title || item.snippet || "",
    imageUrl: item.link,
    thumbnailUrl: item.image?.thumbnailLink,
    rank: index + 1,
    source: "google-cse",
  }));
}

function hashUrl(url) {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function isBadImageUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) return true;
  if (url.includes("gstatic.com/images/branding")) return true;
  if (url.endsWith(".svg")) return true;
  return false;
}

function mimeFromContentType(contentType) {
  if (!contentType) return "image/jpeg";
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return mime.startsWith("image/") ? mime : "image/jpeg";
}

async function fetchAsDataUri(url, retries = 3) {
  const candidates = [url];
  if (url.includes("?")) {
    candidates.push(url.split("?")[0]);
  }

  let lastError = null;

  for (const candidate of candidates) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(1000 * attempt);

      try {
        const res = await fetch(candidate, {
          headers: {
            "User-Agent": "costume-rental-platform-seed/1.0",
            Accept: "image/*,*/*;q=0.8",
          },
          redirect: "follow",
        });

        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
          lastError = new Error(`Not an image: ${contentType}`);
          continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 500) {
          lastError = new Error("Image too small");
          continue;
        }

        const mime = mimeFromContentType(contentType);
        return `data:${mime};base64,${buffer.toString("base64")}`;
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error(`Download failed: ${url}`);
}

async function findImageForCostume(costume) {
  const queries = [primaryQuery(costume), ...fallbackQueries(costume)];

  for (const query of queries) {
    await sleep(SEARCH_DELAY_MS);
    const results = await searchGoogleImages(query);

    for (const result of results) {
      const url = result.imageUrl || result.thumbnailUrl;
      if (isBadImageUrl(url)) continue;

      try {
        await sleep(DOWNLOAD_DELAY_MS);
        const dataUri = await fetchAsDataUri(url);
        return { ...result, query, downloadUrl: url, dataUri };
      } catch {
        // try next Google result
      }
    }
  }

  return null;
}

const provider = assertGoogleConfigured();
console.log(
  `Searching Google Images for ${COSTUME_CATALOG.length} costumes ("<name> cosplay") via ${provider}...`
);

const images = {};
const sources = [];
const downloadCache = new Map();

for (const costume of COSTUME_CATALOG) {
  const expectedQuery = primaryQuery(costume);
  process.stdout.write(`  ${expectedQuery}... `);

  const result = await findImageForCostume(costume);

  if (!result) {
    console.log("NO MATCH");
    throw new Error(`No Google image found for: ${costume.name}`);
  }

  if (!downloadCache.has(result.downloadUrl)) {
    downloadCache.set(result.downloadUrl, result.dataUri);
  }

  const dataUri = downloadCache.get(result.downloadUrl);
  images[costume.slug] = dataUri;
  sources.push({
    slug: costume.slug,
    name: costume.name,
    query: result.query,
    provider: result.source,
    usedFallback: result.query !== expectedQuery,
    rank: result.rank,
    imageId: result.id,
    alt: result.title || null,
    sourceUrl: result.downloadUrl,
    bytes: Math.round((dataUri.length * 3) / 4),
  });

  const altPreview = (result.title || "no title").slice(0, 55);
  const fallbackNote = result.query !== expectedQuery ? ` [fallback: ${result.query}]` : "";
  console.log(`OK (google #${result.rank})${fallbackNote} — ${altPreview}`);
}

writeFileSync(
  OUT,
  JSON.stringify({ fetchedAt: new Date().toISOString(), provider, sources, images }, null, 2),
  "utf8"
);

console.log(`\nWrote ${OUT} (${Object.keys(images).length} costumes)`);
