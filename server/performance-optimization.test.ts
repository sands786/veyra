import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra smooth-operation delivery contracts", () => {
  it("defers secondary routes behind a branded Suspense boundary", () => {
    const app = fs.readFileSync(path.join(root, "client", "src", "App.tsx"), "utf8");

    expect(app).toContain('const Launchpad = lazy(() => import("./pages/Launchpad"));');
    expect(app).toContain('const Documentation = lazy(() => import("./pages/Documentation"));');
    expect(app).toContain("<Suspense fallback={<RouteLoadingBoundary />}>");
    expect(app).toContain("Preparing your private workspace…");
  });

  it("keeps wallet action serialization lightweight and keeps product videos metadata-only", () => {
    const adapter = fs.readFileSync(path.join(root, "client", "src", "lib", "strk20.ts"), "utf8");
    const home = fs.readFileSync(path.join(root, "client", "src", "pages", "Home.tsx"), "utf8");
    const docs = fs.readFileSync(path.join(root, "client", "src", "pages", "Documentation.tsx"), "utf8");

    expect(adapter).not.toContain('from "starknet"');
    expect(adapter).toContain("function bigintToHex(value: bigint)");
    expect(adapter).toContain("buildShieldedRouteActions");
    expect(home).toContain('preload="metadata"');
    expect(docs).toContain('preload="metadata"');
  });

  it("fails closed when a wallet does not prove the requested Starknet network", () => {
    const adapter = fs.readFileSync(path.join(root, "client", "src", "lib", "strk20.ts"), "utf8");

    expect(adapter).toContain("if (!detected || detected !== network) {");
    expect(adapter).toContain("networkCompatible: walletNetwork === network");
    expect(adapter).toContain("canExecute: Boolean(wallet?.strk20InvokeTransaction) && walletNetwork === network");
  });
});
