import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("new-account workspace bootstrap", () => {
  it("creates the workspace and owner membership atomically with explicit compatible defaults", () => {
    const databaseSource = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");

    expect(databaseSource).toContain("return await db.transaction(async (tx) => {");
    expect(databaseSource).toContain('defaultToken: "USDC"');
    expect(databaseSource).toContain('network: "mainnet"');
    expect(databaseSource).toContain("approvalThreshold: 1");
    expect(databaseSource).toContain('.values({ workspaceId, userId, role: "owner" })');
  });

  it("does not expose raw database SQL when bootstrap fails", () => {
    const databaseSource = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");

    expect(databaseSource).toContain("Your private workspace could not be initialized. Select Retry to try again.");
  });
});
