import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const launchpad = readFileSync(
  resolve(root, "client/src/pages/Launchpad.tsx"),
  "utf8"
);
const signIn = readFileSync(
  resolve(root, "client/src/pages/SignIn.tsx"),
  "utf8"
);
const demo = readFileSync(
  resolve(root, "client/src/pages/DemoMode.tsx"),
  "utf8"
);
const main = readFileSync(resolve(root, "client/src/main.tsx"), "utf8");
const db = readFileSync(resolve(root, "server/db.ts"), "utf8");
const routers = readFileSync(resolve(root, "server/routers.ts"), "utf8");

describe("Veyra interaction contracts", () => {
  it("keeps every sidebar/dedicated destination mapped to a registered route", () => {
    for (const path of [
      'path="/launchpad"',
      'path="/demo"',
      'path="/docs"',
      'path="/private-primitives"',
      'path="/private-markets"',
      'path="/markets"',
      'path="/sign-in"',
      'path="/proof/:slug"',
      'path="/claim/:token"',
    ]) {
      expect(app).toContain(path);
    }
  });

  it("keeps critical Home actions behind their intended auth and wallet boundaries", () => {
    expect(home).toContain("if (!isAuthenticated) {");
    expect(home).toContain("if (!connected) {");
    expect(home).toContain("await handleWalletConnect();");
    expect(home).toContain("downloadAuditCsv");
    expect(home).toContain("copyProof");
    expect(home).toContain("onClick={startSignup}");
    expect(home).toContain("onClick={openWalletPicker}");
  });

  it("keeps Launchpad mutations gated and retryable", () => {
    expect(launchpad).toContain('network: "mainnet"');
    expect(launchpad).toContain("createProjectMutation.isPending");
    expect(launchpad).toContain("retryAll");
    expect(launchpad).toContain("onClick={() => ops.refetch()}");
    expect(launchpad).toContain("onClick={() => readiness.refetch()}");
  });

  it("keeps auth forms explicit and prevents accidental form submission from mode links", () => {
    expect(signIn).toContain(
      '<form className="mt-7 space-y-5" onSubmit={submit}>'
    );
    expect(signIn).toContain('<Button type="submit"');
    expect(signIn).toContain(
      'type="button" onClick={() => changeMode("forgot")}'
    );
    expect(signIn).toContain(
      'type="button" onClick={() => changeMode("register")}'
    );
  });

  it("fails closed before production route creation without configured asset or wallet support", () => {
    expect(home).toContain(
      "const tokenAddress = strk20TokenAddressForSymbol(tokenSymbol)"
    );
    expect(home).toContain(
      "const tokenDecimals = strk20TokenDecimalsForSymbol(tokenSymbol)"
    );
    expect(home).toContain(
      "This Mainnet asset is not configured for STRK20 execution."
    );
    expect(home).toContain(
      "if (!isDemoMode && stage === 1 && !wallet?.strk20InvokeTransaction)"
    );
    expect(home).toContain("if (!isDemoMode && stage >= 2)");
    expect(home).toContain("Receipt verification is required.");
    expect(home).toContain(
      "This wallet cannot submit the STRK20 Mainnet action."
    );
    expect(home).toContain(
      "Mainnet signing currently supports one recipient per route."
    );
    expect(home).toContain("decimalToScaledBigInt(");
    expect(home).toContain("tokenDecimals ?? 18");
    expect(home).toContain("selectedRecipients[0]?.walletAddress");
    expect(home).toContain("STRK20_ASSETS");
    expect(home).toContain('tokenAddress ?? ""');
  });

  it("routes workspace headers through safe storage", () => {
    expect(main).toContain("safeLocalStorageGet");
    expect(main).not.toContain(
      'localStorage.getItem("veilpay-active-workspace")'
    );
  });

  it("labels Demo Mode as local-only and provides deterministic recovery actions", () => {
    expect(demo).toContain("DEMO MODE / SIMULATED ONLY");
    expect(demo).toContain("SIMULATE ERROR");
    expect(demo).toContain("RESET");
    expect(demo).toContain("onBeforeNavigate={exitDemo}");
    expect(demo).not.toContain("window.location.reload()");
  });

  it("fails recipient mutations before writing false audit events", () => {
    for (const name of [
      "archiveRecipient",
      "updateRecipient",
      "restoreRecipient",
    ]) {
      const start = db.indexOf(`export async function ${name}`);
      const end = db.indexOf("\nexport async function ", start + 1);
      const block = db.slice(start, end === -1 ? db.length : end);
      expect(block).toContain("result[0]?.affectedRows !== 1");
      expect(block).toContain("Recipient not found in workspace");
      expect(block).toContain("db.transaction(async tx =>");
    }
  });

  it("keeps alert acknowledgement actor-attributed and workspace-scoped", () => {
    expect(routers).toContain("actorUserId: actorId, alertId: input.alertId");
    const start = db.indexOf(
      "export async function acknowledgePrivateMarketAlert"
    );
    const block = db.slice(
      start,
      db.indexOf("\nexport async function ", start + 1)
    );
    expect(block).toContain("actorUserId: number;");
    expect(block).toContain(
      "eq(privateMarketAlerts.workspaceId, input.workspaceId)"
    );
    expect(block).toContain('entityType: "private_market_alert"');
    expect(block).toContain("db.transaction(async tx =>");
  });
});
