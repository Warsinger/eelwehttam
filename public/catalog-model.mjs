const text = (value, max, field) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`Invalid ${field}`);
  return value;
};
function webURL(value, base, image = false) {
  const url = new URL(text(value, 2048, 'URL'), base);
  const local = image && url.origin === new URL(base).origin && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) throw new Error('Unsafe URL');
  return url.href;
}
export function validateCatalog(data, base) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.apps) || data.apps.length < 1 || data.apps.length > 100) throw new Error('Unsupported catalog');
  const seen = new Set();
  const apps = data.apps.map(app => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(app.id || '') || seen.has(app.id)) throw new Error('Invalid or duplicate app ID');
    seen.add(app.id);
    if (!['math', 'game'].includes(app.theme) || !Number.isInteger(app.order) || typeof app.visible !== 'boolean') throw new Error('Invalid display options');
    for (const field of ['imageWidth', 'imageHeight']) if (!Number.isInteger(app[field]) || app[field] < 1 || app[field] > 10000) throw new Error('Invalid image dimensions');
    return { id: app.id, name: text(app.name, 100, 'name'), tagline: text(app.tagline, 120, 'tagline'), description: text(app.description, 1000, 'description'),
      image: webURL(app.image, base, true), imageAlt: text(app.imageAlt, 300, 'image alt text'), imageWidth: app.imageWidth, imageHeight: app.imageHeight,
      playUrl: webURL(app.playUrl, base), sourceUrl: webURL(app.sourceUrl, base), actionLabel: text(app.actionLabel, 100, 'action label'),
      theme: app.theme, order: app.order, visible: app.visible };
  });
  if (!apps.some(app => app.visible)) throw new Error('Catalog must have a visible app');
  return apps.filter(app => app.visible).sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
}
export async function fetchCatalog(url, fetcher = fetch) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(5000), credentials: 'omit' });
  if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > 131072) throw new Error('Catalog too large');
  const body = await response.text();
  if (body.length > 131072) throw new Error('Catalog too large');
  const data = JSON.parse(body);
  return { data, apps: validateCatalog(data, url) };
}
export function readCached(storage, key, base) {
  try { const data = JSON.parse(storage.getItem(key)); return {data, apps:validateCatalog(data,base)}; } catch { return null; }
}
export function saveCached(storage, key, data) {
  try { storage.setItem(key, JSON.stringify(data)); } catch { /* Storage is optional. */ }
}
