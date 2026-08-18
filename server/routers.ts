import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { parseWorkspaceId } from "./workspaceSelection";
import { buildPayrollCron } from "@shared/operations";
import { resolveWorkspaceSelection } from "./workspaceResolver";
import { archiveRecipient, createPaymentRoute, updatePaymentRoute, createRecipient, createTreasuryPolicy, listWorkspaceTreasuryPolicies, listWorkspaceTreasuryBalances, recordTreasuryBalanceSnapshot, simulateTreasuryPolicy, createRecipientClaimLink, getPublicClaim, claimRecipientLink, ensureWorkspaceForUser, getWorkspaceForUser, listWorkspaceAuditEvents, listWorkspacesForUser, listWorkspaceRecipients, listWorkspaceRoutes, listRouteRecipientIds, getWorkspaceByIdForUser, recordBlockchainTransaction, confirmBlockchainTransaction, verifyStarknetReceipt, restoreRecipient, transitionPaymentRoute, updateRecipient, createPayrollSchedule, listWorkspaceSchedules, updatePayrollSchedule, setPayrollScheduleTaskUid, updateWorkspaceApprovalThreshold, listRouteApprovals, upsertRouteApproval, createShareableProof, getPublicProof, listWorkspaceAnalytics, listWorkspaceOperationsHealth, exportWorkspaceAuditCsv, createLaunchpadProject, listWorkspaceLaunchpadProjects, createLaunchpadMilestone, listPrivateMarkets, createPrivateMarket, updatePrivateMarketStatus, commitPrivateMarketBid, createLaunchpadAllocation, updateLaunchpadProjectStatus, updateLaunchpadMilestoneStatus, getPublicLaunchpadProject, getLaunchpadProjectOps, updateLaunchpadProjectOps, getLaunchpadReadiness, listLaunchpadActivity, listLaunchpadAllocations, listLaunchpadReleaseRequests, createLaunchpadReleaseRequest, decideLaunchpadReleaseRequest } from "./db";

async function workspaceFor(ctx: { user: { id: number; name?: string | null } | null; req?: { headers?: Record<string, string | string[] | undefined> } }) {
  if (!ctx.user) throw new Error("Authentication required");
  const user = ctx.user;
  const requestedId = parseWorkspaceId(ctx.req?.headers?.["x-workspace-id"]);
  return resolveWorkspaceSelection(
    requestedId,
    (workspaceId) => getWorkspaceByIdForUser(user.id, workspaceId),
    () => getWorkspaceForUser(user.id),
    async () => {
      const workspace = await ensureWorkspaceForUser(user.id, user.name);
      if (!workspace) throw new Error("Database is not configured");
      return { workspace, memberRole: "owner" as const };
    },
  );
}

const walletAddress = z.string().trim().min(4).max(100).regex(/^0x[0-9a-fA-F]+$/, "Enter a valid Starknet address");
const safeNoNote = z.undefined().optional();
const amount = z.string().trim().min(1).max(80).regex(/^\d+(\.\d{1,18})?$/, "Enter a valid amount");
const tokenSymbol = z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9._-]+$/, "Enter a valid token symbol");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      return listWorkspacesForUser(actorId);
    }),
    overview: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      const [recipientRows, routeRows] = await Promise.all([
        listWorkspaceRecipients(membership.workspace.id),
        listWorkspaceRoutes(membership.workspace.id),
      ]);
      return { workspace: membership.workspace, memberRole: membership.memberRole, recipients: recipientRows, routes: routeRows };
    }),
    setApprovalThreshold: protectedProcedure.input(z.object({ approvalThreshold: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin'].includes(membership.memberRole)) throw new Error("Only owners and admins can change approval thresholds");
      return updateWorkspaceApprovalThreshold(membership.workspace.id, actorId, input.approvalThreshold);
    }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160) })).mutation(async ({ ctx, input }) => {
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      const existing = await getWorkspaceForUser(actorId);
      if (existing) return existing.workspace;
      const workspace = await ensureWorkspaceForUser(actorId, input.name);
      if (!workspace) throw new Error("Database is not configured");
      return workspace;
    }),
  }),
  treasury: router({
    balances: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceTreasuryBalances(membership.workspace.id);
    }),
    recordBalance: protectedProcedure.input(z.object({ token: tokenSymbol, network: z.enum(["mainnet", "sepolia"]), availableBalance: amount, source: z.string().trim().max(40).optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      if (!['owner', 'admin', 'operator'].includes(membership.memberRole)) throw new Error("Only workspace operators can record treasury balances");
      return recordTreasuryBalanceSnapshot({ workspaceId: membership.workspace.id, ...input });
    }),
    simulate: protectedProcedure.input(z.object({ token: tokenSymbol, totalAmount: amount, approvalCount: z.number().int().min(0).max(20), network: z.enum(["mainnet", "sepolia"]).default("mainnet") })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return simulateTreasuryPolicy(membership.workspace.id, input);
    }),
    policies: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceTreasuryPolicies(membership.workspace.id);
    }),
    createPolicy: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, network: z.enum(["mainnet", "sepolia"]), maxRouteAmount: amount, dailyLimit: amount, approvalThreshold: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin'].includes(membership.memberRole)) throw new Error("Only owners and admins can create treasury policies");
      return createTreasuryPolicy({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
  }),
  launchpad: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceLaunchpadProjects(membership.workspace.id);
    }),
    createProject: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), description: z.string().trim().max(2000).optional(), token: tokenSymbol, network: z.enum(["mainnet", "sepolia"]), targetAmount: amount, fundingEndsAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can create Launchpad projects");
      return createLaunchpadProject({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    projectOps: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return getLaunchpadProjectOps(membership.workspace.id, input.projectId);
    }),
    readiness: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return getLaunchpadReadiness(membership.workspace.id, input.projectId);
    }),
    updateProjectOps: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), ownerLabel: z.string().trim().min(2).max(160), roundType: z.enum(["community", "strategic", "treasury", "grant"]), stage: z.enum(["planning", "review", "live", "closeout"]), riskLevel: z.enum(["low", "medium", "high"]), operationalNotes: z.string().trim().max(2000).optional(), readinessOverride: z.enum(["none", "blocked", "ready"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can update project operations");
      return updateLaunchpadProjectOps({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    allocations: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const rows = await listLaunchpadAllocations(membership.workspace.id, input.projectId);
      return rows.map(({ id, commitment, allocationAmount, status, createdAt, claimedAt }) => ({ id, commitment, allocationAmount, status, createdAt, claimedAt }));
    }),
    activity: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listLaunchpadActivity(membership.workspace.id, input.projectId);
    }),
    releaseRequests: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listLaunchpadReleaseRequests(membership.workspace.id, input.projectId);
    }),
    requestRelease: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), milestoneId: z.number().int().positive(), requestedAmount: amount, reason: z.string().trim().min(8).max(500) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can request releases");
      return createLaunchpadReleaseRequest({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    decideRelease: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), status: z.enum(["approved", "rejected", "settled"]), proofReference: z.string().trim().max(255).optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin"].includes(membership.memberRole)) throw new Error("Only owners and admins can decide release requests");
      return decideLaunchpadReleaseRequest({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    createMilestone: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), name: z.string().trim().min(2).max(160), sequence: z.number().int().positive().max(100), releaseAmount: amount, approvalThreshold: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can create milestones");
      return createLaunchpadMilestone({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    reserveAllocation: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), commitment: z.string().trim().min(16).max(255), encryptedReference: z.string().trim().max(4000).optional(), allocationAmount: amount })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can reserve allocations");
      return createLaunchpadAllocation({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    updateProjectStatus: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), status: z.enum(["draft", "live", "funded", "closed"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin"].includes(membership.memberRole)) throw new Error("Only owners and admins can change project status");
      return updateLaunchpadProjectStatus({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    updateMilestoneStatus: protectedProcedure.input(z.object({ milestoneId: z.number().int().positive(), status: z.enum(["planned", "ready", "released", "blocked"]), proofReference: z.string().trim().max(255).optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can update milestones");
      return updateLaunchpadMilestoneStatus({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    public: publicProcedure.input(z.object({ slug: z.string().trim().regex(/^launch-[a-f0-9]{20}$/) })).query(({ input }) => getPublicLaunchpadProject(input.slug)),
  }),
  claims: router({
    create: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), recipientId: z.number().int().positive(), expiresAt: z.coerce.date() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin', 'operator'].includes(membership.memberRole)) throw new Error("Only workspace operators can create claim links");
      return createRecipientClaimLink({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    public: publicProcedure.input(z.object({ token: z.string().trim().regex(/^claim-[a-f0-9]{32}$/) })).query(({ input }) => getPublicClaim(input.token)),
    redeem: publicProcedure.input(z.object({ token: z.string().trim().regex(/^claim-[a-f0-9]{32}$/), walletAddress })).mutation(({ input }) => claimRecipientLink(input.token, input.walletAddress)),
  }),
  recipients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceRecipients(membership.workspace.id);
    }),
    create: protectedProcedure.input(z.object({ displayName: z.string().trim().min(2).max(160), walletAddress, note: safeNoNote })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (membership.memberRole === "viewer") throw new Error("Viewer access cannot create recipients");
      return createRecipient({ workspaceId: membership.workspace.id, createdByUserId: actorId, displayName: input.displayName, walletAddress: input.walletAddress });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), displayName: z.string().trim().min(2).max(160), walletAddress, note: safeNoNote })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (membership.memberRole === "viewer") throw new Error("Viewer access cannot update recipients");
      return updateRecipient(membership.workspace.id, input.id, actorId, { displayName: input.displayName, walletAddress: input.walletAddress });
    }),
    archive: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (membership.memberRole === "viewer") throw new Error("Viewer access cannot archive recipients");
      return archiveRecipient(membership.workspace.id, input.id, actorId);
    }),
    restore: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (membership.memberRole === "viewer") throw new Error("Viewer access cannot restore recipients");
      return restoreRecipient(membership.workspace.id, input.id, actorId);
    }),
  }),
  routes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceRoutes(membership.workspace.id);
    }),
    recipients: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listRouteRecipientIds(membership.workspace.id, input.routeId);
    }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, network: z.enum(["mainnet", "sepolia"]).default("mainnet"), totalAmount: amount, recipientAmounts: z.array(z.object({ recipientId: z.number().int().positive(), amount })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot create payment routes");
      return createPaymentRoute({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(160), token: tokenSymbol, network: z.enum(["mainnet", "sepolia"]).default("mainnet"), totalAmount: amount, recipientAmounts: z.array(z.object({ recipientId: z.number().int().positive(), amount })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot edit payment routes");
      return updatePaymentRoute({ workspaceId: membership.workspace.id, routeId: input.id, actorUserId: actorId, name: input.name, token: input.token, network: input.network, totalAmount: input.totalAmount, recipientAmounts: input.recipientAmounts });
    }),
    transition: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "shielded", "routed", "settled", "failed", "cancelled"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot transition routes");
      return transitionPaymentRoute(membership.workspace.id, input.id, actorId, input.status);
    }),
  }),
  audit: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceAuditEvents(membership.workspace.id);
    }),
  }),
  transactions: router({
    listRoute: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return (await import("./db")).listRouteTransactions(membership.workspace.id, input.routeId);
    }),
    recordSubmission: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), network: z.enum(["mainnet", "sepolia"]), transactionHash: z.string().trim().regex(/^0x[0-9a-fA-F]+$/), status: z.enum(["submitted", "confirmed", "reverted", "unknown"]).default("submitted"), explorerUrl: z.string().url().optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot record transactions");
      return recordBlockchainTransaction({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    confirm: protectedProcedure.input(z.object({ transactionHash: z.string().trim().regex(/^0x[0-9a-fA-F]+$/) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot confirm transactions");
      const verified = await verifyStarknetReceipt(input.transactionHash);
      return confirmBlockchainTransaction({ workspaceId: membership.workspace.id, actorUserId: actorId, transactionHash: input.transactionHash, status: verified.status });
    }),
  }),
  schedules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceSchedules(membership.workspace.id);
    }),
    create: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), frequency: z.enum(["weekly", "biweekly", "monthly"]), timezone: z.string().trim().min(1).max(80), nextRunAt: z.coerce.date() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin', 'operator'].includes(membership.memberRole)) throw new Error("Only workspace operators can schedule routes");
      const created = await createPayrollSchedule({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
      if (created.scheduleCronTaskUid) return created;
      const sessionToken = parseCookieHeader(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const cron = buildPayrollCron(input.nextRunAt, input.frequency, input.timezone);
      try {
        const job = await createHeartbeatJob({ name: `veilpay-schedule-${created.id}`, cron, path: "/api/scheduled/payroll", payload: { scheduleId: created.id }, description: `VeilPay payroll trigger for schedule ${created.id}` }, sessionToken);
        return setPayrollScheduleTaskUid(membership.workspace.id, created.id, job.taskUid);
      } catch (error) {
        await updatePayrollSchedule(membership.workspace.id, created.id, actorId, { frequency: input.frequency, timezone: input.timezone, nextRunAt: input.nextRunAt, status: "paused" });
        throw error;
      }
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), frequency: z.enum(["weekly", "biweekly", "monthly"]), timezone: z.string().trim().min(1).max(80), nextRunAt: z.coerce.date(), status: z.enum(["active", "paused", "completed"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin', 'operator'].includes(membership.memberRole)) throw new Error("Only workspace operators can update schedules");
      const updated = await updatePayrollSchedule(membership.workspace.id, input.id, actorId, { frequency: input.frequency, timezone: input.timezone, nextRunAt: input.nextRunAt, status: input.status });
      if (updated?.scheduleCronTaskUid) {
        const sessionToken = parseCookieHeader(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        await updateHeartbeatJob(updated.scheduleCronTaskUid, { cron: buildPayrollCron(input.nextRunAt, input.frequency, input.timezone), enable: input.status === "active", description: `VeilPay payroll trigger for schedule ${updated.id}` }, sessionToken);
      }
      return updated;
    }),
  }),
  approvals: router({
    list: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listRouteApprovals(membership.workspace.id, input.routeId);
    }),
    decide: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), comment: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin'].includes(membership.memberRole)) throw new Error("Only owners and admins can approve routes");
      return upsertRouteApproval({ workspaceId: membership.workspace.id, routeId: input.routeId, approverUserId: actorId, status: input.status, comment: input.comment });
    }),
  }),
  proofs: router({
    create: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!['owner', 'admin', 'operator'].includes(membership.memberRole)) throw new Error("Only workspace operators can publish proofs");
      return createShareableProof({ workspaceId: membership.workspace.id, routeId: input.routeId, createdByUserId: actorId });
    }),
    public: publicProcedure.input(z.object({ slug: z.string().trim().regex(/^vp-[a-f0-9]{20}$/) })).query(({ input }) => getPublicProof(input.slug)),
  }),
  privateMarkets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listPrivateMarkets(membership.workspace.id);
    }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, network: z.enum(["mainnet", "sepolia"]), targetAmount: amount, bidDeadline: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can create private markets");
      return createPrivateMarket({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    updateStatus: protectedProcedure.input(z.object({ marketId: z.number().int().positive(), status: z.enum(["draft", "live", "closed"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can change market status");
      return updatePrivateMarketStatus({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    commitBid: protectedProcedure.input(z.object({ marketId: z.number().int().positive(), commitmentHash: z.string().trim().min(16).max(255), encryptedTerms: z.string().trim().max(4000).optional(), bidAmount: amount })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      return commitPrivateMarketBid({ workspaceId: membership.workspace.id, bidderUserId: actorId, ...input });
    }),
  }),
  analytics: router({
    health: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceOperationsHealth(membership.workspace.id);
    }),
    summary: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceAnalytics(membership.workspace.id);
    }),
    auditCsv: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return exportWorkspaceAuditCsv(membership.workspace.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
