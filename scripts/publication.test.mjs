import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {planPublication,guardCatalogPublication,publishedRevision} from './changed-paths.mjs';
function repository() {
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-publishing-'));
  const git=args=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git(['init','--initial-branch=main','--object-format=sha1']);
  const write=(file,value)=>{fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});fs.writeFileSync(path.join(cwd,file),value);};
  const commit=()=>{git(['add','.']);git(['-c','user.name=Catalog Test','-c','user.email=catalog@example.invalid','commit','-m','fixture']);return git(['rev-parse','HEAD']);};
  const changes=(base,head)=>{const parts=git(['diff','--no-renames','--name-status','-z',base,head]).split('\0').filter(Boolean);const result=[];for(let i=0;i<parts.length;i+=2)result.push({status:parts[i],file:parts[i+1]});return result;};
  write('public/site.js','original');write('data/apps.json','original');write('data/images/retained.png','original image');
  return {cwd,git,write,commit,changes,original:commit(),cleanup:()=>fs.rmSync(cwd,{recursive:true,force:true})};
}
function context(head,eventName='push') {return {eventName,head,ref:'refs/heads/main',event:{inputs:{catalog:'true',deploy:'false'}}};}
for(const first of ['site','catalog'])test(`overlapping ${first}-only then unrelated push carries forward an unpublished update`,async()=>{
  const repo=repository();try{
    const firstFile=first==='site'?'public/site.js':'data/apps.json';
    const secondFile=first==='site'?'data/apps.json':'public/site.js';
    repo.write(firstFile,'first update');const firstHead=repo.commit();
    repo.write(secondFile,'second update');const secondHead=repo.commit();
    const event={...context(secondHead),event:{before:firstHead}};
    const io={published:async()=>repo.original,changes:repo.changes};
    assert.notEqual(firstHead,secondHead); // The first run fails the shared current-main guard.
    assert.deepEqual(await planPublication(event,io),{site:true,catalog:true});
    const caughtUp={...io,published:async target=>target===first?firstHead:repo.original};
    assert.deepEqual(await planPublication(event,caughtUp),first==='site'?{site:false,catalog:true}:{site:true,catalog:false});
  }finally{repo.cleanup();}
});
for(const change of ['modify','delete'])test(`manual catalog publish rejects ${change} of an already published image`,async()=>{
  const repo=repository();try{
    if(change==='modify')repo.write('data/images/retained.png','replacement image');
    else fs.unlinkSync(path.join(repo.cwd,'data/images/retained.png'));
    const head=repo.commit();const io={published:async()=>repo.original,changes:repo.changes};
    await assert.rejects(planPublication(context(head,'workflow_dispatch'),io),/retained/);
    await assert.rejects(guardCatalogPublication(context(head,'workflow_dispatch'),io),/retained/);
    // Exercise the real CLI dispatch path against a saved event and published revision.
    const eventPath=path.join(repo.cwd,'event.json');fs.writeFileSync(eventPath,JSON.stringify({inputs:{catalog:'true',deploy:'false'}}));
    const output=path.join(repo.cwd,'outputs');
    const script=new URL('./changed-paths.mjs',import.meta.url);
    const child=spawnSync(process.execPath,['--input-type=module','-e',`globalThis.fetch=async()=>Response.json({revision:${JSON.stringify(repo.original)}});process.argv[1]=${JSON.stringify(fileURLToPath(script))};await import(${JSON.stringify(script.href)});`],{cwd:repo.cwd,encoding:'utf8',env:{...process.env,GITHUB_EVENT_PATH:eventPath,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_SHA:head,GITHUB_OUTPUT:output}});
    assert.notEqual(child.status,0);assert.match(child.stderr,/retained/);assert.equal(fs.existsSync(output),false);
  }finally{repo.cleanup();}
});
test('new preview checks production images; unrelated manual site-only publication is independent',async()=>{
  const ctx={...context('a'.repeat(40),'workflow_dispatch'),ref:'refs/heads/feature',event:{inputs:{catalog:'true',preview_pr:'6'}}};
  const calls=[];
  const io={published:async(target,preview)=>{calls.push([target,preview]);return preview?null:'b'.repeat(40);},changes:()=>[{status:'D',file:'data/images/retained.png'}]};
  await assert.rejects(planPublication(ctx,io),/retained/);assert.deepEqual(calls,[['catalog','6'],['catalog','']]);
  const siteOnly={...ctx,event:{inputs:{deploy:'true',catalog:'false',preview_pr:'6'}}};
  assert.deepEqual(await planPublication(siteOnly,{published:()=>{throw Error('No catalog access expected');}}),{site:true,catalog:false});
});
test('serialized pre-upload guard catches a publication after the initial plan',async()=>{
  const ctx=context('a'.repeat(40),'workflow_dispatch');let published='b'.repeat(40);
  const io={published:async()=>published,changes:base=>base==='b'.repeat(40)?[]:[{status:'D',file:'data/images/just-published.png'}]};
  assert.deepEqual(await planPublication(ctx,io),{site:false,catalog:true});
  published='c'.repeat(40);
  await assert.rejects(guardCatalogPublication(ctx,io),/retained/);
  const workflow=fs.readFileSync('.github/workflows/deploy.yml','utf8').split('  catalog-deploy:')[1];
  assert.match(workflow,/concurrency:[\s\S]*group: cloudflare-\$\{\{ github.repository \}\}-vanity-app-catalog/);
  assert.ok(workflow.indexOf('--catalog-guard')<workflow.indexOf('uses: Warsinger/cloudflare-pages-deploy/upload@'));
});
test('published baseline lookup distinguishes a new target from retrieval/corruption failures',async()=>{
  assert.equal(await publishedRevision('https://example.test',async()=>new Response('',{status:404})),null);
  const revision='a'.repeat(40);
  assert.equal(await publishedRevision('https://example.test',async(_,options)=>{assert.equal(options.cache,'no-store');return Response.json({revision});}),revision);
  for(const response of [new Response('',{status:503}),new Response('{bad'),Response.json({revision:'not-a-sha'})])await assert.rejects(publishedRevision('https://example.test',async()=>response));
});
