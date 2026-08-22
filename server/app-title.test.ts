import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra application title", () => {
  it("serves the configured title from the app endpoint", async () => {
    const response = await fetch("http://localhost:3000/");
    expect(response.ok).toBe(true);
    const html = await response.text();
    expect(html).toContain("Veyra");
  });

  it("does not ship an unresolved Vite title placeholder", () => {
    const html = fs.readFileSync(path.join(root, "client", "index.html"), "utf8");
    expect(html).toContain("Veyra — Private Financial Coordination on Starknet");
    expect(html).not.toContain("%VITE_APP_TITLE%");
  });
});
