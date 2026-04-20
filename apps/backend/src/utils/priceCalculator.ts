export function calculateReservationPrice(days: number, items: { pricePerDay: number; quantity: number }[]) {
  let total = 0;
  for (const item of items) {
    total += item.pricePerDay * days * item.quantity;
  }
  return total;
}
