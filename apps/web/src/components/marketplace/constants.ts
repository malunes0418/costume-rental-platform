export const sortOptions = [
  { value: "_newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
] as const;

/**
 * Values must match costume.category strings stored in the API/DB.
 * TODO: make filtering robust — shared taxonomy or API-driven facets
 * so hardcoded labels can’t drift from stored categories again.
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
];

export function categoryLabel(value: string) {
  return categoryFilters.find((c) => c.value === value)?.label ?? value;
}
