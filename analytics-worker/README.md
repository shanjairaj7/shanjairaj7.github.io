# Made for More analytics

This is the private analytics service behind the Made for More website. It uses Cloudflare Workers and D1. It records anonymous visitor journeys immediately and stores registration details only after the visitor agrees to the form consent text.

## Telegram registration alerts

The workshop team can receive three consented alerts in Telegram:

- completed registration details, even when a visitor does not continue to checkout;
- checkout reached, before payment is complete;
- a confirmed payment, only when Paddle sends a signed `transaction.completed` webhook.

Set the bot token and the private chat ID as Cloudflare Worker secrets. A Telegram bot cannot start a private conversation, so first open the bot in Telegram and press **Start**. Then retrieve the numeric chat ID with the Bot API and store it without committing either secret:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN --config analytics-worker/wrangler.toml
npx wrangler secret put TELEGRAM_CHAT_ID --config analytics-worker/wrangler.toml
```

Every alert has a first-party random visitor ID. It is not a device fingerprint. Alerts are deduplicated in D1, so a form update does not create repeated notifications.

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
