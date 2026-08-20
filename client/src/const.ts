import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

type PublicOAuthLaunchConfig = {
  appId: string;
  oauthPortalUrl: string;
};

const isPublicOAuthLaunchConfig = (
  value: unknown
): value is PublicOAuthLaunchConfig => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.appId === "string" &&
    candidate.appId.length > 0 &&
    typeof candidate.oauthPortalUrl === "string" &&
    candidate.oauthPortalUrl.length > 0
  );
};

async function resolveOAuthLaunchConfig(): Promise<PublicOAuthLaunchConfig> {
  const appId = import.meta.env.VITE_APP_ID;
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;

  if (appId && oauthPortalUrl) return { appId, oauthPortalUrl };

  const response = await fetch("/api/oauth/config", {
    cache: "no-store",
    credentials: "same-origin",
  });
  const config: unknown = await response.json();

  if (!response.ok || !isPublicOAuthLaunchConfig(config)) {
    throw new Error("OAuth launch configuration is unavailable.");
  }

  return config;
}

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = async () => {
  let config: PublicOAuthLaunchConfig;
  try {
    config = await resolveOAuthLaunchConfig();
  } catch (error) {
    console.error("[OAuth] Failed to load public launch configuration", error);
    window.alert(
      "Sign in is not configured for this deployment yet. Please retry after the OAuth configuration is available."
    );
    return;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${config.oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", config.appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};
