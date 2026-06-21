export const HANDOFF_PROOF_TYPES = [
  "outbound_dispatch",
  "renter_received",
  "return_initiated",
  "vendor_return"
] as const;

export type HandoffProofType = (typeof HANDOFF_PROOF_TYPES)[number];

const PROOF_COLUMN_BY_TYPE: Record<
  HandoffProofType,
  "outbound_dispatch_proof_url" | "renter_received_proof_url" | "return_initiated_proof_url" | "vendor_return_proof_url"
> = {
  outbound_dispatch: "outbound_dispatch_proof_url",
  renter_received: "renter_received_proof_url",
  return_initiated: "return_initiated_proof_url",
  vendor_return: "vendor_return_proof_url"
};

export function isHandoffProofType(value: string): value is HandoffProofType {
  return HANDOFF_PROOF_TYPES.includes(value as HandoffProofType);
}

export function getHandoffProofColumn(type: HandoffProofType) {
  return PROOF_COLUMN_BY_TYPE[type];
}

export function buildHandoffProofApiUrl(reservationId: number, type: HandoffProofType) {
  return `/api/reservations/${reservationId}/handoff-proofs/${type}`;
}

type FulfillmentProofFields = {
  outbound_dispatch_proof_url?: string | null;
  renter_received_proof_url?: string | null;
  return_initiated_proof_url?: string | null;
  vendor_return_proof_url?: string | null;
};

export function presentFulfillmentHandoffProofs<T extends FulfillmentProofFields>(
  reservationId: number,
  fulfillment: T | null | undefined
) {
  if (!fulfillment) {
    return fulfillment ?? null;
  }

  return {
    ...fulfillment,
    outbound_dispatch_proof_url: fulfillment.outbound_dispatch_proof_url
      ? buildHandoffProofApiUrl(reservationId, "outbound_dispatch")
      : null,
    renter_received_proof_url: fulfillment.renter_received_proof_url
      ? buildHandoffProofApiUrl(reservationId, "renter_received")
      : null,
    return_initiated_proof_url: fulfillment.return_initiated_proof_url
      ? buildHandoffProofApiUrl(reservationId, "return_initiated")
      : null,
    vendor_return_proof_url: fulfillment.vendor_return_proof_url
      ? buildHandoffProofApiUrl(reservationId, "vendor_return")
      : null
  };
}

export function isProtectedHandoffProofUrl(proofUrl: string | null | undefined) {
  if (!proofUrl) return false;
  return (
    proofUrl.includes("outbound_dispatch") ||
    proofUrl.includes("renter_received") ||
    proofUrl.includes("return_initiated") ||
    proofUrl.includes("vendor_return") ||
    HANDOFF_PROOF_TYPES.some((type) => proofUrl.endsWith(`/${type}`))
  );
}
