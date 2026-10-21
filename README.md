# Matt Lee — Applications & projects

A responsive, static portfolio landing page for Math Viz and Tower Defense.
Cloudflare Pages project: `eelwehttam` → `https://eelwehttam.pages.dev`.
Repository: https://github.com/Warsinger/vanity-landing-page

## Preview

Requires Node.js. Run `npm run dev`, then open http://127.0.0.1:4173.
No build or dependency installation is required.

## Edit

- `public/index.html`: introduction, app descriptions and profile links.
- `public/style.css`: responsive layout, colors and typography.
- `public/site.js`: footer year.
- `public/images/`: avatar supplied by Matt and screenshots captured from the live apps.

The project cards show actual app screenshots. The SVG favicon embeds the supplied avatar, framed around the face. Google Fonts supplies DM Sans and Manrope, with local fallback fonts. There is no analytics or backend.

## Publish to Cloudflare Pages

The free Pages Direct Upload project `eelwehttam` has been created in the owner's Cloudflare account.

Every push to `main` runs `.github/workflows/deploy.yml`: it checks local asset references, uploads only `public/`, and verifies the published files match the commit. To publish manually, start **Deploy website** with **deploy** enabled. For a preview, select the current open same-repository PR branch and set **preview_pr** to its number. Ordinary PR events check assets and build an artifact without publishing or receiving deployment secrets.

The workflow uses repository Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The token needs Cloudflare Pages Edit in the intended account. Publishing uses the pinned [shared Cloudflare workflow](https://github.com/Warsinger/cloudflare-pages-deploy), with both workflow and script checkout pinned to the same commit. It validates the existing project, hostname and artifact revision, serializes uploads, and provides linked summaries and updateable preview comments. App-specific published-byte verification remains here and checks the selected production/preview URL.

Run `node scripts/check-site.mjs` before pushing. Use the guarded Actions workflow for manual publishing. The project already exists; do not recreate it. Never commit credentials.

## Links

- https://math-viz.pages.dev/
- https://tower-def.pages.dev/
- https://github.com/Warsinger
- https://www.linkedin.com/in/matthew-lee-devops/
