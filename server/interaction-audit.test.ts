import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const launchpad = readFileSync(resolve(root, "client/src/pages/Launchpad.tsx"), "utf8");
const signIn = readFileSync(resolve(root, "client/src/pages/SignIn.tsx"), "utf8");
const demo = readFileSync(resolve(root, "client/src/pages/DemoMode.tsx"), "utf8");


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
    expect(home).toContain('onClick={startSignup}');
    expect(home).toContain('onClick={openWalletPicker}');
  });

  it("keeps Launchpad mutations gated and retryable", () => {
    expect(launchpad).toContain('network: "mainnet"');
    expect(launchpad).toContain("createProjectMutation.isPending");
    expect(launchpad).toContain("retryAll");
    expect(launchpad).toContain("onClick={() => ops.refetch()}");
    expect(launchpad).toContain("onClick={() => readiness.refetch()}");
  });

  it("keeps auth forms explicit and prevents accidental form submission from mode links", () => {
    expect(signIn).toContain('<form className="mt-7 space-y-5" onSubmit={submit}>');
    expect(signIn).toContain('<Button type="submit"');
    expect(signIn).toContain('type="button" onClick={() => changeMode("forgot")}');
    expect(signIn).toContain('type="button" onClick={() => changeMode("register")}');
  });

  it("labels Demo Mode as local-only and provides deterministic recovery actions", () => {
    expect(demo).toContain("DEMO MODE / SIMULATED ONLY");
    expect(demo).toContain("SIMULATE ERROR");
    expect(demo).toContain("RESET");
    expect(demo).toContain("onBeforeNavigate={exitDemo}");
    expect(demo).not.toContain('window.location.reload()');
  });
});
