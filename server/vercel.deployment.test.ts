import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("manual Vercel frontend deployment package", () => {
  it("keeps the Vite client on Vercel while proxying authenticated backend routes", () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(root, "vercel.json"), "utf8")
    ) as {
      framework: string;
      outputDirectory: string;
      rewrites: Array<{ source: string; destination: string }>;
      headers: Array<{
        source: string;
        headers: Array<{ key: string; value: string }>;
      }>;
    };

    expect(config.framework).toBe("vite");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toContainEqual({
      source: "/api/:path*",
      destination: "https://veilpay-spri-t4knu9mv.manus.space/api/:path*",
    });
    expect(config.rewrites).toContainEqual({
      source: "/manus-storage/:path*",
      destination:
        "https://veilpay-spri-t4knu9mv.manus.space/manus-storage/:path*",
    });
    expect(
      config.rewrites.some(rewrite =>
        rewrite.source.includes("?!api/|manus-storage/")
      )
    ).toBe(true);
    expect(config.headers[0]).toEqual({
      source: "/api/:path*",
      headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }],
    });
  });

  it("documents the safe client-only environment boundary and Veyra-owned authentication path", () => {
    const envExample = fs.readFileSync(
      path.join(root, ".env.vercel.example"),
      "utf8"
    );
    const guide = fs.readFileSync(
      path.join(root, "docs", "VERCEL_DEPLOYMENT.md"),
      "utf8"
    );

    expect(envExample).toContain("need no Vercel");
    expect(envExample).not.toContain("VITE_APP_ID=");
    expect(envExample).not.toContain("VITE_OAUTH_PORTAL_URL=");
    expect(envExample).not.toContain("JWT_SECRET=");
    expect(envExample).not.toContain("DATABASE_URL=");
    expect(guide).toContain("no external OAuth callback allowlist");
    expect(guide).toContain("Veyra-owned account verification");
  });
});
