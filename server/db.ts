import { and, desc, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { RpcProvider } from "starknet";
import {
  buildLaunchpadPublicSummary,
  canAdvanceLaunchpadMilestoneStatus,
  canAdvanceLaunchpadProjectStatus,
  canAdvanceLaunchpadReleaseStatus,
  canAdvancePaymentRouteStatus,
  canAdvancePrivateMarketStatus,
  canPublishShareableProof,
  canReuseLaunchpadAllocation,
  canReusePrivateMarketBid,
  evaluateTreasuryPolicy,
  hasExactRouteAllocations,
  shouldReuseLaunchpadAllocation,
  summarizeLaunchpadReadiness,
  addDecimalStringsExact,
  subtractDecimalStringsExact,
  multiplyDecimalStringsExact,
  decimalRatioAsNumber,
  compareDecimalTimesInteger,
} from "@shared/operations";
import {
  auditEvents,
  claimLinks,
  launchpadAllocations,
  launchpadMilestones,
  launchpadProjects,
  launchpadProjectOps,
  launchpadReleaseRequests,
  treasuryBalanceSnapshots,
  blockchainTransactions,
  payrollSchedules,
  routeApprovals,
  shareableProofs,
  treasuryPolicies,
  InsertUser,
  paymentRoutes,
  privateMarkets,
  privateMarketBids,
  privateMarketQuotes,
  privateMarketRiskPolicies,
  privateMarketAlerts,
  localAccounts,
  passwordResetTokens,
  recipients,
  routeRecipients,
  users,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

function compareDecimalStrings(left: string, right: string): number {
  const normalize = (value: string) => {
    const [whole = "0", fraction = ""] = value.split(".");
    return {
      whole: whole.replace(/^0+(?=\d)/, "") || "0",
      fraction: fraction.replace(/0+$/, ""),
    };
  };
  const a = normalize(left);
  const b = normalize(right);
  if (a.whole.length !== b.whole.length)
    return a.whole.length > b.whole.length ? 1 : -1;
  if (a.whole !== b.whole) return a.whole > b.whole ? 1 : -1;
  const width = Math.max(a.fraction.length, b.fraction.length);
  const af = a.fraction.padEnd(width, "0");
  const bf = b.fraction.padEnd(width, "0");
  if (af === bf) return 0;
  return af > bf ? 1 : -1;
}

function addDecimalStrings(left: string, right: string): string {
  const [leftWhole, leftFraction = ""] = left.split(".");
  const [rightWhole, rightFraction = ""] = right.split(".");
  const fractionLength = Math.max(leftFraction.length, rightFraction.length);
  const leftDigits = `${leftWhole || "0"}${leftFraction.padEnd(fractionLength, "0")}`;
  const rightDigits = `${rightWhole || "0"}${rightFraction.padEnd(fractionLength, "0")}`;
  const width = Math.max(leftDigits.length, rightDigits.length);
  const a = leftDigits.padStart(width, "0");
  const b = rightDigits.padStart(width, "0");
  let carry = 0;
  let result = "";
  for (let index = width - 1; index >= 0; index -= 1) {
    const sum = Number(a[index]) + Number(b[index]) + carry;
    result = String(sum % 10) + result;
    carry = Math.floor(sum / 10);
  }
  if (carry) result = String(carry) + result;
  const wholeEnd = result.length - fractionLength;
  const whole = result.slice(0, wholeEnd) || "0";
  const fraction = result.slice(wholeEnd).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }

  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function createLocalAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
  openId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");

  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: localAccounts.id })
      .from(localAccounts)
      .where(eq(localAccounts.email, input.email))
      .limit(1);
    if (existing[0]) throw new Error("An account with this email already exists");

    const inserted = await tx
      .insert(users)
      .values({
        openId: input.openId,
        name: input.name,
        email: input.email,
        loginMethod: "veyra-password",
        lastSignedIn: new Date(),
      })
      .$returningId();
    const userId = inserted[0]?.id;
    if (!userId) throw new Error("Could not create user account");

    await tx.insert(localAccounts).values({
      userId,
      email: input.email,
      passwordHash: input.passwordHash,
    });

    const user = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) throw new Error("Could not load user account");
    return user[0];
  });
}

export async function getLocalAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ account: localAccounts, user: users })
    .from(localAccounts)
    .innerJoin(users, eq(localAccounts.userId, users.id))
    .where(eq(localAccounts.email, email))
    .limit(1);
  return result[0];
}

export async function touchUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function createPasswordResetRecord(input: { userId: number; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.userId, input.userId), isNull(passwordResetTokens.usedAt)));
  await db.insert(passwordResetTokens).values(input);
}

export async function consumePasswordResetToken(input: { tokenHash: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const now = new Date();
    const token = await tx.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, input.tokenHash)).limit(1);
    const reset = token[0];
    if (!reset || reset.usedAt || reset.expiresAt <= now) return null;
    const updated = await tx.update(passwordResetTokens).set({ usedAt: now }).where(and(eq(passwordResetTokens.id, reset.id), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)));
    const affectedRows = Number(updated[0]?.affectedRows ?? 0);
    if (!affectedRows) return null;
    await tx.update(localAccounts).set({ passwordHash: input.passwordHash }).where(eq(localAccounts.userId, reset.userId));
    await tx.update(users).set({ sessionVersion: sql`${users.sessionVersion} + 1` }).where(eq(users.id, reset.userId));
    const user = await tx.select().from(users).where(eq(users.id, reset.userId)).limit(1);
    return user[0] ?? null;
  });
}

export function buildInitialWorkspaceIdentity(
  userId: number,
  userName?: string | null,
  nonce = randomUUID(),
) {
  const workspaceName = `${userName?.trim() || "Private"} workspace`.slice(0, 160);
  const baseSlug =
    workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "private-workspace";
  const suffix = `${userId}-${nonce.replace(/-/g, "").slice(0, 12)}`;
  return {
    name: workspaceName,
    slug: `${baseSlug.slice(0, 160 - suffix.length - 1)}-${suffix}`,
  };
}

export async function ensureWorkspaceForUser(
  userId: number,
  userName?: string | null
) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ workspace: workspaces })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, userId))
        .limit(1);
      if (existing[0]?.workspace) return existing[0].workspace;

      const identity = buildInitialWorkspaceIdentity(userId, userName);
      const created = await tx
        .insert(workspaces)
        .values({
          name: identity.name,
          slug: identity.slug,
          ownerUserId: userId,
          defaultToken: "USDC",
          network: "mainnet",
          approvalThreshold: 1,
        })
        .$returningId();
      const workspaceId = created[0]?.id;
      if (!workspaceId) throw new Error("Workspace insert returned no identifier");

      await tx
        .insert(workspaceMembers)
        .values({ workspaceId, userId, role: "owner" });
      const rows = await tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      if (!rows[0]) throw new Error("Workspace record was not readable after creation");
      return rows[0];
    });
  } catch (error) {
    console.error("[Workspace] Initial workspace bootstrap failed", { userId, error });
    throw new Error("Your private workspace could not be initialized. Select Retry to try again.");
  }
}

export async function getWorkspaceForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ workspace: workspaces, memberRole: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  return rows[0];
}

export async function updateWorkspaceApprovalThreshold(
  workspaceId: number,
  actorUserId: number,
  approvalThreshold: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const result = await tx
      .update(workspaces)
      .set({ approvalThreshold })
      .where(eq(workspaces.id, workspaceId));
    if (result[0]?.affectedRows !== 1)
      throw new Error("Workspace not found");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId,
        actorUserId,
        entityType: "workspace",
        entityId: workspaceId,
        action: "approval_threshold_updated",
        metadata: JSON.stringify({ approvalThreshold }),
      });
    const rows = await tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    return rows[0];
  });
}

export async function listWorkspaceTreasuryBalances(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(treasuryBalanceSnapshots)
    .where(eq(treasuryBalanceSnapshots.workspaceId, workspaceId))
    .orderBy(desc(treasuryBalanceSnapshots.capturedAt))
    .limit(12);
}

export async function recordTreasuryBalanceSnapshot(input: {
  workspaceId: number;
  token: string;
  network: "mainnet";
  availableBalance: string;
  source?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const inserted = await db
    .insert(treasuryBalanceSnapshots)
    .values(input)
    .$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Could not record treasury balance snapshot");
  const rows = await db
    .select()
    .from(treasuryBalanceSnapshots)
    .where(eq(treasuryBalanceSnapshots.id, id))
    .limit(1);
  return rows[0];
}

export async function simulateTreasuryPolicy(
  workspaceId: number,
  input: {
    token: string;
    totalAmount: string;
    approvalCount: number;
    network: "mainnet";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const policy = (
    await db
      .select()
      .from(treasuryPolicies)
      .where(
        and(
          eq(treasuryPolicies.workspaceId, workspaceId),
          eq(treasuryPolicies.token, input.token),
          eq(treasuryPolicies.status, "active")
        )
      )
      .orderBy(desc(treasuryPolicies.createdAt))
      .limit(1)
  )[0];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const todayRoutes = await db
    .select()
    .from(paymentRoutes)
    .where(eq(paymentRoutes.workspaceId, workspaceId));
  const dailyUsed = todayRoutes
    .filter(
      route =>
        route.token === input.token &&
        route.network === input.network &&
        route.createdAt >= start &&
        !["failed", "cancelled"].includes(route.status)
    )
    .reduce((sum, route) => addDecimalStrings(sum, route.totalAmount), "0");
  const evaluation = evaluateTreasuryPolicy(policy, { ...input, dailyUsed });
  return {
    ...evaluation,
    dailyUsed,
    ...(policy ? { policyName: policy.name } : {}),
  } as const;
}

export async function listWorkspaceTreasuryPolicies(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(treasuryPolicies)
    .where(
      and(
        eq(treasuryPolicies.workspaceId, workspaceId),
        eq(treasuryPolicies.status, "active")
      )
    )
    .orderBy(desc(treasuryPolicies.createdAt));
}

export async function createTreasuryPolicy(input: {
  workspaceId: number;
  createdByUserId: number;
  name: string;
  token: string;
  network: "mainnet";
  maxRouteAmount: string;
  dailyLimit: string;
  approvalThreshold: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const existing = await tx
      .select()
      .from(treasuryPolicies)
      .where(
        and(
          eq(treasuryPolicies.workspaceId, input.workspaceId),
          eq(treasuryPolicies.name, input.name),
          eq(treasuryPolicies.status, "active")
        )
      )
      .limit(1);
    if (existing[0]) return existing[0];
    const inserted = await tx
      .insert(treasuryPolicies)
      .values(input)
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create treasury policy");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "treasury_policy",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(treasuryPolicies)
      .where(eq(treasuryPolicies.id, id))
      .limit(1);
    return rows[0];
  });
}

export async function createRecipientClaimLink(input: {
  workspaceId: number;
  routeId: number;
  recipientId: number;
  createdByUserId: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  if (input.expiresAt <= new Date())
    throw new Error("Claim link must expire in the future");

  return db.transaction(async tx => {
    const route = await tx
      .select({ id: paymentRoutes.id })
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    const recipient = await tx
      .select({ id: recipients.id })
      .from(recipients)
      .where(
        and(
          eq(recipients.id, input.recipientId),
          eq(recipients.workspaceId, input.workspaceId),
          eq(recipients.status, "active")
        )
      )
      .limit(1);
    const allocation = await tx
      .select({ id: routeRecipients.id })
      .from(routeRecipients)
      .where(
        and(
          eq(routeRecipients.routeId, input.routeId),
          eq(routeRecipients.recipientId, input.recipientId)
        )
      )
      .limit(1);
    if (!route[0] || !recipient[0] || !allocation[0])
      throw new Error("Route recipient allocation not found in workspace");

    const existing = await tx
      .select()
      .from(claimLinks)
      .where(
        and(
          eq(claimLinks.workspaceId, input.workspaceId),
          eq(claimLinks.routeId, input.routeId),
          eq(claimLinks.recipientId, input.recipientId),
          eq(claimLinks.status, "pending")
        )
      )
      .limit(1);
    if (existing[0] && existing[0].expiresAt > new Date()) return existing[0];

    const token = `claim-${randomUUID().replaceAll("-", "")}`;
    const inserted = await tx
      .insert(claimLinks)
      .values({ ...input, token })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create claim link");
    await tx
      .update(routeRecipients)
      .set({ fulfillmentStatus: "claim_ready" })
      .where(
        and(
          eq(routeRecipients.routeId, input.routeId),
          eq(routeRecipients.recipientId, input.recipientId)
        )
      );
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "claim_link",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(claimLinks)
      .where(eq(claimLinks.id, id))
      .limit(1);
    return rows[0];
  });
}

export async function getPublicClaim(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      claim: claimLinks,
      route: paymentRoutes,
      allocation: routeRecipients.amount,
    })
    .from(claimLinks)
    .innerJoin(paymentRoutes, eq(claimLinks.routeId, paymentRoutes.id))
    .innerJoin(
      routeRecipients,
      and(
        eq(routeRecipients.routeId, claimLinks.routeId),
        eq(routeRecipients.recipientId, claimLinks.recipientId)
      )
    )
    .where(and(eq(claimLinks.token, token), eq(claimLinks.status, "pending")))
    .limit(1);
  const row = rows[0];
  if (!row || row.claim.expiresAt <= new Date()) return undefined;
  return {
    token: row.claim.token,
    expiresAt: row.claim.expiresAt,
    routeName: row.route.name,
    asset: row.route.token,
    amount: row.allocation,
    status: row.route.status,
  };
}

export async function claimRecipientLink(token: string, walletAddress: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const now = new Date();
  return db.transaction(async tx => {
    const current = await tx
      .select()
      .from(claimLinks)
      .where(
        and(
          eq(claimLinks.token, token),
          eq(claimLinks.status, "pending"),
          gt(claimLinks.expiresAt, now)
        )
      )
      .limit(1);
    if (!current[0]) throw new Error("Claim link is invalid or expired");
    const result = await tx
      .update(claimLinks)
      .set({
        status: "claimed",
        claimedAt: now,
        claimedWalletAddress: walletAddress,
      })
      .where(
        and(
          eq(claimLinks.id, current[0].id),
          eq(claimLinks.status, "pending"),
          gt(claimLinks.expiresAt, now)
        )
      );
    const affectedRows = result[0]?.affectedRows;
    if (affectedRows !== 1) throw new Error("Claim link was already redeemed");
    await tx
      .update(routeRecipients)
      .set({
        fulfillmentStatus: "claimed",
        fulfilledWalletAddress: walletAddress,
      })
      .where(
        and(
          eq(routeRecipients.routeId, current[0].routeId),
          eq(routeRecipients.recipientId, current[0].recipientId)
        )
      );
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: current[0].workspaceId,
        actorUserId: current[0].createdByUserId,
        entityType: "claim_link",
        entityId: current[0].id,
        action: "redeemed",
      });
    return { success: true, walletAddress, claimId: current[0].id } as const;
  });
}

export async function listWorkspaceRecipients(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(recipients)
    .where(eq(recipients.workspaceId, workspaceId))
    .orderBy(desc(recipients.createdAt));
}

export async function listWorkspaceRoutes(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(paymentRoutes)
    .where(eq(paymentRoutes.workspaceId, workspaceId))
    .orderBy(desc(paymentRoutes.createdAt));
}

export async function createRecipient(input: {
  workspaceId: number;
  createdByUserId: number;
  displayName: string;
  walletAddress: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const inserted = await tx.insert(recipients).values(input).$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create recipient");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "recipient",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(recipients)
      .where(eq(recipients.id, id))
      .limit(1);
    return rows[0];
  });
}

export async function archiveRecipient(
  workspaceId: number,
  recipientId: number,
  actorUserId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const result = await tx
      .update(recipients)
      .set({ status: "archived" })
      .where(
        and(
          eq(recipients.id, recipientId),
          eq(recipients.workspaceId, workspaceId)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Recipient not found in workspace");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId,
        actorUserId,
        entityType: "recipient",
        entityId: recipientId,
        action: "archived",
      });
    return { success: true } as const;
  });
}

export async function createPaymentRoute(input: {
  workspaceId: number;
  createdByUserId: number;
  name: string;
  token: string;
  network: "mainnet";
  totalAmount: string;
  recipientAmounts: Array<{ recipientId: number; amount: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  if (!hasExactRouteAllocations(input.totalAmount, input.recipientAmounts))
    throw new Error(
      "Route allocations must be unique, positive, and add exactly to the route total"
    );
  return db.transaction(async tx => {
    const workspace = await tx
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.id, input.workspaceId))
      .for("update")
      .limit(1);
    if (!workspace[0]) throw new Error("Workspace not found");
    const activePolicy = (
      await tx
        .select()
        .from(treasuryPolicies)
        .where(
          and(
            eq(treasuryPolicies.workspaceId, input.workspaceId),
            eq(treasuryPolicies.token, input.token),
            eq(treasuryPolicies.status, "active")
          )
        )
        .orderBy(desc(treasuryPolicies.createdAt))
        .limit(1)
    )[0];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const todayRoutes = await tx
      .select()
      .from(paymentRoutes)
      .where(eq(paymentRoutes.workspaceId, input.workspaceId));
    const dailyUsed = todayRoutes
      .filter(
        route =>
          route.token === input.token &&
          route.network === input.network &&
          route.createdAt >= start &&
          !["failed", "cancelled"].includes(route.status)
      )
      .reduce((sum, route) => addDecimalStrings(sum, route.totalAmount), "0");
    const evaluation = evaluateTreasuryPolicy(activePolicy, {
      totalAmount: input.totalAmount,
      approvalCount: 0,
      network: input.network,
      dailyUsed,
    });
    if (
      !evaluation.allowed &&
      evaluation.reasons.some(
        reason =>
          reason.includes("limit") ||
          reason.includes("restricted") ||
          reason.includes("exceeded")
      )
    )
      throw new Error(evaluation.reasons.join(" / "));
    const recipientIds = Array.from(
      new Set(input.recipientAmounts.map(item => item.recipientId))
    );
    const ownedRecipients = recipientIds.length
      ? await tx
          .select({ id: recipients.id })
          .from(recipients)
          .where(
            and(
              eq(recipients.workspaceId, input.workspaceId),
              eq(recipients.status, "active")
            )
          )
      : [];
    const ownedIds = new Set(ownedRecipients.map(row => row.id));
    if (recipientIds.some(id => !ownedIds.has(id)))
      throw new Error("One or more recipients do not belong to this workspace");
    const inserted = await tx
      .insert(paymentRoutes)
      .values({
        workspaceId: input.workspaceId,
        createdByUserId: input.createdByUserId,
        name: input.name,
        token: input.token,
        network: input.network,
        totalAmount: input.totalAmount,
      })
      .$returningId();
    const routeId = inserted[0]?.id;
    if (!routeId) throw new Error("Could not create payment route");
    if (input.recipientAmounts.length) {
      await tx
        .insert(routeRecipients)
        .values(
          input.recipientAmounts.map(item => ({
            routeId,
            recipientId: item.recipientId,
            amount: item.amount,
          }))
        );
    }
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "payment_route",
        entityId: routeId,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(paymentRoutes)
      .where(eq(paymentRoutes.id, routeId))
      .limit(1);
    return rows[0];
  });
}

export async function updateRecipient(
  workspaceId: number,
  recipientId: number,
  actorUserId: number,
  input: { displayName: string; walletAddress: string; note?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const result = await tx
      .update(recipients)
      .set(input)
      .where(
        and(
          eq(recipients.id, recipientId),
          eq(recipients.workspaceId, workspaceId)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Recipient not found in workspace");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId,
        actorUserId,
        entityType: "recipient",
        entityId: recipientId,
        action: "updated",
      });
    const rows = await tx
      .select()
      .from(recipients)
      .where(
        and(
          eq(recipients.id, recipientId),
          eq(recipients.workspaceId, workspaceId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function restoreRecipient(
  workspaceId: number,
  recipientId: number,
  actorUserId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const result = await tx
      .update(recipients)
      .set({ status: "active" })
      .where(
        and(
          eq(recipients.id, recipientId),
          eq(recipients.workspaceId, workspaceId)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Recipient not found in workspace");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId,
        actorUserId,
        entityType: "recipient",
        entityId: recipientId,
        action: "restored",
      });
    return { success: true } as const;
  });
}

export async function transitionPaymentRoute(
  workspaceId: number,
  routeId: number,
  actorUserId: number,
  status: "draft" | "shielded" | "routed" | "settled" | "failed" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const ownedRoute = await tx
      .select({ id: paymentRoutes.id, status: paymentRoutes.status })
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, routeId),
          eq(paymentRoutes.workspaceId, workspaceId)
        )
      )
      .limit(1);
    if (!ownedRoute[0]) throw new Error("Route not found in workspace");
    if (!canAdvancePaymentRouteStatus(ownedRoute[0].status, status))
      throw new Error(
        `Invalid route transition: ${ownedRoute[0].status} -> ${status}`
      );
    if (status === "settled") {
      const workspace = await tx
        .select({ approvalThreshold: workspaces.approvalThreshold })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      const approved = await tx
        .select({ id: routeApprovals.id })
        .from(routeApprovals)
        .where(
          and(
            eq(routeApprovals.workspaceId, workspaceId),
            eq(routeApprovals.routeId, routeId),
            eq(routeApprovals.status, "approved")
          )
        );
      const threshold = workspace[0]?.approvalThreshold ?? 1;
      if (approved.length < threshold)
        throw new Error(
          `Route requires ${threshold} approval(s) before settlement`
        );
    }
    const result = await tx
      .update(paymentRoutes)
      .set({ status })
      .where(
        and(
          eq(paymentRoutes.id, routeId),
          eq(paymentRoutes.workspaceId, workspaceId),
          eq(paymentRoutes.status, ownedRoute[0].status)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Route changed before transition could be applied");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId,
        actorUserId,
        entityType: "payment_route",
        entityId: routeId,
        action: `status_${status}`,
      });
    const rows = await tx
      .select()
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, routeId),
          eq(paymentRoutes.workspaceId, workspaceId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function listWorkspaceAuditEvents(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.workspaceId, workspaceId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(100);
}

export async function recordBlockchainTransaction(input: {
  workspaceId: number;
  actorUserId: number;
  routeId: number;
  network: "mainnet";
  transactionHash: string;
  status: "submitted";
  explorerUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const ownedRoute = await tx
      .select({ id: paymentRoutes.id, status: paymentRoutes.status, network: paymentRoutes.network })
      .from(paymentRoutes)
      .where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId)))
      .for("update")
      .limit(1);
    if (!ownedRoute[0]) throw new Error("Route not found in workspace");
    if (ownedRoute[0].network !== input.network)
      throw new Error("Transaction network does not match the route network");
    const existing = await tx
      .select()
      .from(blockchainTransactions)
      .where(eq(blockchainTransactions.transactionHash, input.transactionHash))
      .limit(1);
    if (existing[0]) {
      if (existing[0].routeId !== input.routeId || existing[0].network !== input.network)
        throw new Error("Transaction hash is already bound to another route or network");
      return existing[0];
    }
    await tx.insert(blockchainTransactions).values({
      routeId: input.routeId,
      network: input.network,
      transactionHash: input.transactionHash,
      status: input.status,
      explorerUrl: input.explorerUrl,
    });
    const rows = await tx
      .select()
      .from(blockchainTransactions)
      .where(eq(blockchainTransactions.transactionHash, input.transactionHash))
      .limit(1);
    return rows[0];
  });
}

export async function listRouteTransactions(
  workspaceId: number,
  routeId: number
) {
  const db = await getDb();
  if (!db) return [];
  const ownedRoute = await db
    .select({ id: paymentRoutes.id })
    .from(paymentRoutes)
    .where(
      and(
        eq(paymentRoutes.id, routeId),
        eq(paymentRoutes.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!ownedRoute[0]) throw new Error("Route not found in workspace");
  return db
    .select()
    .from(blockchainTransactions)
    .where(eq(blockchainTransactions.routeId, routeId))
    .orderBy(desc(blockchainTransactions.submittedAt));
}

export async function listWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ workspace: workspaces, memberRole: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(workspaces.updatedAt));
}

export async function verifyStarknetReceipt(
  transactionHash: string,
  network: "mainnet"
) {
  const nodeUrl =
    process.env.STARKNET_MAINNET_RPC_URL ||
    process.env.STARKNET_RPC_URL ||
    "https://starknet-mainnet.public.blastapi.io";
  const provider = new RpcProvider({ nodeUrl });
  const receipt = await provider.getTransactionReceipt(transactionHash);
  const executionStatus = String(
    (receipt as { execution_status?: string }).execution_status || ""
  ).toUpperCase();
  const finalityStatus = String(
    (receipt as { finality_status?: string }).finality_status || ""
  ).toUpperCase();
  const status =
    executionStatus === "SUCCEEDED" &&
    ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"].includes(finalityStatus)
      ? "confirmed"
      : executionStatus === "REVERTED"
        ? "reverted"
        : "unknown";
  return { status, finalityStatus, executionStatus } as const;
}

export async function verifyWorkspaceStarknetReceipt(
  workspaceId: number,
  transactionHash: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db
    .select({ tx: blockchainTransactions, route: paymentRoutes })
    .from(blockchainTransactions)
    .innerJoin(
      paymentRoutes,
      eq(blockchainTransactions.routeId, paymentRoutes.id)
    )
    .where(
      and(
        eq(blockchainTransactions.transactionHash, transactionHash),
        eq(paymentRoutes.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!rows[0]) throw new Error("Transaction not found in workspace");
  if (rows[0].tx.network !== rows[0].route.network)
    throw new Error("Stored transaction network does not match its route");
  return verifyStarknetReceipt(transactionHash, rows[0].tx.network);
}

export async function confirmBlockchainTransaction(input: {
  workspaceId: number;
  actorUserId: number;
  transactionHash: string;
  status: "confirmed" | "reverted" | "unknown";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const rows = await tx
      .select({ tx: blockchainTransactions, route: paymentRoutes })
      .from(blockchainTransactions)
      .innerJoin(paymentRoutes, eq(blockchainTransactions.routeId, paymentRoutes.id))
      .where(and(eq(blockchainTransactions.transactionHash, input.transactionHash), eq(paymentRoutes.workspaceId, input.workspaceId)))
      .for("update")
      .limit(1);
    const current = rows[0];
    if (!current) throw new Error("Transaction not found in workspace");
    const routeStatus = input.status === "confirmed" ? "settled" : input.status === "reverted" ? "failed" : "routed";
    if (!canAdvancePaymentRouteStatus(current.route.status, routeStatus))
      throw new Error(`Invalid route transition: ${current.route.status} -> ${routeStatus}`);
    if (routeStatus === "settled") {
      const workspace = await tx.select({ approvalThreshold: workspaces.approvalThreshold }).from(workspaces).where(eq(workspaces.id, input.workspaceId)).limit(1);
      const approved = await tx.select({ id: routeApprovals.id }).from(routeApprovals).where(and(eq(routeApprovals.workspaceId, input.workspaceId), eq(routeApprovals.routeId, current.route.id), eq(routeApprovals.status, "approved")));
      const threshold = workspace[0]?.approvalThreshold ?? 1;
      if (approved.length < threshold) throw new Error(`Route requires ${threshold} approval(s) before settlement`);
    }
    await tx.update(blockchainTransactions).set({ status: input.status, confirmedAt: input.status === "confirmed" ? new Date() : null }).where(eq(blockchainTransactions.id, current.tx.id));
    await tx.update(paymentRoutes).set({ status: routeStatus }).where(and(eq(paymentRoutes.id, current.route.id), eq(paymentRoutes.workspaceId, input.workspaceId)));
    await tx.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, entityType: "payment_route", entityId: current.route.id, action: `status_${routeStatus}` });
    const updated = await tx.select().from(blockchainTransactions).where(eq(blockchainTransactions.transactionHash, input.transactionHash)).limit(1);
    return updated[0];
  });
}

export async function updatePaymentRoute(input: {
  workspaceId: number;
  routeId: number;
  actorUserId: number;
  name: string;
  token: string;
  network: "mainnet";
  totalAmount: string;
  recipientAmounts: Array<{ recipientId: number; amount: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  if (!hasExactRouteAllocations(input.totalAmount, input.recipientAmounts))
    throw new Error(
      "Route allocations must be unique, positive, and add exactly to the route total"
    );
  return db.transaction(async tx => {
    const workspace = await tx
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.id, input.workspaceId))
      .for("update")
      .limit(1);
    if (!workspace[0]) throw new Error("Workspace not found");
    const existing = await tx
      .select({ id: paymentRoutes.id, status: paymentRoutes.status })
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId)
        )
      )
      .for("update")
      .limit(1);
    if (!existing[0]) throw new Error("Route not found in workspace");
    if (existing[0].status !== "draft")
      throw new Error("Only draft routes can be edited");
    const activePolicy = (
      await tx
        .select()
        .from(treasuryPolicies)
        .where(
          and(
            eq(treasuryPolicies.workspaceId, input.workspaceId),
            eq(treasuryPolicies.token, input.token),
            eq(treasuryPolicies.status, "active")
          )
        )
        .orderBy(desc(treasuryPolicies.createdAt))
        .limit(1)
    )[0];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const todayRoutes = await tx
      .select()
      .from(paymentRoutes)
      .where(eq(paymentRoutes.workspaceId, input.workspaceId));
    const dailyUsed = todayRoutes
      .filter(
        route =>
          route.id !== input.routeId &&
          route.token === input.token &&
          route.network === input.network &&
          route.createdAt >= start &&
          !["failed", "cancelled"].includes(route.status)
      )
      .reduce((sum, route) => addDecimalStrings(sum, route.totalAmount), "0");
    const evaluation = evaluateTreasuryPolicy(activePolicy, {
      totalAmount: input.totalAmount,
      approvalCount: 0,
      network: input.network,
      dailyUsed,
    });
    if (
      !evaluation.allowed &&
      evaluation.reasons.some(
        reason =>
          reason.includes("limit") ||
          reason.includes("restricted") ||
          reason.includes("exceeded")
      )
    )
      throw new Error(evaluation.reasons.join(" / "));
    const recipientIds = Array.from(
      new Set(input.recipientAmounts.map(item => item.recipientId))
    );
    const owned = await tx
      .select({ id: recipients.id })
      .from(recipients)
      .where(
        and(
          eq(recipients.workspaceId, input.workspaceId),
          eq(recipients.status, "active")
        )
      );
    const ownedIds = new Set(owned.map(row => row.id));
    if (!recipientIds.length || recipientIds.some(id => !ownedIds.has(id)))
      throw new Error(
        "All selected recipients must be active workspace recipients"
      );
    const result = await tx
      .update(paymentRoutes)
      .set({
        name: input.name,
        token: input.token,
        network: input.network,
        totalAmount: input.totalAmount,
      })
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId),
          eq(paymentRoutes.status, "draft")
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Only draft routes can be edited");
    await tx
      .delete(routeRecipients)
      .where(eq(routeRecipients.routeId, input.routeId));
    await tx
      .insert(routeRecipients)
      .values(
        input.recipientAmounts.map(item => ({
          routeId: input.routeId,
          recipientId: item.recipientId,
          amount: item.amount,
        }))
      );
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "payment_route",
        entityId: input.routeId,
        action: "updated",
      });
    const rows = await tx
      .select()
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function listRouteRecipientIds(
  workspaceId: number,
  routeId: number
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ recipientId: routeRecipients.recipientId })
    .from(routeRecipients)
    .innerJoin(paymentRoutes, eq(routeRecipients.routeId, paymentRoutes.id))
    .where(
      and(
        eq(routeRecipients.routeId, routeId),
        eq(paymentRoutes.workspaceId, workspaceId)
      )
    );
  return rows.map(row => row.recipientId);
}

export async function listRouteRecipientReview(
  workspaceId: number,
  routeId: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      recipientId: routeRecipients.recipientId,
      displayName: recipients.displayName,
      allocation: routeRecipients.amount,
      fulfillmentStatus: routeRecipients.fulfillmentStatus,
      fulfilledWalletAddress: routeRecipients.fulfilledWalletAddress,
    })
    .from(routeRecipients)
    .innerJoin(paymentRoutes, eq(routeRecipients.routeId, paymentRoutes.id))
    .innerJoin(recipients, eq(routeRecipients.recipientId, recipients.id))
    .where(
      and(
        eq(routeRecipients.routeId, routeId),
        eq(paymentRoutes.workspaceId, workspaceId)
      )
    );
}

export async function getWorkspaceByIdForUser(
  userId: number,
  workspaceId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ workspace: workspaces, memberRole: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function createPayrollSchedule(input: {
  workspaceId: number;
  routeId: number;
  createdByUserId: number;
  frequency: "weekly" | "biweekly" | "monthly";
  timezone: string;
  nextRunAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const route = await tx
      .select({ id: paymentRoutes.id })
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!route[0]) throw new Error("Route not found in workspace");
    const existing = await tx
      .select()
      .from(payrollSchedules)
      .where(
        and(
          eq(payrollSchedules.workspaceId, input.workspaceId),
          eq(payrollSchedules.routeId, input.routeId),
          eq(payrollSchedules.frequency, input.frequency),
          eq(payrollSchedules.nextRunAt, input.nextRunAt),
          eq(payrollSchedules.status, "active")
        )
      )
      .limit(1);
    if (existing[0]) return existing[0];
    const inserted = await tx
      .insert(payrollSchedules)
      .values({ ...input, status: "active" })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create payroll schedule");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "schedule",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(payrollSchedules)
      .where(eq(payrollSchedules.id, id))
      .limit(1);
    return rows[0];
  });
}

export async function listWorkspaceSchedules(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(payrollSchedules)
    .where(eq(payrollSchedules.workspaceId, workspaceId))
    .orderBy(desc(payrollSchedules.nextRunAt));
}

export async function setPayrollScheduleTaskUid(
  workspaceId: number,
  scheduleId: number,
  taskUid: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db
    .update(payrollSchedules)
    .set({ scheduleCronTaskUid: taskUid })
    .where(
      and(
        eq(payrollSchedules.id, scheduleId),
        eq(payrollSchedules.workspaceId, workspaceId)
      )
    );
  if (result[0]?.affectedRows !== 1)
    throw new Error("Schedule not found in workspace");
  const rows = await db
    .select()
    .from(payrollSchedules)
    .where(
      and(
        eq(payrollSchedules.id, scheduleId),
        eq(payrollSchedules.workspaceId, workspaceId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function getPayrollScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(payrollSchedules)
    .where(eq(payrollSchedules.scheduleCronTaskUid, taskUid))
    .limit(1);
  return rows[0];
}

export async function markPayrollScheduleTriggered(
  scheduleId: number,
  nextRunAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db
    .update(payrollSchedules)
    .set({ lastRunAt: new Date(), nextRunAt })
    .where(
      and(
        eq(payrollSchedules.id, scheduleId),
        eq(payrollSchedules.status, "active")
      )
    );
  if (result[0]?.affectedRows !== 1)
    throw new Error("Active payroll schedule was not found");
  return { success: true } as const;
}

export async function updatePayrollSchedule(
  workspaceId: number,
  scheduleId: number,
  actorUserId: number,
  input: {
    frequency: "weekly" | "biweekly" | "monthly";
    timezone: string;
    nextRunAt: Date;
    status: "active" | "paused" | "completed";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const result = await tx
      .update(payrollSchedules)
      .set(input)
      .where(
        and(
          eq(payrollSchedules.id, scheduleId),
          eq(payrollSchedules.workspaceId, workspaceId)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Schedule not found in workspace");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId,
        actorUserId,
        entityType: "schedule",
        entityId: scheduleId,
        action: `status_${input.status}`,
      });
    const rows = await tx
      .select()
      .from(payrollSchedules)
      .where(
        and(
          eq(payrollSchedules.id, scheduleId),
          eq(payrollSchedules.workspaceId, workspaceId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function listRouteApprovals(workspaceId: number, routeId: number) {
  const db = await getDb();
  if (!db) return [];
  const route = await db
    .select({ id: paymentRoutes.id })
    .from(paymentRoutes)
    .where(
      and(
        eq(paymentRoutes.id, routeId),
        eq(paymentRoutes.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!route[0]) throw new Error("Route not found in workspace");
  return db
    .select()
    .from(routeApprovals)
    .where(
      and(
        eq(routeApprovals.workspaceId, workspaceId),
        eq(routeApprovals.routeId, routeId)
      )
    )
    .orderBy(desc(routeApprovals.createdAt));
}

export async function upsertRouteApproval(input: {
  workspaceId: number;
  routeId: number;
  approverUserId: number;
  status: "approved" | "rejected";
  comment?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const route = await tx
      .select({ id: paymentRoutes.id })
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!route[0]) throw new Error("Route not found in workspace");
    const now = new Date();
    await tx
      .insert(routeApprovals)
      .values({ ...input, decidedAt: now })
      .onDuplicateKeyUpdate({
        set: {
          status: input.status,
          comment: input.comment,
          decidedAt: now,
        },
      });
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.approverUserId,
        entityType: "route_approval",
        entityId: input.routeId,
        action: input.status,
      });
    const rows = await tx
      .select()
      .from(routeApprovals)
      .where(
        and(
          eq(routeApprovals.workspaceId, input.workspaceId),
          eq(routeApprovals.routeId, input.routeId),
          eq(routeApprovals.approverUserId, input.approverUserId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function createShareableProof(input: {
  workspaceId: number;
  routeId: number;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const route = await tx
      .select({
        id: paymentRoutes.id,
        proofReference: paymentRoutes.proofReference,
        status: paymentRoutes.status,
        token: paymentRoutes.token,
        totalAmount: paymentRoutes.totalAmount,
        name: paymentRoutes.name,
        createdAt: paymentRoutes.createdAt,
      })
      .from(paymentRoutes)
      .where(
        and(
          eq(paymentRoutes.id, input.routeId),
          eq(paymentRoutes.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!route[0]) throw new Error("Route not found in workspace");
    if (!canPublishShareableProof(route[0].status))
      throw new Error("Public proofs require a settled route");
    if (!route[0].proofReference?.trim())
      throw new Error("Public proofs require a confirmed receipt reference");
    const existing = await tx
      .select()
      .from(shareableProofs)
      .where(
        and(
          eq(shareableProofs.workspaceId, input.workspaceId),
          eq(shareableProofs.routeId, input.routeId),
          eq(shareableProofs.status, "active")
        )
      )
      .limit(1);
    if (existing[0]) return { slug: existing[0].slug, route: route[0] };
    const slug = `vp-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const inserted = await tx
      .insert(shareableProofs)
      .values({ ...input, slug })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create proof link");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "proof",
        entityId: id,
        action: "created",
      });
    return { slug, route: route[0] };
  });
}

export async function getPublicProof(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ proof: shareableProofs, route: paymentRoutes })
    .from(shareableProofs)
    .innerJoin(paymentRoutes, eq(shareableProofs.routeId, paymentRoutes.id))
    .where(
      and(eq(shareableProofs.slug, slug), eq(shareableProofs.status, "active"))
    )
    .limit(1);
  if (!rows[0]) return undefined;
  return {
    slug: rows[0].proof.slug,
    status: rows[0].route.status,
    name: rows[0].route.name,
    token: rows[0].route.token,
    totalAmount: rows[0].route.totalAmount,
    proofReference: rows[0].route.proofReference,
    createdAt: rows[0].route.createdAt,
  };
}

export async function listWorkspaceAnalytics(workspaceId: number) {
  const db = await getDb();
  if (!db)
    return {
      routes: 0,
      settled: 0,
      failed: 0,
      totalTransactions: 0,
      confirmedTransactions: 0,
      unknownTransactions: 0,
      proofs: 0,
      activeSchedules: 0,
      auditEvents: 0,
    };
  const [routes, transactions, proofs, schedules, events] = await Promise.all([
    db
      .select()
      .from(paymentRoutes)
      .where(eq(paymentRoutes.workspaceId, workspaceId)),
    db
      .select({ tx: blockchainTransactions, route: paymentRoutes })
      .from(blockchainTransactions)
      .innerJoin(
        paymentRoutes,
        eq(blockchainTransactions.routeId, paymentRoutes.id)
      )
      .where(eq(paymentRoutes.workspaceId, workspaceId)),
    db
      .select()
      .from(shareableProofs)
      .where(
        and(
          eq(shareableProofs.workspaceId, workspaceId),
          eq(shareableProofs.status, "active")
        )
      ),
    db
      .select()
      .from(payrollSchedules)
      .where(
        and(
          eq(payrollSchedules.workspaceId, workspaceId),
          eq(payrollSchedules.status, "active")
        )
      ),
    db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.workspaceId, workspaceId)),
  ]);
  return {
    routes: routes.length,
    settled: routes.filter(route => route.status === "settled").length,
    failed: routes.filter(route => route.status === "failed").length,
    totalTransactions: transactions.length,
    confirmedTransactions: transactions.filter(
      ({ tx }) => tx.status === "confirmed"
    ).length,
    unknownTransactions: transactions.filter(
      ({ tx }) => tx.status === "unknown"
    ).length,
    proofs: proofs.length,
    activeSchedules: schedules.length,
    auditEvents: events.length,
  };
}

export async function listWorkspaceOperationsHealth(workspaceId: number) {
  const db = await getDb();
  if (!db) return { unresolvedReceipts: [], proofHealth: [] };
  const [receipts, proofs] = await Promise.all([
    db
      .select({ tx: blockchainTransactions, route: paymentRoutes })
      .from(blockchainTransactions)
      .innerJoin(
        paymentRoutes,
        eq(blockchainTransactions.routeId, paymentRoutes.id)
      )
      .where(eq(paymentRoutes.workspaceId, workspaceId)),
    db
      .select({ proof: shareableProofs, route: paymentRoutes })
      .from(shareableProofs)
      .innerJoin(paymentRoutes, eq(shareableProofs.routeId, paymentRoutes.id))
      .where(
        and(
          eq(shareableProofs.workspaceId, workspaceId),
          eq(shareableProofs.status, "active")
        )
      ),
  ]);
  return {
    unresolvedReceipts: receipts
      .filter(({ tx }) => ["submitted", "unknown"].includes(tx.status))
      .map(({ tx, route }) => ({
        transactionHash: tx.transactionHash,
        status: tx.status,
        routeId: route.id,
        routeName: route.name,
        updatedAt: tx.submittedAt,
      })),
    proofHealth: proofs.map(({ proof, route }) => ({
      slug: proof.slug,
      routeId: route.id,
      routeName: route.name,
      routeStatus: route.status,
      hasCommitment: Boolean(route.proofReference),
      createdAt: proof.createdAt,
    })),
  };
}

export async function listPrivateMarkets(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(privateMarkets)
    .where(eq(privateMarkets.workspaceId, workspaceId))
    .orderBy(desc(privateMarkets.createdAt));
  return rows.map(({ createdByUserId: _createdByUserId, ...market }) => market);
}

export async function createPrivateMarket(input: {
  workspaceId: number;
  createdByUserId: number;
  name: string;
  token: string;
  network: "mainnet";
  targetAmount: string;
  bidDeadline?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const slug = `market-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const inserted = await tx
      .insert(privateMarkets)
      .values({
        ...input,
        slug,
        status: "draft",
        currentPrice: "0",
        publicVolume: "0",
        publicParticipants: 0,
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create private market");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "private_market",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select({ id: privateMarkets.id, slug: privateMarkets.slug })
      .from(privateMarkets)
      .where(eq(privateMarkets.id, id))
      .limit(1);
    if (!rows[0])
      throw new Error("Private market was created but could not be reloaded");
    return rows[0];
  });
}
export async function updatePrivateMarketStatus(input: {
  workspaceId: number;
  actorUserId: number;
  marketId: number;
  status:
    | "draft"
    | "scheduled"
    | "live"
    | "reveal"
    | "settled"
    | "paused"
    | "closed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const market = await tx
      .select()
      .from(privateMarkets)
      .where(
        and(
          eq(privateMarkets.id, input.marketId),
          eq(privateMarkets.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!market[0]) throw new Error("Private market not found in workspace");
    if (!canAdvancePrivateMarketStatus(market[0].status, input.status))
      throw new Error(
        `Invalid private market transition: ${market[0].status} -> ${input.status}`
      );
    if (input.status === "settled") {
      const acceptedBids = await tx
        .select({ id: privateMarketBids.id })
        .from(privateMarketBids)
        .where(
          and(
            eq(privateMarketBids.marketId, input.marketId),
            eq(privateMarketBids.status, "accepted")
          )
        );
      if (!acceptedBids.length)
        throw new Error(
          "Cannot mark a market settled before an accepted allocation exists"
        );
    }
    const result = await tx
      .update(privateMarkets)
      .set({ status: input.status })
      .where(
        and(
          eq(privateMarkets.id, input.marketId),
          eq(privateMarkets.workspaceId, input.workspaceId),
          eq(privateMarkets.status, market[0].status)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Private market changed before transition could be applied");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "private_market",
        entityId: input.marketId,
        action: `status_${input.status}`,
      });
    const rows = await tx
      .select()
      .from(privateMarkets)
      .where(
        and(
          eq(privateMarkets.id, input.marketId),
          eq(privateMarkets.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function commitPrivateMarketBid(input: {
  workspaceId: number;
  bidderUserId: number;
  marketId: number;
  commitmentHash: string;
  encryptedTerms?: string;
  bidAmount: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const market = await tx
    .select()
    .from(privateMarkets)
    .where(
      and(
        eq(privateMarkets.id, input.marketId),
        eq(privateMarkets.workspaceId, input.workspaceId)
      )
    )
    .for("update")
    .limit(1);
  if (!market[0] || market[0].status !== "live")
    throw new Error("Private market is not open for sealed bids");
  if (market[0].bidDeadline && market[0].bidDeadline.getTime() <= Date.now())
    throw new Error("Sealed-bid window has closed");
  if (!/^\d+(\.\d{1,18})?$/.test(input.bidAmount))
    throw new Error("Bid amount must be a valid positive decimal");
  if (compareDecimalStrings(input.bidAmount, "0") <= 0)
    throw new Error("Bid amount must be greater than zero");
  const policyRows = await tx
    .select()
    .from(privateMarketRiskPolicies)
    .where(
      and(
        eq(privateMarketRiskPolicies.workspaceId, input.workspaceId),
        eq(privateMarketRiskPolicies.status, "active"),
        or(
          eq(privateMarketRiskPolicies.marketId, input.marketId),
          isNull(privateMarketRiskPolicies.marketId)
        )
      )
    )
    .orderBy(
      desc(privateMarketRiskPolicies.marketId),
      desc(privateMarketRiskPolicies.updatedAt)
    )
    .limit(1);
  const policy = policyRows[0];
  const existingVolume = market[0].publicVolume;
  const projectedVolume = addDecimalStrings(existingVolume, input.bidAmount);
  const violations: string[] = [];
  if (policy && compareDecimalStrings(input.bidAmount, policy.maxBidAmount) > 0)
    violations.push(
      `Bid exceeds the configured maximum of ${policy.maxBidAmount}`
    );
  if (
    policy &&
    compareDecimalTimesInteger(
      input.bidAmount,
      100,
      market[0].targetAmount,
      policy.maxConcentrationPct
    ) > 0
  )
    violations.push(
      `Bid exceeds the configured ${policy.maxConcentrationPct}% concentration limit`
    );
  if (compareDecimalStrings(projectedVolume, market[0].targetAmount) > 0)
    violations.push("Bid would exceed the market target capacity");
  if (violations.length) {
    await tx
      .insert(privateMarketAlerts)
      .values({
        workspaceId: input.workspaceId,
        marketId: input.marketId,
        severity: "warning",
        code: "BID_RISK_POLICY_BLOCKED",
        message: violations.join("; "),
        status: "open",
      });
    throw new Error(`Bid blocked by risk policy: ${violations.join("; ")}`);
  }
  const existing = await tx
    .select()
    .from(privateMarketBids)
    .where(eq(privateMarketBids.commitmentHash, input.commitmentHash))
    .limit(1);
  if (existing[0]) {
    if (
      canReusePrivateMarketBid(
        existing[0].marketId,
        input.marketId,
        existing[0].commitmentHash,
        input.commitmentHash
      )
    )
      return {
        bid: {
          id: existing[0].id,
          status: existing[0].status,
          commitmentHash: existing[0].commitmentHash,
        },
        market: market[0],
      };
    throw new Error("Commitment hash has already been used in another market");
  }
  const inserted = await tx
    .insert(privateMarketBids)
    .values({
      marketId: input.marketId,
      bidderUserId: input.bidderUserId,
      commitmentHash: input.commitmentHash,
      encryptedTerms: input.encryptedTerms,
      bidAmount: input.bidAmount,
      status: "committed",
    })
    .$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Could not commit sealed bid");
  await tx
    .update(privateMarkets)
    .set({
      publicParticipants: market[0].publicParticipants + 1,
      publicVolume: addDecimalStrings(market[0].publicVolume, input.bidAmount),
    })
    .where(eq(privateMarkets.id, input.marketId));
  await tx
    .insert(auditEvents)
    .values({
      workspaceId: input.workspaceId,
      actorUserId: input.bidderUserId,
      entityType: "private_market_bid",
      entityId: id,
      action: "committed",
    });
  const bid = await tx
    .select({
      id: privateMarketBids.id,
      status: privateMarketBids.status,
      commitmentHash: privateMarketBids.commitmentHash,
    })
    .from(privateMarketBids)
    .where(eq(privateMarketBids.id, id))
    .limit(1);
  const updatedMarket = await tx
    .select()
    .from(privateMarkets)
    .where(eq(privateMarkets.id, input.marketId))
    .limit(1);
  return { bid: bid[0], market: updatedMarket[0] };
  });
}

export async function createLaunchpadProject(input: {
  workspaceId: number;
  createdByUserId: number;
  name: string;
  description?: string;
  token: string;
  network: "mainnet";
  targetAmount: string;
  fundingEndsAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const slug = `launch-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const inserted = await tx
      .insert(launchpadProjects)
      .values({ ...input, slug, privacyMode: "shielded", status: "draft" })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create Launchpad project");
    await tx
      .insert(launchpadProjectOps)
      .values({
        projectId: id,
        ownerLabel: input.name,
        roundType: "community",
        stage: "planning",
        riskLevel: "medium",
        readinessOverride: "none",
      });
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "launchpad_project",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select({ id: launchpadProjects.id, slug: launchpadProjects.slug })
      .from(launchpadProjects)
      .where(eq(launchpadProjects.id, id))
      .limit(1);
    if (!rows[0])
      throw new Error("Launchpad project was created but could not be reloaded");
    return rows[0];
  });
}
export async function getLaunchpadProjectOps(
  workspaceId: number,
  projectId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db
    .select({ ops: launchpadProjectOps, project: launchpadProjects })
    .from(launchpadProjectOps)
    .innerJoin(
      launchpadProjects,
      eq(launchpadProjectOps.projectId, launchpadProjects.id)
    )
    .where(
      and(
        eq(launchpadProjectOps.projectId, projectId),
        eq(launchpadProjects.workspaceId, workspaceId)
      )
    )
    .limit(1);
  return rows[0]?.ops;
}

export async function updateLaunchpadProjectOps(input: {
  workspaceId: number;
  actorUserId: number;
  projectId: number;
  ownerLabel: string;
  roundType: "community" | "strategic" | "treasury" | "grant";
  stage: "planning" | "review" | "live" | "closeout";
  riskLevel: "low" | "medium" | "high";
  operationalNotes?: string;
  readinessOverride: "none" | "blocked" | "ready";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const project = await tx
      .select({ id: launchpadProjects.id })
      .from(launchpadProjects)
      .where(
        and(
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!project[0]) throw new Error("Launchpad project not found in workspace");
    const result = await tx
      .update(launchpadProjectOps)
      .set({
        ownerLabel: input.ownerLabel,
        roundType: input.roundType,
        stage: input.stage,
        riskLevel: input.riskLevel,
        operationalNotes: input.operationalNotes,
        readinessOverride: input.readinessOverride,
      })
      .where(eq(launchpadProjectOps.projectId, input.projectId));
    if (result[0]?.affectedRows !== 1)
      throw new Error("Launchpad operating metadata not found");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "launchpad_project_ops",
        entityId: input.projectId,
        action: "updated",
      });
    const rows = await tx
      .select({ ops: launchpadProjectOps })
      .from(launchpadProjectOps)
      .where(eq(launchpadProjectOps.projectId, input.projectId))
      .limit(1);
    return rows[0]?.ops;
  });
}

export async function getLaunchpadReadiness(
  workspaceId: number,
  projectId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const projectRows = await db
    .select()
    .from(launchpadProjects)
    .where(
      and(
        eq(launchpadProjects.id, projectId),
        eq(launchpadProjects.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!projectRows[0])
    throw new Error("Launchpad project not found in workspace");
  const [opsRows, milestones, allocations, releases] = await Promise.all([
    db
      .select()
      .from(launchpadProjectOps)
      .where(eq(launchpadProjectOps.projectId, projectId))
      .limit(1),
    db
      .select()
      .from(launchpadMilestones)
      .where(eq(launchpadMilestones.projectId, projectId)),
    db
      .select()
      .from(launchpadAllocations)
      .where(eq(launchpadAllocations.projectId, projectId)),
    db
      .select()
      .from(launchpadReleaseRequests)
      .where(eq(launchpadReleaseRequests.projectId, projectId)),
  ]);
  const ops = opsRows[0];
  const checks = [
    {
      key: "metadata",
      label: "Operating metadata configured",
      passed: Boolean(ops?.ownerLabel && ops.operationalNotes),
    },
    {
      key: "milestones",
      label: "Release plan has milestones",
      passed: milestones.length > 0,
    },
    {
      key: "allocations",
      label: "Private allocation register initialized",
      passed: allocations.length > 0,
    },
    {
      key: "releases",
      label: "No unresolved release request",
      passed: !releases.some(release => release.status === "pending"),
    },
    {
      key: "project",
      label: "Project lifecycle is open",
      passed: projectRows[0].status !== "closed",
    },
  ];
  return summarizeLaunchpadReadiness(checks, ops?.readinessOverride ?? "none");
}

export async function listLaunchpadActivity(
  workspaceId: number,
  projectId: number
) {
  const db = await getDb();
  if (!db) return [];
  const project = await db
    .select({ id: launchpadProjects.id })
    .from(launchpadProjects)
    .where(
      and(
        eq(launchpadProjects.id, projectId),
        eq(launchpadProjects.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!project[0]) throw new Error("Launchpad project not found in workspace");
  const [
    projectEvents,
    milestoneEvents,
    allocationEvents,
    releaseEvents,
    opsEvents,
  ] = await Promise.all([
    db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.workspaceId, workspaceId),
          eq(auditEvents.entityType, "launchpad_project"),
          eq(auditEvents.entityId, projectId)
        )
      ),
    db
      .select({ event: auditEvents })
      .from(auditEvents)
      .innerJoin(
        launchpadMilestones,
        eq(auditEvents.entityId, launchpadMilestones.id)
      )
      .where(
        and(
          eq(auditEvents.workspaceId, workspaceId),
          eq(auditEvents.entityType, "launchpad_milestone"),
          eq(launchpadMilestones.projectId, projectId)
        )
      ),
    db
      .select({ event: auditEvents })
      .from(auditEvents)
      .innerJoin(
        launchpadAllocations,
        eq(auditEvents.entityId, launchpadAllocations.id)
      )
      .where(
        and(
          eq(auditEvents.workspaceId, workspaceId),
          eq(auditEvents.entityType, "launchpad_allocation"),
          eq(launchpadAllocations.projectId, projectId)
        )
      ),
    db
      .select({ event: auditEvents })
      .from(auditEvents)
      .innerJoin(
        launchpadReleaseRequests,
        eq(auditEvents.entityId, launchpadReleaseRequests.id)
      )
      .where(
        and(
          eq(auditEvents.workspaceId, workspaceId),
          eq(auditEvents.entityType, "launchpad_release"),
          eq(launchpadReleaseRequests.projectId, projectId)
        )
      ),
    db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.workspaceId, workspaceId),
          eq(auditEvents.entityType, "launchpad_project_ops"),
          eq(auditEvents.entityId, projectId)
        )
      ),
  ]);
  return [
    ...projectEvents,
    ...milestoneEvents.map(({ event }) => event),
    ...allocationEvents.map(({ event }) => event),
    ...releaseEvents.map(({ event }) => event),
    ...opsEvents,
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);
}

export async function listLaunchpadReleaseRequests(
  workspaceId: number,
  projectId: number
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      release: launchpadReleaseRequests,
      milestone: launchpadMilestones,
      project: launchpadProjects,
    })
    .from(launchpadReleaseRequests)
    .innerJoin(
      launchpadMilestones,
      eq(launchpadReleaseRequests.milestoneId, launchpadMilestones.id)
    )
    .innerJoin(
      launchpadProjects,
      eq(launchpadReleaseRequests.projectId, launchpadProjects.id)
    )
    .where(
      and(
        eq(launchpadReleaseRequests.projectId, projectId),
        eq(launchpadProjects.workspaceId, workspaceId)
      )
    )
    .orderBy(desc(launchpadReleaseRequests.createdAt));
  return rows.map(({ release, milestone }) => ({
    ...release,
    milestoneName: milestone.name,
  }));
}

export async function createLaunchpadReleaseRequest(input: {
  workspaceId: number;
  actorUserId: number;
  projectId: number;
  milestoneId: number;
  requestedAmount: string;
  reason: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const rows = await tx
      .select({ milestone: launchpadMilestones, project: launchpadProjects })
      .from(launchpadMilestones)
      .innerJoin(
        launchpadProjects,
        eq(launchpadMilestones.projectId, launchpadProjects.id)
      )
      .where(
        and(
          eq(launchpadMilestones.id, input.milestoneId),
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!rows[0]) throw new Error("Milestone not found in project workspace");
    const existing = await tx
      .select()
      .from(launchpadReleaseRequests)
      .where(
        and(
          eq(launchpadReleaseRequests.projectId, input.projectId),
          eq(launchpadReleaseRequests.milestoneId, input.milestoneId),
          eq(launchpadReleaseRequests.status, "pending")
        )
      )
      .limit(1);
    if (existing[0]) return existing[0];
    const inserted = await tx
      .insert(launchpadReleaseRequests)
      .values({
        projectId: input.projectId,
        milestoneId: input.milestoneId,
        requestedByUserId: input.actorUserId,
        requestedAmount: input.requestedAmount,
        reason: input.reason,
        status: "pending",
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create release request");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "launchpad_release",
        entityId: id,
        action: "requested",
      });
    const release = await tx
      .select()
      .from(launchpadReleaseRequests)
      .where(eq(launchpadReleaseRequests.id, id))
      .limit(1);
    return release[0];
  });
}

export async function decideLaunchpadReleaseRequest(input: {
  workspaceId: number;
  actorUserId: number;
  requestId: number;
  status: "approved" | "rejected" | "settled";
  proofReference?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const rows = await tx
      .select({ release: launchpadReleaseRequests, project: launchpadProjects })
      .from(launchpadReleaseRequests)
      .innerJoin(
        launchpadProjects,
        eq(launchpadReleaseRequests.projectId, launchpadProjects.id)
      )
      .where(
        and(
          eq(launchpadReleaseRequests.id, input.requestId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    const current = rows[0]?.release;
    if (!current) throw new Error("Release request not found in workspace");
    if (!canAdvanceLaunchpadReleaseStatus(current.status, input.status)) {
      throw new Error(`Cannot move release request from ${current.status} to ${input.status}`);
    }

    const result = await tx
      .update(launchpadReleaseRequests)
      .set({
        status: input.status,
        decidedByUserId: input.actorUserId,
        decidedAt: new Date(),
        proofReference: input.proofReference,
      })
      .where(
        and(
          eq(launchpadReleaseRequests.id, input.requestId),
          eq(launchpadReleaseRequests.status, current.status)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Release request changed before decision could be applied");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "launchpad_release",
        entityId: input.requestId,
        action: input.status,
      });
    const release = await tx
      .select()
      .from(launchpadReleaseRequests)
      .where(eq(launchpadReleaseRequests.id, input.requestId))
      .limit(1);
    return release[0];
  });
}

export async function listWorkspaceLaunchpadProjects(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const projects = await db
    .select()
    .from(launchpadProjects)
    .where(eq(launchpadProjects.workspaceId, workspaceId))
    .orderBy(desc(launchpadProjects.createdAt));
  if (!projects.length) return [];
  const hydrated = await Promise.all(
    projects.map(async project => ({
      ...project,
      milestones: await db
        .select()
        .from(launchpadMilestones)
        .where(eq(launchpadMilestones.projectId, project.id)),
    }))
  );
  return hydrated;
}
export async function createLaunchpadMilestone(input: {
  workspaceId: number;
  createdByUserId: number;
  projectId: number;
  name: string;
  sequence: number;
  releaseAmount: string;
  approvalThreshold: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const project = await tx
      .select({ id: launchpadProjects.id })
      .from(launchpadProjects)
      .where(
        and(
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!project[0]) throw new Error("Launchpad project not found in workspace");
    const inserted = await tx
      .insert(launchpadMilestones)
      .values({
        projectId: input.projectId,
        name: input.name,
        sequence: input.sequence,
        releaseAmount: input.releaseAmount,
        approvalThreshold: input.approvalThreshold,
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create Launchpad milestone");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "launchpad_milestone",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(launchpadMilestones)
      .where(eq(launchpadMilestones.id, id))
      .limit(1);
    return rows[0];
  });
}
export async function listLaunchpadAllocations(
  workspaceId: number,
  projectId: number
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ allocation: launchpadAllocations })
    .from(launchpadAllocations)
    .innerJoin(
      launchpadProjects,
      eq(launchpadAllocations.projectId, launchpadProjects.id)
    )
    .where(
      and(
        eq(launchpadAllocations.projectId, projectId),
        eq(launchpadProjects.workspaceId, workspaceId)
      )
    )
    .orderBy(desc(launchpadAllocations.createdAt));
  return rows.map(({ allocation }) => ({
    id: allocation.id,
    commitment: allocation.commitment,
    allocationAmount: allocation.allocationAmount,
    status: allocation.status,
    createdAt: allocation.createdAt,
    claimedAt: allocation.claimedAt,
  }));
}

export async function createLaunchpadAllocation(input: {
  workspaceId: number;
  createdByUserId: number;
  projectId: number;
  commitment: string;
  encryptedReference?: string;
  allocationAmount: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const project = await tx
      .select({ id: launchpadProjects.id })
      .from(launchpadProjects)
      .where(
        and(
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!project[0]) throw new Error("Launchpad project not found in workspace");
    const existing = await tx
      .select()
      .from(launchpadAllocations)
      .where(eq(launchpadAllocations.commitment, input.commitment))
      .limit(1);
    if (existing[0]) {
      if (
        canReuseLaunchpadAllocation(
          existing[0].projectId,
          input.projectId,
          existing[0].commitment,
          input.commitment
        )
      )
        return existing[0];
      throw new Error(
        "Allocation commitment has already been used in another project"
      );
    }
    const inserted = await tx
      .insert(launchpadAllocations)
      .values({
        projectId: input.projectId,
        commitment: input.commitment,
        encryptedReference: input.encryptedReference,
        allocationAmount: input.allocationAmount,
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not reserve Launchpad allocation");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "launchpad_allocation",
        entityId: id,
        action: "reserved",
      });
    const rows = await tx
      .select()
      .from(launchpadAllocations)
      .where(eq(launchpadAllocations.id, id))
      .limit(1);
    return rows[0];
  });
}
export async function updateLaunchpadProjectStatus(input: {
  workspaceId: number;
  actorUserId: number;
  projectId: number;
  status: "draft" | "live" | "funded" | "closed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const project = await tx
      .select()
      .from(launchpadProjects)
      .where(
        and(
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!project[0]) throw new Error("Launchpad project not found in workspace");
    if (!canAdvanceLaunchpadProjectStatus(project[0].status, input.status))
      throw new Error(
        `Invalid Launchpad project transition: ${project[0].status} -> ${input.status}`
      );
    const result = await tx
      .update(launchpadProjects)
      .set({ status: input.status })
      .where(
        and(
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId),
          eq(launchpadProjects.status, project[0].status)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Launchpad project changed before transition could be applied");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "launchpad_project",
        entityId: input.projectId,
        action: `status_${input.status}`,
      });
    const rows = await tx
      .select()
      .from(launchpadProjects)
      .where(
        and(
          eq(launchpadProjects.id, input.projectId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    return rows[0];
  });
}
export async function updateLaunchpadMilestoneStatus(input: {
  workspaceId: number;
  actorUserId: number;
  milestoneId: number;
  status: "planned" | "ready" | "released" | "blocked";
  proofReference?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const rows = await tx
      .select({ milestone: launchpadMilestones, project: launchpadProjects })
      .from(launchpadMilestones)
      .innerJoin(
        launchpadProjects,
        eq(launchpadMilestones.projectId, launchpadProjects.id)
      )
      .where(
        and(
          eq(launchpadMilestones.id, input.milestoneId),
          eq(launchpadProjects.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!rows[0]) throw new Error("Launchpad milestone not found in workspace");
    if (
      !canAdvanceLaunchpadMilestoneStatus(rows[0].milestone.status, input.status)
    )
      throw new Error(
        `Invalid Launchpad milestone transition: ${rows[0].milestone.status} -> ${input.status}`
      );
    const result = await tx
      .update(launchpadMilestones)
      .set({ status: input.status, proofReference: input.proofReference })
      .where(
        and(
          eq(launchpadMilestones.id, input.milestoneId),
          eq(launchpadMilestones.status, rows[0].milestone.status)
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("Launchpad milestone changed before transition could be applied");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "launchpad_milestone",
        entityId: input.milestoneId,
        action: `status_${input.status}`,
      });
    const updated = await tx
      .select()
      .from(launchpadMilestones)
      .where(eq(launchpadMilestones.id, input.milestoneId))
      .limit(1);
    return updated[0];
  });
}
export async function getPublicLaunchpadProject(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const project = await db
    .select()
    .from(launchpadProjects)
    .where(eq(launchpadProjects.slug, slug))
    .limit(1);
  if (!project[0]) return undefined;
  const milestones = await db
    .select()
    .from(launchpadMilestones)
    .where(eq(launchpadMilestones.projectId, project[0].id));
  return buildLaunchpadPublicSummary(
    {
      slug: project[0].slug,
      name: project[0].name,
      description: project[0].description,
      token: project[0].token,
      network: project[0].network,
      targetAmount: project[0].targetAmount,
      raisedAmount: project[0].raisedAmount,
      privacyMode: project[0].privacyMode,
      status: project[0].status,
      fundingEndsAt: project[0].fundingEndsAt,
    },
    milestones
  );
}
export async function exportWorkspaceAuditCsv(workspaceId: number) {
  const events = await listWorkspaceAuditEvents(workspaceId);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    "id,entityType,entityId,action,createdAt",
    ...events.map(event =>
      [
        event.id,
        event.entityType,
        event.entityId,
        event.action,
        event.createdAt.toISOString(),
      ]
        .map(escape)
        .join(",")
    ),
  ].join("\n");
}

export async function getPrivateMarketInsights(
  workspaceId: number,
  userId: number
) {
  const db = await getDb();
  if (!db)
    return {
      markets: [],
      portfolio: {
        committedAmount: "0",
        openCommitments: 0,
        settledAmount: "0",
        currentValue: "0",
        pnl: "0",
        history: [],
      },
      execution: { acceptedQuotes: 0, openQuotes: 0, averageAcceptedFeeBps: 0 },
      risk: {
        activeMarkets: 0,
        openCommitments: 0,
        maxUtilizationPct: 0,
        attention: [] as string[],
      },
      disclosure: {
        allowedScopes: ["aggregate" as const],
        privateFields: ["bidder_identity", "raw_bid_amount", "encrypted_terms"],
      },
    };
  const markets = await db
    .select()
    .from(privateMarkets)
    .where(eq(privateMarkets.workspaceId, workspaceId))
    .orderBy(desc(privateMarkets.updatedAt));
  const marketIds = markets.map(market => market.id);
  const [allBids, allQuotes, policies] = await Promise.all([
    marketIds.length
      ? db
          .select()
          .from(privateMarketBids)
          .where(eq(privateMarketBids.bidderUserId, userId))
      : Promise.resolve([]),
    marketIds.length
      ? db
          .select()
          .from(privateMarketQuotes)
          .where(inArray(privateMarketQuotes.marketId, marketIds))
      : Promise.resolve([]),
    marketIds.length
      ? db
          .select()
          .from(privateMarketRiskPolicies)
          .where(
            and(
              eq(privateMarketRiskPolicies.workspaceId, workspaceId),
              eq(privateMarketRiskPolicies.status, "active")
            )
          )
      : Promise.resolve([]),
  ]);
  const visibleBids = allBids.filter(bid => marketIds.includes(bid.marketId));
  const committed = visibleBids
    .filter(bid => bid.status !== "rejected")
    .reduce((sum, bid) => addDecimalStringsExact(sum, bid.bidAmount), "0");
  const accepted = visibleBids.filter(bid => bid.status === "accepted");
  const settledAmount = accepted.reduce(
    (sum, bid) => addDecimalStringsExact(sum, bid.bidAmount),
    "0"
  );
  const currentValue = accepted.reduce((sum, bid) => {
    const market = markets.find(item => item.id === bid.marketId);
    return addDecimalStringsExact(
      sum,
      multiplyDecimalStringsExact(bid.bidAmount, market?.currentPrice ?? "0")
    );
  }, "0");
  const openCommitments = visibleBids.filter(
    bid => bid.status === "committed" || bid.status === "revealed"
  ).length;
  const maxUtilizationPct = markets.reduce(
    (max, market) =>
      Math.max(
        max,
        decimalRatioAsNumber(market.publicVolume, market.targetAmount) * 100
      ),
    0
  );
  const attention: string[] = [];
  if (
    markets.some(
      market =>
        market.status === "live" &&
        market.bidDeadline &&
        market.bidDeadline.getTime() < Date.now()
    )
  )
    attention.push("One or more live bid windows require operator review");
  if (
    markets.some(
      market =>
        decimalRatioAsNumber(market.publicVolume, market.targetAmount) * 100 > 90
    )
  )
    attention.push("A market is approaching its target allocation");
  if (policies.some(policy => policy.maxConcentrationPct < 10))
    attention.push(
      "At least one active policy has a tightly constrained concentration limit"
    );
  const history = visibleBids
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(bid => ({
      at: bid.createdAt.toISOString(),
      committedAmount: bid.status === "rejected" ? "0" : bid.bidAmount,
      status: bid.status,
    }));
  const acceptedQuotes = allQuotes.filter(quote => quote.status === "accepted");
  const averageAcceptedFeeBps = acceptedQuotes.length
    ? Math.round(
        acceptedQuotes.reduce((sum, quote) => sum + quote.feeBps, 0) /
          acceptedQuotes.length
      )
    : 0;
  return {
    markets: markets.map(
      ({ createdByUserId: _createdByUserId, ...market }) => ({
        ...market,
        utilizationPct: Number(
          (decimalRatioAsNumber(market.publicVolume, market.targetAmount) * 100).toFixed(2)
        ),
        lifecycleAction:
          market.status === "draft"
            ? "SCHEDULE MARKET"
            : market.status === "live"
              ? "START REVEAL"
              : market.status === "closed"
                ? "ARCHIVED"
                : "REVIEW MARKET",
      })
    ),
    portfolio: {
      committedAmount: committed,
      openCommitments,
      settledAmount,
      currentValue,
      pnl: subtractDecimalStringsExact(currentValue, settledAmount),
      history,
    },
    execution: {
      acceptedQuotes: acceptedQuotes.length,
      openQuotes: allQuotes.filter(
        quote =>
          quote.status === "open" && quote.expiresAt.getTime() > Date.now()
      ).length,
      averageAcceptedFeeBps,
    },
    risk: {
      activeMarkets: markets.filter(market => market.status === "live").length,
      openCommitments,
      maxUtilizationPct: Number(maxUtilizationPct.toFixed(2)),
      attention,
    },
    disclosure: {
      allowedScopes: ["aggregate" as const],
      privateFields: ["bidder_identity", "raw_bid_amount", "encrypted_terms"],
    },
  };
}

export async function listPrivateMarketQuotes(
  workspaceId: number,
  marketId: number
) {
  const db = await getDb();
  if (!db) return [];
  const market = await db
    .select({ id: privateMarkets.id })
    .from(privateMarkets)
    .where(
      and(
        eq(privateMarkets.id, marketId),
        eq(privateMarkets.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!market[0]) throw new Error("Private market not found in workspace");
  const rows = await db
    .select()
    .from(privateMarketQuotes)
    .where(eq(privateMarketQuotes.marketId, marketId))
    .orderBy(desc(privateMarketQuotes.createdAt));
  return rows.map(({ createdByUserId: _createdByUserId, ...quote }) => quote);
}

export async function createPrivateMarketQuote(input: {
  workspaceId: number;
  marketId: number;
  createdByUserId: number;
  providerLabel: string;
  price: string;
  feeBps: number;
  capacity: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const market = await tx
      .select()
      .from(privateMarkets)
      .where(
        and(
          eq(privateMarkets.id, input.marketId),
          eq(privateMarkets.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    if (!market[0]) throw new Error("Private market not found in workspace");
    if (market[0].status === "closed")
      throw new Error("Cannot quote a closed market");
    if (input.expiresAt.getTime() <= Date.now())
      throw new Error("Quote expiry must be in the future");
    const inserted = await tx
      .insert(privateMarketQuotes)
      .values({
        marketId: input.marketId,
        createdByUserId: input.createdByUserId,
        providerLabel: input.providerLabel,
        price: input.price,
        feeBps: input.feeBps,
        capacity: input.capacity,
        expiresAt: input.expiresAt,
        status: "open",
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create RFQ quote");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "private_market_quote",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(privateMarketQuotes)
      .where(eq(privateMarketQuotes.id, id))
      .limit(1);
    if (!rows[0]) throw new Error("Could not load RFQ quote");
    const { createdByUserId: _createdByUserId, ...quote } = rows[0];
    return quote;
  });
}

export async function getPrivateMarketRiskPolicy(
  workspaceId: number,
  marketId: number | undefined
) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(privateMarketRiskPolicies)
    .where(
      and(
        eq(privateMarketRiskPolicies.workspaceId, workspaceId),
        eq(privateMarketRiskPolicies.status, "active"),
        marketId === undefined
          ? isNull(privateMarketRiskPolicies.marketId)
          : or(
              eq(privateMarketRiskPolicies.marketId, marketId),
              isNull(privateMarketRiskPolicies.marketId)
            )
      )
    )
    .orderBy(
      desc(privateMarketRiskPolicies.marketId),
      desc(privateMarketRiskPolicies.updatedAt)
    )
    .limit(1);
  return rows[0] ? { ...rows[0], createdByUserId: undefined } : null;
}

export async function upsertPrivateMarketRiskPolicy(input: {
  workspaceId: number;
  marketId?: number;
  createdByUserId: number;
  maxBidAmount: string;
  maxConcentrationPct: number;
  approvalThreshold: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  if (input.maxConcentrationPct < 1 || input.maxConcentrationPct > 100)
    throw new Error("Concentration must be between 1 and 100 percent");
  if (input.approvalThreshold < 1 || input.approvalThreshold > 10)
    throw new Error("Approval threshold must be between 1 and 10");
  return db.transaction(async tx => {
    if (input.marketId !== undefined) {
      const market = await tx
        .select({ id: privateMarkets.id })
        .from(privateMarkets)
        .where(
          and(
            eq(privateMarkets.id, input.marketId),
            eq(privateMarkets.workspaceId, input.workspaceId)
          )
        )
        .limit(1);
      if (!market[0]) throw new Error("Private market not found in workspace");
    }
    const scope = input.marketId === undefined
      ? isNull(privateMarketRiskPolicies.marketId)
      : eq(privateMarketRiskPolicies.marketId, input.marketId);
    await tx
      .update(privateMarketRiskPolicies)
      .set({ status: "archived" })
      .where(
        and(
          eq(privateMarketRiskPolicies.workspaceId, input.workspaceId),
          scope,
          eq(privateMarketRiskPolicies.status, "active")
        )
      );
    const inserted = await tx
      .insert(privateMarketRiskPolicies)
      .values({
        workspaceId: input.workspaceId,
        marketId: input.marketId,
        createdByUserId: input.createdByUserId,
        maxBidAmount: input.maxBidAmount,
        maxConcentrationPct: input.maxConcentrationPct,
        approvalThreshold: input.approvalThreshold,
        status: "active",
      })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not persist risk policy");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.createdByUserId,
        entityType: "private_market_risk_policy",
        entityId: id,
        action: "created",
      });
    const rows = await tx
      .select()
      .from(privateMarketRiskPolicies)
      .where(eq(privateMarketRiskPolicies.id, id))
      .limit(1);
    return rows[0] ? { ...rows[0], createdByUserId: undefined } : null;
  });
}

export async function updatePrivateMarketQuoteStatus(input: {
  workspaceId: number;
  quoteId: number;
  actorUserId: number;
  status: "accepted" | "expired" | "rejected";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db
    .select({ quote: privateMarketQuotes, market: privateMarkets })
    .from(privateMarketQuotes)
    .innerJoin(
      privateMarkets,
      eq(privateMarketQuotes.marketId, privateMarkets.id)
    )
    .where(
      and(
        eq(privateMarketQuotes.id, input.quoteId),
        eq(privateMarkets.workspaceId, input.workspaceId)
      )
    )
    .limit(1);
  const existing = rows[0];
  if (!existing) throw new Error("RFQ quote not found in workspace");
  if (existing.quote.status !== "open")
    throw new Error("Only open RFQ quotes can change status");
  return db.transaction(async tx => {
    const result = await tx
      .update(privateMarketQuotes)
      .set({ status: input.status })
      .where(
        and(
          eq(privateMarketQuotes.id, input.quoteId),
          eq(privateMarketQuotes.status, "open")
        )
      );
    if (result[0]?.affectedRows !== 1)
      throw new Error("RFQ quote changed before status update could be applied");
    await tx
      .insert(auditEvents)
      .values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "private_market_quote",
        entityId: input.quoteId,
        action: input.status,
      });
    const updated = await tx
      .select()
      .from(privateMarketQuotes)
      .where(eq(privateMarketQuotes.id, input.quoteId))
      .limit(1);
    if (!updated[0]) throw new Error("Could not load updated RFQ quote");
    const { createdByUserId: _createdByUserId, ...quote } = updated[0];
    return quote;
  });
}

export async function exportPrivateMarketBook(
  workspaceId: number,
  marketId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const market = await db
    .select({
      name: privateMarkets.name,
      network: privateMarkets.network,
      token: privateMarkets.token,
    })
    .from(privateMarkets)
    .where(
      and(
        eq(privateMarkets.id, marketId),
        eq(privateMarkets.workspaceId, workspaceId)
      )
    )
    .limit(1);
  if (!market[0]) throw new Error("Private market not found in workspace");
  const quotes = await db
    .select({
      providerLabel: privateMarketQuotes.providerLabel,
      price: privateMarketQuotes.price,
      feeBps: privateMarketQuotes.feeBps,
      capacity: privateMarketQuotes.capacity,
      status: privateMarketQuotes.status,
      expiresAt: privateMarketQuotes.expiresAt,
      createdAt: privateMarketQuotes.createdAt,
    })
    .from(privateMarketQuotes)
    .where(eq(privateMarketQuotes.marketId, marketId))
    .orderBy(desc(privateMarketQuotes.createdAt));
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    ["market", market[0].name],
    ["network", market[0].network],
    ["token", market[0].token],
    [],
    [
      "provider_label",
      "price",
      "fee_bps",
      "capacity",
      "status",
      "expires_at",
      "created_at",
    ],
    ...quotes.map(quote => [
      quote.providerLabel,
      quote.price,
      String(quote.feeBps),
      quote.capacity,
      quote.status,
      quote.expiresAt.toISOString(),
      quote.createdAt.toISOString(),
    ]),
  ];
  return rows
    .map(row => row.map(cell => escape(String(cell ?? ""))).join(","))
    .join("\n");
}

export async function listPrivateMarketAlerts(
  workspaceId: number,
  marketId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const markets = await db
    .select()
    .from(privateMarkets)
    .where(
      marketId
        ? and(
            eq(privateMarkets.workspaceId, workspaceId),
            eq(privateMarkets.id, marketId)
          )
        : eq(privateMarkets.workspaceId, workspaceId)
    );
  for (const market of markets) {
    const [openExpiredQuotes, existingQuoteAlert, existingUtilizationAlert] =
      await Promise.all([
        db
          .select({ id: privateMarketQuotes.id })
          .from(privateMarketQuotes)
          .where(
            and(
              eq(privateMarketQuotes.marketId, market.id),
              eq(privateMarketQuotes.status, "open"),
              lt(privateMarketQuotes.expiresAt, new Date())
            )
          )
          .then(rows => rows.length),
        db
          .select({ id: privateMarketAlerts.id })
          .from(privateMarketAlerts)
          .where(
            and(
              eq(privateMarketAlerts.workspaceId, workspaceId),
              eq(privateMarketAlerts.marketId, market.id),
              eq(privateMarketAlerts.code, "RFQ_QUOTES_EXPIRED"),
              eq(privateMarketAlerts.status, "open")
            )
          )
          .limit(1),
        db
          .select({ id: privateMarketAlerts.id })
          .from(privateMarketAlerts)
          .where(
            and(
              eq(privateMarketAlerts.workspaceId, workspaceId),
              eq(privateMarketAlerts.marketId, market.id),
              eq(privateMarketAlerts.code, "MARKET_UTILIZATION_HIGH"),
              eq(privateMarketAlerts.status, "open")
            )
          )
          .limit(1),
      ]);
    if (openExpiredQuotes > 0 && !existingQuoteAlert[0]) {
      await db
        .insert(privateMarketAlerts)
        .values({
          workspaceId,
          marketId: market.id,
          severity: "warning",
          code: "RFQ_QUOTES_EXPIRED",
          message: `${openExpiredQuotes} open RFQ quote(s) require expiry review.`,
          status: "open",
        });
    }
    const utilization =
      decimalRatioAsNumber(market.publicVolume, market.targetAmount) * 100;
    const utilizationAbove90 =
      compareDecimalTimesInteger(market.publicVolume, 100, market.targetAmount, 90) > 0;
    const utilizationAbove100 =
      compareDecimalTimesInteger(market.publicVolume, 100, market.targetAmount, 100) > 0;
    if (utilizationAbove90 && !existingUtilizationAlert[0]) {
      await db
        .insert(privateMarketAlerts)
        .values({
          workspaceId,
          marketId: market.id,
          severity: utilizationAbove100 ? "critical" : "warning",
          code: "MARKET_UTILIZATION_HIGH",
          message: `Market utilization is ${utilization.toFixed(2)}% of target capacity.`,
          status: "open",
        });
    }
  }
  return db
    .select()
    .from(privateMarketAlerts)
    .where(
      marketId
        ? and(
            eq(privateMarketAlerts.workspaceId, workspaceId),
            eq(privateMarketAlerts.marketId, marketId)
          )
        : eq(privateMarketAlerts.workspaceId, workspaceId)
    )
    .orderBy(desc(privateMarketAlerts.createdAt))
    .limit(50);
}

export async function acknowledgePrivateMarketAlert(input: {
  workspaceId: number;
  actorUserId: number;
  alertId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.transaction(async tx => {
    const result = await tx
      .update(privateMarketAlerts)
      .set({ status: "acknowledged", acknowledgedAt: new Date() })
      .where(
        and(
          eq(privateMarketAlerts.id, input.alertId),
          eq(privateMarketAlerts.workspaceId, input.workspaceId),
          eq(privateMarketAlerts.status, "open")
        )
      );
    if (result[0]?.affectedRows === 1) {
      await tx.insert(auditEvents).values({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "private_market_alert",
        entityId: input.alertId,
        action: "acknowledged",
      });
    }
    const updated = await tx
      .select()
      .from(privateMarketAlerts)
      .where(
        and(
          eq(privateMarketAlerts.id, input.alertId),
          eq(privateMarketAlerts.workspaceId, input.workspaceId)
        )
      )
      .limit(1);
    return updated[0] ?? null;
  });
}
