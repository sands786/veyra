import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { RpcProvider } from "starknet";
import {
  auditEvents,
  blockchainTransactions,
  payrollSchedules,
  routeApprovals,
  shareableProofs,
  InsertUser,
  paymentRoutes,
  recipients,
  routeRecipients,
  users,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureWorkspaceForUser(userId: number, userName?: string | null) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db
    .select({ workspace: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  if (existing[0]?.workspace) return existing[0].workspace;

  const workspaceName = `${userName?.trim() || "Private"} workspace`;
  const slug = `${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "private-workspace"}-${userId}`;
  const created = await db.insert(workspaces).values({ name: workspaceName, slug, ownerUserId: userId }).$returningId();
  const workspaceId = created[0]?.id;
  if (!workspaceId) throw new Error("Could not create workspace");
  await db.insert(workspaceMembers).values({ workspaceId, userId, role: "owner" });
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return rows[0];
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

export async function updateWorkspaceApprovalThreshold(workspaceId: number, actorUserId: number, approvalThreshold: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(workspaces).set({ approvalThreshold }).where(eq(workspaces.id, workspaceId));
  await db.insert(auditEvents).values({ workspaceId, actorUserId, entityType: "workspace", entityId: workspaceId, action: "approval_threshold_updated", metadata: JSON.stringify({ approvalThreshold }) });
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return rows[0];
}

export async function listWorkspaceRecipients(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recipients).where(eq(recipients.workspaceId, workspaceId)).orderBy(desc(recipients.createdAt));
}

export async function listWorkspaceRoutes(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentRoutes).where(eq(paymentRoutes.workspaceId, workspaceId)).orderBy(desc(paymentRoutes.createdAt));
}

export async function createRecipient(input: { workspaceId: number; createdByUserId: number; displayName: string; walletAddress: string; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const inserted = await db.insert(recipients).values(input).$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Could not create recipient");
  await db.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, entityType: "recipient", entityId: id, action: "created" });
  const rows = await db.select().from(recipients).where(eq(recipients.id, id)).limit(1);
  return rows[0];
}

export async function archiveRecipient(workspaceId: number, recipientId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(recipients).set({ status: "archived" }).where(and(eq(recipients.id, recipientId), eq(recipients.workspaceId, workspaceId)));
  await db.insert(auditEvents).values({ workspaceId, actorUserId, entityType: "recipient", entityId: recipientId, action: "archived" });
  return { success: true } as const;
}

export async function createPaymentRoute(input: { workspaceId: number; createdByUserId: number; name: string; token: string; totalAmount: string; recipientAmounts: Array<{ recipientId: number; amount: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const recipientIds = Array.from(new Set(input.recipientAmounts.map((item) => item.recipientId)));
  const ownedRecipients = recipientIds.length ? await db.select({ id: recipients.id }).from(recipients).where(and(eq(recipients.workspaceId, input.workspaceId), eq(recipients.status, "active"))) : [];
  const ownedIds = new Set(ownedRecipients.map((row) => row.id));
  if (recipientIds.some((id) => !ownedIds.has(id))) throw new Error("One or more recipients do not belong to this workspace");
  const inserted = await db.insert(paymentRoutes).values({ workspaceId: input.workspaceId, createdByUserId: input.createdByUserId, name: input.name, token: input.token, totalAmount: input.totalAmount }).$returningId();
  const routeId = inserted[0]?.id;
  if (!routeId) throw new Error("Could not create payment route");
  if (input.recipientAmounts.length) {
    await db.insert(routeRecipients).values(input.recipientAmounts.map((item) => ({ routeId, recipientId: item.recipientId, amount: item.amount })));
  }
  await db.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, entityType: "payment_route", entityId: routeId, action: "created" });
  const rows = await db.select().from(paymentRoutes).where(eq(paymentRoutes.id, routeId)).limit(1);
  return rows[0];
}

export async function updateRecipient(workspaceId: number, recipientId: number, actorUserId: number, input: { displayName: string; walletAddress: string; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(recipients).set(input).where(and(eq(recipients.id, recipientId), eq(recipients.workspaceId, workspaceId)));
  await db.insert(auditEvents).values({ workspaceId, actorUserId, entityType: "recipient", entityId: recipientId, action: "updated" });
  const rows = await db.select().from(recipients).where(and(eq(recipients.id, recipientId), eq(recipients.workspaceId, workspaceId))).limit(1);
  return rows[0];
}

export async function restoreRecipient(workspaceId: number, recipientId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(recipients).set({ status: "active" }).where(and(eq(recipients.id, recipientId), eq(recipients.workspaceId, workspaceId)));
  await db.insert(auditEvents).values({ workspaceId, actorUserId, entityType: "recipient", entityId: recipientId, action: "restored" });
  return { success: true } as const;
}

export async function transitionPaymentRoute(workspaceId: number, routeId: number, actorUserId: number, status: "draft" | "shielded" | "routed" | "settled" | "failed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const ownedRoute = await db.select({ id: paymentRoutes.id }).from(paymentRoutes).where(and(eq(paymentRoutes.id, routeId), eq(paymentRoutes.workspaceId, workspaceId))).limit(1);
  if (!ownedRoute[0]) throw new Error("Route not found in workspace");
  if (status === "settled") {
    const workspace = await db.select({ approvalThreshold: workspaces.approvalThreshold }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    const approved = await db.select({ id: routeApprovals.id }).from(routeApprovals).where(and(eq(routeApprovals.workspaceId, workspaceId), eq(routeApprovals.routeId, routeId), eq(routeApprovals.status, "approved")));
    const threshold = workspace[0]?.approvalThreshold ?? 1;
    if (approved.length < threshold) throw new Error(`Route requires ${threshold} approval(s) before settlement`);
  }
  await db.update(paymentRoutes).set({ status }).where(and(eq(paymentRoutes.id, routeId), eq(paymentRoutes.workspaceId, workspaceId)));
  await db.insert(auditEvents).values({ workspaceId, actorUserId, entityType: "payment_route", entityId: routeId, action: `status_${status}` });
  const rows = await db.select().from(paymentRoutes).where(and(eq(paymentRoutes.id, routeId), eq(paymentRoutes.workspaceId, workspaceId))).limit(1);
  return rows[0];
}

export async function listWorkspaceAuditEvents(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEvents).where(eq(auditEvents.workspaceId, workspaceId)).orderBy(desc(auditEvents.createdAt)).limit(100);
}

export async function recordBlockchainTransaction(input: { workspaceId: number; actorUserId: number; routeId: number; network: "mainnet" | "sepolia"; transactionHash: string; status: "submitted" | "confirmed" | "reverted" | "unknown"; explorerUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const ownedRoute = await db.select({ id: paymentRoutes.id }).from(paymentRoutes).where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId))).limit(1);
  if (!ownedRoute[0]) throw new Error("Route not found in workspace");
  const existing = await db.select().from(blockchainTransactions).where(eq(blockchainTransactions.transactionHash, input.transactionHash)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(blockchainTransactions).values({ routeId: input.routeId, network: input.network, transactionHash: input.transactionHash, status: input.status, explorerUrl: input.explorerUrl });
  if (input.status === "confirmed") await transitionPaymentRoute(input.workspaceId, input.routeId, input.actorUserId, "settled");
  const rows = await db.select().from(blockchainTransactions).where(eq(blockchainTransactions.transactionHash, input.transactionHash)).limit(1);
  return rows[0];
}

export async function listRouteTransactions(workspaceId: number, routeId: number) {
  const db = await getDb();
  if (!db) return [];
  const ownedRoute = await db.select({ id: paymentRoutes.id }).from(paymentRoutes).where(and(eq(paymentRoutes.id, routeId), eq(paymentRoutes.workspaceId, workspaceId))).limit(1);
  if (!ownedRoute[0]) throw new Error("Route not found in workspace");
  return db.select().from(blockchainTransactions).where(eq(blockchainTransactions.routeId, routeId)).orderBy(desc(blockchainTransactions.submittedAt));
}

export async function listWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ workspace: workspaces, memberRole: workspaceMembers.role }).from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(eq(workspaceMembers.userId, userId)).orderBy(desc(workspaces.updatedAt));
}

export async function verifyStarknetReceipt(transactionHash: string) {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL || "https://rpc.starknet.lava.build" });
  const receipt = await provider.getTransactionReceipt(transactionHash);
  const executionStatus = String((receipt as { execution_status?: string }).execution_status || "").toUpperCase();
  const finalityStatus = String((receipt as { finality_status?: string }).finality_status || "").toUpperCase();
  const status = executionStatus === "SUCCEEDED" && ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"].includes(finalityStatus) ? "confirmed" : executionStatus === "REVERTED" ? "reverted" : "unknown";
  return { status, finalityStatus, executionStatus } as const;
}

export async function confirmBlockchainTransaction(input: { workspaceId: number; actorUserId: number; transactionHash: string; status: "confirmed" | "reverted" | "unknown" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db.select({ tx: blockchainTransactions, route: paymentRoutes }).from(blockchainTransactions).innerJoin(paymentRoutes, eq(blockchainTransactions.routeId, paymentRoutes.id)).where(and(eq(blockchainTransactions.transactionHash, input.transactionHash), eq(paymentRoutes.workspaceId, input.workspaceId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("Transaction not found in workspace");
  await db.update(blockchainTransactions).set({ status: input.status, confirmedAt: input.status === "confirmed" ? new Date() : null }).where(eq(blockchainTransactions.transactionHash, input.transactionHash));
  const routeStatus = input.status === "confirmed" ? "settled" : input.status === "reverted" ? "failed" : "routed";
  await transitionPaymentRoute(input.workspaceId, current.route.id, input.actorUserId, routeStatus);
  const updated = await db.select().from(blockchainTransactions).where(eq(blockchainTransactions.transactionHash, input.transactionHash)).limit(1);
  return updated[0];
}

export async function updatePaymentRoute(input: { workspaceId: number; routeId: number; actorUserId: number; name: string; token: string; totalAmount: string; recipientAmounts: Array<{ recipientId: number; amount: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(paymentRoutes).where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId))).limit(1);
  if (!existing[0]) throw new Error("Route not found in workspace");
  if (existing[0].status !== "draft") throw new Error("Only draft routes can be edited");
  const recipientIds = Array.from(new Set(input.recipientAmounts.map((item) => item.recipientId)));
  const owned = await db.select({ id: recipients.id }).from(recipients).where(and(eq(recipients.workspaceId, input.workspaceId), eq(recipients.status, "active")));
  const ownedIds = new Set(owned.map((row) => row.id));
  if (!recipientIds.length || recipientIds.some((id) => !ownedIds.has(id))) throw new Error("All selected recipients must be active workspace recipients");
  await db.update(paymentRoutes).set({ name: input.name, token: input.token, totalAmount: input.totalAmount }).where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId)));
  await db.delete(routeRecipients).where(eq(routeRecipients.routeId, input.routeId));
  await db.insert(routeRecipients).values(input.recipientAmounts.map((item) => ({ routeId: input.routeId, recipientId: item.recipientId, amount: item.amount })));
  await db.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, entityType: "payment_route", entityId: input.routeId, action: "updated" });
  const rows = await db.select().from(paymentRoutes).where(eq(paymentRoutes.id, input.routeId)).limit(1);
  return rows[0];
}

export async function listRouteRecipientIds(workspaceId: number, routeId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ recipientId: routeRecipients.recipientId }).from(routeRecipients).innerJoin(paymentRoutes, eq(routeRecipients.routeId, paymentRoutes.id)).where(and(eq(routeRecipients.routeId, routeId), eq(paymentRoutes.workspaceId, workspaceId)));
  return rows.map((row) => row.recipientId);
}

export async function getWorkspaceByIdForUser(userId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ workspace: workspaces, memberRole: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  return rows[0];
}


export async function createPayrollSchedule(input: { workspaceId: number; routeId: number; createdByUserId: number; frequency: "weekly" | "biweekly" | "monthly"; timezone: string; nextRunAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const route = await db.select({ id: paymentRoutes.id }).from(paymentRoutes).where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId))).limit(1);
  if (!route[0]) throw new Error("Route not found in workspace");
  const existing = await db.select().from(payrollSchedules).where(and(eq(payrollSchedules.workspaceId, input.workspaceId), eq(payrollSchedules.routeId, input.routeId), eq(payrollSchedules.frequency, input.frequency), eq(payrollSchedules.nextRunAt, input.nextRunAt), eq(payrollSchedules.status, "active"))).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(payrollSchedules).values({ ...input, status: "active" }).$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Could not create payroll schedule");
  await db.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, entityType: "schedule", entityId: id, action: "created" });
  const rows = await db.select().from(payrollSchedules).where(eq(payrollSchedules.id, id)).limit(1);
  return rows[0];
}

export async function listWorkspaceSchedules(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payrollSchedules).where(eq(payrollSchedules.workspaceId, workspaceId)).orderBy(desc(payrollSchedules.nextRunAt));
}

export async function setPayrollScheduleTaskUid(workspaceId: number, scheduleId: number, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(payrollSchedules).set({ scheduleCronTaskUid: taskUid }).where(and(eq(payrollSchedules.id, scheduleId), eq(payrollSchedules.workspaceId, workspaceId)));
  const rows = await db.select().from(payrollSchedules).where(and(eq(payrollSchedules.id, scheduleId), eq(payrollSchedules.workspaceId, workspaceId))).limit(1);
  return rows[0];
}

export async function getPayrollScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(payrollSchedules).where(eq(payrollSchedules.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function markPayrollScheduleTriggered(scheduleId: number, nextRunAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(payrollSchedules).set({ lastRunAt: new Date(), nextRunAt }).where(and(eq(payrollSchedules.id, scheduleId), eq(payrollSchedules.status, "active")));
  return { success: true } as const;
}

export async function updatePayrollSchedule(workspaceId: number, scheduleId: number, actorUserId: number, input: { frequency: "weekly" | "biweekly" | "monthly"; timezone: string; nextRunAt: Date; status: "active" | "paused" | "completed" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select({ id: payrollSchedules.id }).from(payrollSchedules).where(and(eq(payrollSchedules.id, scheduleId), eq(payrollSchedules.workspaceId, workspaceId))).limit(1);
  if (!existing[0]) throw new Error("Schedule not found in workspace");
  await db.update(payrollSchedules).set(input).where(and(eq(payrollSchedules.id, scheduleId), eq(payrollSchedules.workspaceId, workspaceId)));
  await db.insert(auditEvents).values({ workspaceId, actorUserId, entityType: "schedule", entityId: scheduleId, action: `status_${input.status}` });
  const rows = await db.select().from(payrollSchedules).where(eq(payrollSchedules.id, scheduleId)).limit(1);
  return rows[0];
}

export async function listRouteApprovals(workspaceId: number, routeId: number) {
  const db = await getDb();
  if (!db) return [];
  const route = await db.select({ id: paymentRoutes.id }).from(paymentRoutes).where(and(eq(paymentRoutes.id, routeId), eq(paymentRoutes.workspaceId, workspaceId))).limit(1);
  if (!route[0]) throw new Error("Route not found in workspace");
  return db.select().from(routeApprovals).where(and(eq(routeApprovals.workspaceId, workspaceId), eq(routeApprovals.routeId, routeId))).orderBy(desc(routeApprovals.createdAt));
}

export async function upsertRouteApproval(input: { workspaceId: number; routeId: number; approverUserId: number; status: "approved" | "rejected"; comment?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const route = await db.select({ id: paymentRoutes.id }).from(paymentRoutes).where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId))).limit(1);
  if (!route[0]) throw new Error("Route not found in workspace");
  const existing = await db.select({ id: routeApprovals.id }).from(routeApprovals).where(and(eq(routeApprovals.workspaceId, input.workspaceId), eq(routeApprovals.routeId, input.routeId), eq(routeApprovals.approverUserId, input.approverUserId))).limit(1);
  if (existing[0]) {
    await db.update(routeApprovals).set({ status: input.status, comment: input.comment, decidedAt: new Date() }).where(eq(routeApprovals.id, existing[0].id));
  } else {
    await db.insert(routeApprovals).values({ ...input, decidedAt: new Date() });
  }
  await db.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.approverUserId, entityType: "route_approval", entityId: input.routeId, action: input.status });
  const rows = await db.select().from(routeApprovals).where(and(eq(routeApprovals.workspaceId, input.workspaceId), eq(routeApprovals.routeId, input.routeId), eq(routeApprovals.approverUserId, input.approverUserId))).limit(1);
  return rows[0];
}

export async function createShareableProof(input: { workspaceId: number; routeId: number; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const route = await db.select({ id: paymentRoutes.id, proofReference: paymentRoutes.proofReference, status: paymentRoutes.status, token: paymentRoutes.token, totalAmount: paymentRoutes.totalAmount, name: paymentRoutes.name, createdAt: paymentRoutes.createdAt }).from(paymentRoutes).where(and(eq(paymentRoutes.id, input.routeId), eq(paymentRoutes.workspaceId, input.workspaceId))).limit(1);
  if (!route[0]) throw new Error("Route not found in workspace");
  const existing = await db.select().from(shareableProofs).where(and(eq(shareableProofs.workspaceId, input.workspaceId), eq(shareableProofs.routeId, input.routeId), eq(shareableProofs.status, "active"))).limit(1);
  if (existing[0]) return { slug: existing[0].slug, route: route[0] };
  const slug = `vp-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const inserted = await db.insert(shareableProofs).values({ ...input, slug }).$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Could not create proof link");
  await db.insert(auditEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, entityType: "proof", entityId: id, action: "created" });
  return { slug, route: route[0] };
}

export async function getPublicProof(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ proof: shareableProofs, route: paymentRoutes }).from(shareableProofs).innerJoin(paymentRoutes, eq(shareableProofs.routeId, paymentRoutes.id)).where(and(eq(shareableProofs.slug, slug), eq(shareableProofs.status, "active"))).limit(1);
  if (!rows[0]) return undefined;
  return { slug: rows[0].proof.slug, status: rows[0].route.status, name: rows[0].route.name, token: rows[0].route.token, totalAmount: rows[0].route.totalAmount, proofReference: rows[0].route.proofReference, createdAt: rows[0].route.createdAt };
}

export async function listWorkspaceAnalytics(workspaceId: number) {
  const db = await getDb();
  if (!db) return { routes: 0, settled: 0, failed: 0, totalTransactions: 0, auditEvents: 0 };
  const [routes, transactions, events] = await Promise.all([
    db.select().from(paymentRoutes).where(eq(paymentRoutes.workspaceId, workspaceId)),
    db.select({ tx: blockchainTransactions, route: paymentRoutes }).from(blockchainTransactions).innerJoin(paymentRoutes, eq(blockchainTransactions.routeId, paymentRoutes.id)).where(eq(paymentRoutes.workspaceId, workspaceId)),
    db.select().from(auditEvents).where(eq(auditEvents.workspaceId, workspaceId)),
  ]);
  return { routes: routes.length, settled: routes.filter((route) => route.status === "settled").length, failed: routes.filter((route) => route.status === "failed").length, totalTransactions: transactions.length, auditEvents: events.length };
}

export async function exportWorkspaceAuditCsv(workspaceId: number) {
  const events = await listWorkspaceAuditEvents(workspaceId);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return ["id,entityType,entityId,action,createdAt", ...events.map((event) => [event.id, event.entityType, event.entityId, event.action, event.createdAt.toISOString()].map(escape).join(","))].join("\n");
}
