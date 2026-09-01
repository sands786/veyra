import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("account-first wallet access", () => {
  it("keeps the internal registration launcher separate from external identity callbacks", () => {
    const authLauncher = fs.readFileSync(
      path.join(root, "client", "src", "const.ts"),
      "utf8"
    );
    const signInPage = fs.readFileSync(
      path.join(root, "client", "src", "pages", "SignIn.tsx"),
      "utf8"
    );

    expect(authLauncher).toContain("export const startSignup");
    expect(authLauncher).toContain("/sign-in?mode=register");
    expect(signInPage).toContain('signInParams.get("mode") === "register"');
  });

  it("lets visitors open wallet discovery while keeping a defensive authentication boundary for workspace actions", () => {
    const homePage = fs.readFileSync(
      path.join(root, "client", "src", "pages", "Home.tsx"),
      "utf8"
    );

    expect(homePage).toContain("if (!isAuthenticated) {");
    expect(homePage).toContain(
      "WALLET ACTIONS APPEAR AFTER WORKSPACE CONTEXT IS AVAILABLE."
    );
    expect(homePage).not.toContain("SIGN UP TO CONNECT");
    expect(homePage).toContain("{walletPickerOpen && (");
    expect(homePage).not.toContain("{isAuthenticated && walletPickerOpen && (");
    expect(homePage).toContain("if (!isAuthenticated) {");
    expect(homePage).toContain("disabled={isWalletActionLocked(walletConnecting)}");
  });
});
