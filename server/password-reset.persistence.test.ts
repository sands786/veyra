import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const resetBlock = dbSource.slice(
  dbSource.indexOf("export async function consumePasswordResetToken"),
  dbSource.indexOf("export function buildInitialWorkspaceIdentity")
);

describe("password-reset persistence boundary", () => {
  it("reads the Drizzle MySQL update result tuple before accepting token consumption", () => {
    expect(resetBlock).toContain("const affectedRows = Number(updated[0]?.affectedRows ?? 0);");
    expect(resetBlock).not.toContain("(updated as unknown as { affectedRows?: number }).affectedRows");
    expect(resetBlock).toContain("isNull(passwordResetTokens.usedAt)");
    expect(resetBlock).toContain("gt(passwordResetTokens.expiresAt, now)");
  });

  it("invalidates prior sessions in the same transaction after a successful token claim", () => {
    expect(resetBlock).toContain("await tx.update(users).set({ sessionVersion: sql`${users.sessionVersion} + 1` }");
    expect(resetBlock).toContain("return db.transaction(async tx =>");
  });
});
