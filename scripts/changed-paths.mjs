import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
export function classify(paths){return {site:paths.some(p=>!p.startsWith('data/')),catalog:paths.some(p=>p.startsWith('data/')||p.startsWith('scripts/')||p.startsWith('.github/workflows/')||p==='public/catalog-model.mjs')};}
export function checkImageChanges(changes){
  for(const {status,file} of changes)if(file.startsWith('data/images/')&&status!=='A')throw Error('Catalog images are retained for cached releases: add a new filename and keep the old file instead of modifying/deleting '+file);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
  let plan;
  if(process.env.GITHUB_EVENT_NAME==='workflow_dispatch')plan={site:event.inputs?.deploy==='true',catalog:event.inputs?.catalog==='true'};
  else{
    const base=event.pull_request?execFileSync('git',['merge-base',event.pull_request.base.sha,event.pull_request.head.sha],{encoding:'utf8'}).trim():event.before;
    const head=event.pull_request?.head.sha||process.env.GITHUB_SHA;
    const args=base&& !/^0+$/.test(base)?['diff','--no-renames','--name-status','-z',base,head]:['diff-tree','--root','--no-commit-id','--name-status','-r','-z',head];
    const values=execFileSync('git',args,{encoding:'utf8'}).split('\0').filter(Boolean);const changes=[];
    for(let i=0;i<values.length;i+=2)changes.push({status:values[i],file:values[i+1]});
    checkImageChanges(changes);plan=classify(changes.map(c=>c.file));
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT,`site=${plan.site}\ncatalog=${plan.catalog}\n`);
  console.log(JSON.stringify(plan));
}
