export function getPagination(page?: number, pageSize?: number) {
  const p = page && page > 0 ? page : 1;
  const size = pageSize && pageSize > 0 ? pageSize : 20;
  const offset = (p - 1) * size;
  const limit = size;
  return { offset, limit, page: p, pageSize: size };
}
