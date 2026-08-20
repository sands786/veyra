import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Veyra brand cohesion", () => {
  it("keeps workspace route, audit, and receipt records in the graphite-and-vermilion sealed-record language", () => {
    expect(home).toContain("SEALED EVENT REGISTER");
    expect(home).toContain("RECEIPT VAULT");
    expect(home).toContain("border-[#F0563A]/25 bg-[#201815]");
    expect(home).toContain("absolute right-0 top-0 h-8 w-8 border-b border-l border-[#F0563A]/25");
  });
});
