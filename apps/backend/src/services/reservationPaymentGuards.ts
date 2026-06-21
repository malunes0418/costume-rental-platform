import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";

export async function assertInitialPaymentApprovedForVendorReview(reservation: Reservation) {
  const approvedPayments = await Payment.findAll({
    where: {
      user_id: reservation.user_id,
      payment_purpose: "INITIAL_RESERVATION",
      status: "APPROVED"
    },
    order: [["created_at", "DESC"]]
  });
  const payment = approvedPayments.find(
    (candidate) =>
      Array.isArray(candidate.reservation_ids) &&
      candidate.reservation_ids.some((id) => Number(id) === Number(reservation.id))
  );

  if (!payment) {
    throw new Error("Initial payment must be verified before vendor review");
  }
}

export async function assertNoBlockingPaymentForRenterCancel(reservation: Reservation) {
  const payments = await Payment.findAll({
    where: { user_id: reservation.user_id },
    order: [["created_at", "DESC"]]
  });
  const blockingPayment = payments.find(
    (payment) =>
      Array.isArray(payment.reservation_ids) &&
      payment.reservation_ids.some((id) => Number(id) === Number(reservation.id)) &&
      (payment.status === "PENDING" || payment.status === "APPROVED")
  );

  if (blockingPayment) {
    throw new Error("This reservation cannot be cancelled while payment verification is pending or approved");
  }
}
