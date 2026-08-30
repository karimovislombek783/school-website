# File guide

| Path | Purpose |
|---|---|
| `app/page.tsx` | Uzbek-default entry with remembered language preference |
| `app/[lang]/[[...slug]]/page.tsx` | All bilingual public routes |
| `app/layout.tsx` | Global metadata and document shell |
| `app/globals.css` | Complete design and responsive rules |
| `components/site-shell.tsx` | Header, footer, mobile navigation, language switch |
| `components/preview-forms.tsx` | Safe newsletter and contact demonstrations |
| `components/admin-gateway.tsx` | Server-side administrator authentication and authorization |
| `components/admin-console.tsx` | Secure bilingual content-management interface |
| `components/admin-auth.tsx` | Administrator sign-in and sign-out controls |
| `components/admin-mfa.tsx` | Authenticator-app MFA enrolment and verification |
| `components/content-directory.tsx` | Functional filters, public listings, and empty states |
| `components/language-switch.tsx` | Remembers the visitor's chosen language |
| `lib/site-content.ts` | Confirmed legal identity, bilingual content, and remaining placeholders |
| `public/favicon.svg` | Temporary school mark |
| `public/robots.txt` | Allows public search indexing and points crawlers to the sitemap |
| `public/sitemap.xml` | Public Uzbek and English page index for search engines |
| `tests/` | Automated route, interface, and security-contract checks |
| `vercel.json` | Vercel build configuration |
| `.env.example` | Future service configuration template |
| `docs/` | Setup, deployment, and personalization instructions |
| `supabase/schema.sql` | Database tables, four roles, MFA policies, private media, and audit trail |
| `supabase/migrations/` | Safe updates for an already-configured school database |

Framework support files and the lockfile should remain in the repository even when you do not edit them directly.
