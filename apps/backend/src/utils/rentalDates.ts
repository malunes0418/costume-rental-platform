export function assertValidRentalRange(startDate: Date, endDate: Date) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("startDate and endDate must be valid dates");
  }

  if (endDate.getTime() < startDate.getTime()) {
    throw new Error("endDate must be on or after startDate");
  }
}
