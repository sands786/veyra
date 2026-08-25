import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const clientSourceFiles = [
  "client/src/pages/Home.tsx",
  "client/src/pages/Launchpad.tsx",
  "client/src/pages/PrivateMarkets.tsx",
  "client/src/pages/PrivatePrimitives.tsx",
  "client/src/pages/SignIn.tsx",
  "client/src/components/DashboardLayout.tsx",
];

const visibleAuthControlPattern = />\s*(?:SIGN IN|SIGN UP|SIGN OUT|Sign in|Sign up|Sign out|LOG IN|LOG OUT|Log in|Log out)(?:\s*<|\s*$)/m;

function readClientSources() {
  return clientSourceFiles.map(file => ({
    file,
    source: fs.readFileSync(path.join(root, file), "utf8"),
  }));
}

describe("visible authentication controls", () => {
  it("does not render sign-in, sign-up, or sign-out labels in user-facing surfaces", () => {
    for (const { file, source } of readClientSources()) {
      expect(source, file).not.toMatch(visibleAuthControlPattern);
    }
  });

  it("keeps the protected session boundary and internal access launcher available", () => {
    const home = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Home.tsx"),
      "utf8"
    );
    const launchpad = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Launchpad.tsx"),
      "utf8"
    );
    const privateMarkets = fs.readFileSync(
      path.join(root, "client", "src", "pages", "PrivateMarkets.tsx"),
      "utf8"
    );

    expect(home).toContain("const { user, loading, error, isAuthenticated } = useAuth();");
    expect(home).toContain("startLogin();");
    expect(launchpad).toContain("const { isAuthenticated } = useAuth();");
    expect(privateMarkets).toContain("const { isAuthenticated } = useAuth();");
  });
});
