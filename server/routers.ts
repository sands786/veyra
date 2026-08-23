import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { getSessionCookieOptions } from "./_core/cookies";
import { createLocalOpenId, createPasswordResetToken, createVeyraSessionToken, hashAccountPassword, hashPasswordResetToken, normalizeAccountEmail, VEYRA_SESSION_MS, verifyAccountPassword } from "./_core/localAuth";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { parseWorkspaceId } from "./workspaceSelection";
import { buildPayrollCron } from "@shared/operations";
import { resolveWorkspaceSelection } from "./workspaceResolver";
import { ENV } from "./_core/env";
import { passwordResetBaseUrl } from "./passwordReset";
import { archiveRecipient, createPaymentRoute, updatePaymentRoute, createRecipient, createTreasuryPolicy, listWorkspaceTreasuryPolicies, listWorkspaceTreasuryBalances, recordTreasuryBalanceSnapshot, simulateTreasuryPolicy, createRecipientClaimLink, getPublicClaim, claimRecipientLink, ensureWorkspaceForUser, getWorkspaceForUser, listWorkspaceAuditEvents, listWorkspacesForUser, listWorkspaceRecipients, listWorkspaceRoutes, listRouteRecipientIds, listRouteRecipientReview, getWorkspaceByIdForUser, recordBlockchainTransaction, confirmBlockchainTransaction, verifyWorkspaceStarknetReceipt, restoreRecipient, transitionPaymentRoute, updateRecipient, createPayrollSchedule, listWorkspaceSchedules, updatePayrollSchedule, setPayrollScheduleTaskUid, updateWorkspaceApprovalThreshold, listRouteApprovals, upsertRouteApproval, createShareableProof, getPublicProof, listWorkspaceAnalytics, listWorkspaceOperationsHealth, exportWorkspaceAuditCsv, createLaunchpadProject, listWorkspaceLaunchpadProjects, createLaunchpadMilestone, listPrivateMarkets, getPrivateMarketInsights, listPrivateMarketQuotes, createPrivateMarketQuote, updatePrivateMarketQuoteStatus, getPrivateMarketRiskPolicy, upsertPrivateMarketRiskPolicy, exportPrivateMarketBook, listPrivateMarketAlerts, acknowledgePrivateMarketAlert, createPrivateMarket, updatePrivateMarketStatus, commitPrivateMarketBid, createLaunchpadAllocation, updateLaunchpadProjectStatus, updateLaunchpadMilestoneStatus, getPublicLaunchpadProject, getLaunchpadProjectOps, updateLaunchpadProjectOps, getLaunchpadReadiness, listLaunchpadActivity, listLaunchpadAllocations, listLaunchpadReleaseRequests, createLaunchpadReleaseRequest, decideLaunchpadReleaseRequest } from "./db";
import { consumePasswordResetToken, createLocalAccount, createPasswordResetRecord, getLocalAccountByEmail, touchUserLastSignedIn } from "./db";

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
const positiveAmount = amount.refine(value => !/^0+(?:\.0{1,18})?$/.test(value), "Amount must be greater than zero");
const tokenSymbol = z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9._-]+$/, "Enter a valid token symbol");
const accountEmail = z.string().trim().email().max(320);
const accountPassword = z.string().min(12).max(128);
const mainnetNetwork = z.literal("mainnet");

function authUserPayload(user: { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; role: "user" | "admin" }) {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, role: user.role };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? authUserPayload(ctx.user) : null),
    register: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120), email: accountEmail, password: accountPassword })).mutation(async ({ ctx, input }) => {
      const email = normalizeAccountEmail(input.email);
      const user = await createLocalAccount({
        name: input.name,
        email,
        passwordHash: await hashAccountPassword(input.password),
        openId: createLocalOpenId(email),
      });
      const token = await createVeyraSessionToken(user.openId, user.sessionVersion);
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: VEYRA_SESSION_MS });
      return authUserPayload(user);
    }),
    signIn: publicProcedure.input(z.object({ email: accountEmail, password: accountPassword })).mutation(async ({ ctx, input }) => {
      const account = await getLocalAccountByEmail(normalizeAccountEmail(input.email));
      const valid = account ? await verifyAccountPassword(input.password, account.account.passwordHash) : false;
      if (!account || !valid) throw new Error("Invalid email or password");
      await touchUserLastSignedIn(account.user.id);
      const token = await createVeyraSessionToken(account.user.openId, account.user.sessionVersion);
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: VEYRA_SESSION_MS });
      return authUserPayload(account.user);
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: accountEmail })).mutation(async ({ ctx, input }) => {
      const generic = { message: "If an account exists for that email, recovery instructions have been sent." } as const;
      const account = await getLocalAccountByEmail(normalizeAccountEmail(input.email));
      if (!account) return generic;
      const { token, tokenHash } = createPasswordResetToken();
      await createPasswordResetRecord({ userId: account.user.id, tokenHash, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
      const origin = typeof ctx.req.headers.origin === "string" ? ctx.req.headers.origin : undefined;
      const baseUrl = passwordResetBaseUrl({
        requestOrigin: origin,
        isProduction: ENV.isProduction,
        configuredPublicAppUrl: ENV.publicAppUrl,
      });
      const resetUrl = `${baseUrl}/sign-in?mode=reset&token=${encodeURIComponent(token)}`;
      if (ENV.resendApiKey && ENV.resendFromEmail) {
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: ENV.resendFromEmail, to: [account.user.email ?? input.email], subject: "Reset your Veyra password", html: `<p>Reset your Veyra password within 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>` }) });
        if (!response.ok) throw new Error("Recovery delivery is temporarily unavailable. Please try again later.");
        return generic;
      }
      if (!ENV.isProduction) return { ...generic, previewResetUrl: resetUrl };
      return generic;
    }),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(40).max(100), password: accountPassword })).mutation(async ({ ctx, input }) => {
      const user = await consumePasswordResetToken({ tokenHash: hashPasswordResetToken(input.token), passwordHash: await hashAccountPassword(input.password) });
      if (!user) throw new Error("This reset link is invalid or expired. Request a new one.");
      const sessionToken = await createVeyraSessionToken(user.openId, user.sessionVersion);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: VEYRA_SESSION_MS });
      return authUserPayload(user);
    }),
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
    recordBalance: protectedProcedure.input(z.object({ token: tokenSymbol, network: mainnetNetwork, availableBalance: positiveAmount, source: z.string().trim().max(40).optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      if (!['owner', 'admin', 'operator'].includes(membership.memberRole)) throw new Error("Only workspace operators can record treasury balances");
      return recordTreasuryBalanceSnapshot({ workspaceId: membership.workspace.id, ...input });
    }),
    simulate: protectedProcedure.input(z.object({ token: tokenSymbol, totalAmount: positiveAmount, approvalCount: z.number().int().min(0).max(20), network: mainnetNetwork.default("mainnet") })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return simulateTreasuryPolicy(membership.workspace.id, input);
    }),
    policies: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listWorkspaceTreasuryPolicies(membership.workspace.id);
    }),
    createPolicy: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, network: mainnetNetwork, maxRouteAmount: positiveAmount, dailyLimit: positiveAmount, approvalThreshold: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => {
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
    createProject: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), description: z.string().trim().max(2000).optional(), token: tokenSymbol, network: mainnetNetwork, targetAmount: positiveAmount, fundingEndsAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
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
    requestRelease: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), milestoneId: z.number().int().positive(), requestedAmount: positiveAmount, reason: z.string().trim().min(8).max(500) })).mutation(async ({ ctx, input }) => {
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
    createMilestone: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), name: z.string().trim().min(2).max(160), sequence: z.number().int().positive().max(100), releaseAmount: positiveAmount, approvalThreshold: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can create milestones");
      return createLaunchpadMilestone({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    reserveAllocation: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), commitment: z.string().trim().min(16).max(255), encryptedReference: z.string().trim().max(4000).optional(), allocationAmount: positiveAmount })).mutation(async ({ ctx, input }) => {
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
    recipientReview: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listRouteRecipientReview(membership.workspace.id, input.routeId);
    }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, network: mainnetNetwork.default("mainnet"), totalAmount: positiveAmount, recipientAmounts: z.array(z.object({ recipientId: z.number().int().positive(), amount: positiveAmount })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot create payment routes");
      return createPaymentRoute({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(160), token: tokenSymbol, network: mainnetNetwork.default("mainnet"), totalAmount: positiveAmount, recipientAmounts: z.array(z.object({ recipientId: z.number().int().positive(), amount: positiveAmount })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
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
    recordSubmission: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), network: mainnetNetwork, transactionHash: z.string().trim().regex(/^0x[0-9a-fA-F]+$/), status: z.literal("submitted").default("submitted"), explorerUrl: z.string().url().optional() })).mutation(async ({ ctx, input }) => {
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
      const verified = await verifyWorkspaceStarknetReceipt(membership.workspace.id, input.transactionHash);
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
      // Local Veyra sessions are not Manus Heartbeat credentials. An empty
      // session intentionally uses the project-owner scope supported by the
      // Heartbeat SDK; the callback still authenticates as a cron task UID.
      const heartbeatSession = "";
      const cron = buildPayrollCron(input.nextRunAt, input.frequency, input.timezone);
      try {
        const job = await createHeartbeatJob({ name: `veilpay-schedule-${created.id}`, cron, path: "/api/scheduled/payroll", payload: { scheduleId: created.id }, description: `VeilPay payroll trigger for schedule ${created.id}` }, heartbeatSession);
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
        const heartbeatSession = "";
        await updateHeartbeatJob(updated.scheduleCronTaskUid, { cron: buildPayrollCron(input.nextRunAt, input.frequency, input.timezone), enable: input.status === "active", description: `VeilPay payroll trigger for schedule ${updated.id}` }, heartbeatSession);
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
    insights: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      return getPrivateMarketInsights(membership.workspace.id, actorId);
    }),
    quotes: protectedProcedure.input(z.object({ marketId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listPrivateMarketQuotes(membership.workspace.id, input.marketId);
    }),
    riskPolicy: protectedProcedure.input(z.object({ marketId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return getPrivateMarketRiskPolicy(membership.workspace.id, input.marketId);
    }),
    createQuote: protectedProcedure.input(z.object({ marketId: z.number().int().positive(), providerLabel: z.string().trim().min(2).max(160), price: positiveAmount, feeBps: z.number().int().min(0).max(10000), capacity: positiveAmount, expiresAt: z.coerce.date() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can create RFQ quotes");
      return createPrivateMarketQuote({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    upsertRiskPolicy: protectedProcedure.input(z.object({ marketId: z.number().int().positive().optional(), maxBidAmount: positiveAmount, maxConcentrationPct: z.number().int().min(1).max(100), approvalThreshold: z.number().int().min(1).max(10) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin"].includes(membership.memberRole)) throw new Error("Only workspace owners and admins can change risk policy");
      return upsertPrivateMarketRiskPolicy({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    updateQuoteStatus: protectedProcedure.input(z.object({ quoteId: z.number().int().positive(), status: z.enum(["accepted", "expired", "rejected"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can update RFQ quotes");
      return updatePrivateMarketQuoteStatus({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    exportBook: protectedProcedure.input(z.object({ marketId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return exportPrivateMarketBook(membership.workspace.id, input.marketId);
    }),
    alerts: protectedProcedure.input(z.object({ marketId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      return listPrivateMarketAlerts(membership.workspace.id, input?.marketId);
    }),
    acknowledgeAlert: protectedProcedure.input(z.object({ alertId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can acknowledge alerts");
      return acknowledgePrivateMarketAlert({ workspaceId: membership.workspace.id, actorUserId: actorId, alertId: input.alertId });
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const membership = await workspaceFor(ctx);
      return listPrivateMarkets(membership.workspace.id);
    }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, network: mainnetNetwork, targetAmount: positiveAmount, bidDeadline: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can create private markets");
      return createPrivateMarket({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    updateStatus: protectedProcedure.input(z.object({ marketId: z.number().int().positive(), status: z.enum(["draft", "scheduled", "live", "reveal", "settled", "paused", "closed"]) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Only workspace operators can change market status");
      return updatePrivateMarketStatus({ workspaceId: membership.workspace.id, actorUserId: actorId, ...input });
    }),
    commitBid: protectedProcedure.input(z.object({ marketId: z.number().int().positive(), commitmentHash: z.string().trim().min(16).max(255), encryptedTerms: z.string().trim().max(4000).optional(), bidAmount: positiveAmount })).mutation(async ({ ctx, input }) => {
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
