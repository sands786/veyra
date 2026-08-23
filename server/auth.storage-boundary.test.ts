import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const authHook = readFileSync(
  resolve(process.cwd(), "client/src/_core/hooks/useAuth.ts"),
  "utf8",
);

describe("auth storage boundary", () => {
  it("does not write authenticated user data to localStorage during render", () => {
    expect(authHook).not.toContain("veyra-runtime-user-info");
    expect(authHook).not.toContain("localStorage.setItem");
  });

  it("keeps session cleanup scoped to logout", () => {
    expect(authHook).toContain('sessionStorage.removeItem("veyra-session")');
    expect(authHook).toContain("finally");
  });
});
