import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const storageProxy = readFileSync(resolve(process.cwd(), "server/_core/storageProxy.ts"), "utf8");
const viteBridge = readFileSync(resolve(process.cwd(), "server/_core/vite.ts"), "utf8");
const legacyEntry = readFileSync(resolve(process.cwd(), "server/index.ts"), "utf8");

describe("Express 5 route compatibility", () => {
  it("uses named wildcard paths for the storage proxy and SPA fallbacks", () => {
    expect(storageProxy).toContain('app.get("/manus-storage/*path"');
    expect(storageProxy).toContain("const path = req.params.path");
    expect(viteBridge).toContain('app.use("/{*path}"');
    expect(legacyEntry).toContain('app.get("/{*path}"');
  });
});
