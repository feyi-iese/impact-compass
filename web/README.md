# Impact Compass (web)

React + Vite SPA for volunteer onboarding, role-based dashboards, organizer event management, and waitlist.

## Supabase setup

1. Create a project in [Supabase](https://supabase.com/dashboard).
2. In **SQL Editor**, run [`schema.sql`](./schema.sql).
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
- **Onboarding submit** → `onboarding_submissions` (anonymous insert) + profile updates after auth
- **Magic-link auth** (`/auth`) → Supabase Auth OTP flow
- **Volunteer dashboard** (`/dashboard/volunteer`) → `profiles` + `event_signups`
- **Organizer dashboard** (`/dashboard/organizer`) → `organizations` + `events` + signup metrics
- **Feed / opportunity detail** → `events` when rows exist; otherwise falls back to [`src/lib/seedData.js`](./src/lib/seedData.js)

### Common DB/RLS fixup

The browser often shows **401** even when the real issue is **row-level security** (message like `new row violates row-level security policy for table "waitlist"`).

1. Confirm **Project Settings → API** uses the **`anon` `public`** key in `.env` (not `service_role`).
2. In **SQL Editor**, run [`supabase_rls_fix.sql`](./supabase_rls_fix.sql) if any insert/select policies are blocked. It includes waitlist, organizer, organizations, events, event signups, and reminder queue policies.

### Auth setup (magic links)

In Supabase dashboard:

- **Authentication → URL Configuration**
  - Site URL: your deployed app URL (or `http://localhost:5173` for local)
  - Additional redirect URLs: include local + prod auth callback URLs
- **Authentication → Providers → Email**
  - Enable email OTP / magic link.

### Reminder function setup (MVP)

Edge function source:

- [`supabase/functions/send-reminders/index.ts`](./supabase/functions/send-reminders/index.ts)

Deploy and schedule:

1. Deploy function with Supabase CLI:
   - `supabase functions deploy send-reminders`
2. Add secret:
  - `SUPABASE_SERVICE_ROLE_KEY` (function runtime)
  - `RESEND_API_KEY` (function runtime)
  - `RESEND_FROM_EMAIL` (verified sender/domain in Resend)
  - optional: `RESEND_REPLY_TO`
3. Schedule (hourly) in dashboard or CLI to call the function endpoint.

The current implementation sends reminder emails through Resend. You still need to deploy the function, add the secrets above, and schedule it to run.

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
