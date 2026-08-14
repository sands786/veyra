export type EditableRoute = {
  id: number;
  status: string;
  name: string;
  token: string;
  totalAmount: string;
};

export function prepareRouteEdit(route: EditableRoute, recipientIds: number[]) {
  if (route.status !== "draft") {
    return {
      editable: false as const,
      message: `Only draft routes can be edited; this route is already ${route.status}.`,
    };
  }

  return {
    editable: true as const,
    routeId: route.id,
    name: route.name,
    token: route.token,
    totalAmount: route.totalAmount,
    recipientIds: [...recipientIds],
  };
}
