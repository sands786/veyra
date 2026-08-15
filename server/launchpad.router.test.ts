import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getWorkspaceForUser: vi.fn(),
  getWorkspaceByIdForUser: vi.fn(),
  ensureWorkspaceForUser: vi.fn(),
  listLaunchpadAllocations: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const user = {
  id: 42,
  openId: "launchpad-router-test",
  name: "Launchpad Test",
  email: "test@example.com",
  loginMethod: "test",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const workspace = { id: 7, name: "Private workspace", slug: "private-workspace-42", ownerUserId: 42, approvalThreshold: 1, createdAt: new Date(), updatedAt: new Date() };

describe("Launchpad router authorization and privacy boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getWorkspaceByIdForUser.mockResolvedValue(undefined);
    dbMocks.ensureWorkspaceForUser.mockResolvedValue(workspace);
    dbMocks.getWorkspaceForUser.mockResolvedValue({ workspace, memberRole: "viewer" });
    dbMocks.listLaunchpadAllocations.mockResolvedValue([{ id: 1, commitment: "cm-0123456789abcdef", allocationAmount: "1000", status: "reserved", createdAt: new Date(), claimedAt: null, encryptedReference: "secret-ref", claimedWalletAddress: "0xdeadbeef" }]);
  });

  it("rejects project-operations writes for viewer members", async () => {
    const caller = appRouter.createCaller(context(user));
    await expect(caller.launchpad.updateProjectOps({ projectId: 9, ownerLabel: "Owner", roundType: "community", stage: "planning", riskLevel: "medium", readinessOverride: "none" })).rejects.toThrow("Only workspace operators can update project operations");
  });

  it("rejects release requests for viewer members", async () => {
    const caller = appRouter.createCaller(context(user));
    await expect(caller.launchpad.requestRelease({ projectId: 9, milestoneId: 4, requestedAmount: "1000", reason: "Evidence attached" })).rejects.toThrow("Only workspace operators can request releases");
  });

  it("passes only the resolved workspace id into allocation retrieval", async () => {
    const caller = appRouter.createCaller(context(user));
    const result = await caller.launchpad.allocations({ projectId: 9 });
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("encryptedReference");
    expect(result[0]).not.toHaveProperty("claimedWalletAddress");
    expect(dbMocks.listLaunchpadAllocations).toHaveBeenCalledWith(7, 9);
  });
});
