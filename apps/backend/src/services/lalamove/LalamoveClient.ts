import { createHmac } from "crypto";
import { env } from "../../config/env";

// ─── Request / response shapes ──────────────────────────────────────────────

export interface LalamoveStop {
  coordinates: { lat: string; lng: string };
  address: string;
}

export interface LalamoveContact {
  name: string;
  phone: string;
}

export interface LalamoveQuotationPayload {
  serviceType: string;
  stops: LalamoveStop[];
  item?: {
    quantity: string;
    weight: string;
    categories: string[];
    handlingInstructions: string[];
  };
}

export interface LalamoveQuotationResponse {
  quotationId: string;
  scheduleAt?: string;
  serviceType: string;
  stops: LalamoveStop[];
  isRouteOptimized: boolean;
  priceBreakdown: {
    base: string;
    extraMileage: string;
    surcharge: string;
    totalExcludeTax: string;
    tax: string;
    total: string;
    currency: string;
  };
}

export interface LalamoveOrderPayload {
  quotationId: string;
  sender: { stopId: string; name: string; phone: string };
  recipients: Array<{ stopId: string; name: string; phone: string; remarks?: string }>;
  isRecipientSMSEnabled?: boolean;
  isPODEnabled?: boolean;
}

export interface LalamoveOrderResponse {
  orderId: string;
  quotationId: string;
  shareLink?: string;
  status: string;
}

export interface LalamoveOrderDetail {
  orderId: string;
  quotationId: string;
  priceBreakdown: LalamoveQuotationResponse["priceBreakdown"];
  status: string;
  shareLink?: string;
  stops: Array<LalamoveStop & { stopId: string }>;
  driverInfo?: {
    driverId: string;
    name: string;
    phone: string;
    plateNumber?: string;
  };
}

// ─── Error type ─────────────────────────────────────────────────────────────

export class LalamoveApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly lalamoveCode: string,
    message: string
  ) {
    super(message);
    this.name = "LalamoveApiError";
  }
}

// ─── Client ─────────────────────────────────────────────────────────────────

/**
 * Thin typed wrapper around the Lalamove v3 REST API.
 *
 * Auth: HMAC-SHA256 per Lalamove docs.
 *   stringToSign = `{timestamp}\r\n{METHOD}\r\n{path}\r\n\r\n{body}`
 *   Authorization: hmac {API_KEY}:{timestamp}:{signature}
 */
export class LalamoveClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly market: string;

  constructor() {
    if (!env.lalamoveApiKey || !env.lalamoveApiSecret) {
      throw new Error("LALAMOVE_API_KEY and LALAMOVE_API_SECRET must be set");
    }
    this.baseUrl = env.lalamoveBaseUrl;
    this.apiKey = env.lalamoveApiKey;
    this.apiSecret = env.lalamoveApiSecret;
    this.market = env.lalamoveMarket;
  }

  // ── Signature ──────────────────────────────────────────────────────────

  buildSignature(method: string, path: string, body: string, timestamp: string): string {
    const stringToSign = `${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${body}`;
    return createHmac("sha256", this.apiSecret).update(stringToSign).digest("hex");
  }

  private buildAuthorizationHeader(method: string, path: string, body: string): {
    Authorization: string;
    "X-LLM-Country": string;
    "X-Request-ID": string;
  } {
    const timestamp = Date.now().toString();
    const signature = this.buildSignature(method, path, body, timestamp);
    return {
      Authorization: `hmac ${this.apiKey}:${timestamp}:${signature}`,
      "X-LLM-Country": this.market,
      "X-Request-ID": `${timestamp}-${Math.random().toString(36).slice(2)}`
    };
  }

  // ── HTTP helpers ───────────────────────────────────────────────────────

  private async request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const bodyStr = body ? JSON.stringify(body) : "";
    const headers = this.buildAuthorizationHeader(method, path, bodyStr);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: bodyStr || undefined,
      signal: AbortSignal.timeout(15000)
    });

    const text = await response.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // not JSON — fall through to error handling
    }

    if (!response.ok) {
      const code = (json?.message as string) ?? (json?.code as string) ?? "UNKNOWN";
      throw new LalamoveApiError(response.status, code, `Lalamove API error ${response.status}: ${code}`);
    }

    return (json ?? {}) as T;
  }

  // ── Public API ─────────────────────────────────────────────────────────

  async createQuotation(payload: LalamoveQuotationPayload): Promise<LalamoveQuotationResponse> {
    return this.request<LalamoveQuotationResponse>("POST", "/v3/quotations", {
      data: {
        ...payload,
        language: "en_PH"
      }
    });
  }

  async getQuotation(quotationId: string): Promise<LalamoveQuotationResponse> {
    return this.request<LalamoveQuotationResponse>("GET", `/v3/quotations/${encodeURIComponent(quotationId)}`);
  }

  async placeOrder(payload: LalamoveOrderPayload): Promise<LalamoveOrderResponse> {
    return this.request<LalamoveOrderResponse>("POST", "/v3/orders", { data: payload });
  }

  async getOrder(orderId: string): Promise<LalamoveOrderDetail> {
    return this.request<LalamoveOrderDetail>("GET", `/v3/orders/${encodeURIComponent(orderId)}`);
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request<unknown>("DELETE", `/v3/orders/${encodeURIComponent(orderId)}`);
  }

  async setWebhook(url: string): Promise<void> {
    await this.request<unknown>("POST", "/v3/webhooks", { data: { url } });
  }
}
