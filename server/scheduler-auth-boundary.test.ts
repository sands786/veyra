import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const routersSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const heartbeatSource = readFileSync(
  resolve(root, "server/_core/heartbeat.ts"),
  "utf8",
);

describe("scheduler authentication boundary", () => {
  it("does not pass the local Veyra cookie into Heartbeat job calls", () => {
    expect(routersSource).toContain('const heartbeatSession = "";');
    expect(routersSource).not.toContain(
      'parseCookieHeader(ctx.req.headers.cookie ?? "")[COOKIE_NAME]',
    );
  });

  it("keeps empty heartbeat sessions on the documented project-owner path", () => {
    expect(heartbeatSource).toContain(
      'if (userSession) {\n    headers["x-manus-user-session"] = userSession;\n  }',
    );
  });
});
