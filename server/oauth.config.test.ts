import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Vercel OAuth launch configuration", () => {
  it("exposes only the public launch configuration through the managed backend", () => {
    const oauthSource = fs.readFileSync(
      path.join(root, "server", "_core", "oauth.ts"),
      "utf8"
    );

    expect(oauthSource).toContain('app.get("/api/oauth/config"');
    expect(oauthSource).toContain(
      "res.json({ appId: ENV.appId, oauthPortalUrl: ENV.oAuthPortalUrl })"
    );
    expect(oauthSource).toContain('res.set("Cache-Control", "no-store")');
  });

  it("uses the same-origin OAuth configuration endpoint when Vite variables are absent", () => {
    const clientSource = fs.readFileSync(
      path.join(root, "client", "src", "const.ts"),
      "utf8"
    );

    expect(clientSource).toContain('fetch("/api/oauth/config"');
    expect(clientSource).toContain('credentials: "same-origin"');
    expect(clientSource).toContain(
      "const redirectUri = `${window.location.origin}/api/oauth/callback`"
    );
  });
});
