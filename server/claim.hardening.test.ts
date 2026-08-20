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
});
