# School Website Project

A light, bilingual Uzbek–English website foundation for a licensed private K–12 school in Uzbekistan. This version uses placeholders until the school confirms its exact legal name, licence details, contacts, staff, and policies.

## Included

- Uzbek and English public pages
- About, academics, teachers, news, achievements, admissions, contact, legal, and privacy pages
- Newsletter and contact demonstrations that do not transmit data
- An admin workflow prototype without live authentication or a database
- Responsive, accessible navigation and forms
- Uzbek-default entry with a remembered English preference
- Functional public filters and publication-gated detail-page templates
- Honest empty states: drafts and missing records never appear publicly

## Run locally

Install Node.js 22 or newer, then run `npm install` and `npm run dev`.

Run `npm test` for the Sites build and route checks. Run `npm run build:vercel` to verify the Vercel build.

Before publishing, complete `docs/PERSONALIZATION-CHECKLIST.md`. Keep the temporary search-engine block until the legal identity and public content are approved.

Setup instructions are in `docs/GITHUB-DESKTOP.md` and `docs/DEPLOYMENT.md`.
