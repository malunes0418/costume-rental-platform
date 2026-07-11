import { apiFetch } from "./api";
import type { ReservationAdjustment, ReservationFulfillment } from "./fulfillment";
import type { PricingMode } from "./pricing";
import type { ReservationStatus, VendorReservationStatus } from "./reservationStatus";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number;
  name?: string;
  email?: string;
  role: string;
  created_at?: string;
};

export type AdminReservation = {
  id: number;
  user_id: number;
  status: ReservationStatus;
  vendor_status?: VendorReservationStatus;
  start_date: string;
  end_date: string;
  total_price: number;
  currency?: string;
  created_at?: string;
  items?: any[];
  fulfillment?: ReservationFulfillment | null;
  adjustments?: ReservationAdjustment[];
  User?: { name?: string; email?: string };
};

export type AdminInventoryVendor = {
  user_id: number;
  name?: string;
  email?: string;
  vendor_status?: string;
  business_name?: string;
  bio?: string;
};

export type AdminInventoryItem = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  size?: string | null;
  gender?: string | null;
  theme?: string | null;
  stock: number;
  pricing_mode: PricingMode;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  deposit_amount?: number;
  status?: string;
  is_active?: boolean;
  owner_id?: number | null;
  created_at?: string;
  updated_at?: string;
  vendor?: AdminInventoryVendor | null;
};

export type AdminInventoryListParams = {
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type AdminInventoryListResponse = {
  data: AdminInventoryItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CostumeModerationStatus = "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";

export type PendingVendor = {
  id: number;
  user_id: number;
  store_name?: string;
  business_name?: string;
  bio?: string;
  id_document_url?: string;
  review_note?: string | null;
  reviewed_at?: string | null;
  status: string;
  created_at?: string;
  User?: { name?: string; email?: string };
};

export type AdminOverviewResponse = {
  queues: {
    pendingVendors: number;
    flaggedCostumes: number;
    openReports: number;
    openDisputes: number;
    pendingPayouts: number;
  };
  kpis: {
    activeReservations: number;
    totalReservations: number;
    totalUsers: number;
  };
  series: {
    reservationsLast7Days: number[];
    quotedValueLast7Days: number[];
  };
  statusBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    label: string;
    sub: string;
    amount: number;
    status: string;
    date?: string;
  }>;
};

export type ContentReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";
export type ContentReportTargetType = "COSTUME" | "USER" | "REVIEW" | "OTHER";

export type AdminContentReport = {
  id: number;
  reporter_id?: number | null;
  target_type: ContentReportTargetType;
  target_id: number;
  reason: string;
  details?: string | null;
  status: ContentReportStatus;
  resolution_note?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  created_at?: string;
  reporter?: { id: number; name?: string; email?: string } | null;
  resolver?: { id: number; name?: string; email?: string } | null;
  target?: Record<string, unknown> | null;
};

export type AdminModerationQueueResponse = {
  tab: "flagged" | "reports";
  data: AdminInventoryItem[] | AdminContentReport[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminAuditLog = {
  id: number;
  actor_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  actor?: { id: number; name?: string; email?: string } | null;
};

export type AdminAuditListResponse = {
  data: AdminAuditLog[];
  page: number;
  pageSize: number;
  total: number;
};

export type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

export type AdminDisputeMessage = {
  id: number;
  dispute_id: number;
  author_id: number;
  body: string;
  created_at?: string;
  author?: { id: number; name?: string; email?: string } | null;
};

export type AdminDispute = {
  id: number;
  reservation_id: number;
  opened_by: number;
  against_user_id?: number | null;
  subject: string;
  status: DisputeStatus;
  resolution_note?: string | null;
  created_at?: string;
  updated_at?: string;
  opener?: { id: number; name?: string; email?: string } | null;
  againstUser?: { id: number; name?: string; email?: string } | null;
  reservation?: {
    id: number;
    status: string;
    total_price: number;
    start_date: string;
    end_date: string;
    user_id: number;
  } | null;
  messages?: AdminDisputeMessage[];
};

export type AdminDisputeListResponse = {
  data: AdminDispute[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminVendorBalance = {
  vendor_id: number;
  name?: string;
  email?: string;
  business_name?: string | null;
  available_balance: number;
  held_balance: number;
  pending_payout_balance: number;
  paid_total: number;
  gross_total: number;
};

export type AdminVendorBalanceListResponse = {
  data: AdminVendorBalance[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminPayout = {
  id: number;
  vendor_id: number;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  payment_method_snapshot?: Record<string, unknown> | null;
  notes?: string | null;
  failure_reason?: string | null;
  created_by: number;
  paid_at?: string | null;
  created_at?: string;
  vendor?: { id: number; name?: string; email?: string } | null;
  entries?: Array<Record<string, unknown>>;
};

export type AdminPayoutListResponse = {
  data: AdminPayout[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminPlatformSettings = {
  platform_fee_rate: number;
  feature_flags: {
    moderation_enabled: boolean;
    disputes_enabled: boolean;
    payouts_enabled: boolean;
  };
};

export type PaginatedParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

// ── API functions ──────────────────────────────────────────────────────────────

export function adminGetOverview() {
  return apiFetch<AdminOverviewResponse>("/api/admin/overview");
}

export function adminListUsers() {
  return apiFetch<AdminUser[]>("/api/admin/users");
}

export function adminListReservations() {
  return apiFetch<AdminReservation[]>("/api/admin/reservations");
}

export function adminListInventory(params: AdminInventoryListParams = {}) {
  return apiFetch<AdminInventoryListResponse>(
    `/api/admin/inventory${qs({
      q: params.q,
      status: params.status,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize
    })}`
  );
}

export function adminGetInventoryItem(id: number) {
  return apiFetch<AdminInventoryItem>(`/api/admin/inventory/${id}`);
}

export function adminBulkUpdateCostumeStatus(
  ids: number[],
  status: CostumeModerationStatus,
  reason?: string
) {
  return apiFetch<{ updated: number; status: string; ids: number[] }>("/api/admin/inventory/bulk-status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ids, status, reason })
  });
}

export function adminListPendingVendors() {
  return apiFetch<PendingVendor[]>("/api/admin/vendors/pending");
}

export function adminListAllVendors() {
  return apiFetch<PendingVendor[]>("/api/admin/vendors");
}

export function adminApproveVendor(userId: number, review_note?: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/vendors/${userId}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ review_note })
  });
}

export function adminRejectVendor(userId: number, review_note?: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/vendors/${userId}/reject`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ review_note })
  });
}

export function adminUpdateCostumeStatus(
  costumeId: number,
  status: CostumeModerationStatus,
  reason?: string
) {
  return apiFetch<{ success: boolean }>(`/api/admin/costumes/${costumeId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, reason })
  });
}

export function adminUpdateReservationStatus(
  reservationId: number,
  status: ReservationStatus,
  reason?: string
) {
  return apiFetch<{ success: boolean }>(`/api/admin/reservations/${reservationId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, reason })
  });
}

export function adminUpdateUserRole(userId: number, role: string, reason?: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, reason })
  });
}

// Moderation
export function adminGetModerationQueue(
  params: PaginatedParams & { tab?: "flagged" | "reports"; status?: string } = {}
) {
  return apiFetch<AdminModerationQueueResponse>(
    `/api/admin/moderation/queue${qs({
      tab: params.tab,
      status: params.status,
      q: params.q,
      page: params.page,
      pageSize: params.pageSize
    })}`
  );
}

export function adminCreateContentReport(input: {
  target_type: ContentReportTargetType;
  target_id: number;
  reason: string;
  details?: string;
}) {
  return apiFetch<AdminContentReport>("/api/admin/moderation/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function adminResolveContentReport(
  id: number,
  input: {
    status: "RESOLVED" | "DISMISSED";
    resolution_note?: string;
    costume_status?: CostumeModerationStatus;
  }
) {
  return apiFetch<{ report: AdminContentReport; costume: unknown }>(
    `/api/admin/moderation/reports/${id}/resolve`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }
  );
}

// Audit
export function adminListAuditLogs(
  params: PaginatedParams & {
    action?: string;
    entityType?: string;
    entityId?: number;
    actorId?: number;
  } = {}
) {
  return apiFetch<AdminAuditListResponse>(
    `/api/admin/audit${qs({
      q: params.q,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId,
      page: params.page,
      pageSize: params.pageSize
    })}`
  );
}

export function adminGetAuditLog(id: number) {
  return apiFetch<AdminAuditLog>(`/api/admin/audit/${id}`);
}

// Disputes
export function adminListDisputes(params: PaginatedParams & { status?: string } = {}) {
  return apiFetch<AdminDisputeListResponse>(
    `/api/admin/disputes${qs({
      q: params.q,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize
    })}`
  );
}

export function adminGetDispute(id: number) {
  return apiFetch<AdminDispute>(`/api/admin/disputes/${id}`);
}

export function adminCreateDispute(input: {
  reservation_id: number;
  subject: string;
  against_user_id?: number | null;
  initial_message?: string;
}) {
  return apiFetch<AdminDispute>("/api/admin/disputes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function adminUpdateDisputeStatus(
  id: number,
  status: DisputeStatus,
  resolution_note?: string
) {
  return apiFetch<AdminDispute>(`/api/admin/disputes/${id}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, resolution_note })
  });
}

export function adminAddDisputeMessage(id: number, body: string) {
  return apiFetch<AdminDispute>(`/api/admin/disputes/${id}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body })
  });
}

// Payouts
export function adminListVendorBalances(params: PaginatedParams = {}) {
  return apiFetch<AdminVendorBalanceListResponse>(
    `/api/admin/payouts/balances${qs({
      q: params.q,
      page: params.page,
      pageSize: params.pageSize
    })}`
  );
}

export function adminGetVendorPayoutDetail(vendorId: number) {
  return apiFetch<{
    vendor: Record<string, unknown>;
    balances: {
      available_balance: number;
      held_balance: number;
      pending_payout_balance: number;
      paid_total: number;
    };
    entries: Array<Record<string, unknown>>;
    payouts: AdminPayout[];
    payment_methods: Array<Record<string, unknown>>;
  }>(`/api/admin/payouts/vendors/${vendorId}`);
}

export function adminListPayouts(params: PaginatedParams & { vendorId?: number; status?: string } = {}) {
  return apiFetch<AdminPayoutListResponse>(
    `/api/admin/payouts${qs({
      vendorId: params.vendorId,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize
    })}`
  );
}

export function adminSyncEarningEntries() {
  return apiFetch<{ created: number; fee_rate: number }>("/api/admin/payouts/sync", {
    method: "POST"
  });
}

export function adminCreatePayout(input: {
  vendor_id: number;
  payment_method_id?: number;
  notes?: string;
  entry_ids?: number[];
}) {
  return apiFetch<AdminPayout>("/api/admin/payouts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function adminMarkPayoutPaid(id: number, notes?: string) {
  return apiFetch<AdminPayout>(`/api/admin/payouts/${id}/paid`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ notes })
  });
}

export function adminMarkPayoutFailed(id: number, failure_reason?: string) {
  return apiFetch<AdminPayout>(`/api/admin/payouts/${id}/failed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ failure_reason })
  });
}

export function adminHoldEarningEntry(id: number, reason?: string) {
  return apiFetch<Record<string, unknown>>(`/api/admin/payouts/entries/${id}/hold`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason })
  });
}

export function adminReleaseEarningEntry(id: number, reason?: string) {
  return apiFetch<Record<string, unknown>>(`/api/admin/payouts/entries/${id}/release`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason })
  });
}

// Settings
export function adminGetSettings() {
  return apiFetch<AdminPlatformSettings>("/api/admin/settings");
}

export function adminUpdateSettings(input: Partial<AdminPlatformSettings>) {
  return apiFetch<AdminPlatformSettings>("/api/admin/settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function getPlatformFeeRate() {
  return apiFetch<{ platform_fee_rate: number }>("/api/account/platform-settings");
}
