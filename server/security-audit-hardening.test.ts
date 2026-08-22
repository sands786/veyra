import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("security audit hardening contracts", () => {
  it("does not expose raw scheduled-payroll errors to callers", () => {
    const source = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");
    expect(source).toContain('error: "scheduled-payroll-failed"');
    expect(source).toContain("requestId");
    expect(source).toContain('console.error("[Scheduled payroll] execution failed"');
    expect(source).not.toContain("error: String(error)");
  });

  it("blocks cross-site browser mutations before tRPC", () => {
    const source = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");
    expect(source).toContain('app.use("/api/trpc", (req, res, next) =>');
    expect(source).toContain('fetchSite === "cross-site"');
    expect(source).toContain('const forwardedHost = String(req.headers["x-forwarded-host"] || "")');
    expect(source).toContain('const expectedHost = forwardedHost || req.headers.host;');
    expect(source).toContain('process.env.TRUSTED_BROWSER_ORIGINS || "https://veyra-gamma-gold.vercel.app"');
    expect(source).toContain('!originIsTrustedProxy');
    expect(source).toContain('error: "cross-site-request-blocked"');
  });

  it("requires a confirmed receipt reference before public proof creation", () => {
    const source = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    const start = source.indexOf("export async function createShareableProof");
    const end = source.indexOf("export async function getPublicProof", start);
    const block = source.slice(start, end);
    expect(block).toContain("Public proofs require a confirmed receipt reference");
    expect(block).toContain("route[0].proofReference?.trim()");
  });

  it("uses a transaction and current-state guard for launchpad release decisions", () => {
    const source = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    const start = source.indexOf("export async function decideLaunchpadReleaseRequest");
    const end = source.indexOf("export async function listWorkspaceLaunchpadProjects", start);
    const block = source.slice(start, end);
    expect(block).toContain("db.transaction(async tx =>");
    expect(block).toContain("canAdvanceLaunchpadReleaseStatus");
    expect(block).toContain("eq(launchpadReleaseRequests.status, current.status)");
  });

  it("keeps route editing and blockchain lifecycle writes transaction-scoped", () => {
    const source = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    for (const name of ["updatePaymentRoute", "recordBlockchainTransaction", "confirmBlockchainTransaction"]) {
      const start = source.indexOf(`export async function ${name}`);
      const end = source.indexOf("\nexport async function ", start + 1);
      const block = source.slice(start, end === -1 ? source.length : end);
      expect(block).toContain("db.transaction(async tx =>");
    }
  });
});
