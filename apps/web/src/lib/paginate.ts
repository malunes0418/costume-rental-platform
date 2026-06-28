export function resolvePageSize(value: string) {
  if (value === "all") return Number.POSITIVE_INFINITY;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number) {
  if (!Number.isFinite(pageSize) || pageSize >= items.length) {
    return {
      items,
      totalPages: 1,
      page: 0,
      start: items.length === 0 ? 0 : 1,
      end: items.length
    };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const startIndex = safePage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);

  return {
    items: items.slice(startIndex, endIndex),
    totalPages,
    page: safePage,
    start: items.length === 0 ? 0 : startIndex + 1,
    end: endIndex
  };
}
