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

describe("homepage circular surface geometry", () => {
  it("assigns the circular silhouette to every canonical surface", () => {
    const circleAssignments = homeSource.match(/shape: "circle"/g) ?? [];

    expect(circleAssignments).toHaveLength(10);
    expect(homeSource).not.toContain('shape: "capsule"');
    expect(homeSource).not.toContain('shape: "hexagon"');
    expect(homeSource).not.toContain('shape: "pentagon"');
    expect(homeSource).not.toContain('shape: "angled"');
    expect(homeSource).not.toContain('shape: "triangle"');
  });

  it("keeps every surface datum inside a clipped circular boundary", () => {
    expect(styleSource).toContain(".surface-map-card {");
    expect(styleSource).toContain("aspect-ratio: 1 / 1");
    expect(styleSource).toContain("border-radius: 50% !important");
    expect(styleSource).toContain("clip-path: circle(50% at 50% 50%) !important");
    expect(styleSource).toContain("overflow: hidden");
    expect(styleSource).toContain("max-width: 10rem");
  });
});
