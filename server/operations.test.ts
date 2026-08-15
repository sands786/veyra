import { describe, expect, it } from "vitest";
import { buildLaunchpadPublicSummary, buildPayrollCron, canAdvanceLaunchpadMilestoneStatus, canAdvanceLaunchpadProjectStatus, evaluateTreasuryPolicy, isClaimToken, isLaunchpadAdminRole, isLaunchpadOperatorRole, isLaunchpadSlug, isPublicProofSlug, nextPayrollRunAt, normalizeAmountInput, shouldReuseLaunchpadAllocation } from "@shared/operations";

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

  it("enforces Launchpad role boundaries and slug shape", () => {
    expect(isLaunchpadOperatorRole("operator")).toBe(true);
    expect(isLaunchpadOperatorRole("viewer")).toBe(false);
    expect(isLaunchpadAdminRole("admin")).toBe(true);
    expect(isLaunchpadAdminRole("operator")).toBe(false);
    expect(isLaunchpadSlug("launch-0123456789abcdef0123")).toBe(true);
    expect(isLaunchpadSlug("launch-not-a-valid-slug")).toBe(false);
  });

  it("enforces Launchpad project and milestone transition contracts", () => {
    expect(canAdvanceLaunchpadProjectStatus("draft", "live")).toBe(true);
    expect(canAdvanceLaunchpadProjectStatus("draft", "funded")).toBe(false);
    expect(canAdvanceLaunchpadProjectStatus("closed", "live")).toBe(false);
    expect(canAdvanceLaunchpadMilestoneStatus("planned", "ready")).toBe(true);
    expect(canAdvanceLaunchpadMilestoneStatus("planned", "released")).toBe(false);
    expect(canAdvanceLaunchpadMilestoneStatus("released", "blocked")).toBe(false);
  });

  it("reuses the same Launchpad allocation commitment idempotently", () => {
    expect(shouldReuseLaunchpadAllocation("cm-abc123", "cm-abc123")).toBe(true);
    expect(shouldReuseLaunchpadAllocation("cm-abc123", "cm-def456")).toBe(false);
    expect(shouldReuseLaunchpadAllocation(undefined, "cm-abc123")).toBe(false);
  });

  it("keeps allocation data out of public Launchpad summaries", () => {
    const summary = buildLaunchpadPublicSummary({ slug: "launch-0123456789abcdef0123", name: "Private round", description: "Milestone room", token: "USDC", network: "mainnet", targetAmount: "1000", raisedAmount: "0", privacyMode: "shielded", status: "live", fundingEndsAt: null }, [{ id: 1, name: "Beta", sequence: 1, releaseAmount: "500", status: "planned", proofReference: null }]);
    expect(summary.milestones).toHaveLength(1);
    expect(summary).not.toHaveProperty("allocations");
    expect(JSON.stringify(summary)).not.toContain("wallet");
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
