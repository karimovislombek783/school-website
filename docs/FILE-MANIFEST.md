# File guide

| Path | Purpose |
|---|---|
| `app/page.tsx` | Language gateway |
| `app/[lang]/[[...slug]]/page.tsx` | All bilingual public routes |
| `app/layout.tsx` | Global metadata and document shell |
| `app/globals.css` | Complete design and responsive rules |
| `components/site-shell.tsx` | Header, footer, mobile navigation, language switch |
| `components/preview-forms.tsx` | Safe newsletter and contact demonstrations |
| `components/admin-gateway.tsx` | Server-side administrator authentication and authorization |
| `components/admin-console.tsx` | Secure bilingual content-management interface |
| `components/admin-auth.tsx` | Administrator sign-in and sign-out controls |
| `components/content-directory.tsx` | Functional filters, public listings, and empty states |
| `components/language-switch.tsx` | Remembers the visitor's chosen language |
| `lib/site-content.ts` | Central bilingual content and placeholders |
| `public/favicon.svg` | Temporary school mark |
| `public/robots.txt` | Temporary search-indexing block |
| `tests/` | Automated build and route checks |
| `vercel.json` | Vercel build configuration |
| `.env.example` | Future service configuration template |
| `docs/` | Setup, deployment, and personalization instructions |
| `supabase/schema.sql` | Database tables, audit trail and row-level security policies |

Framework support files and the lockfile should remain in the repository even when you do not edit them directly.
