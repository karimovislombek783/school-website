# Newsletter setup

The newsletter uses Supabase for double-opt-in subscriber records and Resend for email delivery. Subscriber tables are inaccessible to browser roles. Confirmation and unsubscribe tokens are stored only as SHA-256 hashes.

## 1. Apply the database migration

Open the existing school project in Supabase, select **SQL Editor**, paste the complete contents of `supabase/migrations/20260907_newsletter.sql`, and run it once.

## 2. Configure Resend

1. Create a Resend account and add `izzatbek-edu-group.uz` as a sending domain.
2. Add the DNS records shown by Resend at the domain registrar.
3. Wait until Resend reports the domain as verified.
4. Create a Resend API key restricted to sending access.

## 3. Configure Vercel

Add these variables to the Vercel project for Production, Preview, and Development where appropriate:

- `SUPABASE_SERVICE_ROLE_KEY`: from Supabase **Project Settings → API Keys**. This is server-only.
- `RESEND_API_KEY`: the restricted Resend sending key.
- `NEWSLETTER_FROM`: `IZZATBEK-EDU-GROUP <news@izzatbek-edu-group.uz>`
- `NEWSLETTER_SITE_URL`: `https://www.izzatbek-edu-group.uz`

Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never rename either server secret with a `NEXT_PUBLIC_` prefix.

Redeploy after adding the variables.

## 4. Test before launch

1. Subscribe using an address controlled by the school.
2. Open the confirmation email and confirm the address.
3. In the admin dashboard, open **News** and use the envelope button beside one published test article.
4. Confirm receipt in both Uzbek and English if possible.
5. Test the unsubscribe link.

Each news record is protected by a unique campaign lock and can be emailed only once. Only an owner or administrator with an MFA-verified session can send a campaign. Sending failure does not unpublish or alter the news article.
