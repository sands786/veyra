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
      'className="mt-8 grid gap-0 border-t border-white/10 sm:grid-cols-2"'
    );
    expect(homeSource).toContain(
      'className="group flex min-h-[260px] flex-col justify-between border-b border-white/10 p-5 transition-[background-color,transform] duration-200 ease-out hover:bg-white/[0.025] hover:-translate-y-0.5 focus-within:bg-white/[0.025] motion-reduce:transform-none sm:p-7 lg:p-8"'
    );
    expect((homeSource.match(/targetType:/g) ?? []).length).toBe(10);
  });

  it("does not apply circular clipping to the rectangular surface map", () => {
    expect(styleSource).not.toContain(".surface-map-card");
    expect(styleSource).not.toContain("clip-path: circle(50% at 50% 50%)");
    expect(styleSource).not.toContain("aspect-ratio: 1 / 1");
  });
});
