import { UnavailableBoundary } from "@/components/UnavailableBoundary";

export default function NotFound() {
  return <UnavailableBoundary eyebrow="ROUTE RESOLUTION / 404" title="This Veyra room is unavailable." description="The address does not resolve to a public workspace surface. It may be mistyped, moved, or intentionally restricted." evidence="NO WORKSPACE, RECIPIENT, CLAIM, OR PRIVATE MARKET DATA WAS DISCLOSED" />;
}
