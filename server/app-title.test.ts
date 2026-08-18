import { describe, expect, it } from "vitest";

describe("Veyra application title", () => {
  it("serves the configured title from the app endpoint", async () => {
    const response = await fetch("http://localhost:3000/");
    expect(response.ok).toBe(true);
    const html = await response.text();
    expect(html).toContain("Veyra");
  });
});
