# Impact Compass (web)

React + Vite SPA for volunteer onboarding, opportunity feed, and waitlist.

## Supabase setup

1. Create a project in [Supabase](https://supabase.com/dashboard).
2. In **SQL Editor**, run the full script in [`schema.sql`](./schema.sql) (or run it in order if you already applied earlier sections — new tables are at the bottom: `onboarding_submissions`, `opportunities`, and seed `INSERT`).
3. Copy environment variables:
   - **Project Settings → API** → Project URL and `anon` `public` key.
4. In this folder:

   ```bash
   cp .env.example .env
   ```

   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

Without these variables, the app still runs: onboarding saves to **localStorage**, the feed uses **seed data**, and waitlist signup shows a clear configuration error.

With Supabase configured:

- **Waitlist** (`/waitlist`) → `waitlist` table  
- **Organizer form** (home → “I’m an organizer”) → `org_interests` table  
- **Onboarding submit** → `onboarding_submissions` (anonymous insert)  
- **Feed / opportunity detail** → `opportunities` table when rows exist; otherwise falls back to [`src/lib/seedData.js`](./src/lib/seedData.js)

### Waitlist insert fails (401 / RLS error `42501`)

The browser often shows **401** even when the real issue is **row-level security** (message like `new row violates row-level security policy for table "waitlist"`).

1. The app **does not** call `.select()` after waitlist insert, because **SELECT** on `waitlist` is intentionally denied for `anon` (only the dashboard can read rows). If you still use an old build that chained `.select()`, upgrade or rebuild.
2. Confirm **Project Settings → API** uses the **`anon` `public`** key in `.env` (not the `service_role` key).
3. In **SQL Editor**, run [`supabase_rls_fix.sql`](./supabase_rls_fix.sql) if inserts are still blocked: it recreates the waitlist **insert** policy for `anon` / `authenticated`, adds grants, and creates **`org_interests`** if missing.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

---

This template originally included generic Vite + React notes; see [Vite docs](https://vite.dev) for ESLint/React Compiler options.
