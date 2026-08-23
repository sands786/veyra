import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const home = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8"
);
const brand = readFileSync(
  resolve(process.cwd(), "client/src/components/VeyraBrand.tsx"),
  "utf8"
);
const demo = readFileSync(
  resolve(process.cwd(), "client/src/pages/DemoMode.tsx"),
  "utf8"
);

describe("Veyra brand cohesion", () => {
  it("keeps workspace route, audit, and receipt records in the graphite-and-vermilion sealed-record language", () => {
    expect(home).toContain("SEALED EVENT REGISTER");
    expect(home).toContain("RECEIPT VAULT");
    expect(home).toContain("border-[#F0563A]/25 bg-[#201815]");
    expect(home).toContain(
      "absolute right-0 top-0 h-8 w-8 border-b border-l border-[#F0563A]/25"
    );
  });

  it("keeps the brand lockup semantic and the Demo Mode control rail mobile-safe", () => {
    expect(brand).toContain('role="img"');
    expect(brand).toContain('aria-label="Veyra"');
    expect(demo).toContain(
      "flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end"
    );
    expect(demo).toContain("DEMO MODE / SIMULATED ONLY");
  });
});
