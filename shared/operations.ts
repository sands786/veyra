export type PayrollFrequency = "weekly" | "biweekly" | "monthly";

type DecimalParts = { digits: bigint; scale: number };

function parseDecimal(value: string): DecimalParts | null {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) return null;
  const [whole = "0", fraction = ""] = value.split(".");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return {
    digits: BigInt(`${whole}${trimmedFraction}` || "0"),
    scale: trimmedFraction.length,
  };
}

function scaleDecimal(parts: DecimalParts, scale: number): bigint {
  let multiplier = BigInt(1);
  for (let index = parts.scale; index < scale; index += 1) {
    multiplier *= BigInt(10);
  }
  return parts.digits * multiplier;
}

function formatDecimal(digits: bigint, scale: number): string {
  if (digits === BigInt(0)) return "0";
  const raw = digits.toString().padStart(scale + 1, "0");
  if (scale === 0) return raw;
  const splitAt = raw.length - scale;
  const fraction = raw.slice(splitAt).replace(/0+$/, "");
  return fraction ? `${raw.slice(0, splitAt)}.${fraction}` : raw.slice(0, splitAt);
}

function isPositiveDecimalString(value: string): boolean {
  const parts = parseDecimal(value.trim());
  return Boolean(parts && parts.digits > BigInt(0));
}

function compareDecimalStringsExact(left: string, right: string): number {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  if (!a || !b) return 0;
  const scale = Math.max(a.scale, b.scale);
  const leftValue = scaleDecimal(a, scale);
  const rightValue = scaleDecimal(b, scale);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
}

export function addDecimalStringsExact(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  if (!a || !b) return "0";
  const scale = Math.max(a.scale, b.scale);
  return formatDecimal(scaleDecimal(a, scale) + scaleDecimal(b, scale), scale);
}

export function subtractDecimalStringsExact(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  if (!a || !b) return "0";
  const scale = Math.max(a.scale, b.scale);
  const difference = scaleDecimal(a, scale) - scaleDecimal(b, scale);
  if (difference >= BigInt(0)) return formatDecimal(difference, scale);
  return `-${formatDecimal(-difference, scale)}`;
}

export function compareDecimalTimesInteger(
  left: string,
  leftMultiplier: number,
  right: string,
  rightMultiplier: number
): number {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  if (!a || !b || !Number.isInteger(leftMultiplier) || !Number.isInteger(rightMultiplier)) return 0;
  const scale = Math.max(a.scale, b.scale);
  const leftValue = scaleDecimal(a, scale) * BigInt(leftMultiplier);
  const rightValue = scaleDecimal(b, scale) * BigInt(rightMultiplier);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
}

export function multiplyDecimalStringsExact(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  if (!a || !b) return "0";
  return formatDecimal(a.digits * b.digits, a.scale + b.scale);
}

export function decimalRatioAsNumber(left: string, right: string): number {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  if (!a || !b || b.digits === BigInt(0)) return 0;
  const approximate = (parts: DecimalParts) => {
    const digits = parts.digits.toString();
    const significant = digits.slice(0, 15);
    const significantValue = Number(significant);
    return significantValue * 10 ** (digits.length - significant.length - parts.scale);
  };
  const ratio = approximate(a) / approximate(b);
  return Number.isFinite(ratio) ? ratio : ratio < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
}

function decimalAsFiniteNumber(value: string): number {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return numeric < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value])
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    minute: Number(values.minute),
    hour: Number(values.hour) % 24,
    dayOfMonth: Number(values.day),
    dayOfWeek: weekdays[values.weekday] ?? 0,
  };
}

export function buildPayrollCron(
  nextRunAt: Date,
  frequency: PayrollFrequency,
  timezone = "UTC"
): string {
  const { minute, hour, dayOfMonth, dayOfWeek } = zonedParts(
    nextRunAt,
    timezone
  );
  return frequency === "monthly"
    ? `0 ${minute} ${hour} ${dayOfMonth} * *`
    : `0 ${minute} ${hour} * * ${dayOfWeek}`;
}

export function nextPayrollRunAt(
  current: Date,
  frequency: PayrollFrequency
): Date {
  const next = new Date(current);
  if (frequency === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + (frequency === "biweekly" ? 14 : 7));
  return next;
}

export function isPublicProofSlug(value: string): boolean {
  return /^vp-[a-f0-9]{20}$/.test(value);
}

export type PolicyEvaluation = {
  maxRouteAmount: string;
  dailyLimit: string;
  approvalThreshold: number;
  network: "mainnet";
};

export function evaluateTreasuryPolicy(
  policy: PolicyEvaluation | undefined,
  input: {
    totalAmount: string;
    approvalCount: number;
    network: "mainnet";
    dailyUsed: string;
  }
) {
  if (!policy)
    return {
      policyFound: false,
      allowed: true,
      reasons: ["No active policy for this token"],
    } as const;
  const reasons: string[] = [];
  if (input.network !== policy.network)
    reasons.push(`Policy is restricted to ${policy.network}`);
  if (compareDecimalStringsExact(input.totalAmount, policy.maxRouteAmount) > 0)
    reasons.push(`Amount exceeds per-route limit of ${policy.maxRouteAmount}`);
  if (
    compareDecimalStringsExact(
      addDecimalStringsExact(input.dailyUsed, input.totalAmount),
      policy.dailyLimit
    ) > 0
  )
    reasons.push(`Daily limit of ${policy.dailyLimit} would be exceeded`);
  if (input.approvalCount < policy.approvalThreshold)
    reasons.push(`Requires ${policy.approvalThreshold} approval(s)`);
  return {
    policyFound: true,
    allowed: reasons.length === 0,
    reasons,
    maxRouteAmount: policy.maxRouteAmount,
    dailyLimit: policy.dailyLimit,
    approvalThreshold: policy.approvalThreshold,
    network: policy.network,
  } as const;
}

export function isLaunchpadOperatorRole(role: string): boolean {
  return role === "owner" || role === "admin" || role === "operator";
}

export function isLaunchpadAdminRole(role: string): boolean {
  return role === "owner" || role === "admin";
}

export type LaunchpadTab =
  | "overview"
  | "milestones"
  | "allocations"
  | "operations";

export type LaunchpadReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
};

export function summarizeLaunchpadReadiness(
  checks: LaunchpadReadinessCheck[],
  override: "none" | "blocked" | "ready" = "none"
) {
  const score = checks.length
    ? Math.round(
        (checks.filter(check => check.passed).length / checks.length) * 100
      )
    : 0;
  return {
    score,
    ready:
      override !== "blocked" &&
      override === "ready" &&
      checks.every(check => check.passed),
    checks,
    override,
  } as const;
}

export function canRequestLaunchpadRelease(
  projectStatus: "draft" | "live" | "funded" | "closed",
  milestoneStatus: "planned" | "ready" | "released" | "blocked",
  pendingRequest: boolean,
  amount: string,
  reason: string
): boolean {
  return (
    projectStatus !== "closed" &&
    milestoneStatus === "ready" &&
    !pendingRequest &&
    /^\d+(\.\d{1,18})?$/.test(amount.trim()) &&
    reason.trim().length >= 8
  );
}

export type LaunchpadReleaseStatus = "pending" | "approved" | "rejected" | "settled";

export function canDecideLaunchpadRelease(
  status: LaunchpadReleaseStatus
): boolean {
  return status === "pending";
}

export function canAdvanceLaunchpadReleaseStatus(
  from: LaunchpadReleaseStatus,
  to: LaunchpadReleaseStatus
): boolean {
  const transitions: Record<LaunchpadReleaseStatus, LaunchpadReleaseStatus[]> = {
    pending: ["approved", "rejected"],
    approved: ["settled"],
    rejected: [],
    settled: [],
  };
  return transitions[from].includes(to);
}

export function getLaunchpadInitialTab(): LaunchpadTab {
  return "overview";
}

export function resolveLaunchpadPanel(
  tab: LaunchpadTab,
  hasProject: boolean
): "empty" | LaunchpadTab {
  return hasProject ? tab : "empty";
}

export function resolveLaunchpadEmptyState(
  hasProject: boolean,
  milestoneCount: number
): "create-project" | "add-milestone" | "ready" {
  if (!hasProject) return "create-project";
  if (milestoneCount === 0) return "add-milestone";
  return "ready";
}

export function nextLaunchpadProjectStatus(
  status: "draft" | "live" | "funded" | "closed"
): "live" | "funded" | "closed" | null {
  return status === "draft"
    ? "live"
    : status === "live"
      ? "funded"
      : status === "funded"
        ? "closed"
        : null;
}

export function launchpadProjectActionLabel(
  status: "draft" | "live" | "funded" | "closed"
): string {
  return status === "draft"
    ? "OPEN ROOM"
    : status === "live"
      ? "MARK FUNDED"
      : status === "funded"
        ? "CLOSE ROUND"
        : "ROUND CLOSED";
}

export function canSubmitLaunchpadProject(
  name: string,
  targetAmount: string
): boolean {
  return name.trim().length >= 2 && isPositiveDecimalString(targetAmount);
}

export function canSubmitLaunchpadAllocation(
  commitment: string,
  amount: string
): boolean {
  return commitment.trim().length >= 16 && isPositiveDecimalString(amount);
}

export function canAdvanceLaunchpadProjectStatus(
  from: "draft" | "live" | "funded" | "closed",
  to: "draft" | "live" | "funded" | "closed"
): boolean {
  if (from === to) return true;
  return (
    (from === "draft" && to === "live") ||
    (from === "live" && (to === "funded" || to === "closed")) ||
    (from === "funded" && to === "closed")
  );
}

export function canAdvanceLaunchpadMilestoneStatus(
  from: "planned" | "ready" | "released" | "blocked",
  to: "planned" | "ready" | "released" | "blocked"
): boolean {
  if (from === to) return true;
  return (
    (from === "planned" && (to === "ready" || to === "blocked")) ||
    (from === "ready" && (to === "released" || to === "blocked")) ||
    (from === "blocked" && to === "ready")
  );
}

export function shouldReuseLaunchpadAllocation(
  existingCommitment: string | undefined,
  requestedCommitment: string
): boolean {
  return (
    Boolean(existingCommitment) && existingCommitment === requestedCommitment
  );
}

export function canReuseLaunchpadAllocation(
  existingProjectId: number,
  requestedProjectId: number,
  existingCommitment: string | undefined,
  requestedCommitment: string
): boolean {
  return (
    existingProjectId === requestedProjectId &&
    shouldReuseLaunchpadAllocation(existingCommitment, requestedCommitment)
  );
}

export function canReusePrivateMarketBid(
  existingMarketId: number,
  requestedMarketId: number,
  existingCommitment: string | undefined,
  requestedCommitment: string
): boolean {
  return (
    existingMarketId === requestedMarketId &&
    Boolean(existingCommitment) &&
    existingCommitment === requestedCommitment
  );
}

export function isLaunchpadSlug(value: string): boolean {
  return /^launch-[a-f0-9]{20}$/.test(value);
}

export function buildLaunchpadPublicSummary(
  project: {
    slug: string;
    name: string;
    description: string | null;
    token: string;
    network: "mainnet";
    targetAmount: string;
    raisedAmount: string;
    privacyMode: "shielded" | "public";
    status: "draft" | "live" | "funded" | "closed";
    fundingEndsAt: Date | null;
  },
  milestones: Array<{
    id: number;
    name: string;
    sequence: number;
    releaseAmount: string;
    status: "planned" | "ready" | "released" | "blocked";
    proofReference: string | null;
  }>
) {
  return {
    ...project,
    milestones: milestones.map(
      ({ id, name, sequence, releaseAmount, status, proofReference }) => ({
        id,
        name,
        sequence,
        releaseAmount,
        status,
        proofReference,
      })
    ),
  };
}

export function canScheduleRoute(
  routeId: number | null,
  pending: boolean
): boolean {
  return routeId !== null && routeId > 0 && !pending;
}

export function canPublishShareableProof(
  status: "draft" | "shielded" | "routed" | "settled" | "failed" | "cancelled"
): boolean {
  return status === "settled";
}

export type PaymentRouteStatus =
  | "draft"
  | "shielded"
  | "routed"
  | "settled"
  | "failed"
  | "cancelled";

export function canAdvancePaymentRouteStatus(
  from: PaymentRouteStatus,
  to: PaymentRouteStatus
): boolean {
  if (from === to) return true;
  const transitions: Record<PaymentRouteStatus, PaymentRouteStatus[]> = {
    draft: ["shielded", "cancelled"],
    shielded: ["routed", "failed", "cancelled"],
    routed: ["settled", "failed"],
    settled: [],
    failed: [],
    cancelled: [],
  };
  return transitions[from].includes(to);
}

export function hasExactRouteAllocations(
  totalAmount: string,
  recipientAmounts: Array<{ recipientId: number; amount: string }>
): boolean {
  if (!/^\d+(\.\d{1,18})?$/.test(totalAmount) || recipientAmounts.length === 0)
    return false;
  const compare = compareDecimalStringsExact;
  const add = addDecimalStringsExact;
  const ids = new Set<number>();
  let allocationTotal = "0";
  for (const allocation of recipientAmounts) {
    if (
      !Number.isInteger(allocation.recipientId) ||
      allocation.recipientId <= 0 ||
      ids.has(allocation.recipientId)
    )
      return false;
    if (
      !/^\d+(\.\d{1,18})?$/.test(allocation.amount) ||
      compare(allocation.amount, "0") <= 0
    )
      return false;
    ids.add(allocation.recipientId);
    allocationTotal = add(allocationTotal, allocation.amount);
  }
  return (
    compare(totalAmount, "0") > 0 && compare(allocationTotal, totalAmount) === 0
  );
}

export function canCreateRecipientClaim(
  routeId: number | null,
  recipientIds: number[],
  pending: boolean
): boolean {
  return (
    routeId !== null &&
    routeId > 0 &&
    recipientIds.length === 1 &&
    recipientIds[0] > 0 &&
    !pending
  );
}

export function isWalletActionLocked(pending: boolean): boolean {
  return pending;
}

export function isValidStarknetAddress(value: string): boolean {
  const normalized = value.trim();
  return (
    normalized.length >= 4 &&
    normalized.length <= 100 &&
    /^0x[0-9a-fA-F]+$/.test(normalized)
  );
}

export function normalizeAmountInput(value: string): string {
  return value.replace(/,/g, "").trim();
}

export function isClaimToken(value: string): boolean {
  return /^claim-[a-f0-9]{32}$/.test(value);
}

export type PrivateMarketStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "reveal"
  | "settled"
  | "paused"
  | "closed";
export type PrivateMarketOrderKind = "sealed_bid" | "rfq";
export type PrivateDisclosureScope =
  | "none"
  | "aggregate"
  | "counterparty"
  | "auditor";

export function canAdvancePrivateMarketStatus(
  from: PrivateMarketStatus,
  to: PrivateMarketStatus
): boolean {
  if (from === to) return true;
  const transitions: Record<PrivateMarketStatus, PrivateMarketStatus[]> = {
    draft: ["scheduled", "live", "paused", "closed"],
    scheduled: ["live", "paused", "closed"],
    live: ["reveal", "paused", "closed"],
    reveal: ["settled", "paused", "closed"],
    settled: ["closed"],
    paused: ["scheduled", "live", "closed"],
    closed: [],
  };
  return transitions[from].includes(to);
}

export function marketActionLabel(status: PrivateMarketStatus): string {
  return status === "draft"
    ? "SCHEDULE MARKET"
    : status === "scheduled"
      ? "OPEN MARKET"
      : status === "live"
        ? "START REVEAL"
        : status === "reveal"
          ? "SETTLE ALLOCATIONS"
          : status === "settled"
            ? "ARCHIVE MARKET"
            : status === "paused"
              ? "RESUME MARKET"
              : "MARKET CLOSED";
}

export function evaluatePrivateMarketRisk(input: {
  bidAmount: string;
  targetAmount: string;
  currentCommitted: string;
  maxBidAmount?: string;
  maxConcentrationPct?: number;
  participantCommitted?: string;
}): {
  allowed: boolean;
  reasons: string[];
  utilizationPct: number;
  concentrationPct: number;
} {
  const bidParts = parseDecimal(input.bidAmount);
  const target = decimalAsFiniteNumber(input.targetAmount);
  const participant = decimalAsFiniteNumber(input.participantCommitted ?? input.bidAmount);
  const committedWithBid = addDecimalStringsExact(input.currentCommitted, input.bidAmount);
  const utilizationPct =
    compareDecimalStringsExact(input.targetAmount, "0") > 0
      ? Math.min(999, (decimalAsFiniteNumber(committedWithBid) / Math.max(target, Number.EPSILON)) * 100)
      : 0;
  const concentrationPct =
    compareDecimalStringsExact(committedWithBid, "0") > 0
      ? (participant / Math.max(decimalAsFiniteNumber(committedWithBid), Number.EPSILON)) * 100
      : 0;
  const reasons: string[] = [];
  if (!bidParts || bidParts.digits === BigInt(0))
    reasons.push("Bid must be greater than zero");
  if (input.maxBidAmount && compareDecimalStringsExact(input.bidAmount, input.maxBidAmount) > 0)
    reasons.push(`Bid exceeds the configured cap of ${input.maxBidAmount}`);
  if (
    input.maxConcentrationPct !== undefined &&
    compareDecimalTimesInteger(
      input.participantCommitted ?? input.bidAmount,
      100,
      committedWithBid,
      input.maxConcentrationPct
    ) > 0
  )
    reasons.push(`Concentration exceeds ${input.maxConcentrationPct}%`);
  return {
    allowed: reasons.length === 0,
    reasons,
    utilizationPct: Number(utilizationPct.toFixed(2)),
    concentrationPct: Number(concentrationPct.toFixed(2)),
  };
}

export function comparePrivateMarketQuotes(
  quotes: Array<{
    id: string;
    price: string;
    feeBps: number;
    expiresAt: Date | string;
  }>,
  now = new Date()
) {
  return quotes
    .filter(quote => new Date(quote.expiresAt).getTime() > now.getTime())
    .map(quote => ({
      ...quote,
      allInPrice: decimalAsFiniteNumber(
        formatDecimal(
          (parseDecimal(quote.price)?.digits ?? BigInt(0)) * BigInt(10000 + quote.feeBps),
          parseDecimal(quote.price)?.scale ?? 0
        )
      ) / 10000,
    }))
    .sort((left, right) => {
      const leftQuote = quotes.find(quote => quote.id === left.id);
      const rightQuote = quotes.find(quote => quote.id === right.id);
      if (!leftQuote || !rightQuote) return left.allInPrice - right.allInPrice;
      return compareDecimalTimesInteger(
        leftQuote.price,
        10000 + leftQuote.feeBps,
        rightQuote.price,
        10000 + rightQuote.feeBps
      );
    });
}

export function buildPrivateMarketPortfolio(input: {
  commitments: Array<{
    amount: string;
    status: "committed" | "revealed" | "accepted" | "rejected";
  }>;
  settledValue: string;
  currentValue: string;
}) {
  const committed = input.commitments
    .filter(item => item.status !== "rejected")
    .reduce((sum, item) => addDecimalStringsExact(sum, item.amount), "0");
  const settled = input.settledValue;
  const current = input.currentValue;
  return {
    committedAmount: committed,
    settledAmount: settled,
    currentValue: current,
    pnl: subtractDecimalStringsExact(current, settled),
    openCommitments: input.commitments.filter(
      item => item.status === "committed" || item.status === "revealed"
    ).length,
  };
}

export function canPublishPrivateDisclosure(
  scope: PrivateDisclosureScope,
  settlementConfirmed: boolean
): boolean {
  return scope !== "none" && settlementConfirmed;
}

export function privateDisclosureFields(
  scope: PrivateDisclosureScope
): string[] {
  if (scope === "aggregate")
    return [
      "market_status",
      "aggregate_volume",
      "participant_count",
      "clearing_price",
    ];
  if (scope === "counterparty")
    return [
      "market_status",
      "aggregate_volume",
      "participant_count",
      "clearing_price",
      "counterparty_allocation",
    ];
  if (scope === "auditor")
    return [
      "market_status",
      "aggregate_volume",
      "participant_count",
      "clearing_price",
      "settlement_receipt",
      "policy_attestation",
    ];
  return [];
}
