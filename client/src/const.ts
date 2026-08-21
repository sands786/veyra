export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Existing sign-in calls retain this stable helper, but Veyra now opens its own
// credential screen rather than relying on an external OAuth callback allowlist.
export const startLogin = () => {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
};
