import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra glass-interface presentation layer", () => {
  it("defines shared glass surfaces without changing product network or auth contracts", () => {
    const styles = fs.readFileSync(path.join(root, "client", "src", "index.css"), "utf8");
    const home = fs.readFileSync(path.join(root, "client", "src", "pages", "Home.tsx"), "utf8");

    expect(styles).toContain("Veyra glass system: presentation-only surfaces shared across every route.");
    expect(styles).toContain("backdrop-filter: blur(20px) saturate(118%);");
    expect(styles).toContain(".min-h-screen[class*=\"bg-[#111210]\"]");
    expect(home).toContain('const selectedNetwork = "mainnet" as const;');
    expect(home).toContain(
      "WALLET ACTIONS APPEAR AFTER WORKSPACE CONTEXT IS AVAILABLE."
    );
    expect(home).not.toContain("SIGN UP TO CONNECT");
  });

  it("keeps the Launchpad access gate wired to the established workspace boundary", () => {
    const launchpad = fs.readFileSync(path.join(root, "client", "src", "pages", "Launchpad.tsx"), "utf8");

    expect(launchpad).toContain("PRIVATE ROOM / ACCESS GATE");
    expect(launchpad).toContain("WORKSPACE CONTEXT REQUIRED");
    expect(launchpad).not.toContain("onClick={startLogin}");
    expect(launchpad).toContain("PUBLIC: PROJECT STATE / SHIELDED: CONTRIBUTORS, ALLOCATIONS, AND GOVERNANCE EVIDENCE");
  });
});
