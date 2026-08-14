import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("VeilPay workspace boundaries", () => {
  it("returns no user for the public auth query when signed out", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("rejects malformed recipient wallet addresses before database work", async () => {
    const caller = appRouter.createCaller(
      context({
        id: 42,
        openId: "workspace-test",
        name: "Workspace Test",
        email: "test@example.com",
        loginMethod: "test",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }),
    );
    await expect(caller.recipients.create({ displayName: "Bad wallet", walletAddress: "not-a-starknet-address" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
