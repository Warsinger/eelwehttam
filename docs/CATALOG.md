# Application catalog

The landing page reads a separately deployed, public JSON feed from
`https://vanity-app-catalog.pages.dev/apps.json`. Source JSON and images remain
in this repository under `data/`. Only static Cloudflare Pages hosting is used:
no R2 subscription, payment method, Worker, database or extra token is required.
The existing repository Pages token/account secrets publish both projects.

## Editing apps

Edit `data/apps.json`. `schemaVersion` is 1. Each entry has a unique lowercase
`id`, `name`, `tagline`, `description`, HTTPS `playUrl`/`sourceUrl`, `actionLabel`,
`theme` (`math` or `game`), integer `order`, boolean `visible`, relative `image`,
`imageAlt`, `imageWidth` and `imageHeight`. All entries are validated, including
hidden entries. At least one app must remain visible. Text is rendered with DOM
textContent; metadata cannot inject markup or script URLs.

Add screenshots to `data/images/` (PNG/JPEG/WebP, maximum 5 MiB each). Reference
that path from JSON. To replace a screenshot, ADD a new filename, update JSON,
and KEEP the old file. Image modification/deletion is checked against the
last published catalog on every publication path, including manual runs, so cached
catalogs retain their screenshot URLs. All retained images are included in each
catalog deployment with content-hashed names and immutable cache headers. Old
images can be pruned only through a separately planned compatibility change.

Run `node --test scripts/*.test.mjs`, `node scripts/check-site.mjs` and
`node scripts/build-catalog.mjs` before publishing. Packaging requires a fresh
`build/catalog` output directory. No dependency installation is required.

## Publishing independently

After review/merge, a main push containing only `data/` changes validates and
publishes the catalog; landing jobs SKIP when no earlier site change remains
unpublished. Each target compares against its own published `version.json`,
not just the previous push. If a newer unrelated push supersedes an unfinished
run, the latest run carries forward that target’s pending changes.
Site-code changes publish the landing page. Shared catalog validation/build or
workflow changes can schedule both. A mixed commit can publish both projects.
The site uses the pinned shared workflow. The catalog uses the shared
validation/comment scripts and shared upload action inside one project queue,
with separate artifacts, exact project/hostname guards, current-main/PR guards,
explicit secrets and revision manifests. Catalog image retention is rechecked
after entering that queue, immediately before upload, against the then-current
published revision; this also protects against a catalog published after the
initial plan. New previews check production/main when they have no prior feed.
Only a 404 means a target has not been published; network/API/invalid revision
errors fail closed and require a retry or baseline repair. Force-pushed source
revisions are fetched by exact SHA when needed; unavailable history fails closed. Catalog validation failures leave the previous published feed intact.
Pages replaces a complete catalog bundle, so JSON and images belong to one
release. Image URLs are retained across subsequent releases as explained above.

For manual publishing, choose **Deploy website → Run workflow**:
- **deploy** publishes the landing site.
- **catalog** publishes the catalog.
- **preview_pr** must identify the current open same-repository PR on a non-main branch.
- **setup_catalog** explicitly creates the free `vanity-app-catalog` Direct Upload
  project, production branch main, only if missing. It never changes an existing
  project's settings. Initial setup can run on this PR branch before merge.

For an integrated PR preview, enable deploy AND catalog. The site preview reads
`https://pr-N.vanity-app-catalog.pages.dev/apps.json`. A site-only preview can use
its bundled fallback until that PR's catalog exists. Ordinary PR checks never
publish or receive Cloudflare credentials. Two distinct bot-owned comments give
the site and feed preview links; job summaries link each deployment.

## Retrieval, fallback and rollback

JSON is public with CORS `*` and a 60-second browser cache lifetime. Screenshots
have immutable URLs. Visitors load the catalog on page load/reload; an already
open tab does not poll for updates. There is no browser write credential.

A valid saved catalog is displayed first, or the bundled snapshot
`public/catalog-fallback.json` if none exists. Live data replaces it only after
validation, with a five-second request timeout and bounded JSON size. Invalid,
offline, blocked or slow feeds retain saved content and show a brief status.
Blocked localStorage does not stop rendering. Identical data does not rebuild
cards; changed data preserves a focused link when its app still exists.

The bundled fallback is a deliberate snapshot, independent of `data/`; data-only
updates do not update it. Refresh that JSON and public fallback screenshots in a
normal site PR when wanted. Without JavaScript a GitHub link remains available.

For rollback, revert a data change through GitHub and publish it again, or select
a known-good production deployment in the catalog Pages project. This changes
only the feed. A later main catalog publication replaces a dashboard rollback.
Record the catalog revision and verify the public JSON and images after changes.

## Verification

PR checks cover schema/URL safety, cached/storage failures, unavailable/oversized
feeds, image packaging, data-only routing, overlapping pushes, manual image
retention and the serialized pre-upload recheck using temporary Git histories. Hosted checks must verify browser
rendering, CORS, keyboard focus and narrow layouts. To demonstrate independence:
record the landing version.json, publish a catalog-only preview update, reload
the SAME site preview, and confirm its cards change while its revision stays the
same and the manual run's landing jobs are skipped. Revert temporary demo data
before review. Production validation waits for approval/merge.
