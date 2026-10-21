# Repository workflow

- Make routine changes directly on `main`; the owner does not require PRs or a separate planning step here.
- Use the builder GitHub App identity for coding and publishing, and the reviewer identity when reviewing.
- Local helper: `C:\Users\eelwe\.codex\github-identities\github-role.mjs`, with `--repo Warsinger/vanity-landing-page`.
- Site changes on `main` deploy `public/` to Pages project `eelwehttam`. Data-only changes deploy the independent `vanity-app-catalog` feed and skip the landing build/deployment. See `docs/CATALOG.md`.
- Keep catalog images immutable: add a new filename and retain older files for cached catalogs. Keep the bundled fallback snapshot separate from live data.
- Preserve the site's professional copy, cream/green/rust palette, and responsive layout. Use actual app screenshots for project images.
- Run `node scripts/check-site.mjs` before pushing and confirm the deployment workflow succeeds afterward.
- Never commit credentials or deploy the repository root. Keep hosting on the existing free static Pages project.
