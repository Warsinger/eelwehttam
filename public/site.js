import { fetchCatalog, readCached, saveCached } from './catalog-model.mjs';
import { catalogURL } from './catalog-config.mjs';
document.getElementById('year').textContent = new Date().getFullYear();
const grid = document.getElementById('project-grid');
const status = document.getElementById('catalog-status');
let rendered = '';
function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function render(apps) {
  const fingerprint = JSON.stringify(apps);
  if (fingerprint === rendered) return;
  const focused = grid.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
  const fragment = document.createDocumentFragment();
  for (const app of apps) {
    const card = element('article', `project ${app.theme}`);
    const art = element('a', `project-art ${app.theme}-art screenshot-art`);
    art.href = app.playUrl; art.setAttribute('aria-label', app.actionLabel); art.dataset.focusKey = `${app.id}:image`;
    const img = element('img'); img.src = app.image; img.alt = app.imageAlt; img.width = app.imageWidth; img.height = app.imageHeight; img.loading = 'lazy';
    art.append(img, element('span','round-arrow','↗'));
    const copy = element('div','project-copy');
    copy.append(element('p','eyebrow',app.tagline),element('h3','',app.name),element('p','',app.description));
    const links = element('div','project-links');
    const play = element('a','',app.actionLabel+' ↗'); play.href = app.playUrl; play.dataset.focusKey = `${app.id}:play`;
    const source = element('a','source','Source code ↗'); source.href = app.sourceUrl; source.dataset.focusKey = `${app.id}:source`;
    links.append(play,source); copy.append(links); card.append(art,copy); fragment.append(card);
  }
  grid.replaceChildren(fragment); rendered = fingerprint;
  if (focused) [...grid.querySelectorAll('a')].find(link => link.dataset.focusKey === focused)?.focus({preventScroll:true});
}
async function start() {
  let available = false;
  let storage;
  try { storage = window.localStorage; } catch { /* Optional storage may be blocked. */ }
  const key = `vanity.catalog.v1:${catalogURL}`;
  const cached = readCached(storage,key,catalogURL);
  if (cached) { render(cached.apps); available = true; status.textContent = ''; }
  if (!available) {
    try { const fallback = await fetchCatalog(new URL('catalog-fallback.json',document.baseURI).href); render(fallback.apps); available = true; status.textContent = ''; } catch { /* Try the live feed next. */ }
  }
  try {
    const remote = await fetchCatalog(catalogURL); render(remote.apps); saveCached(storage,key,remote.data); status.textContent = '';
  } catch {
    status.textContent = available ? 'Showing saved projects. The latest updates are temporarily unavailable.' : 'Projects are temporarily unavailable. You can still explore them on GitHub below.';
  }
}
start();
