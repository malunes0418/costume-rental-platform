export interface VendorApplyRequest {
  business_name?: string;
  bio?: string;
}

export interface CostumeStatusUpdateRequest {
  status: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";
}

export interface MessageCreateRequest {
  content: string;
}

export interface VendorReservationSurchargeRequest {
  amount: number | string;
  note: string;
}

export type VendorPaymentMethodType = "GCASH" | "MAYA" | "BANK" | "OTHER";

export interface VendorPaymentMethodInput {
  method_type: VendorPaymentMethodType;
  label: string;
  account_name: string;
  account_number: string;
  bank_name?: string | null;
  instructions?: string | null;
  is_active?: boolean;
  sort_order?: number;
}
