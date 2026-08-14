import { describe, expect, it } from "vitest";
import { prepareRouteEdit } from "./routeEdit";

describe("prepareRouteEdit", () => {
  const route = { id: 7, status: "draft", name: "March payroll", token: "USDC", totalAmount: "2840" };

  it("restores the persisted draft fields and recipient assignments", () => {
    expect(prepareRouteEdit(route, [11, 14])).toEqual({
      editable: true,
      routeId: 7,
      name: "March payroll",
      token: "USDC",
      totalAmount: "2840",
      recipientIds: [11, 14],
    });
  });

  it("returns an explicit gate for non-draft routes", () => {
    expect(prepareRouteEdit({ ...route, status: "settled" }, [11])).toEqual({
      editable: false,
      message: "Only draft routes can be edited; this route is already settled.",
    });
  });
});
