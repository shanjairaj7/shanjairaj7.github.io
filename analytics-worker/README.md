# Made for More analytics

This is the private analytics service behind the Made for More website. It uses Cloudflare Workers and D1. It records anonymous visitor journeys immediately and stores registration details only after the visitor agrees to the form consent text.

## View the report

From the website project folder, run:

```bash
./analytics-worker/report.sh
```

The report shows the conversion funnel, sections that hold attention, saved registrations, confirmed payments, and recent anonymous journeys. Sign in to Cloudflare with `npx wrangler login` first if the command asks.

## Activate Paddle payment confirmation

1. Complete Paddle live-account verification.
2. In Paddle, create a notification destination for:
   `https://made-for-more-analytics.shanjairajdev.workers.dev/v1/paddle/webhook`
3. Subscribe it to `transaction.completed`.
4. Store the destination's endpoint secret without placing it in source code:

```bash
npx wrangler secret put PADDLE_WEBHOOK_SECRET --config analytics-worker/wrangler.toml
```

Paste the endpoint secret only into the secure prompt. Each verified Paddle payment will then appear in the report and link to its anonymous website journey.
