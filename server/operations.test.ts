import { describe, expect, it } from "vitest";
import { buildLaunchpadPublicSummary, buildPayrollCron, buildPrivateMarketPortfolio, canAdvancePrivateMarketStatus, canDecideLaunchpadRelease, canRequestLaunchpadRelease, canPublishPrivateDisclosure, comparePrivateMarketQuotes, evaluatePrivateMarketRisk, summarizeLaunchpadReadiness, canAdvanceLaunchpadMilestoneStatus, canAdvanceLaunchpadProjectStatus, canCreateRecipientClaim, canScheduleRoute, canSubmitLaunchpadAllocation, canSubmitLaunchpadProject, canPublishShareableProof, canReuseLaunchpadAllocation, evaluateTreasuryPolicy, getLaunchpadInitialTab, isClaimToken, isLaunchpadAdminRole, isLaunchpadOperatorRole, isLaunchpadSlug, isPublicProofSlug, isValidStarknetAddress, isWalletActionLocked, launchpadProjectActionLabel, nextLaunchpadProjectStatus, nextPayrollRunAt, normalizeAmountInput, privateDisclosureFields, resolveLaunchpadEmptyState, resolveLaunchpadPanel, shouldReuseLaunchpadAllocation, canReusePrivateMarketBid } from "@shared/operations";

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

  it("enforces private market lifecycle transitions and labels", () => {
    expect(canAdvancePrivateMarketStatus("draft", "scheduled")).toBe(true);
    expect(canAdvancePrivateMarketStatus("live", "settled")).toBe(false);
    expect(canAdvancePrivateMarketStatus("reveal", "settled")).toBe(true);
  });

  it("evaluates market risk caps and concentration", () => {
    const blocked = evaluatePrivateMarketRisk({ bidAmount: "700", targetAmount: "10000", currentCommitted: "1000", maxBidAmount: "500", maxConcentrationPct: 25, participantCommitted: "700" });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reasons).toContain("Bid exceeds the configured cap of 500");
  });

  it("compares live RFQ quotes by all-in price", () => {
    const quotes = comparePrivateMarketQuotes([{ id: "a", price: "1.02", feeBps: 20, expiresAt: "2026-08-20T00:00:00Z" }, { id: "b", price: "1.01", feeBps: 40, expiresAt: "2026-08-20T00:00:00Z" }], new Date("2026-08-19T00:00:00Z"));
    expect(quotes[0]?.id).toBe("b");
  });

  it("builds a private portfolio summary without exposing bidder identity", () => {
    expect(buildPrivateMarketPortfolio({ commitments: [{ amount: "250", status: "committed" }, { amount: "100", status: "rejected" }], settledValue: "200", currentValue: "240" })).toMatchObject({ committedAmount: "250", openCommitments: 1, pnl: "40" });
  });

  it("gates selective disclosures on confirmed settlement", () => {
    expect(canPublishPrivateDisclosure("aggregate", false)).toBe(false);
    expect(canPublishPrivateDisclosure("aggregate", true)).toBe(true);
    expect(privateDisclosureFields("aggregate")).not.toContain("bidder_identity");
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

  it("allows Launchpad allocation idempotency only inside the same project", () => {
    expect(canReuseLaunchpadAllocation(4, 4, "cm-0123456789abcdef", "cm-0123456789abcdef")).toBe(true);
    expect(canReuseLaunchpadAllocation(4, 5, "cm-0123456789abcdef", "cm-0123456789abcdef")).toBe(false);
  });

  it("allows public proofs only for settled routes", () => {
    expect(canPublishShareableProof("settled")).toBe(true);
    expect(canPublishShareableProof("draft")).toBe(false);
    expect(canPublishShareableProof("failed")).toBe(false);
  });

  it("allows sealed-bid idempotency only inside the same market", () => {
    expect(canReusePrivateMarketBid(7, 7, "commitment-123456789", "commitment-123456789")).toBe(true);
    expect(canReusePrivateMarketBid(7, 8, "commitment-123456789", "commitment-123456789")).toBe(false);
    expect(canReusePrivateMarketBid(7, 7, "commitment-123456789", "different-commitment")).toBe(false);
  });

  it("reuses the same Launchpad allocation commitment idempotently", () => {
    expect(shouldReuseLaunchpadAllocation("cm-abc123", "cm-abc123")).toBe(true);
    expect(shouldReuseLaunchpadAllocation("cm-abc123", "cm-def456")).toBe(false);
    expect(shouldReuseLaunchpadAllocation(undefined, "cm-abc123")).toBe(false);
  });

  it("covers the polished Launchpad action and validation states", () => {
    expect(nextLaunchpadProjectStatus("draft")).toBe("live");
    expect(nextLaunchpadProjectStatus("live")).toBe("funded");
    expect(nextLaunchpadProjectStatus("closed")).toBeNull();
    expect(launchpadProjectActionLabel("draft")).toBe("OPEN ROOM");
    expect(launchpadProjectActionLabel("funded")).toBe("CLOSE ROUND");
    expect(canSubmitLaunchpadProject(" ", "250000")).toBe(false);
    expect(canSubmitLaunchpadProject("Private round", "2,500")).toBe(false);
    expect(canSubmitLaunchpadProject("Private round", "2500")).toBe(true);
    expect(canSubmitLaunchpadAllocation("short", "2500")).toBe(false);
    expect(canSubmitLaunchpadAllocation("cm-0123456789abcdef", "2500")).toBe(true);
  });

  it("enforces explicit selection and pending locks for audited actions", () => {
    expect(canScheduleRoute(null, false)).toBe(false);
    expect(canScheduleRoute(12, false)).toBe(true);
    expect(canScheduleRoute(12, true)).toBe(false);
    expect(canCreateRecipientClaim(12, [], false)).toBe(false);
    expect(canCreateRecipientClaim(12, [44], false)).toBe(true);
    expect(canCreateRecipientClaim(12, [44, 45], false)).toBe(false);
    expect(canCreateRecipientClaim(12, [44], true)).toBe(false);
    expect(isWalletActionLocked(true)).toBe(true);
    expect(isWalletActionLocked(false)).toBe(false);
  });

  it("shares the strict Starknet address contract across wallet actions", () => {
    expect(isValidStarknetAddress("0x1234abcd")).toBe(true);
    expect(isValidStarknetAddress(" 0x1234abcd ")).toBe(true);
    expect(isValidStarknetAddress("not-a-wallet")).toBe(false);
    expect(isValidStarknetAddress("0x")).toBe(false);
  });

  it("resolves polished Launchpad tabs and empty states deterministically", () => {
    expect(getLaunchpadInitialTab()).toBe("overview");
    expect(resolveLaunchpadPanel("milestones", false)).toBe("empty");
    expect(resolveLaunchpadPanel("allocations", true)).toBe("allocations");
    expect(resolveLaunchpadEmptyState(false, 0)).toBe("create-project");
    expect(resolveLaunchpadEmptyState(true, 0)).toBe("add-milestone");
    expect(resolveLaunchpadEmptyState(true, 2)).toBe("ready");
  });

  it("computes production Launchpad readiness and release gating deterministically", () => {
    const checks = [{ key: "metadata", label: "Metadata", passed: true }, { key: "milestones", label: "Milestones", passed: true }, { key: "allocations", label: "Allocations", passed: false }];
    expect(summarizeLaunchpadReadiness(checks, "ready").score).toBe(67);
    expect(summarizeLaunchpadReadiness(checks, "ready").ready).toBe(false);
    expect(summarizeLaunchpadReadiness(checks, "blocked").ready).toBe(false);
    expect(canRequestLaunchpadRelease("live", "ready", false, "75000", "Beta evidence is attached")).toBe(true);
    expect(canRequestLaunchpadRelease("live", "planned", false, "75000", "Beta evidence is attached")).toBe(false);
    expect(canRequestLaunchpadRelease("closed", "ready", false, "75000", "Beta evidence is attached")).toBe(false);
    expect(canDecideLaunchpadRelease("pending")).toBe(true);
    expect(canDecideLaunchpadRelease("approved")).toBe(false);
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


describe("Launchpad SaaS failure boundaries", () => {
  it("blocks release requests when readiness or project state is unsafe", () => {
    expect(canRequestLaunchpadRelease("live", "blocked", false, "1000", "Evidence is attached")).toBe(false);
    expect(canRequestLaunchpadRelease("live", "ready", true, "1000", "Evidence is attached")).toBe(false);
  });

  it("rejects malformed or empty private allocation commitments", () => {
    expect(canSubmitLaunchpadAllocation("", "1000")).toBe(false);
    expect(canSubmitLaunchpadAllocation("cm-short", "1000")).toBe(false);
    expect(canSubmitLaunchpadAllocation("cm-0123456789abcdef", "1000")).toBe(true);
  });
});
