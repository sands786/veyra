import { relations } from "drizzle-orm";
import { int, index, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  ownerUserId: int("ownerUserId").notNull(),
  defaultToken: varchar("defaultToken", { length: 80 }).notNull().default("USDC"),
  network: mysqlEnum("network", ["mainnet", "sepolia"]).notNull().default("mainnet"),
  approvalThreshold: int("approvalThreshold").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workspaceMembers = mysqlTable("workspaceMembers", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "operator", "viewer"]).notNull().default("viewer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recipients = mysqlTable("recipients", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  walletAddress: varchar("walletAddress", { length: 100 }).notNull(),
  note: text("note"),
  status: mysqlEnum("status", ["active", "archived"]).notNull().default("active"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentRoutes = mysqlTable("paymentRoutes", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  token: varchar("token", { length: 80 }).notNull(),
  network: mysqlEnum("network", ["mainnet", "sepolia"]).notNull().default("mainnet"),
  totalAmount: varchar("totalAmount", { length: 80 }).notNull(),
  privacyMode: mysqlEnum("privacyMode", ["shielded", "public"]).notNull().default("shielded"),
  status: mysqlEnum("status", ["draft", "shielded", "routed", "settled", "failed", "cancelled"]).notNull().default("draft"),
  proofReference: varchar("proofReference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const routeRecipients = mysqlTable("routeRecipients", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull(),
  recipientId: int("recipientId").notNull(),
  amount: varchar("amount", { length: 80 }).notNull(),
  fulfillmentStatus: mysqlEnum("fulfillmentStatus", ["pending", "claim_ready", "claimed", "paid"]).notNull().default("pending"),
  fulfilledWalletAddress: varchar("fulfilledWalletAddress", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const payrollSchedules = mysqlTable("payrollSchedules", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  routeId: int("routeId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"]).notNull(),
  timezone: varchar("timezone", { length: 80 }).notNull().default("UTC"),
  nextRunAt: timestamp("nextRunAt").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"]).notNull().default("active"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskUidIdx: index("payrollSchedules_task_uid_idx").on(table.scheduleCronTaskUid),
}));

export const routeApprovals = mysqlTable("routeApprovals", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  routeId: int("routeId").notNull(),
  approverUserId: int("approverUserId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  comment: text("comment"),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shareableProofs = mysqlTable("shareableProofs", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  routeId: int("routeId").notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "revoked"]).notNull().default("active"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export const treasuryBalanceSnapshots = mysqlTable("treasuryBalanceSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  token: varchar("token", { length: 80 }).notNull(),
  network: mysqlEnum("network", ["mainnet", "sepolia"]).notNull(),
  availableBalance: varchar("availableBalance", { length: 80 }).notNull(),
  source: varchar("source", { length: 40 }).notNull().default("wallet_read"),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export const treasuryPolicies = mysqlTable("treasuryPolicies", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  token: varchar("token", { length: 80 }).notNull(),
  network: mysqlEnum("network", ["mainnet", "sepolia"]).notNull().default("mainnet"),
  maxRouteAmount: varchar("maxRouteAmount", { length: 80 }).notNull(),
  dailyLimit: varchar("dailyLimit", { length: 80 }).notNull(),
  approvalThreshold: int("approvalThreshold").notNull().default(1),
  status: mysqlEnum("status", ["active", "archived"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const claimLinks = mysqlTable("claimLinks", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  routeId: int("routeId").notNull(),
  recipientId: int("recipientId").notNull(),
  token: varchar("token", { length: 80 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  status: mysqlEnum("status", ["pending", "claimed", "revoked"]).notNull().default("pending"),
  claimedAt: timestamp("claimedAt"),
  claimedWalletAddress: varchar("claimedWalletAddress", { length: 80 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const launchpadProjects = mysqlTable("launchpadProjects", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  token: varchar("token", { length: 80 }).notNull(),
  network: mysqlEnum("network", ["mainnet", "sepolia"]).notNull().default("mainnet"),
  targetAmount: varchar("targetAmount", { length: 80 }).notNull(),
  raisedAmount: varchar("raisedAmount", { length: 80 }).notNull().default("0"),
  privacyMode: mysqlEnum("privacyMode", ["shielded", "public"]).notNull().default("shielded"),
  status: mysqlEnum("status", ["draft", "live", "funded", "closed"]).notNull().default("draft"),
  fundingEndsAt: timestamp("fundingEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const launchpadMilestones = mysqlTable("launchpadMilestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  sequence: int("sequence").notNull().default(1),
  releaseAmount: varchar("releaseAmount", { length: 80 }).notNull(),
  approvalThreshold: int("approvalThreshold").notNull().default(1),
  status: mysqlEnum("status", ["planned", "ready", "released", "blocked"]).notNull().default("planned"),
  proofReference: varchar("proofReference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const launchpadAllocations = mysqlTable("launchpadAllocations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  commitment: varchar("commitment", { length: 255 }).notNull().unique(),
  encryptedReference: text("encryptedReference"),
  allocationAmount: varchar("allocationAmount", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["reserved", "claimed", "revoked"]).notNull().default("reserved"),
  claimedWalletAddress: varchar("claimedWalletAddress", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
});

export const blockchainTransactions = mysqlTable("blockchainTransactions", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull(),
  network: mysqlEnum("network", ["mainnet", "sepolia"]).notNull(),
  transactionHash: varchar("transactionHash", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["submitted", "confirmed", "reverted", "unknown"]).notNull().default("submitted"),
  explorerUrl: varchar("explorerUrl", { length: 255 }),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  action: varchar("action", { length: 80 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  recipients: many(recipients),
  routes: many(paymentRoutes),
  events: many(auditEvents),
}));

export const paymentRouteRelations = relations(paymentRoutes, ({ many }) => ({
  recipients: many(routeRecipients),
  transactions: many(blockchainTransactions),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type Recipient = typeof recipients.$inferSelect;
export type PaymentRoute = typeof paymentRoutes.$inferSelect;
export type RouteRecipient = typeof routeRecipients.$inferSelect;
export type TreasuryBalanceSnapshot = typeof treasuryBalanceSnapshots.$inferSelect;
export type TreasuryPolicy = typeof treasuryPolicies.$inferSelect;
export type ClaimLink = typeof claimLinks.$inferSelect;
export type LaunchpadProject = typeof launchpadProjects.$inferSelect;
export type LaunchpadMilestone = typeof launchpadMilestones.$inferSelect;
export type LaunchpadAllocation = typeof launchpadAllocations.$inferSelect;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type PayrollSchedule = typeof payrollSchedules.$inferSelect;
export type RouteApproval = typeof routeApprovals.$inferSelect;
export type ShareableProof = typeof shareableProofs.$inferSelect;
