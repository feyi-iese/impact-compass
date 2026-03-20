# Security Notes

This project contains a public web client (`web`) and static pages content.

## Secret Handling

- Never commit `.env` files.
- Only commit `.env.example` with placeholder values.
- `VITE_*` variables are embedded in the browser bundle and are public by design.
- Do **not** use Supabase `service_role` keys in frontend code or client env files.

## Supabase Safety Requirements

- Keep Row Level Security (RLS) enabled on all public tables.
- Grant only minimum privileges needed for `anon` and `authenticated`.
- Prefer insert-only patterns for anonymous forms; block public reads unless needed.
- Treat form endpoints as public and assume abuse attempts.

## Deployment Checklist

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in hosting provider secrets.
- Verify production env does not include `service_role` keys.
- Re-run `npm audit` before release.
- Confirm no secrets are tracked:
  - `git ls-files | rg -i "\\.env|secret|token|key"`
- Confirm redirect and SPA routing files are present (`web/public/_redirects`).

## MVP Anti-Abuse (Low Friction)

- Keep email uniqueness constraints on waitlist tables.
- Add basic server-side logging/monitoring for anomalous insert spikes.
- If abuse appears, add bot protection (Cloudflare Turnstile/hCaptcha) to forms.

### Monitoring Queries (Supabase SQL Editor)

Use these lightweight checks during MVP:

```sql
-- Waitlist submissions in the last 24h by hour
select
  date_trunc('hour', created_at) as hour,
  count(*) as submissions
from public.waitlist
where created_at >= now() - interval '24 hours'
group by 1
order by 1 desc;

-- Top domains in waitlist emails (basic spam pattern check)
select
  split_part(lower(email), '@', 2) as domain,
  count(*) as c
from public.waitlist
group by 1
order by c desc
limit 20;
```

## Reporting

If you discover a vulnerability, do not open a public issue with exploit details.
Share findings privately with the repository owner and include reproduction steps,
impact, and suggested remediation.
