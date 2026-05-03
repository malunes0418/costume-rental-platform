export function resolveApiAsset(url: string): string {
  if (!url) return url;
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Already a data URL
  if (url.startsWith("data:")) return url;
  // Bare base64 — images stored without the data:image/... prefix
  // Heuristic: if the string contains no slashes and looks like base64 characters
  if (/^[A-Za-z0-9+/]+=*$/.test(url.substring(0, 40))) {
    return `data:image/jpeg;base64,${url}`;
  }
  // Relative path — prefix with API base
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

