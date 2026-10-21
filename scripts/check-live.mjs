import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
const base = process.env.SITE_URL || 'https://eelwehttam.pages.dev';
const digest = data => createHash('sha256').update(data).digest('hex');
const paths = ['index.html', 'style.css', 'site.js', 'catalog-model.mjs', 'catalog-config.mjs', 'catalog-fallback.json', 'favicon.svg', 'images/matt-avatar.jpeg', 'images/math-viz.jpg', 'images/tower-defense.jpg', 'images/space-invaders.png'];
for (let attempt = 0; attempt < 6; attempt++) {
  try {
    for (const path of paths) {
      const response = await fetch(`${base}/${path}?verify=${process.env.GITHUB_SHA || Date.now()}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      const expected = path === 'catalog-config.mjs' ? await readFile(new URL('../build/pages/catalog-config.mjs', import.meta.url)).catch(() => readFile(new URL('../public/catalog-config.mjs', import.meta.url))) : await readFile(new URL(`../public/${path}`, import.meta.url));
      if (digest(Buffer.from(await response.arrayBuffer())) !== digest(expected)) throw new Error(`${path}: published content does not match this commit`);
    }
    console.log('Verified published HTML, CSS, JavaScript, favicon, avatar, and screenshots.');
    process.exit(0);
  } catch (error) {
    if (attempt === 5) throw error;
    console.log(`Waiting for deployment propagation: ${error.message}`);
    await setTimeout(10000);
  }
}
