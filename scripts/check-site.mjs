import { readFile, access } from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^https?:/.test(match[1])) continue;
  await access(new URL(match[1], root));
}
for (const url of ['https://math-viz.pages.dev/', 'https://tower-def.pages.dev/', 'https://github.com/Warsinger', 'https://www.linkedin.com/in/matthew-lee-devops/']) {
  if (!html.includes(url)) throw new Error(`Missing required link: ${url}`);
}
console.log('All referenced local assets and required app/profile links are present.');
