import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

describe("public claim hardening", () => {
  it("uses the recipient allocation instead of a route-wide amount for public claim disclosure", () => {
    expect(source).toContain("allocation: routeRecipients.amount");
    expect(source).toContain("amount: row.allocation");
    expect(source).not.toContain(
      "amount: row.route.totalAmount, status: row.route.status"
    );
  });

  it("guards claim redemption with an expiry-aware conditional update inside a transaction", () => {
    expect(source).toMatch(/return db\s*\.transaction\(async\s*\(?tx\)?\s*=>/);
    expect(source).toContain("gt(claimLinks.expiresAt, now)");
    expect(source).toContain(
      'if (affectedRows !== 1) throw new Error("Claim link was already redeemed")'
    );
  });

  it("creates claim links atomically after workspace ownership validation", () => {
    const start = source.indexOf("export async function createRecipientClaimLink");
    const end = source.indexOf("export async function getPublicClaim", start);
    const block = source.slice(start, end);
    expect(block).toContain("return db.transaction(async tx =>");
    expect(block).toContain("eq(paymentRoutes.workspaceId, input.workspaceId)");
    expect(block).toContain("eq(recipients.workspaceId, input.workspaceId)");
    expect(block).toContain("await tx\n      .insert(claimLinks)");
    expect(block).toContain("await tx\n      .update(routeRecipients)");
    expect(block).toContain("await tx\n      .insert(auditEvents)");
  });
});
