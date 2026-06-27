export const sortOptions = [
  { value: "_newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
] as const;

export const categoryFilters = [
  { value: "", label: "All" },
  { value: "superhero", label: "Superhero" },
  { value: "halloween", label: "Halloween" },
  { value: "historical", label: "Historical" },
  { value: "fantasy", label: "Fantasy" },
  { value: "anime", label: "Anime" },
  { value: "theatrical", label: "Theatrical" },
  { value: "vintage", label: "Vintage" },
  { value: "sci_fi", label: "Sci-Fi" },
];

export function categoryLabel(value: string) {
  return categoryFilters.find((c) => c.value === value)?.label ?? value;
}
