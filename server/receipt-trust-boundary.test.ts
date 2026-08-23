import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const routers = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const db = readFileSync(resolve(root, "server/db.ts"), "utf8");

describe("receipt trust boundary", () => {
  it("accepts only submitted status when recording a transaction hash", () => {
    const start = routers.indexOf("recordSubmission:");
    const end = routers.indexOf("\n    }),", start);
    const block = routers.slice(start, end === -1 ? routers.length : end);

    expect(block).toContain('status: z.literal("submitted").default("submitted")');
    expect(block).not.toContain('z.enum(["submitted", "confirmed", "reverted", "unknown"])');
  });

  it("keeps the persistence helper limited to unverified submissions", () => {
    const start = db.indexOf("export async function recordBlockchainTransaction");
    const end = db.indexOf("\nexport async function ", start + 1);
    const block = db.slice(start, end === -1 ? db.length : end);

    expect(block).toContain('status: "submitted";');
    expect(block).not.toContain('input.status === "confirmed"');
    expect(block).not.toContain('status: "settled"');
  });

  it("routes confirmation through receipt verification before lifecycle mutation", () => {
    const start = routers.indexOf("confirm: protectedProcedure");
    const end = routers.indexOf("\n  }),\n  schedules:", start);
    const block = routers.slice(start, end === -1 ? routers.length : end);

    expect(block.indexOf("verifyWorkspaceStarknetReceipt")).toBeGreaterThan(-1);
    expect(block.indexOf("verifyWorkspaceStarknetReceipt")).toBeLessThan(
      block.indexOf("confirmBlockchainTransaction")
    );
  });
});
