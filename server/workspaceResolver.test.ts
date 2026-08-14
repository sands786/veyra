import { describe, expect, it } from "vitest";
import { resolveWorkspaceSelection } from "./workspaceResolver";

describe("resolveWorkspaceSelection", () => {
  const primary = { workspace: { id: 1 }, memberRole: "owner" };
  const secondary = { workspace: { id: 2 }, memberRole: "operator" };

  it("honors a selected workspace only when membership lookup returns it", async () => {
    const result = await resolveWorkspaceSelection(
      2,
      async (id) => (id === 2 ? secondary : undefined),
      async () => primary,
      async () => primary,
    );
    expect(result).toEqual(secondary);
  });

  it("falls back to the default accessible workspace for an unauthorized ID", async () => {
    const result = await resolveWorkspaceSelection(
      999,
      async () => undefined,
      async () => primary,
      async () => secondary,
    );
    expect(result).toEqual(primary);
  });

  it("bootstraps only when no accessible workspace exists", async () => {
    const result = await resolveWorkspaceSelection(
      null,
      async () => undefined,
      async () => undefined,
      async () => secondary,
    );
    expect(result).toEqual(secondary);
  });
});
