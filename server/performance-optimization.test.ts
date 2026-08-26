import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra smooth-operation delivery contracts", () => {
  it("keeps secondary routes lazy without a visible loading interruption", () => {
    const app = fs.readFileSync(
      path.join(root, "client", "src", "App.tsx"),
      "utf8"
    );

    expect(app).toContain(
      'const Launchpad = lazy(() => import("./pages/Launchpad"));'
    );
    expect(app).toContain(
      'const Documentation = lazy(() => import("./pages/Documentation"));'
    );
    expect(app).toContain("<Suspense fallback={null}>");
    expect(app).not.toContain("RouteLoadingBoundary");
    expect(app).not.toContain("Preparing your private workspace…");
  });

  it("keeps wallet action serialization lightweight and keeps product videos metadata-only", () => {
    const adapter = fs.readFileSync(
      path.join(root, "client", "src", "lib", "strk20.ts"),
      "utf8"
    );
    const home = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Home.tsx"),
      "utf8"
    );
    const docs = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Documentation.tsx"),
      "utf8"
    );

    expect(adapter).not.toContain('from "starknet"');
    expect(adapter).toContain("function bigintToHex(value: bigint)");
    expect(adapter).toContain("buildShieldedRouteActions");
    expect(home).toContain('preload="metadata"');
    expect(docs).toContain('preload="metadata"');
  });

  it("keeps product exits client-side to prevent white navigation flashes", () => {
    const app = fs.readFileSync(
      path.join(root, "client", "src", "App.tsx"),
      "utf8"
    );
    const demo = fs.readFileSync(
      path.join(root, "client", "src", "pages", "DemoMode.tsx"),
      "utf8"
    );
    const docs = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Documentation.tsx"),
      "utf8"
    );
    const primitives = fs.readFileSync(
      path.join(root, "client", "src", "pages", "PrivatePrimitives.tsx"),
      "utf8"
    );
    const sharedReturnButton = fs.readFileSync(
      path.join(
        root,
        "client",
        "src",
        "components",
        "WorkspaceReturnButton.tsx"
      ),
      "utf8"
    );

    for (const source of [app, demo, docs, primitives]) {
      expect(source).not.toContain('window.location.href = "/"');
      expect(source).not.toContain("window.location.reload()");
    }
    expect(app).toContain("const [, setLocation] = useLocation();");
    expect(docs).toContain("const [, setLocation] = useLocation();");
    expect(sharedReturnButton).toContain(
      "const [, setLocation] = useLocation();"
    );
    expect(sharedReturnButton).toContain('setLocation("/")');
  });

  it("fails closed when a wallet does not prove the requested Starknet network", () => {
    const adapter = fs.readFileSync(
      path.join(root, "client", "src", "lib", "strk20.ts"),
      "utf8"
    );

    expect(adapter).toContain("if (!detected || detected !== network) {");
    expect(adapter).toContain("networkCompatible: walletNetwork === network");
    expect(adapter).toContain("const strk20Ready = Boolean(");
    expect(adapter).toContain(
      "wallet?.strk20InvokeTransaction || wallet?.request"
    );
    expect(adapter).toContain(
      "canExecute: strk20Ready && walletNetwork === network"
    );
  });
});
