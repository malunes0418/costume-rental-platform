import { apiFetch } from "./api";
import type { EffectiveCostumeFulfillment, CostumeFulfillmentOverride } from "./fulfillment";
import type { PricingMode } from "./pricing";

export type CostumeImage = {
  id: number;
  costume_id: number;
  image_url: string;
  is_primary: boolean;
};

export type Costume = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  category_label?: string | null;
  size?: string | null;
  gender?: string | null;
  theme?: string | null;
  pricing_mode: PricingMode;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  owner_id?: number | null;
  status?: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";
  owner?: {
    id: number;
    name?: string | null;
    VendorProfile?: {
      business_name?: string | null;
    };
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  CostumeImages?: CostumeImage[];
  fulfillmentOverride?: CostumeFulfillmentOverride | null;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CostumeListQuery = Partial<{
  q: string;
  category: string;
  size: string;
  gender: string;
  theme: string;
  ownerId: number;
  sort: "price_asc" | "price_desc";
  page: number;
  pageSize: number;
}>;

export type CostumeDetailResponse = {
  costume: Costume;
  ratingCount: number;
  avgRating: number | null;
  effective_fulfillment: EffectiveCostumeFulfillment;
};

export type Review = {
  id: number;
  costume_id: number;
  user_id: number;
  rating: number;
  comment?: string | null;
  created_at?: string;
  User?: { id: number; name?: string | null; avatar_url?: string | null };
};

export type Reservation = {
  id: number;
  user_id: number;
  status: string;
  start_date?: string;
  end_date?: string;
};

function toQueryString(q: Record<string, unknown>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export function listCostumes(query: CostumeListQuery) {
  return apiFetch<PaginatedResult<Costume>>(`/api/costumes${toQueryString(query)}`);
}

export function getCostume(id: number) {
  return apiFetch<CostumeDetailResponse>(`/api/costumes/${id}`);
}

export function getAvailability(id: number, startDate: string, endDate: string) {
  return apiFetch<Reservation[]>(
    `/api/costumes/${id}/availability${toQueryString({ startDate, endDate })}`
  );
}

export function listCostumeReviews(costumeId: number) {
  return apiFetch<Review[]>(`/api/reviews/costumes/${costumeId}`);
}

