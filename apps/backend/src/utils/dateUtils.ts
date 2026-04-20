export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA <= endB && startB <= endA;
}

export function getDateRange(start: Date, end: Date) {
  const dates: Date[] = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function countDaysInclusive(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return days < 1 ? 1 : days;
}
