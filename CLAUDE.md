# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint validation
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
```

## Tech Stack

- **Next.js 14** (App Router) + **React 18** + **Tailwind CSS 3.4**
- **Supabase** — PostgreSQL database, auth, and Row-Level Security
- **TanStack React Query v5** — client-side data fetching and cache
- **Zod v4** — input validation schemas
- **Upstash Redis** — rate limiting (60 req/min per IP, sliding window)
- **Recharts** — financial charts
- **Vitest** + React Testing Library — unit tests in `/tests/`

## Architecture

### Route Structure

```
app/
  (auth)/          # Login, register pages
  (dashboard)/     # Protected layout + pages: dashboard, transactions,
                   # accounts, categories, credit-cards, invoices, reports
  api/             # Server-side route handlers
```

### Data Flow

1. **React component** → custom hook (`/hooks/use*.ts`) → `fetch` to `/api/*`
2. **API route** → CSRF check → rate limit → auth verify → Zod validation → Supabase query → `{ data, error }` response
3. **TanStack Query** caches results; mutations invalidate related queries on success

All API responses follow the contract: `{ data: T | null, error: string | null }`.

### Key Patterns

- **Authentication:** `middleware.ts` guards all `/(dashboard)` routes via Supabase SSR cookies. All API routes independently call `supabase.auth.getUser()`.
- **CSRF:** Origin header validated for all mutating requests (POST/PATCH/PUT/DELETE).
- **Supabase clients:** `lib/supabase/client.ts` (browser) vs `lib/supabase/server.ts` (server/API routes). Always use the server client in API routes.
- **Soft deletes:** Transactions are marked with `deleted_at`; never physically deleted.
- **Query invalidation:** Transaction mutations invalidate `['transactions']`, `['accounts']`, and `['dashboard']` keys. Account mutations invalidate `['accounts']` and `['dashboard']`.
- **Validation schemas:** Live in `/lib/validations/`. Reused in both API routes and frontend forms.
- **Domain logic:** Invoice calculations and installment logic isolated in `/lib/domain/`.

### Important Configuration

- `next.config.mjs` has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — TypeScript and ESLint errors do not fail the Vercel build.
- Security headers (CSP, HSTS, X-Frame-Options) are set in `next.config.mjs`.
- TypeScript path alias: `@/*` maps to the repository root.
