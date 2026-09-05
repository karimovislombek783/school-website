# Secure school Supabase setup

Use a separate Supabase project for the school. Do not reuse the research platform database. Supabase Free currently grants two active free projects across organizations where you are an Owner or Administrator, so one research project and one school project fit if those are your only active projects. A trusted adult school representative should own the school account.

## 1. Create and secure the project

1. Create a new Supabase project and save the database password in the school's password manager.
2. Open **Authentication → Providers → Email** and disable public user sign-ups. Administrators must be created deliberately.
3. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it once.
4. Confirm that the tables `admin_users`, `content_items`, and `audit_log` exist and that Storage contains the private `school-media` bucket.

## 2. Create the first owner

1. Open **Authentication → Users → Add user**.
2. Create the trusted adult owner's account with a unique school-controlled email and strong password.
3. Copy that user's UUID.
4. Run this in SQL Editor, replacing the placeholder:

```sql
insert into public.admin_users (user_id, role)
values ('PASTE-USER-UUID', 'owner');
```

Do not create the first owner with a student's personal email. The database prevents removal or deactivation of the final active owner.

## 3. Connect Vercel

In **Supabase → Project Settings → API**, copy only:

- Project URL
- Publishable key (or legacy `anon` key)

Add them in **Vercel → school-website → Settings → Environment Variables** as:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Enable Production, Preview, and Development, then redeploy the latest Vercel deployment. Never copy the `service_role` key into Vercel, GitHub, `.env.local`, or any browser-facing variable.

## 4. Enrol MFA

1. Open `/uz/admin` or `/en/admin` on the deployed website.
2. Sign in as the owner.
3. Scan the displayed QR code with an authenticator app.
4. Enter the six-digit code to finish enrolment.

Content changes, uploads, deletion, and membership changes require an MFA-verified session.

## Roles

| Role | Capabilities |
|---|---|
| Owner | All CMS actions and administrator membership management |
| Administrator | Create, publish, unpublish, delete, upload, and read audit history |
| Editor | Create, edit, publish, unpublish, and upload; cannot delete |
| Writer | Create and edit only their own drafts; cannot publish |

Until a staff-management screen is added, create additional users in **Authentication → Users**, then assign their UUID in SQL Editor:

```sql
insert into public.admin_users (user_id, role)
values ('PASTE-USER-UUID', 'writer');
```

Use `owner`, `administrator`, `editor`, or `writer` exactly.

## Verification checklist

- A visitor can see published records only.
- A writer cannot publish, delete another person's draft, or read another writer's draft.
- An editor cannot delete records or manage administrators.
- An administrator can read the audit log but cannot manage owners.
- Only an owner with MFA can manage administrator memberships.
- Uploaded files reject non-JPEG/PNG/WebP content and files over 5 MB.
- Contact and newsletter collection remain inactive until approved privacy and consent wording exists.

## Existing project update

If the original schema was already installed before the multi-subject teacher update, run `supabase/migrations/20260829_teacher_profiles.sql` once in SQL Editor. It adds independent leadership status, multiple departments, and bilingual subject lists without removing existing content.

After deploying the achievements catalogue update, run `supabase/migrations/20260905_achievement_catalog.sql` once in SQL Editor. Run it after the teacher-profile migration. It adds the International, National and Olympiad structure, optional bilingual subjects, results and academic years while preserving existing achievement records.

Free projects may pause after inactivity and have usage quotas. Review current Supabase plan limits before the official public launch.
