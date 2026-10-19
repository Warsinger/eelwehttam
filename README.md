# Matt Lee — Apps & experiments

A responsive, static portfolio landing page for Math Viz and Tower Defense.
Cloudflare Pages project: `eelwehttam` → `https://eelwehttam.pages.dev`.
Repository: https://github.com/Warsinger/eelwehttam

## Preview

Requires Node.js. Run `npm run dev`, then open http://127.0.0.1:4173.
No build or dependency installation is required.

## Edit

- `public/index.html`: introduction, app descriptions and profile links.
- `public/style.css`: responsive layout, colors and typography.
- `public/art.js`: decorative mathematical illustration.

The project illustrations are original SVG/CSS artwork, not screenshots. Google Fonts supplies DM Sans and Manrope, with local fallback fonts. There is no analytics or backend.

## Publish to Cloudflare Pages

The free Pages Direct Upload project `eelwehttam` has been created in the owner's Cloudflare account.

Upload a ZIP of the **contents** of `public/` through the project's Cloudflare dashboard, then choose **Deploy site**. `index.html` must be at the ZIP root.

For later command-line updates, authenticate with `npx wrangler login`, then run `npm run deploy`. The project already exists; do not recreate it. Never commit credentials. GitHub pushes alone do not deploy this Direct Upload project.

## Links

- https://math-viz.pages.dev/
- https://tower-def.pages.dev/
- https://github.com/Warsinger
- https://www.linkedin.com/in/matthew-lee-devops/
