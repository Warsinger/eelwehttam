import fs from 'node:fs';
const base='https://vanity-app-catalog.pages.dev/';
fs.cpSync('public','build/pages',{recursive:true});
const preview=process.env.PREVIEW_PR;
if(preview&&!/^[1-9][0-9]*$/.test(preview))throw new Error('Invalid preview PR');
const url=preview?`https://pr-${preview}.vanity-app-catalog.pages.dev/apps.json`:base+'apps.json';
fs.writeFileSync('build/pages/catalog-config.mjs',`export const catalogURL = ${JSON.stringify(url)};\n`);
fs.writeFileSync('build/pages/version.json',JSON.stringify({revision:process.env.GITHUB_SHA})+'\n');
