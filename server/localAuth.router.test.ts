import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "@shared/const";

const dbMocks = vi.hoisted(() => ({
  createLocalAccount: vi.fn(),
  getLocalAccountByEmail: vi.fn(),
  touchUserLastSignedIn: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  createLocalOpenId: vi.fn((email: string) => `local_${email}`),
  createVeyraSessionToken: vi.fn(async (openId: string) => `session-${openId}`),
  hashAccountPassword: vi.fn(async () => "scrypt$16384$8$1$fake$verifier"),
  normalizeAccountEmail: vi.fn((email: string) => email.trim().toLowerCase()),
  verifyAccountPassword: vi.fn(async () => true),
  VEYRA_SESSION_MS: 2_592_000_000,
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

vi.mock("./_core/localAuth", async () => {
  const actual = await vi.importActual<typeof import("./_core/localAuth")>("./_core/localAuth");
  return { ...actual, ...authMocks };
});

import { appRouter } from "./routers";

const user = {
  id: 91,
  openId: "local_operator",
  name: "Veyra Operator",
  email: "operator@veyra.test",
  loginMethod: "veyra-password",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: {} },
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }), clearCookie: () => undefined },
    } as TrpcContext,
    cookies,
  };
}

describe("Veyra-owned auth router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createLocalAccount.mockResolvedValue(user);
    dbMocks.getLocalAccountByEmail.mockResolvedValue({ account: { passwordHash: "scrypt$16384$8$1$fake$verifier" }, user });
    dbMocks.touchUserLastSignedIn.mockResolvedValue(undefined);
    authMocks.verifyAccountPassword.mockResolvedValue(true);
  });

  it("registers a normalized local account and emits the server-issued session cookie", async () => {
    const { ctx, cookies } = context();
    const result = await appRouter.createCaller(ctx).auth.register({ name: "Veyra Operator", email: " Operator@Veyra.Test ", password: "correct horse battery staple" });

    expect(result).toEqual({ id: user.id, openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, role: user.role });
    expect(dbMocks.createLocalAccount).toHaveBeenCalledWith(expect.objectContaining({ email: "operator@veyra.test", passwordHash: "scrypt$16384$8$1$fake$verifier" }));
    expect(cookies).toEqual([expect.objectContaining({ name: COOKIE_NAME, value: "session-local_operator", options: expect.objectContaining({ httpOnly: true, secure: true, maxAge: authMocks.VEYRA_SESSION_MS }) })]);
  });

  it("rejects invalid credentials without emitting a session and avoids user-existence disclosure", async () => {
    authMocks.verifyAccountPassword.mockResolvedValue(false);
    const { ctx, cookies } = context();
    await expect(appRouter.createCaller(ctx).auth.signIn({ email: "operator@veyra.test", password: "correct horse battery staple" })).rejects.toThrow("Invalid email or password");
    expect(cookies).toEqual([]);
  });

  it("signs in a verified Veyra account and refreshes its activity timestamp", async () => {
    const { ctx, cookies } = context();
    const result = await appRouter.createCaller(ctx).auth.signIn({ email: "operator@veyra.test", password: "correct horse battery staple" });

    expect(result).toEqual({ id: user.id, openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, role: user.role });
    expect(dbMocks.touchUserLastSignedIn).toHaveBeenCalledWith(user.id);
    expect(cookies[0]).toMatchObject({ name: COOKIE_NAME, value: "session-local_operator" });
  });
});
