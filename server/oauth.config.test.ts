import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra-owned authentication launch", () => {
  it("routes existing sign-in calls to the in-app account surface without an external callback", () => {
    const clientSource = fs.readFileSync(path.join(root, "client", "src", "const.ts"), "utf8");
    const appSource = fs.readFileSync(path.join(root, "client", "src", "App.tsx"), "utf8");

    expect(clientSource).toContain('`/sign-in?returnTo=${encodeURIComponent(returnTo)}`');
    expect(clientSource).not.toContain("/api/oauth/config");
    expect(clientSource).not.toContain("/api/oauth/callback");
    expect(clientSource).not.toContain("/app-auth");
    expect(appSource).toContain('<Route path="/sign-in" component={SignIn} />');
  });

  it("keeps Veyra-owned credential logic local and removes the active OAuth route registration", () => {
    const localAuthSource = fs.readFileSync(path.join(root, "server", "_core", "localAuth.ts"), "utf8");
    const serverSource = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");

    expect(localAuthSource).toContain("scryptCallback");
    expect(localAuthSource).toContain("timingSafeEqual");
    expect(localAuthSource).toContain("VEYRA_SESSION_MS");
    expect(serverSource).not.toContain("registerOAuthRoutes(app)");
    const contextSource = fs.readFileSync(path.join(root, "server", "_core", "context.ts"), "utf8");
    expect(contextSource).toContain("authenticateVeyraRequest(opts.req)");
    expect(contextSource).not.toContain("sdk.authenticateRequest");
  });
});
