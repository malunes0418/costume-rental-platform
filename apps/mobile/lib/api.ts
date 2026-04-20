/**
 * API client for the CostumeStay backend.
 * Reads EXPO_PUBLIC_API_URL from environment.
 */

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...rest } = init;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

function toQueryString(q: Record<string, unknown>) {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ─── Types ───────────────────────────────────────────────
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
  size?: string | null;
  gender?: string | null;
  theme?: string | null;
  base_price_per_day: number;
  is_active?: boolean;
  created_at?: string;
  CostumeImages?: CostumeImage[];
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
  sort: "price_asc" | "price_desc";
  page: number;
  pageSize: number;
}>;

export type CostumeDetailResponse = {
  costume: Costume;
  ratingCount: number;
  avgRating: number | null;
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

export type AuthUser = {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string | null;
  role?: string;
};

export type AuthTokenResponse = { user: AuthUser; token: string };

// ─── API calls ───────────────────────────────────────────

export function listCostumes(query: CostumeListQuery, token?: string | null) {
  return apiFetch<PaginatedResult<Costume>>(
    `/api/costumes${toQueryString(query as Record<string, unknown>)}`,
    { token }
  );
}

export function getCostume(id: number, token?: string | null) {
  return apiFetch<CostumeDetailResponse>(`/api/costumes/${id}`, { token });
}

export function listCostumeReviews(costumeId: number) {
  return apiFetch<Review[]>(`/api/reviews/costumes/${costumeId}`);
}

export function loginApi(email: string, password: string) {
  return apiFetch<AuthTokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerApi(email: string, password: string, name?: string) {
  return apiFetch<AuthTokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, ...(name ? { name } : {}) }),
  });
}

export function resolveAsset(imageUrl: string): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

// ─── Vendor API calls ──────────────────────────────────────

export type VendorProfile = {
  id: number;
  user_id: number;
  store_name: string;
  store_description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  reservation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
};

export type Reservation = {
  id: number;
  costume_id: number;
  renter_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
};

export function applyForVendor(payload: { store_name: string; store_description?: string; id_document_url?: string }, token: string) {
  const bodyPayload = {
    ...payload,
    id_document_url: payload.id_document_url || "https://example.com/dummy-id.png"
  };
  return apiFetch<{ success: boolean; data: VendorProfile }>("/api/vendors/apply", {
    method: "POST",
    body: JSON.stringify(bodyPayload),
    token,
  });
}

export function getVendorProfile(token: string) {
  return apiFetch<{ success: boolean; data: VendorProfile | null }>("/api/vendors/me", {
    token,
  });
}

export function listVendorCostumes(token: string) {
  return apiFetch<{ success: boolean; data: Costume[] }>("/api/vendors/costumes", {
    token,
  });
}

export function createVendorCostume(payload: any, token: string) {
  return apiFetch<{ success: boolean; data: Costume }>("/api/vendors/costumes", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function updateVendorCostume(id: number, payload: any, token: string) {
  return apiFetch<{ success: boolean; data: Costume }>(`/api/vendors/costumes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteVendorCostume(id: number, token: string) {
  return apiFetch<{ success: boolean }>(`/api/vendors/costumes/${id}`, {
    method: "DELETE",
    token,
  });
}

export function listVendorReservations(token: string) {
  return apiFetch<{ success: boolean; data: Reservation[] }>("/api/vendors/reservations", {
    token,
  });
}

export function approveReservation(id: number, token: string) {
  return apiFetch<{ success: boolean; data: Reservation }>(`/api/vendors/reservations/${id}/approve`, {
    method: "POST",
    token,
  });
}

export function rejectReservation(id: number, token: string) {
  return apiFetch<{ success: boolean; data: Reservation }>(`/api/vendors/reservations/${id}/reject`, {
    method: "POST",
    token,
  });
}

export function listReservationMessages(id: number, token: string) {
  return apiFetch<{ success: boolean; data: Message[] }>(`/api/vendors/reservations/${id}/messages`, {
    token,
  });
}

export function createReservationMessage(id: number, content: string, token: string) {
  return apiFetch<{ success: boolean; data: Message }>(`/api/vendors/reservations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
    token,
  });
}
