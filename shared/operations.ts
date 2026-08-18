export type PayrollFrequency = "weekly" | "biweekly" | "monthly";

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { minute: Number(values.minute), hour: Number(values.hour) % 24, dayOfMonth: Number(values.day), dayOfWeek: weekdays[values.weekday] ?? 0 };
}

export function buildPayrollCron(nextRunAt: Date, frequency: PayrollFrequency, timezone = "UTC"): string {
  const { minute, hour, dayOfMonth, dayOfWeek } = zonedParts(nextRunAt, timezone);
  return frequency === "monthly"
    ? `0 ${minute} ${hour} ${dayOfMonth} * *`
    : `0 ${minute} ${hour} * * ${dayOfWeek}`;
}

export function nextPayrollRunAt(current: Date, frequency: PayrollFrequency): Date {
  const next = new Date(current);
  if (frequency === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + (frequency === "biweekly" ? 14 : 7));
  return next;
}

export function isPublicProofSlug(value: string): boolean {
  return /^vp-[a-f0-9]{20}$/.test(value);
}

export type PolicyEvaluation = { maxRouteAmount: string; dailyLimit: string; approvalThreshold: number; network: "mainnet" | "sepolia" };

export function evaluateTreasuryPolicy(policy: PolicyEvaluation | undefined, input: { totalAmount: string; approvalCount: number; network: "mainnet" | "sepolia"; dailyUsed: string }) {
  if (!policy) return { policyFound: false, allowed: true, reasons: ["No active policy for this token"] } as const;
  const reasons: string[] = [];
  if (input.network !== policy.network) reasons.push(`Policy is restricted to ${policy.network}`);
  if (Number(input.totalAmount) > Number(policy.maxRouteAmount)) reasons.push(`Amount exceeds per-route limit of ${policy.maxRouteAmount}`);
  if (Number(input.dailyUsed) + Number(input.totalAmount) > Number(policy.dailyLimit)) reasons.push(`Daily limit of ${policy.dailyLimit} would be exceeded`);
  if (input.approvalCount < policy.approvalThreshold) reasons.push(`Requires ${policy.approvalThreshold} approval(s)`);
  return { policyFound: true, allowed: reasons.length === 0, reasons, maxRouteAmount: policy.maxRouteAmount, dailyLimit: policy.dailyLimit, approvalThreshold: policy.approvalThreshold, network: policy.network } as const;
}

export function isLaunchpadOperatorRole(role: string): boolean {
  return role === "owner" || role === "admin" || role === "operator";
}

export function isLaunchpadAdminRole(role: string): boolean {
  return role === "owner" || role === "admin";
}

export type LaunchpadTab = "overview" | "milestones" | "allocations" | "operations";

export type LaunchpadReadinessCheck = { key: string; label: string; passed: boolean };

export function summarizeLaunchpadReadiness(checks: LaunchpadReadinessCheck[], override: "none" | "blocked" | "ready" = "none") {
  const score = checks.length ? Math.round((checks.filter((check) => check.passed).length / checks.length) * 100) : 0;
  return { score, ready: override !== "blocked" && override === "ready" && checks.every((check) => check.passed), checks, override } as const;
}

export function canRequestLaunchpadRelease(projectStatus: "draft" | "live" | "funded" | "closed", milestoneStatus: "planned" | "ready" | "released" | "blocked", pendingRequest: boolean, amount: string, reason: string): boolean {
  return projectStatus !== "closed" && milestoneStatus === "ready" && !pendingRequest && /^\d+(\.\d{1,18})?$/.test(amount.trim()) && reason.trim().length >= 8;
}

export function canDecideLaunchpadRelease(status: "pending" | "approved" | "rejected" | "settled"): boolean {
  return status === "pending";
}

export function getLaunchpadInitialTab(): LaunchpadTab {
  return "overview";
}

export function resolveLaunchpadPanel(tab: LaunchpadTab, hasProject: boolean): "empty" | LaunchpadTab {
  return hasProject ? tab : "empty";
}

export function resolveLaunchpadEmptyState(hasProject: boolean, milestoneCount: number): "create-project" | "add-milestone" | "ready" {
  if (!hasProject) return "create-project";
  if (milestoneCount === 0) return "add-milestone";
  return "ready";
}

export function nextLaunchpadProjectStatus(status: "draft" | "live" | "funded" | "closed"): "live" | "funded" | "closed" | null {
  return status === "draft" ? "live" : status === "live" ? "funded" : status === "funded" ? "closed" : null;
}

export function launchpadProjectActionLabel(status: "draft" | "live" | "funded" | "closed"): string {
  return status === "draft" ? "OPEN ROOM" : status === "live" ? "MARK FUNDED" : status === "funded" ? "CLOSE ROUND" : "ROUND CLOSED";
}

export function canSubmitLaunchpadProject(name: string, targetAmount: string): boolean {
  return name.trim().length >= 2 && /^\d+(\.\d{1,18})?$/.test(targetAmount.trim());
}

export function canSubmitLaunchpadAllocation(commitment: string, amount: string): boolean {
  return commitment.trim().length >= 16 && /^\d+(\.\d{1,18})?$/.test(amount.trim());
}

export function canAdvanceLaunchpadProjectStatus(from: "draft" | "live" | "funded" | "closed", to: "draft" | "live" | "funded" | "closed"): boolean {
  if (from === to) return true;
  return (from === "draft" && to === "live") || (from === "live" && (to === "funded" || to === "closed")) || (from === "funded" && to === "closed");
}

export function canAdvanceLaunchpadMilestoneStatus(from: "planned" | "ready" | "released" | "blocked", to: "planned" | "ready" | "released" | "blocked"): boolean {
  if (from === to) return true;
  return (from === "planned" && (to === "ready" || to === "blocked")) || (from === "ready" && (to === "released" || to === "blocked")) || (from === "blocked" && to === "ready");
}

export function shouldReuseLaunchpadAllocation(existingCommitment: string | undefined, requestedCommitment: string): boolean {
  return Boolean(existingCommitment) && existingCommitment === requestedCommitment;
}

export function canReuseLaunchpadAllocation(existingProjectId: number, requestedProjectId: number, existingCommitment: string | undefined, requestedCommitment: string): boolean {
  return existingProjectId === requestedProjectId && shouldReuseLaunchpadAllocation(existingCommitment, requestedCommitment);
}

export function canReusePrivateMarketBid(existingMarketId: number, requestedMarketId: number, existingCommitment: string | undefined, requestedCommitment: string): boolean {
  return existingMarketId === requestedMarketId && Boolean(existingCommitment) && existingCommitment === requestedCommitment;
}

export function isLaunchpadSlug(value: string): boolean {
  return /^launch-[a-f0-9]{20}$/.test(value);
}

export function buildLaunchpadPublicSummary(project: { slug: string; name: string; description: string | null; token: string; network: "mainnet" | "sepolia"; targetAmount: string; raisedAmount: string; privacyMode: "shielded" | "public"; status: "draft" | "live" | "funded" | "closed"; fundingEndsAt: Date | null }, milestones: Array<{ id: number; name: string; sequence: number; releaseAmount: string; status: "planned" | "ready" | "released" | "blocked"; proofReference: string | null }>) {
  return { ...project, milestones: milestones.map(({ id, name, sequence, releaseAmount, status, proofReference }) => ({ id, name, sequence, releaseAmount, status, proofReference })) };
}

export function canScheduleRoute(routeId: number | null, pending: boolean): boolean {
  return routeId !== null && routeId > 0 && !pending;
}

export function canPublishShareableProof(status: "draft" | "shielded" | "routed" | "settled" | "failed" | "cancelled"): boolean {
  return status === "settled";
}

export function canCreateRecipientClaim(routeId: number | null, recipientIds: number[], pending: boolean): boolean {
  return routeId !== null && routeId > 0 && recipientIds.length === 1 && recipientIds[0] > 0 && !pending;
}

export function isWalletActionLocked(pending: boolean): boolean {
  return pending;
}

export function isValidStarknetAddress(value: string): boolean {
  const normalized = value.trim();
  return normalized.length >= 4 && normalized.length <= 100 && /^0x[0-9a-fA-F]+$/.test(normalized);
}

export function normalizeAmountInput(value: string): string {
  return value.replace(/,/g, "").trim();
}

export function isClaimToken(value: string): boolean {
  return /^claim-[a-f0-9]{32}$/.test(value);
}
