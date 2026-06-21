import { describe, expect, it } from "vitest";
import {
  buildHandoffProofApiUrl,
  getHandoffProofColumn,
  isHandoffProofType,
  presentFulfillmentHandoffProofs
} from "./handoffProofs";

describe("handoffProofs", () => {
  it("validates proof types and maps columns", () => {
    expect(isHandoffProofType("renter_received")).toBe(true);
    expect(isHandoffProofType("invalid")).toBe(false);
    expect(getHandoffProofColumn("vendor_return")).toBe("vendor_return_proof_url");
  });

  it("replaces stored upload paths with authorized API URLs", () => {
    const presented = presentFulfillmentHandoffProofs(42, {
      outbound_dispatch_proof_url: "/uploads/proof-a.jpg",
      renter_received_proof_url: null,
      return_initiated_proof_url: "/uploads/proof-b.jpg",
      vendor_return_proof_url: null
    });

    expect(presented?.outbound_dispatch_proof_url).toBe(
      buildHandoffProofApiUrl(42, "outbound_dispatch")
    );
    expect(presented?.return_initiated_proof_url).toBe(
      buildHandoffProofApiUrl(42, "return_initiated")
    );
    expect(presented?.renter_received_proof_url).toBeNull();
  });
});
