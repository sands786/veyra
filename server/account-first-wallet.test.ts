import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("account-first wallet access", () => {
  it("sends explicit sign-up actions to Veyra registration rather than an external identity callback", () => {
    const authLauncher = fs.readFileSync(path.join(root, "client", "src", "const.ts"), "utf8");
    const signInPage = fs.readFileSync(path.join(root, "client", "src", "pages", "SignIn.tsx"), "utf8");

    expect(authLauncher).toContain("export const startSignup");
    expect(authLauncher).toContain("/sign-in?mode=register");
    expect(signInPage).toContain('signInParams.get("mode") === "register"');
  });

  it("hides real wallet discovery from visitors and keeps a defensive authentication boundary in the picker action", () => {
    const homePage = fs.readFileSync(path.join(root, "client", "src", "pages", "Home.tsx"), "utf8");

    expect(homePage).toContain("if (!isAuthenticated) {");
    expect(homePage).toContain("CREATE OR ACCESS A VEYRA ACCOUNT BEFORE DISCOVERING WALLETS.");
    expect(homePage).toContain("SIGN UP TO CONNECT");
    expect(homePage).toContain("{isAuthenticated && walletPickerOpen && (");
    expect(homePage).toContain("{isAuthenticated && (\n                <Button\n                  disabled={isWalletActionLocked(walletConnecting)}");
  });
});
