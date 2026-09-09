# Editorial operations setup

The code deploy is only the first half of this upgrade. Complete these steps once.

## 1. Apply the database migration

In Supabase SQL Editor, open and run the complete file:

`supabase/migrations/20260910_editorial_operations.sql`

This adds scheduled publishing, revision history, and allows an emailed article to be deleted without deleting its historical delivery statistics.

## 2. Configure the scheduler secret

Create a long random value (at least 32 characters). Add it to the Vercel Production environment as `SCHEDULER_SECRET`, then redeploy. Do not put the value in GitHub or client-side variables.

## 3. Run the scheduler every minute from Supabase

In Supabase, open **Integrations → Cron → Create job**:

- Name: `editorial-scheduler`
- Schedule: `* * * * *`
- Method: `POST`
- URL: `https://izzatbek-edu-group.uz/api/scheduler/run`
- Header: `x-scheduler-secret` with the same secret stored in Vercel

Store the header value through Supabase Vault when the dashboard offers that option. Scheduled times are saved from the browser in UTC and displayed to administrators in their local time.

## 4. Verify

Create a temporary draft, schedule it five minutes ahead, and schedule its email two minutes after publication. Confirm that:

1. it is not public before the selected time;
2. it becomes public after the scheduler runs;
3. the email arrives in the subscriber's selected language;
4. the article can be deleted afterward;
5. an older version can be restored from **Revision history**.

## Operational note

The newsletter accepts up to 1,000 active subscribers per campaign and sends them in batches of 100. The admin overview displays a visible warning when required server configuration or revision storage is unavailable.
