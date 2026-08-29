# School Website Project

A bilingual Uzbek–English website foundation for `"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasi`. The legal name and licence details are taken from the supplied licence; contacts, staff, imagery and policies remain pending approval.

## Included

- Uzbek and English public pages
- About, academics, teachers, news, achievements, admissions, contact, legal, and privacy pages
- Newsletter and contact demonstrations that do not transmit data
- A Supabase-backed administrator login and bilingual content-management system, safely disabled until configured
- Four permission levels (owner, administrator, editor, writer) enforced by database policies
- Mandatory authenticator-app MFA for content changes and administrator management
- Private, validated image uploads and an administrator audit log
- Responsive, accessible navigation and forms
- Uzbek-default entry with a remembered English preference
- Functional public filters and publication-gated detail-page templates
- Multi-subject teacher profiles with independent leadership and multi-department classification
- Honest empty states: drafts and missing records never appear publicly

## Run locally

Install Node.js 22 or newer, then run `npm install` and `npm run dev`.

Run `npm test` for route, interface, and security-contract checks. Run `npm run build:vercel` to verify the Vercel build.

Before publishing, complete `docs/PERSONALIZATION-CHECKLIST.md`. Keep the temporary search-engine block until the legal identity and public content are approved.

Setup instructions are in `docs/GITHUB-DESKTOP.md` and `docs/DEPLOYMENT.md`.
The separate school database and administrator setup is documented in `docs/SUPABASE-SETUP.md`.
