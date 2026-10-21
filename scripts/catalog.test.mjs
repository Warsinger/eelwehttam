import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateCatalog,fetchCatalog,readCached,saveCached} from '../public/catalog-model.mjs';
import {buildCatalog} from './build-catalog.mjs';
import {classify,checkImageChanges} from './changed-paths.mjs';
const source=JSON.parse(fs.readFileSync('public/catalog-fallback.json','utf8'));
const base='https://catalog.example/apps.json';
test('catalog preserves current app links, ordering and visibility',()=>{
  const copy=structuredClone(source);copy.apps[0].order=5;copy.apps[1].visible=false;
  const apps=validateCatalog(copy,base);assert.deepEqual(apps.map(a=>a.id),['space-invaders','math-viz']);assert.equal(apps[1].playUrl,'https://math-viz.pages.dev/');
});
test('unsafe metadata is rejected before rendering or publication',()=>{
  for(const edit of [data=>data.schemaVersion=2,data=>data.apps[0].playUrl='javascript:alert(1)',data=>data.apps[0].image='data:text/html,test',data=>data.apps[1].id=data.apps[0].id,data=>data.apps[0].imageAlt='',data=>data.apps.forEach(a=>a.visible=false)]){
    const copy=structuredClone(source);edit(copy);assert.throws(()=>validateCatalog(copy,base));
  }
  const copy=structuredClone(source);copy.apps[0].name='<img src=x onerror=alert(1)>';
  assert.equal(validateCatalog(copy,base)[0].name,copy.apps[0].name); // The renderer uses textContent, not HTML.
});
test('invalid/offline/oversized feeds never replace a saved catalog',async()=>{
  for(const response of [new Response('bad JSON'),Response.json({...source,schemaVersion:99}),new Response('',{status:503}),new Response('x'.repeat(131073))])await assert.rejects(fetchCatalog(base,async()=>response));
  await assert.rejects(fetchCatalog(base,async()=>{throw Error('offline');}));
  const cached=readCached({getItem:()=>JSON.stringify(source)},'key',base);assert.equal(cached.apps.length,3);
  assert.equal(readCached({getItem:()=>'{broken'},'key',base),null);
  assert.equal(readCached({getItem:()=>{throw Error('blocked');}},'key',base),null);
  assert.doesNotThrow(()=>saveCached({setItem:()=>{throw Error('quota');}},'key',source));
});
test('catalog packaging hashes images, includes retained images, and sets public/cache headers',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-build-'));
  try{
    const published=buildCatalog('data',path.join(dir,'nested','catalog'),'a'.repeat(40));
    for(const app of published.apps){assert.match(app.image,/^images\/[a-f0-9]{64}\./);assert.ok(fs.existsSync(path.join(dir,'nested','catalog',app.image)));}
    assert.equal(published.revision,'a'.repeat(40));assert.match(fs.readFileSync(path.join(dir,'nested','catalog','_headers'),'utf8'),/Access-Control-Allow-Origin: \*/);
    const fixture=path.join(dir,'fixture');fs.cpSync('data',fixture,{recursive:true});const bad=structuredClone(source);bad.apps[0].image='../private.txt';fs.writeFileSync(path.join(fixture,'apps.json'),JSON.stringify(bad));
    assert.throws(()=>buildCatalog(fixture,path.join(dir,'bad'),'b'.repeat(40)),/image reference/);assert.equal(fs.existsSync(path.join(dir,'bad')),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('data-only changes never schedule the landing build; shared validation changes check both',()=>{
  assert.deepEqual(classify(['data/apps.json','data/images/new-app.png']),{site:false,catalog:true});
  assert.deepEqual(classify(['public/style.css']),{site:true,catalog:false});
  assert.deepEqual(classify(['public/catalog-model.mjs']),{site:true,catalog:true});
  assert.doesNotThrow(()=>checkImageChanges([{status:'A',file:'data/images/new.png'}]));
  for(const status of ['M','D'])assert.throws(()=>checkImageChanges([{status,file:'data/images/old.png'}]),/retained/);
});


