# Sentinel Dashboard

Sentinel Prime command center at [dashboard.sentinelprime.org](https://dashboard.sentinelprime.org).

Built on the [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) Next.js template with Sentinel Prime branding and integrations.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview — MRR, subscribers, products, pending approvals, Legion health |
| `/scout` | Scout approval queue |
| `/lister` | Lister draft management |
| `/market` | Medusa product management |
| `/stripe` | Pricing, coupons, flash deals, revenue |
| `/legion` | Service health, WoL, Uptime Kuma |
| `/invest` | AI signals, watchlist, paper portfolio (auth required) |
| `/settings` | Password, API keys, deploy hook |

## Auth

Default master password: `sentinelprime2026` (stored in localStorage after login).

## Setup

```bash
cp .env.local.example .env.local
# Fill in API keys
npm install
npm run dev
```

## Deploy (Netlify)

1. Push to `Lordsleezy/sentinel-dashboard`
2. Connect repo in Netlify
3. Set environment variables from `.env.local.example`
4. Add DNS: `dashboard.sentinelprime.org` CNAME → your Netlify site

### Scout / Lister tunnel DNS (required for HTTPS)

In Cloudflare DNS for `sentinelprime.org`, add proxied CNAMEs:

| Name | Target |
|------|--------|
| `scout` | `bc6619f8-db74-488e-9a4f-6f063f71d78e.cfargotunnel.com` |
| `lister` | `bc6619f8-db74-488e-9a4f-6f063f71d78e.cfargotunnel.com` |

Or run: `CF_API_TOKEN=xxx node scripts/add-scout-lister-dns.mjs`

## Required API Keys

- `SUPABASE_SERVICE_ROLE_KEY` — Scout/Lister pending counts and tables
- `STRIPE_SECRET_KEY` — MRR, payments, pricing, coupons
- `GITHUB_TOKEN` — Pricing file commits to Lordsleezy/sentinelprime
- `NETLIFY_DEPLOY_HOOK` — Redeploy sentinelprime.org after price changes
- `WOL_MAC_ADDRESS` — Legion MAC for Wake-on-LAN (e.g. `9c:5a:44:46:e1:80`)
- `DASHBOARD_API_TOKEN` — Bearer token for protected API routes (shutdown)
- `LEGION_SSH_HOST` / `LEGION_SSH_USER` / `LEGION_SSH_PASSWORD` — Remote shutdown
