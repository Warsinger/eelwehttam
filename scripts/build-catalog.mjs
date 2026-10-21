import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateCatalog} from '../public/catalog-model.mjs';
export function buildCatalog(source, output, revision) {
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Catalog build needs a full source revision');
  const raw=fs.readFileSync(path.join(source,'apps.json'),'utf8');
  if (Buffer.byteLength(raw)>131072) throw new Error('Catalog too large');
  const data=JSON.parse(raw);validateCatalog(data,'https://catalog.example/apps.json');
  const files=new Map();
  for (const name of fs.readdirSync(path.join(source,'images'))) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpg|jpeg|webp)$/.test(name)) throw new Error('Invalid image filename');
    const location=path.join(source,'images',name);
    if (!fs.lstatSync(location).isFile()) throw new Error('Image must be a regular file');
    const bytes=fs.readFileSync(location);const ext=path.extname(name).slice(1);
    if (!bytes.length || bytes.length>5*1024*1024) throw new Error('Image exceeds 5 MiB limit');
    const valid=ext==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if (!valid) throw new Error('Image bytes do not match extension');
    const hash=createHash('sha256').update(bytes).digest('hex');
    files.set('images/'+name,{key:`images/${hash}.${ext}`,bytes});
  }
  const apps=data.apps.map(app=>{
    if (!/^images\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpg|jpeg|webp)$/.test(app.image) || !files.has(app.image)) throw new Error('Missing or unsafe image reference');
    return {...app,image:files.get(app.image).key};
  });
  const published={schemaVersion:1,revision,apps};validateCatalog(published,'https://catalog.example/apps.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.mkdirSync(output,{recursive:false});fs.mkdirSync(path.join(output,'images'));
  for (const {key,bytes} of files.values())fs.writeFileSync(path.join(output,key),bytes);
  fs.writeFileSync(path.join(output,'apps.json'),JSON.stringify(published)+'\n');
  fs.writeFileSync(path.join(output,'version.json'),JSON.stringify({revision})+'\n');
  fs.writeFileSync(path.join(output,'index.html'),'<!doctype html><meta charset="utf-8"><title>Application catalog</title><p><a href="apps.json">Application catalog JSON</a></p>');
  fs.writeFileSync(path.join(output,'404.html'),'<!doctype html><title>Not found</title><h1>Not found</h1>');
  fs.writeFileSync(path.join(output,'_headers'),'/*\n  Access-Control-Allow-Origin: *\n  X-Content-Type-Options: nosniff\n/apps.json\n  Cache-Control: public, max-age=60\n/version.json\n  Cache-Control: no-cache\n/images/*\n  Cache-Control: public, max-age=31536000, immutable\n');
  return published;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  buildCatalog('data',process.argv[2]||'build/catalog',process.env.GITHUB_SHA||'0'.repeat(40));console.log('Catalog and all image references validated.');
}
