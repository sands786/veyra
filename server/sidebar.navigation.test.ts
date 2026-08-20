import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra sidebar navigation", () => {
  it("assigns distinct semantic icons to the closely related control-rail destinations", () => {
    const homePage = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Home.tsx"),
      "utf8"
    );

    expect(homePage).toContain(
      "<KeyRound size={16} /> <span>Identity keys</span>"
    );
    expect(homePage).toContain(
      "<Workflow size={16} /> <span>Operations</span>"
    );
    expect(homePage).toContain(
      "<Blocks size={16} /> <span>Private primitives</span>"
    );
    expect(homePage).toContain(
      "<LineChart size={16} /> <span>Private markets</span>"
    );
    expect(homePage).not.toContain(
      "<Fingerprint size={16} /> <span>Private primitives</span>"
    );
  });

  it("uses a deliberate control-rail hierarchy for sidebar group labels and route states", () => {
    const navigationStyles = fs.readFileSync(
      path.join(root, "client", "src", "index.css"),
      "utf8"
    );

    expect(navigationStyles).toContain(".nav-group-label::before");
    expect(navigationStyles).toContain(".nav-group-label::after");
    expect(navigationStyles).toContain(".nav-item:hover {");
    expect(navigationStyles).toContain("transform: translateX(2px);");
    expect(navigationStyles).toContain(".nav-item-active::before");
    expect(navigationStyles).toContain(".nav-item:focus-visible");
  });
});
