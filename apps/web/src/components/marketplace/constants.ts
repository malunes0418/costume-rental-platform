export const sortOptions = [
  { value: "_newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
] as const;

/** Must stay identical to backend `PLATFORM_CATEGORIES`. */
export const PLATFORM_CATEGORIES = [
  "Superheroes",
  "Horror & Halloween",
  "Historical & Fantasy",
  "Anime & Gaming",
  "Movies & TV",
  "Theatrical",
  "Sci-Fi",
  "Other",
] as const;

export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

export const OTHER_CATEGORY = "Other" as const;

/**
 * Values must match costume.category strings stored in the API/DB.
 */
export const categoryFilters = [
  { value: "", label: "All" },
  { value: "Superheroes", label: "Superheroes" },
  { value: "Horror & Halloween", label: "Halloween" },
  { value: "Historical & Fantasy", label: "Historical" },
  { value: "Anime & Gaming", label: "Anime" },
  { value: "Movies & TV", label: "Movies & TV" },
  { value: "Theatrical", label: "Theatrical" },
  { value: "Sci-Fi", label: "Sci-Fi" },
  { value: "Other", label: "Other" },
];

export function isPlatformCategory(value: string | null | undefined): value is PlatformCategory {
  return !!value && (PLATFORM_CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(value: string) {
  return categoryFilters.find((c) => c.value === value)?.label ?? value;
}

/** Shopper-facing category text (custom Other label, platform value, or legacy string). */
export function displayCategory(costume: {
  category?: string | null;
  category_label?: string | null;
}): string | null {
  const category = costume.category?.trim() || null;
  if (!category) return null;

  if (category === OTHER_CATEGORY) {
    const label = costume.category_label?.trim();
    return label || OTHER_CATEGORY;
  }

  return category;
}

/** Browse/filter URL value for a stored category (legacy free-text → Other). */
export function browseCategoryParam(category: string | null | undefined): string | null {
  if (!category?.trim()) return null;
  if (isPlatformCategory(category)) return category;
  return OTHER_CATEGORY;
}
