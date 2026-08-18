import { describe, expect, it } from "vitest";
import { milestoneSteps, privateClaimDemoPath, privatePrimitiveEvidenceNote, privatePrimitiveIds, privatePrimitiveLabels } from "@shared/privatePrimitives";

describe("private primitives contract", () => {
  it("keeps the three StarkWare-inspired primitives addressable", () => {
    expect(privatePrimitiveIds).toEqual(["links", "proofs", "milestones"]);
    expect(privatePrimitiveLabels.links).toBe("PRIVATE LINKS");
    expect(privatePrimitiveLabels.proofs).toBe("SELECTIVE PROOF");
    expect(privatePrimitiveLabels.milestones).toBe("MILESTONE RELEASES");
  });

  it("preserves the evidence-first milestone lifecycle", () => {
    expect(milestoneSteps).toEqual(["PREPARE", "FUND", "EVIDENCE", "RESOLVE"]);
    expect(milestoneSteps.indexOf("EVIDENCE")).toBeLessThan(milestoneSteps.indexOf("RESOLVE"));
  });

  it("keeps demo links and network evidence boundaries explicit", () => {
    expect(privateClaimDemoPath).toMatch(/^\/claim\//);
    expect(privatePrimitiveEvidenceNote("sepolia")).toContain("no mainnet proof");
    expect(privatePrimitiveEvidenceNote("mainnet")).toContain("wallet approval");
  });
});
