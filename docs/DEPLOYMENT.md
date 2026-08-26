# Deployment

## Vercel

1. Sign in to Vercel with the GitHub account that owns the repository.
2. Select **Add New → Project**, import the repository, and leave the framework as Next.js.
3. The included `vercel.json` runs the standard Next.js build. This demonstration needs no environment variables.
4. After deployment, test `/uz`, `/en`, the language switch, mobile menu, forms, and admin demonstration.
5. Add the final domain only after the school approves its legal name and public launch.

The contact form and newsletter remain demonstrations. The administrator CMS becomes active only after the separate school Supabase project is configured according to `SUPABASE-SETUP.md`.

Website DNS and Google Workspace email DNS are separate. Use the exact DNS records displayed by each provider.

This project currently blocks search indexing and shows placeholder legal details. Do not remove those protections until the personalization checklist is complete. A tuition-charging school should confirm that its chosen hosting plan permits its use case.
