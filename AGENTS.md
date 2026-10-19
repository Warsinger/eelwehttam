# Repository workflow

- Make routine changes directly on `main`; the owner does not require PRs or a separate planning step here.
- Use the builder GitHub App identity for coding and publishing, and the reviewer identity when reviewing.
- Local helper: `C:\Users\eelwe\.codex\github-identities\github-role.mjs`, with `--repo Warsinger/eelwehttam`.
- Pushes to `main` deploy `public/` to the existing Cloudflare Pages project `eelwehttam`.
- Preserve the site's professional copy, cream/green/rust palette, and responsive layout. Use actual app screenshots for project images.
- Run `node scripts/check-site.mjs` before pushing and confirm the deployment workflow succeeds afterward.
- Never commit credentials or deploy the repository root. Keep hosting on the existing free static Pages project.
