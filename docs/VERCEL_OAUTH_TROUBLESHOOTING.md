# Vercel authentication migration record

## Retired OAuth blocker

The earlier Vercel deployment relied on a Manus OAuth callback origin. That was an external deployment blocker because `https://veyra-gamma-gold.vercel.app/api/oauth/callback` required approval in a Manus allowlist.

That external callback dependency is no longer part of the active Veyra authentication path.

Veyra now serves an application-owned `/sign-in` screen. Registration and sign-in use the existing same-origin `/api/trpc` rewrite; the managed backend derives a memory-hard password verifier, issues the signed HttpOnly session cookie, and retains the existing protected tRPC authorization boundary.

The frontend no longer needs Vite OAuth variables, an OAuth portal URL, a callback handler, or an allowlisted redirect origin. The only Vercel requirement is that its existing `/api/*` rewrite target remains the managed Veyra backend.

## Deployment verification

Deploy the current revision, then verify:

| Verify | Expected result |
| --- | --- |
| `https://YOUR-VERCEL-DOMAIN/sign-in` | Veyra’s native credential screen loads with no browser redirect. |
| **Create account** | The same-origin tRPC request completes, then returns to the requested Veyra route with a server-issued session. |
| Refresh a protected workspace page | The session remains valid through the HttpOnly cookie and workspace procedures remain authenticated. |
| **Sign out** | The session cookie clears and protected tRPC procedures no longer receive a user. |

No Vercel secret or `VITE_*` authentication variable is required for this flow. A fresh deployment is required only to serve the new client bundle.

## Security boundary

Veyra follows a server-side credential boundary: the browser submits account credentials only through the same-origin tRPC rewrite; the managed backend derives and stores a password verifier, writes the signed session cookie, and protects tRPC procedures. In the supported deployment split, **Vercel serves the Vite frontend and rewrites `/api/*` to the managed Veyra Express backend**. That managed backend owns `JWT_SECRET`, `DATABASE_URL`, and password verification; no private credential is embedded in the Vercel client.

Adding backend secrets to a static Vercel project does not add an Express backend and is not required for Veyra-owned authentication. The existing Vercel-plus-managed-backend pattern remains the supported path; no external callback approval is required.
