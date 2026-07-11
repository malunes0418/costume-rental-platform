import { describe, expect, it } from "vitest";
import { parseOAuthIntent } from "../services/AuthService";

describe("parseOAuthIntent", () => {
  it("defaults to login", () => {
    expect(parseOAuthIntent(undefined)).toBe("login");
    expect(parseOAuthIntent("login")).toBe("login");
  });

  it("accepts register", () => {
    expect(parseOAuthIntent("register")).toBe("register");
  });
});
