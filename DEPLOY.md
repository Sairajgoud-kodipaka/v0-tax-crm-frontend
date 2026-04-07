# Deploying to Vercel (Tax CRM)

## Secrets and environment variables

**Never commit** `.env.local` or paste secrets into `vercel.json`, GitHub Actions logs, or client-side code.

| Variable | Where to set (Vercel) | Exposed to browser? |
|----------|------------------------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | Yes (by design) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Production + Preview | Yes — this is Supabase **anon** / publishable key; security is **RLS**, not hiding this key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview only | **No** — server-only. Do **not** add `NEXT_PUBLIC_` prefix |
| `NEXT_PUBLIC_APP_URL` | Production = `https://your-domain.vercel.app` (or custom domain) | Yes |
| `ALLOW_MVP_MANUAL_PAYMENT` | Optional, server | No |

In the Vercel dashboard: **Project → Settings → Environment Variables**. Use the same names as in `.env.example`.

## Deploy steps

1. Push the repo to GitHub/GitLab/Bitbucket (without `.env*.local`).
2. **Import** the repo in Vercel; it will detect Next.js.
3. Add the variables above for **Production** (and **Preview** if you want preview deployments to work).
4. Deploy. Run **Redeploy** after changing env vars.

## Optional

- **Supabase**: Auth → URL configuration: add your Vercel URL to **Site URL** / **Redirect URLs** if you use email links or OAuth.
- **Branch protection**: deploy `main` to Production; use Preview for PRs.
