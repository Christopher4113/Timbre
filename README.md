# Timbre

Teach AI how you communicate once, then take your voice everywhere. See `instructions.md` for scope and build order, `docs/brand-guidelines.md` for brand.

## Setup

The Next.js app lives in `client/`.

```bash
cd client
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
pnpm db:migrate              # applies drizzle/ migrations to Neon
pnpm dev
```

Without `RESEND_API_KEY`, magic links print to the dev server console.

| Script | What |
|---|---|
| `pnpm test` | Vitest (renderer snapshots, proxy auth gate) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | New migration from `lib/db/schema.ts` |

## Security model

- **Route protection, two layers.** `client/proxy.ts` bounces any request without a session cookie (pages redirect to `/?signin=1`, API returns 401). It is only an optimistic check. The real check is `client/lib/session.ts`: `requireConsentedUser()` in the `(app)` layout and `apiUser()` in every route handler validate the session in Postgres and the consent version.
- **Public routes:** `/`, `/api/auth/*`, `/api/webhooks/*` (HMAC verified), `/api/inngest` (signing key verified).
- **Rate limits.** Auth endpoints use Better Auth's limiter with database storage (magic link: 3 per 10 min per IP). Model-spending endpoints call `apiUser("generate" | "profileBuild" | "signedUrl")`, an atomic per-user fixed-window counter in the `ai_usage` table. Limits live in `client/lib/rate-limit.ts`.
- **SQL injection.** All DB access goes through Drizzle in `client/lib/db/queries.ts`, which parameterizes every value. Never use `sql.raw()` or string-built SQL with user input. Validate request bodies with Zod before they reach queries.
- **Data scoping.** Every query function takes `userId`. Route handlers never query tables directly.
- **Headers.** HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer, mic limited to same origin (`client/next.config.ts`).
