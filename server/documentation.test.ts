import { describe, expect, it } from "vitest";
import { documentationChapters, documentationProductSurfaces, documentationRoute, documentationTeaserAsset } from "@shared/documentation";

describe("documentation contract", () => {
  it("covers the complete product guide structure", () => {
    expect(documentationRoute).toBe("/docs");
    expect(documentationChapters).toEqual(["overview", "why", "product", "privacy", "starknet", "demo"]);
    expect(documentationProductSurfaces).toEqual(["Private payroll", "Operations + treasury", "Private claims", "Launchpad governance"]);
  });

  it("uses the lifecycle-safe uploaded teaser asset", () => {
    expect(documentationTeaserAsset).toMatch(/^\/manus-storage\/veilpay-coming-soon-teaser-with-music_[a-z0-9]+\.mp4$/);
  });
});
