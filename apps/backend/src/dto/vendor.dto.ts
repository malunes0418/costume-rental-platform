export interface VendorApplyRequest {
  business_name?: string;
  bio?: string;
}

export interface CostumeStatusUpdateRequest {
  status: "ACTIVE" | "HIDDEN" | "FLAGGED";
}

export interface MessageCreateRequest {
  content: string;
}
