# Manual Vercel frontend deployment

This repository includes a **frontend-only Vercel deployment package**. Vercel serves the Vite application and transparently proxies same-origin `/api/*` and `/manus-storage/*` requests to the verified Veyra backend already running on Manus. The database, protected tRPC procedures, OAuth exchange, receipt verification, and platform-managed credentials remain on the managed backend.

> The configuration deliberately does **not** move the Veyra backend, `DATABASE_URL`, `JWT_SECRET`, or Manus-managed service credentials into Vercel. Treat those as server-only infrastructure.

## 1. What the included files do

| Repository file                                 | Purpose                                                                                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`vercel.json`](../vercel.json)                 | Builds `dist/public`, proxies authenticated `/api/*` and storage requests to the Manus backend, disables rewrite caching for API responses, and preserves Vite SPA fallback routing. |
| [`.env.vercel.example`](../.env.vercel.example) | Safe public Vite build-time environment template. It intentionally contains no secret.                                                                                               |
| `pnpm build:vercel`                             | Runs the existing Vite client build only. It does not package the Express server for Vercel.                                                                                         |

The frontend already calls `/api/trpc` with same-origin credentials. The external rewrites preserve that contract, so no client API URL change is required. Vercel’s rewrite mechanism keeps the browser URL unchanged while proxying the request upstream. [1]

## 2. Deploy from GitHub

1. Open [Vercel New Project](https://vercel.com/new) and import `sands786/veyra`.
2. Confirm the root directory is the repository root. The committed [`vercel.json`](../vercel.json) selects the Vite framework, `pnpm install --frozen-lockfile`, `pnpm build:vercel`, and `dist/public` output.
3. No private backend values belong in Vercel. The frontend now obtains the non-secret OAuth launch configuration from `/api/oauth/config` through the existing same-origin rewrite. The optional public `VITE_APP_ID` and `VITE_OAUTH_PORTAL_URL` values in [`.env.vercel.example`](../.env.vercel.example) may be used together as build-time overrides, but are not required for the documented Vercel-plus-Manus deployment.
4. Deploy a preview first. Confirm `/`, `/documentation`, and a direct deep link such as `/proof/<id>` all render the SPA.
5. Promote the verified deployment or attach a custom domain only after completing the OAuth-origin step below.

## 3. Required Manus OAuth origin step

The client constructs its redirect dynamically as:

```text
https://YOUR-VERCEL-DOMAIN/api/oauth/callback
```

Before testing sign-in, register both the production Vercel domain and any preview domain you intend to use as allowed redirect origins for the Manus application. The callback continues to execute on the managed Veyra backend through the `/api/oauth/callback` rewrite; this preserves the existing state nonce validation and host-scoped session cookie flow.

| Verify                                         | Expected result                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Open `https://YOUR-VERCEL-DOMAIN/`             | Vite frontend loads from Vercel.                                                                                                           |
| Open `https://YOUR-VERCEL-DOMAIN/api/trpc/...` | Request is proxied to the managed Veyra backend without a browser-visible origin change.                                                   |
| Select **Sign in**                             | The browser reads public launch configuration through `/api/oauth/config`, then opens the Manus OAuth portal with the Vercel callback URI. |
| Complete sign-in                               | OAuth returns to `https://YOUR-VERCEL-DOMAIN/api/oauth/callback`, the session is established, and the browser returns to `/`.              |

## 4. Deployment boundary and operational notes

Vercel is appropriate here as a CDN-hosted frontend plus reverse-proxy edge. The current application’s database and protected business logic are intentionally kept on the managed Veyra backend. Vercel’s documentation notes that Express on Vercel becomes a single function and that `express.static()` does not serve static assets; the committed deployment pattern avoids that mismatch by keeping the Vite assets on Vercel and the existing Express process on Manus. [2]

Do not cache `/api/*` responses at the Vercel edge. These routes include authenticated tRPC procedures and session-changing OAuth callbacks. `vercel.json` explicitly disables external-rewrite caching for that path. [1]

If the managed backend domain changes, replace both backend destinations in `vercel.json`, deploy a preview, then repeat the OAuth redirect-origin review. Do not commit any secret values into the repository. If Sign In opens `undefined/app-auth`, the deployment predates the runtime configuration fallback or was built without both optional Vite OAuth variables; redeploy from the current revision.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel Rewrites"
[2]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
