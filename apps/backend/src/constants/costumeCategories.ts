export const OTHER_CATEGORY = "Other" as const;

export const PLATFORM_CATEGORIES = [
  "Superheroes",
  "Horror & Halloween",
  "Historical & Fantasy",
  "Anime & Gaming",
  "Movies & TV",
  "Theatrical",
  "Sci-Fi",
  OTHER_CATEGORY
] as const;

export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

/** Platform categories used for browse filters — excludes catch-all Other. */
export const KNOWN_BROWSE_CATEGORIES = PLATFORM_CATEGORIES.filter(
  (category) => category !== OTHER_CATEGORY
);

export function isPlatformCategory(value: string): value is PlatformCategory {
  return (PLATFORM_CATEGORIES as readonly string[]).includes(value);
}

export function isKnownBrowseCategory(value: string): boolean {
  return (KNOWN_BROWSE_CATEGORIES as readonly string[]).includes(value);
}
