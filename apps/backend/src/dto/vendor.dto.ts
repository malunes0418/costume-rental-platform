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
