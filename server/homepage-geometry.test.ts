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

describe("homepage rectangular surface geometry", () => {
  it("keeps the ten-surface institutional map in its stable rectangular grid", () => {
    expect(homeSource).toContain(
      'className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3"'
    );
    expect(homeSource).toContain(
      'className="group flex min-h-[260px] flex-col justify-between bg-[#151D21] p-5 transition-colors hover:bg-[#1B2930] sm:p-6"'
    );
    expect((homeSource.match(/targetType:/g) ?? []).length).toBe(10);
  });

  it("does not apply circular clipping to the rectangular surface map", () => {
    expect(styleSource).not.toContain(".surface-map-card");
    expect(styleSource).not.toContain("clip-path: circle(50% at 50% 50%)");
    expect(styleSource).not.toContain("aspect-ratio: 1 / 1");
  });
});
