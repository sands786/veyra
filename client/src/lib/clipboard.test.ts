import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

describe("copyText", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns true when the browser clipboard accepts the value", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(copyText("proof://VP-019")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("proof://VP-019");
  });

  it("returns false when clipboard access is unavailable or rejected", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } });
    await expect(copyText("proof://VP-019")).resolves.toBe(false);
    vi.stubGlobal("navigator", {});
    await expect(copyText("proof://VP-019")).resolves.toBe(false);
  });
});
