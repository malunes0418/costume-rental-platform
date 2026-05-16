import type { PaymentAttributes } from "../models/Payment";

/** Multipart fields for `POST /payments/proof` (often arrive as strings). */
export interface UploadPaymentProofRequest {
  reservationIds: string | string[]; // Can be an array of IDs or a stringified JSON array
  amount: number | string;
}

export type UploadPaymentProofResponse = PaymentAttributes;

export type MyPaymentsResponse = PaymentAttributes[];
