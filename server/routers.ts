import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { parseWorkspaceId } from "./workspaceSelection";
import { resolveWorkspaceSelection } from "./workspaceResolver";
import { archiveRecipient, createPaymentRoute, updatePaymentRoute, createRecipient, ensureWorkspaceForUser, getWorkspaceForUser, listWorkspaceAuditEvents, listWorkspacesForUser, listWorkspaceRecipients, listWorkspaceRoutes, listRouteRecipientIds, getWorkspaceByIdForUser, recordBlockchainTransaction, confirmBlockchainTransaction, verifyStarknetReceipt, restoreRecipient, transitionPaymentRoute, updateRecipient } from "./db";

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
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), token: tokenSymbol, totalAmount: amount, recipientAmounts: z.array(z.object({ recipientId: z.number().int().positive(), amount })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot create payment routes");
      return createPaymentRoute({ workspaceId: membership.workspace.id, createdByUserId: actorId, ...input });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(160), token: tokenSymbol, totalAmount: amount, recipientAmounts: z.array(z.object({ recipientId: z.number().int().positive(), amount })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const membership = await workspaceFor(ctx);
      const actorId = ctx.user?.id;
      if (!actorId) throw new Error("Authentication required");
      if (!["owner", "admin", "operator"].includes(membership.memberRole)) throw new Error("Viewer access cannot edit payment routes");
      return updatePaymentRoute({ workspaceId: membership.workspace.id, routeId: input.id, actorUserId: actorId, name: input.name, token: input.token, totalAmount: input.totalAmount, recipientAmounts: input.recipientAmounts });
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
});

export type AppRouter = typeof appRouter;
