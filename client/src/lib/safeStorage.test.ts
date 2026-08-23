import { describe, expect, it, vi } from "vitest";
import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "./safeStorage";

describe("safe local storage boundary", () => {
  it("returns safe defaults when browser storage is unavailable", () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });

    expect(safeLocalStorageGet("missing")).toBeNull();
    expect(safeLocalStorageSet("key", "value")).toBe(false);
    expect(safeLocalStorageRemove("key")).toBe(false);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("swallows storage exceptions without changing the caller contract", () => {
    const getItem = vi.fn(() => {
      throw new Error("storage denied");
    });
    const setItem = vi.fn(() => {
      throw new Error("storage denied");
    });
    const removeItem = vi.fn(() => {
      throw new Error("storage denied");
    });
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: { getItem, setItem, removeItem } },
    });

    expect(safeLocalStorageGet("key")).toBeNull();
    expect(safeLocalStorageSet("key", "value")).toBe(false);
    expect(safeLocalStorageRemove("key")).toBe(false);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });
});
