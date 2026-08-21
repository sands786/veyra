# Manual Vercel frontend deployment

This repository includes a **frontend-only Vercel deployment package**. Vercel serves the Vite application and transparently proxies same-origin `/api/*` and `/manus-storage/*` requests to the verified Veyra backend already running on Manus. The database, Veyra-owned account verification, protected tRPC procedures, receipt verification, and session-signing secret remain on the managed backend.

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
3. No private backend values belong in Vercel. Veyra’s **Create account** and **Sign in** screens submit to the existing same-origin `/api/trpc` rewrite, where the managed backend hashes credentials, writes the signed HttpOnly session cookie, and enforces protected procedures. No OAuth-related Vercel variables are required.
4. Deploy a preview first. Confirm `/`, `/documentation`, and a direct deep link such as `/proof/<id>` all render the SPA.
5. Open `/sign-in`, create an account with a strong password, confirm the browser returns to the requested workspace page, then promote the verified deployment or attach a custom domain.

## 3. Veyra-owned account verification

The Vercel domain needs **no external OAuth callback allowlist**. The browser communicates only with its own origin: Vercel rewrites `/api/trpc` to the managed backend, which validates the email-and-password request, stores only a memory-hard verifier, and issues a server-signed HttpOnly session cookie.

| Verify                                         | Expected result                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Open `https://YOUR-VERCEL-DOMAIN/`             | Vite frontend loads from Vercel.                                                                                                           |
| Open `https://YOUR-VERCEL-DOMAIN/api/trpc/...` | Request is proxied to the managed Veyra backend without a browser-visible origin change.                                                   |
| Open `/sign-in`                                | The Veyra-owned account screen loads without an OAuth portal or callback.                                                                   |
| Create account or sign in                      | Vercel rewrites the same-origin tRPC request to the managed backend, which sets the authenticated Veyra session and returns to the app.   |

## 4. Deployment boundary and operational notes

Vercel is appropriate here as a CDN-hosted frontend plus reverse-proxy edge. The current application’s database and protected business logic are intentionally kept on the managed Veyra backend. Vercel’s documentation notes that Express on Vercel becomes a single function and that `express.static()` does not serve static assets; the committed deployment pattern avoids that mismatch by keeping the Vite assets on Vercel and the existing Express process on Manus. [2]

This remains a **server-side authentication architecture**: Vercel only serves the browser shell, while the managed backend receives account requests through tRPC, derives password verifiers, and issues the signed session cookie through the same-origin rewrite. Do not copy `JWT_SECRET`, `DATABASE_URL`, password verifiers, or other server credentials into the Vercel frontend project unless you intentionally migrate the entire backend to Vercel and configure its serverless function separately.

Do not cache `/api/*` responses at the Vercel edge. These routes include authenticated tRPC procedures and session-changing account requests. `vercel.json` explicitly disables external-rewrite caching for that path. [1]

If the managed backend domain changes, replace both backend destinations in `vercel.json` and deploy a preview. Do not commit any secret values into the repository. If Sign In still opens an OAuth portal, the deployment predates the Veyra-owned authentication migration; redeploy from the current revision.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel Rewrites"
[2]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
