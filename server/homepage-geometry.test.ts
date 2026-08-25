import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const homeSource = fs.readFileSync(
  path.resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8"
);
const styleSource = fs.readFileSync(
  path.resolve(process.cwd(), "client/src/index.css"),
  "utf8"
);

describe("homepage surface geometry", () => {
  it("keeps all canonical surface shapes assigned in the system map", () => {
    expect(homeSource).toContain('shape: "capsule"');
    expect(homeSource).toContain('shape: "circle"');
    expect(homeSource).toContain('shape: "hexagon"');
    expect(homeSource).toContain('shape: "pentagon"');
    expect(homeSource).toContain('shape: "angled"');
    expect(homeSource).toContain('shape: "triangle"');
  });

  it("defines reusable geometric silhouettes for the surface cards", () => {
    expect(styleSource).toContain(".surface-map-card--capsule");
    expect(styleSource).toContain(".surface-map-card--circle");
    expect(styleSource).toContain(".surface-map-card--hexagon");
    expect(styleSource).toContain(".surface-map-card--pentagon");
    expect(styleSource).toContain(".surface-map-card--angled");
    expect(styleSource).toContain(".surface-map-card--triangle");
    expect(styleSource).toContain("clip-path: polygon");
  });
});
