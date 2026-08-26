# Separate school Supabase setup

Do not reuse the research platform's Supabase project.

1. A trusted adult creates a new Supabase project owned by the school.
2. In **SQL Editor**, run `supabase/schema.sql` once.
3. In **Authentication → Users**, create the first administrator account with a strong unique password and MFA.
4. Copy that user's UUID and run this once in SQL Editor:

```sql
insert into public.admin_users (user_id, role) values ('PASTE-USER-UUID', 'owner');
```

5. In Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview and Development. Never put the service-role key in browser variables or GitHub.
6. Redeploy. `/uz/admin` and `/en/admin` will then require the Supabase administrator login.

The public can read only records marked `published`. Drafts and administrative tables are protected by row-level security. Keep contact and newsletter submission disabled until privacy and consent wording is approved.
