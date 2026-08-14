import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { RpcProvider } from "starknet";
import {
  auditEvents,
  blockchainTransactions,
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
