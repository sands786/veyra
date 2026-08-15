import { describe, expect, it } from "vitest";
import { buildPayrollCron, evaluateTreasuryPolicy, isClaimToken, isPublicProofSlug, nextPayrollRunAt, normalizeAmountInput } from "@shared/operations";

describe("operations primitives", () => {
  it("builds weekly Heartbeat cron expressions in UTC", () => {
    expect(buildPayrollCron(new Date("2026-08-15T09:07:00.000Z"), "weekly")).toBe("0 7 9 * * 6");
  });

  it("builds monthly Heartbeat cron expressions from the UTC day of month", () => {
    expect(buildPayrollCron(new Date("2026-08-15T09:07:00.000Z"), "monthly")).toBe("0 7 9 15 * *");
  });

  it("advances biweekly and monthly schedules deterministically", () => {
    const current = new Date("2026-08-15T09:07:00.000Z");
    expect(nextPayrollRunAt(current, "biweekly").toISOString()).toBe("2026-08-29T09:07:00.000Z");
    expect(nextPayrollRunAt(current, "monthly").toISOString()).toBe("2026-09-15T09:07:00.000Z");
  });

  it("uses the requested timezone when constructing cron fields", () => {
    expect(buildPayrollCron(new Date("2026-08-15T09:07:00.000Z"), "weekly", "America/Los_Angeles")).toBe("0 7 2 * * 6");
  });

  it("evaluates treasury policy limits and approval requirements", () => {
    const blocked = evaluateTreasuryPolicy({ maxRouteAmount: "5000", dailyLimit: "10000", approvalThreshold: 2, network: "mainnet" }, { totalAmount: "6000", approvalCount: 1, network: "mainnet", dailyUsed: "5000" });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reasons).toHaveLength(3);
    const allowed = evaluateTreasuryPolicy({ maxRouteAmount: "5000", dailyLimit: "10000", approvalThreshold: 2, network: "mainnet" }, { totalAmount: "4200", approvalCount: 2, network: "mainnet", dailyUsed: "0" });
    expect(allowed.allowed).toBe(true);
    const wrongNetwork = evaluateTreasuryPolicy({ maxRouteAmount: "5000", dailyLimit: "10000", approvalThreshold: 1, network: "sepolia" }, { totalAmount: "100", approvalCount: 1, network: "mainnet", dailyUsed: "0" });
    expect(wrongNetwork.allowed).toBe(false);
  });

  it("normalizes comma-formatted UI amounts before strict validation", () => {
    expect(normalizeAmountInput("2,840")).toBe("2840");
    expect(normalizeAmountInput("  12,345.67  ")).toBe("12345.67");
  });

  it("accepts only structurally valid private claim tokens", () => {
    expect(isClaimToken("claim-0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isClaimToken("claim-0123456789abcdef0123456789abcde")).toBe(false);
    expect(isClaimToken("claim-0123456789abcdef0123456789abcdefx")).toBe(false);
  });

  it("accepts only VeilPay public proof slugs", () => {
    expect(isPublicProofSlug("vp-0123456789abcdef0123")).toBe(true);
    expect(isPublicProofSlug("vp-0123456789abcdef01234")).toBe(false);
    expect(isPublicProofSlug("VP-0123456789ABCDEF0123")).toBe(false);
  });
});
