# File guide

| Path | Purpose |
|---|---|
| `app/page.tsx` | Language gateway |
| `app/[lang]/[[...slug]]/page.tsx` | All bilingual public routes |
| `app/layout.tsx` | Global metadata and document shell |
| `app/globals.css` | Complete design and responsive rules |
| `components/site-shell.tsx` | Header, footer, mobile navigation, language switch |
| `components/preview-forms.tsx` | Safe newsletter and contact demonstrations |
| `components/admin-preview.tsx` | Non-persistent admin workflow prototype |
| `lib/site-content.ts` | Central bilingual content and placeholders |
| `public/favicon.svg` | Temporary school mark |
| `public/robots.txt` | Temporary search-indexing block |
| `tests/` | Automated build and route checks |
| `vercel.json` | Vercel build configuration |
| `.env.example` | Future service configuration template |
| `docs/` | Setup, deployment, and personalization instructions |

Framework support files and the lockfile should remain in the repository even when you do not edit them directly.
