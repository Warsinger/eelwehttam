import {readFile,access} from 'node:fs/promises';
import {validateCatalog} from '../public/catalog-model.mjs';
const root=new URL('../public/',import.meta.url);
const html=await readFile(new URL('index.html',root),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(/^https?:/.test(match[1]))continue;
  await access(new URL(match[1],root));
}
const snapshot=JSON.parse(await readFile(new URL('catalog-fallback.json',root),'utf8'));
const apps=validateCatalog(snapshot,'https://eelwehttam.pages.dev/catalog-fallback.json');
for(const app of apps)await access(new URL(snapshot.apps.find(item=>item.id===app.id).image,root));
for(const url of ['https://github.com/Warsinger','https://www.linkedin.com/in/matthew-lee-devops/'])if(!html.includes(url))throw Error('Missing profile link');
if(!html.includes('id="project-grid"')||!html.includes('type="module"'))throw Error('Missing catalog renderer');
console.log('Site assets and bundled fallback catalog validated.');
