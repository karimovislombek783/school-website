# Publications upgrade

## Required after deployment

Run `supabase/migrations/20260909_publications_and_authors.sql` once in the Supabase SQL Editor. Run the migration before creating or editing publications in the new dashboard.

Existing `news` records become **School News** and existing `announcement` records become **Announcements** automatically. Existing URLs remain under `/news/`, so old links do not break.

## Editorial model

Publications support ten categories and six formats. A writer is optional; without one, the publication is attributed to the school editorial team. Add occasional contributors to the writers list and leave **Public profile** disabled. Enable a public profile only when the school is ready to publish a fuller contributor biography.

Newsletter emails use the selected publication writer as their byline. Each recipient still receives the Uzbek or English article according to their stored newsletter language.
