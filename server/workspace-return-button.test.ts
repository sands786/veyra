import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const sharedControl = readFileSync(
  resolve(root, "client/src/components/WorkspaceReturnButton.tsx"),
  "utf8"
);
const surfaces = [
  "PrivateMarkets.tsx",
  "Launchpad.tsx",
  "PrivatePrimitives.tsx",
  "Documentation.tsx",
  "DemoMode.tsx",
  "Claim.tsx",
  "Proof.tsx",
].map((file) => [
  file,
  readFileSync(resolve(root, "client/src/pages", file), "utf8"),
] as const);


describe("workspace-return navigation consistency", () => {
  it("keeps the shared control client-side, accessible, and aligned with the reference treatment", () => {
    expect(sharedControl).toContain('setLocation("/")');
    expect(sharedControl).toContain('aria-label="Back to workspace"');
    expect(sharedControl).toContain("BACK TO WORKSPACE");
    expect(sharedControl).toContain("ArrowUpRight");
    expect(sharedControl).toContain("focus-visible:ring-2");
  });

  it("uses the shared control on every dedicated Veyra surface", () => {
    for (const [file, source] of surfaces) {
      expect(source, file).toContain(
        'import { WorkspaceReturnButton } from "@/components/WorkspaceReturnButton";'
      );
      expect(source, file).toContain("<WorkspaceReturnButton");
    }
  });

  it("removes the legacy surface-specific return labels", () => {
    const combined = surfaces.map(([, source]) => source).join("\n");
    expect(combined).not.toContain("BACK TO PAYROLL");
    expect(combined).not.toContain("← VEYRA WORKSPACE");
    expect(combined).not.toContain("EXIT DEMO");
    expect(readFileSync(resolve(root, "client/src/components/UnavailableBoundary.tsx"), "utf8")).not.toContain("RETURN TO VEYRA");
  });
});
