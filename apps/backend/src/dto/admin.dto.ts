import type { CostumeAttributes } from "../models/Costume";
import type { UserPublic } from "./shared.dto";
import type { ReservationWithItems } from "./reservation.dto";
import type { PaginatedResult } from "./common.dto";

/** Admin list row: cart/reservation lines plus optional customer. */
export type AdminReservationRow = ReservationWithItems & { User?: UserPublic };

export type AdminListReservationsResponse = AdminReservationRow[];

export type AdminInventoryVendor = {
  user_id: number;
  name?: string;
  email?: string;
  vendor_status?: string;
  business_name?: string;
  bio?: string;
};

export type AdminInventoryItem = CostumeAttributes & {
  vendor?: AdminInventoryVendor | null;
};

export type AdminListInventoryResponse = PaginatedResult<AdminInventoryItem>;

export type AdminListUsersResponse = UserPublic[];

export type AdminInventoryListQuery = {
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type AdminOverviewQueueCounts = {
  pendingVendors: number;
  flaggedCostumes: number;
  openReports: number;
  openDisputes: number;
  pendingPayouts: number;
};

export type AdminOverviewKpis = {
  activeReservations: number;
  totalReservations: number;
  totalUsers: number;
};

export type AdminOverviewSeries = {
  reservationsLast7Days: number[];
  quotedValueLast7Days: number[];
};

export type AdminOverviewActivityItem = {
  id: string;
  label: string;
  sub: string;
  amount: number;
  status: string;
  date?: string;
};

export type AdminOverviewResponse = {
  queues: AdminOverviewQueueCounts;
  kpis: AdminOverviewKpis;
  series: AdminOverviewSeries;
  statusBreakdown: Record<string, number>;
  recentActivity: AdminOverviewActivityItem[];
};

export type AdminBulkCostumeStatusRequest = {
  ids: number[];
  status: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";
  reason?: string;
};

export type AdminBulkCostumeStatusResponse = {
  updated: number;
  status: string;
  ids: number[];
};

export type AdminAuditListQuery = {
  q?: string;
  action?: string;
  entityType?: string;
  entityId?: number;
  actorId?: number;
  page?: number;
  pageSize?: number;
};

export type AdminModerationQueueQuery = {
  tab?: "flagged" | "reports";
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AdminDisputeListQuery = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AdminPayoutListQuery = {
  vendorId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
};
