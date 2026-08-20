import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  documentationChapters,
  documentationProductSurfaces,
  documentationRoute,
  documentationTeaserAsset,
  documentationVideoGuides,
} from "@shared/documentation";

const veyraVideoCdnPattern =
  /^https:\/\/files\.manuscdn\.com\/user_upload_by_module\/session_file\/\d+\/[A-Za-z0-9]+\.mp4$/;
const root = path.resolve(import.meta.dirname, "..");

describe("documentation contract", () => {
  it("covers the complete product guide structure", () => {
    expect(documentationRoute).toBe("/docs");
    expect(documentationChapters).toEqual([
      "overview",
      "why",
      "product",
      "privacy",
      "starknet",
      "demo",
    ]);
    expect(documentationProductSurfaces).toEqual([
      "Private payroll",
      "Operations + treasury",
      "Private claims",
      "Launchpad governance",
    ]);
  });

  it("uses the published Veyra cinematic teaser asset", () => {
    expect(documentationTeaserAsset).toMatch(veyraVideoCdnPattern);
  });

  it("maps every standalone function video to a published Veyra guide asset", () => {
    expect(documentationVideoGuides).toHaveLength(8);
    expect(new Set(documentationVideoGuides.map(guide => guide.id)).size).toBe(
      8
    );
    expect(
      documentationVideoGuides.every(guide =>
        veyraVideoCdnPattern.test(guide.asset)
      )
    ).toBe(true);
    expect(
      documentationVideoGuides.every(
        guide => guide.purpose.length > 40 && guide.boundary.length > 40
      )
    ).toBe(true);
  });

  it("keeps native player controls in the Veyra Documentation room while making README films visible on GitHub", () => {
    const documentationPage = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Documentation.tsx"),
      "utf8"
    );
    const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

    expect(documentationPage).toContain("documentationVideoGuides.map");
    expect(documentationPage).toContain(
      'controls playsInline preload="metadata"'
    );
    expect(readme).not.toContain("<video controls");
    expect(readme).toContain("[![Open Film 01");
    expect(readme).toContain("[![Open Film 00");
    expect(readme).toContain(
      "https://veilpay-spri-t4knu9mv.manus.space/documentation#overview"
    );
  });
});
