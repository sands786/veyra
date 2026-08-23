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

    expect(block).toContain(
      'status: z.literal("submitted").default("submitted")'
    );
    expect(block).not.toContain(
      'z.enum(["submitted", "confirmed", "reverted", "unknown"])'
    );
  });

  it("keeps the persistence helper limited to unverified submissions", () => {
    const start = db.indexOf(
      "export async function recordBlockchainTransaction"
    );
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

  it("permits recovery only through a server-verified receipt before recording", () => {
    const start = routers.indexOf("recoverSubmission:");
    const end = routers.indexOf("\n    }),", start);
    const block = routers.slice(start, end === -1 ? routers.length : end);

    expect(block).toContain("recoverBlockchainTransaction");
    expect(db).toContain("export async function recoverBlockchainTransaction");
    const recoveryStart = db.indexOf(
      "export async function recoverBlockchainTransaction"
    );
    const recoveryEnd = db.indexOf(
      "\nexport async function ",
      recoveryStart + 1
    );
    const recovery = db.slice(
      recoveryStart,
      recoveryEnd === -1 ? db.length : recoveryEnd
    );
    expect(recovery.indexOf("verifyStarknetReceipt")).toBeGreaterThan(-1);
    expect(recovery.indexOf("verifyStarknetReceipt")).toBeLessThan(
      recovery.indexOf("recordBlockchainTransaction")
    );
  });

  it("makes repeated route creation and submission recording retry-safe", () => {
    const routeStart = db.indexOf("export async function createPaymentRoute");
    const routeEnd = db.indexOf("\nexport async function ", routeStart + 1);
    const route = db.slice(routeStart, routeEnd === -1 ? db.length : routeEnd);
    const transactionStart = db.indexOf(
      "export async function recordBlockchainTransaction"
    );
    const transactionEnd = db.indexOf(
      "\nexport async function ",
      transactionStart + 1
    );
    const transaction = db.slice(
      transactionStart,
      transactionEnd === -1 ? db.length : transactionEnd
    );

    expect(route).toContain("clientRequestId?: string;");
    expect(route).toContain(
      "eq(paymentRoutes.clientRequestId, input.clientRequestId)"
    );
    expect(transaction).toContain('action: "transaction_submitted"');
    expect(transaction).toContain('set({ status: "routed" })');
  });
});
