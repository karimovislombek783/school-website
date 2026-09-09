# Newsletter dashboard and analytics setup

The owner/administrator dashboard at `/uz/admin` and `/en/admin` now shows subscribers, preferred languages, campaign results, CSV export, and a test-email button. Access requires MFA.

## 1. Apply the migration

In the Supabase SQL Editor, run all of `supabase/migrations/20260909_newsletter_analytics.sql` once. It is safe to run again.

## 2. Connect Resend

Create a Resend webhook for `https://www.izzatbek-edu-group.uz/api/newsletter/webhook`. Select `email.delivered`, `email.delivery_delayed`, `email.opened`, `email.clicked`, `email.bounced`, and `email.complained`.

Copy its `whsec_...` signing secret into Vercel as the Production variable `RESEND_WEBHOOK_SECRET`, then redeploy.

In Resend domain settings, configure a custom tracking subdomain such as `links.izzatbek-edu-group.uz`, add the requested CNAME at your DNS provider, verify it, and enable click tracking. Enable open tracking only if the school accepts its privacy tradeoff; open counts are approximate because mail apps can preload or block pixels.

## 3. Test

1. Sign into the admin page and complete MFA.
2. Click **Send test**. Only the administrator email receives it.
3. Publish a disposable news item and send it.
4. Open and click the message, wait a minute, then click **Refresh**.
5. Delete the disposable article afterward. Campaign history remains for accountability.

The stored `preferred_language` controls each subscriber's email language. A subscription made from `/en` starts in English; administrators can change it in the dashboard.
