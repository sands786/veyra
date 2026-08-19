import { describe, expect, it } from "vitest";
import { documentationChapters, documentationProductSurfaces, documentationRoute, documentationTeaserAsset, documentationVideoGuides } from "@shared/documentation";

const veyraVideoCdnPattern = /^https:\/\/files\.manuscdn\.com\/user_upload_by_module\/session_file\/\d+\/[A-Za-z0-9]+\.mp4$/;

describe("documentation contract", () => {
  it("covers the complete product guide structure", () => {
    expect(documentationRoute).toBe("/docs");
    expect(documentationChapters).toEqual(["overview", "why", "product", "privacy", "starknet", "demo"]);
    expect(documentationProductSurfaces).toEqual(["Private payroll", "Operations + treasury", "Private claims", "Launchpad governance"]);
  });

  it("uses the published Veyra cinematic teaser asset", () => {
    expect(documentationTeaserAsset).toMatch(veyraVideoCdnPattern);
  });

  it("maps every standalone function video to a published Veyra guide asset", () => {
    expect(documentationVideoGuides).toHaveLength(8);
    expect(new Set(documentationVideoGuides.map((guide) => guide.id)).size).toBe(8);
    expect(documentationVideoGuides.every((guide) => veyraVideoCdnPattern.test(guide.asset))).toBe(true);
    expect(documentationVideoGuides.every((guide) => guide.purpose.length > 40 && guide.boundary.length > 40)).toBe(true);
  });
});
