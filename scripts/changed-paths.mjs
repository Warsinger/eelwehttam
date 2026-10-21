import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
export function classify(paths) {
  return {
    site: paths.some(p => !p.startsWith('data/')),
    catalog: paths.some(p => p.startsWith('data/') || p.startsWith('scripts/') || p.startsWith('.github/workflows/') || p === 'public/catalog-model.mjs'),
  };
}
export function checkImageChanges(changes) {
  for (const {status,file} of changes) if (file.startsWith('data/images/') && status !== 'A') {
    throw Error('Catalog images are retained for cached releases: add a new filename and keep the old file instead of modifying/deleting '+file);
  }
}
export function previewNumber(context) {
  if (context.eventName === 'pull_request') return String(context.event.number);
  if (context.ref === 'refs/heads/main') return '';
  const pr = context.event.inputs?.preview_pr;
  if (!/^[1-9][0-9]*$/.test(pr || '')) throw Error('Preview publication requires a PR number');
  return pr;
}
export function targetURL(target, preview = '') {
  const host = target === 'site' ? 'eelwehttam.pages.dev' : 'vanity-app-catalog.pages.dev';
  return `https://${preview ? 'pr-'+preview+'.' : ''}${host}/version.json`;
}
export async function publishedRevision(url, fetcher = fetch) {
  const response = await fetcher(url, {cache:'no-store', signal:AbortSignal.timeout(10000)});
  if (response.status === 404) return null; // The target has never been published.
  if (!response.ok) throw Error(`Cannot read published baseline: HTTP ${response.status}`);
  const body = await response.text();
  if (body.length > 16384) throw Error('Invalid published baseline');
  const data = JSON.parse(body);
  if (!/^[a-f0-9]{40}$/.test(data.revision || '')) throw Error('Invalid published revision');
  return data.revision;
}
async function retentionBaseline(context, io, revision, preview) {
  if (revision) return revision;
  // A new preview inherits retention obligations from production/main.
  if (preview) return await io.published('catalog','') || await io.defaultRevision();
  return null;
}
export async function checkPublishedImages(context, io, revision, preview) {
  const baseline = await retentionBaseline(context,io,revision,preview);
  if (baseline) checkImageChanges(await io.changes(baseline,context.head));
}
export async function planPublication(context, io) {
  const preview = previewNumber(context);
  let plan;
  let catalogRevision;
  if (context.eventName === 'workflow_dispatch') {
    plan = {site:context.event.inputs?.deploy === 'true', catalog:context.event.inputs?.catalog === 'true'};
    if (plan.catalog) catalogRevision = await io.published('catalog',preview);
  } else {
    const [siteRevision, feedRevision] = await Promise.all([io.published('site',preview),io.published('catalog',preview)]);
    catalogRevision = feedRevision;
    // event.before cannot account for an earlier run rejected by the main-head guard.
    plan = {
      site: !siteRevision || classify((await io.changes(siteRevision,context.head)).map(c=>c.file)).site,
      catalog: !feedRevision || classify((await io.changes(feedRevision,context.head)).map(c=>c.file)).catalog,
    };
  }
  if (plan.catalog) await checkPublishedImages(context,io,catalogRevision,preview);
  return plan;
}
export async function guardCatalogPublication(context, io) {
  if (!['push','workflow_dispatch'].includes(context.eventName)) throw Error('Catalog publication requires push or manual dispatch');
  const preview = previewNumber(context);
  await checkPublishedImages(context,io,await io.published('catalog',preview),preview);
}
function git(args) { return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(); }
function ensureRevision(revision) {
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw Error('Invalid source revision');
  try { git(['cat-file','-e',revision+'^{commit}']); }
  catch {
    // Force-pushed preview revisions may no longer be in the fetched branch history.
    git(['fetch','--no-tags','origin',revision]);
    git(['cat-file','-e',revision+'^{commit}']);
  }
}
export function gitChanges(base,head) {
  ensureRevision(base); ensureRevision(head);
  const values=git(['diff','--no-renames','--name-status','-z',base,head]).split('\0').filter(Boolean);
  const changes=[];
  for(let i=0;i<values.length;i+=2)changes.push({status:values[i],file:values[i+1]});
  return changes;
}
if(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
  const context={eventName:process.env.GITHUB_EVENT_NAME,event,head:event.pull_request?.head.sha || process.env.GITHUB_SHA,ref:process.env.GITHUB_REF};
  const io={published:(target,preview)=>publishedRevision(targetURL(target,preview)),changes:gitChanges,defaultRevision:()=>git(['rev-parse','origin/main'])};
  if(process.argv.includes('--catalog-guard')) {
    await guardCatalogPublication(context,io);
    console.log('Published catalog image retention verified immediately before upload.');
  } else {
    const plan=await planPublication(context,io);
    fs.appendFileSync(process.env.GITHUB_OUTPUT,`site=${plan.site}\ncatalog=${plan.catalog}\n`);
    console.log(JSON.stringify(plan));
  }
}
