import { describe, expect, it } from "vitest";
import { documentationChapters, documentationProductSurfaces, documentationRoute, documentationTeaserAsset, documentationVideoGuides } from "@shared/documentation";

describe("documentation contract", () => {
  it("covers the complete product guide structure", () => {
    expect(documentationRoute).toBe("/docs");
    expect(documentationChapters).toEqual(["overview", "why", "product", "privacy", "starknet", "demo"]);
    expect(documentationProductSurfaces).toEqual(["Private payroll", "Operations + treasury", "Private claims", "Launchpad governance"]);
  });

  it("uses the lifecycle-safe uploaded teaser asset", () => {
    expect(documentationTeaserAsset).toMatch(/^\/manus-storage\/veilpay-coming-soon-teaser-with-music_[a-z0-9]+\.mp4$/);
  });

  it("maps every standalone function video to a safe storage asset", () => {
    expect(documentationVideoGuides).toHaveLength(8);
    expect(new Set(documentationVideoGuides.map((guide) => guide.id)).size).toBe(8);
    expect(documentationVideoGuides.every((guide) => guide.asset.startsWith("/manus-storage/") && guide.asset.endsWith(".mp4"))).toBe(true);
    expect(documentationVideoGuides.every((guide) => guide.purpose.length > 40 && guide.boundary.length > 40)).toBe(true);
  });
});
