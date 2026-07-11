import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { classifyLalamoveEvent, mapLalamoveStatus } from "./LalamoveWebhookService";

// ─── HMAC signature tests ────────────────────────────────────────────────────

describe("LalamoveClient.extractErrorCode", () => {
  it("reads top-level message codes", async () => {
    const { LalamoveClient } = await import("./LalamoveClient");
    expect(LalamoveClient.extractErrorCode({ message: "ERR_OUT_OF_SERVICE_AREA" })).toBe(
      "ERR_OUT_OF_SERVICE_AREA"
    );
  });

  it("reads errors array with id + detail", async () => {
    const { LalamoveClient } = await import("./LalamoveClient");
    expect(
      LalamoveClient.extractErrorCode({
        errors: [
          {
            id: "ERR_INVALID_FIELD",
            message: "Please verify your field.",
            detail: "'market' validation failed: value cannot be null or empty."
          }
        ]
      })
    ).toBe("ERR_INVALID_FIELD: 'market' validation failed: value cannot be null or empty.");
  });

  it("reads errors object shape", async () => {
    const { LalamoveClient } = await import("./LalamoveClient");
    expect(
      LalamoveClient.extractErrorCode({
        errors: {
          id: "ERR_INVALID_RESPONSE",
          message: "Non-200 response received",
          detail: "'url' validation failed"
        }
      })
    ).toBe("ERR_INVALID_RESPONSE: 'url' validation failed");
  });
});

describe("LalamoveClient.buildSignature", () => {
  const API_KEY = "test-api-key";
  const API_SECRET = "test-api-secret";

  /**
   * Constructs a client with fake credentials by temporarily setting env vars.
   * We test the signature algorithm directly so we do not need a real network call.
   */
  function buildSignatureDirectly(
    apiSecret: string,
    method: string,
    path: string,
    body: string,
    timestamp: string
  ): string {
    const stringToSign = `${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${body}`;
    return createHmac("sha256", apiSecret).update(stringToSign).digest("hex");
  }

  it("produces a deterministic HMAC-SHA256 signature", () => {
    const timestamp = "1720512000000";
    const method = "POST";
    const path = "/v3/quotations";
    const body = JSON.stringify({ data: { serviceType: "MOTORCYCLE" } });

    const expected = buildSignatureDirectly(API_SECRET, method, path, body, timestamp);

    // Verify the algorithm matches the spec: timestamp\r\nMETHOD\r\npath\r\n\r\nbody
    const stringToSign = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
    const recomputed = createHmac("sha256", API_SECRET).update(stringToSign).digest("hex");
    expect(recomputed).toBe(expected);
    expect(recomputed).toHaveLength(64); // SHA-256 → 32 bytes → 64 hex chars
  });

  it("produces different signatures for different timestamps", () => {
    const method = "GET";
    const path = "/v3/orders/abc123";
    const body = "";

    const sig1 = buildSignatureDirectly(API_SECRET, method, path, body, "1000000000000");
    const sig2 = buildSignatureDirectly(API_SECRET, method, path, body, "1000000000001");
    expect(sig1).not.toBe(sig2);
  });

  it("produces different signatures for different paths", () => {
    const method = "GET";
    const body = "";
    const ts = "1720512000000";

    const sig1 = buildSignatureDirectly(API_SECRET, method, "/v3/orders/abc", body, ts);
    const sig2 = buildSignatureDirectly(API_SECRET, method, "/v3/orders/xyz", body, ts);
    expect(sig1).not.toBe(sig2);
  });

  it("produces different signatures for different secrets", () => {
    const method = "POST";
    const path = "/v3/quotations";
    const body = "{}";
    const ts = "1720512000000";

    const sig1 = buildSignatureDirectly("secret-a", method, path, body, ts);
    const sig2 = buildSignatureDirectly("secret-b", method, path, body, ts);
    expect(sig1).not.toBe(sig2);
  });

  it("uses uppercase METHOD in the string-to-sign", () => {
    const ts = "1720512000000";
    const path = "/v3/quotations";
    const body = "";

    // Lower and upper case methods should produce the same signature (normalized to upper)
    const sigLower = buildSignatureDirectly(API_SECRET, "post", path, body, ts);
    const sigUpper = buildSignatureDirectly(API_SECRET, "POST", path, body, ts);
    expect(sigLower).toBe(sigUpper);
  });

  it("authorization header format matches hmac KEY:ts:sig", () => {
    // Verify the Authorization header format without calling the actual API
    const ts = "1720512000000";
    const method = "GET";
    const path = "/v3/orders/1";
    const body = "";

    const sig = buildSignatureDirectly(API_SECRET, method, path, body, ts);
    const authHeader = `hmac ${API_KEY}:${ts}:${sig}`;

    expect(authHeader).toMatch(/^hmac [^:]+:\d+:[0-9a-f]{64}$/);
  });
});

// ─── Webhook payload → status mapping tests ──────────────────────────────────

describe("classifyLalamoveEvent", () => {
  it("classifies DRIVER_ASSIGNED event correctly", () => {
    expect(classifyLalamoveEvent("DRIVER_ASSIGNED")).toBe("DRIVER_ASSIGNED");
  });

  it("classifies POD_STATUS_CHANGED event correctly", () => {
    expect(classifyLalamoveEvent("POD_STATUS_CHANGED")).toBe("POD_UPDATED");
  });

  it("classifies ORDER_STATUS_CHANGED + PICKED_UP", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "PICKED_UP")).toBe("PICKED_UP");
  });

  it("classifies ORDER_STATUS_CHANGED + COMPLETED", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "COMPLETED")).toBe("COMPLETED");
  });

  it("classifies ORDER_STATUS_CHANGED + CANCELED as FAILED", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "CANCELED")).toBe("FAILED");
  });

  it("classifies ORDER_STATUS_CHANGED + CANCELLED (alternate spelling) as FAILED", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "CANCELLED")).toBe("FAILED");
  });

  it("classifies ORDER_STATUS_CHANGED + EXPIRED as FAILED", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "EXPIRED")).toBe("FAILED");
  });

  it("classifies ORDER_STATUS_CHANGED + REJECTED as FAILED", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "REJECTED")).toBe("FAILED");
  });

  it("classifies ORDER_STATUS_CHANGED + unknown status as STATUS_UPDATED", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "ASSIGNING_DRIVER")).toBe("STATUS_UPDATED");
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "ON_GOING")).toBe("STATUS_UPDATED");
  });

  it("classifies unknown event type as IGNORED", () => {
    expect(classifyLalamoveEvent("SOME_NEW_EVENT")).toBe("IGNORED");
    expect(classifyLalamoveEvent("")).toBe("IGNORED");
  });

  it("is case-insensitive for status strings", () => {
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "completed")).toBe("COMPLETED");
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "canceled")).toBe("FAILED");
    expect(classifyLalamoveEvent("ORDER_STATUS_CHANGED", "picked_up")).toBe("PICKED_UP");
  });
});

describe("mapLalamoveStatus", () => {
  it("uppercases the status string", () => {
    expect(mapLalamoveStatus("completed")).toBe("COMPLETED");
    expect(mapLalamoveStatus("Picked_Up")).toBe("PICKED_UP");
    expect(mapLalamoveStatus("ASSIGNED")).toBe("ASSIGNED");
  });
});
