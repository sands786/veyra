import { describe, expect, it } from "vitest";
import { parseWorkspaceId } from "./workspaceSelection";

describe("parseWorkspaceId", () => {
  it("accepts a positive integer workspace ID", () => {
    expect(parseWorkspaceId("12")).toBe(12);
  });

  it("accepts the first value from a repeated header", () => {
    expect(parseWorkspaceId(["9", "10"])).toBe(9);
  });

  it("rejects missing, zero, negative, and malformed values", () => {
    expect(parseWorkspaceId(undefined)).toBeNull();
    expect(parseWorkspaceId("0")).toBeNull();
    expect(parseWorkspaceId("-2")).toBeNull();
    expect(parseWorkspaceId("workspace")).toBeNull();
  });
});
