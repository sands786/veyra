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
const veyraManagedTeaserPattern =
  /^\/manus-storage\/veyra-30s-logo-led-stable-teaser_[a-z0-9]+\.mp4$/;
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
    expect(documentationTeaserAsset).toMatch(veyraManagedTeaserPattern);
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
    expect(documentationPage).toContain("controls");
    expect(documentationPage).toContain("playsInline");
    expect(documentationPage).toContain('preload="metadata"');
    expect(readme).not.toContain("<video controls");
    expect(readme).toContain("[![Open Film 01");
    expect(readme).toContain("[![Open Film 00");
    expect(readme).toContain(
      "https://veilpay-spri-t4knu9mv.manus.space/documentation#overview"
    );
  });

  it("keeps film metadata legible below the desktop breakpoint and supplies accessible navigation motion", () => {
    const documentationPage = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Documentation.tsx"),
      "utf8"
    );

    expect(documentationPage).toContain(
      "mt-5 space-y-4 border-t border-white/10 pt-5"
    );
    expect(documentationPage).not.toContain("sm:grid-cols-[1fr_auto]");
    expect(documentationPage).toContain(
      "focus-visible:ring-2 focus-visible:ring-[#6DE3A1]"
    );
    expect(documentationPage).toContain("active:scale-[0.985]");
    expect(documentationPage).toContain("group-hover:translate-x-1");
  });

  it("keeps the public teaser viewing room free of redundant production metadata", () => {
    const homePage = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Home.tsx"),
      "utf8"
    );

    expect(homePage).toContain("See the boundary.");
    expect(homePage).not.toContain(">Format<");
    expect(homePage).not.toContain(">Audio<");
    expect(homePage).not.toContain(">Motion<");
    expect(homePage).not.toContain(">Original score<");
    expect(homePage).toContain(documentationTeaserAsset);
  });
});
