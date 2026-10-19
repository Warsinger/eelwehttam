# Matt Lee — Apps & experiments

A responsive, static portfolio landing page for Math Viz and Tower Defense.
Target Cloudflare Pages project: `eelwehttam` → `https://eelwehttam.pages.dev` (subject to availability).

## Preview

Requires Node.js. Run `npm run dev`, then open http://127.0.0.1:4173.
No build or dependency installation is required.

## Edit

- `public/index.html`: introduction, app descriptions and profile links.
- `public/style.css`: responsive layout, colors and typography.
- `public/art.js`: decorative mathematical illustration.

The project illustrations are original SVG/CSS artwork, not screenshots. Google Fonts supplies DM Sans and Manrope, with local fallback fonts. There is no analytics or backend.

## Publish to Cloudflare Pages

Create a free Pages project named `eelwehttam` in the intended Cloudflare account. If the name is available, Cloudflare assigns `eelwehttam.pages.dev`.

For Git integration, select this repository, production branch `main`, no framework, no build command, and output directory `public`.

Alternatively, use Direct Upload: authenticate with `npx wrangler login`, create the Pages project with `npx wrangler pages project create eelwehttam --production-branch main`, then run `npm run deploy`.
Choose either Git integration or Direct Upload when creating the project. Never commit credentials.

## Links

- https://math-viz.pages.dev/
- https://tower-def.pages.dev/
- https://github.com/Warsinger
- https://www.linkedin.com/in/matthew-lee-devops/
