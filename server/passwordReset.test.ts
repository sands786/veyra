import { describe, expect, it } from "vitest";
import { passwordResetBaseUrl } from "./passwordReset";

describe("password reset URL boundary", () => {
  it("uses the configured public app URL in production regardless of request origin", () => {
    expect(
      passwordResetBaseUrl({
        requestOrigin: "https://attacker.example",
        isProduction: true,
        configuredPublicAppUrl: "https://app.example",
      }),
    ).toBe("https://app.example");
  });

  it("allows a local or managed preview origin during development", () => {
    expect(
      passwordResetBaseUrl({
        requestOrigin: "https://3000-preview.manus.computer",
        isProduction: false,
      }),
    ).toBe("https://3000-preview.manus.computer");
  });

  it("falls back to the managed public app for untrusted or malformed origins", () => {
    expect(
      passwordResetBaseUrl({
        requestOrigin: "https://attacker.example",
        isProduction: false,
      }),
    ).toBe("https://veilpay-spri-t4knu9mv.manus.space");
    expect(
      passwordResetBaseUrl({
        requestOrigin: "not-a-url",
        isProduction: false,
      }),
    ).toBe("https://veilpay-spri-t4knu9mv.manus.space");
  });
});
