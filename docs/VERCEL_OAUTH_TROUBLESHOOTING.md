# Vercel OAuth Troubleshooting

## Verified failure mode

The Vercel deployment at `https://veyra-gamma-gold.vercel.app` successfully rewrites `GET /api/oauth/callback` to the managed Veyra backend: a callback request without OAuth parameters returns the expected `400 {"error":"code and state are required"}` response.

The deployed client bundle, however, was built without the public Vite OAuth variables. Its Sign In launcher resolves to `new URL("undefined/app-auth")` and sends an undefined `appId`. This prevents the button from launching the Manus OAuth portal.

The managed Veyra backend was separately verified to return valid non-secret `appId` and `oauthPortalUrl` values from `GET /api/oauth/config`. The current repair makes the Vercel client use that same-origin route whenever optional Vite OAuth variables are absent.

The Vercel deployment was then rechecked and confirmed to serve the repaired client bundle: it contains the `/api/oauth/config` fallback and no longer contains the prior `undefined/app-auth` launch string. A Vercel title placeholder can remain visible when optional presentation variables are absent; it does not affect the OAuth launch path.

## Required correction

Set both values in the Vercel project’s environment variables for **Production**, **Preview**, and **Development**, then redeploy from a clean build:

| Variable                | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `VITE_OAUTH_PORTAL_URL` | Base URL of the Manus OAuth portal used by the browser to launch sign-in. |
| `VITE_APP_ID`           | Veyra’s Manus OAuth application identifier passed to the portal.          |

Because Vite embeds `VITE_*` values during the build, changing the optional Vercel variables has no effect until a fresh deployment is created. The runtime fallback also requires a fresh deployment so the browser receives the current Sign In launcher.

## Architecture alignment

Veyra already follows the security boundary of a full-stack OAuth application: the browser begins authentication, while the server exchanges the authorization code, validates state, writes the signed session cookie, and protects tRPC procedures. In the supported deployment split, **Vercel serves the Vite frontend and rewrites `/api/*` to the managed Manus Express backend**. That managed backend owns `JWT_SECRET`, `DATABASE_URL`, `OAUTH_SERVER_URL`, and the OAuth exchange; no private credential is embedded in the Vercel client.

Adding those server-only variables to a static Vercel project does not add an Express backend and cannot allow an unregistered redirect domain. A separate full-stack Vercel server deployment would still require the same callback-origin approval, in addition to independently configured database and session secrets. The current Vercel-plus-Manus pattern is therefore the correct path for Veyra unless the backend is intentionally migrated off Manus.

## Callback requirement

After the Vercel production URL is known, register this exact callback in the Manus application’s allowed redirect origins:

```text
https://veyra-gamma-gold.vercel.app/api/oauth/callback
```

The Vercel rewrite keeps the browser origin on Vercel while forwarding the callback and API requests to the managed Veyra backend.
