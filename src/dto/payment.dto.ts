import type { PaymentAttributes } from "../models/Payment";

/** Multipart fields for `POST /payments/proof` (often arrive as strings). */
export interface UploadPaymentProofRequest {
  reservationId: number | string;
  amount: number | string;
}

export type UploadPaymentProofResponse = PaymentAttributes;

export type MyPaymentsResponse = PaymentAttributes[];
