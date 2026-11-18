/* Keep bundled portraits attached to their actual player names.
 * Adding Rodinha's Nagi appearance must never overwrite Seishiro Nagi. */
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'web/assets/imported-portraits/index.json'),'utf8'));
const appFile=path.join(root,'web/app.js');
const source=fs.readFileSync(appFile,'utf8');
const pattern=/const BUNDLED_PORTRAITS=Object\.freeze\((\{[^;]+\})\);/;
const found=source.match(pattern);
if(!found)throw Error('Mapa de retratos não encontrado; nada alterado.');
const old=JSON.parse(found[1]);
const images=manifest.images;
const seen=new Set(),files=new Set();
const next={};
for(const item of images){
 if(typeof item.name!=='string'||!item.name||seen.has(item.name)||
    !/^[a-z0-9-]+\.jpg$/.test(item.file)||files.has(item.file))
  throw Error('Nome ou arquivo de retrato inválido: '+item?.name);
 seen.add(item.name);files.add(item.file);
 const local=path.join(root,'web/assets/imported-portraits',item.file);
 const bytes=fs.readFileSync(local);
 if(bytes.length<100||bytes.length>2_000_000||bytes[0]!==255||bytes[1]!==216||
    bytes.at(-2)!==255||bytes.at(-1)!==217)throw Error('JPEG inválido: '+item.name);
 next[item.name]='assets/imported-portraits/'+item.file;
}
// No pre-existing portrait may be silently remapped or removed.
for(const [name,url] of Object.entries(old))if(next[name]!==url)
 throw Error('Tentativa de mudar o retrato existente de '+name);
if(next['Seishiro Nagi']!==old['Seishiro Nagi'])
 throw Error('A foto do Seishiro Nagi original deve permanecer intacta.');
const replacement='const BUNDLED_PORTRAITS=Object.freeze('+JSON.stringify(next)+');';
const updated=source.replace(pattern,replacement);
if(updated!==source)fs.writeFileSync(appFile,updated);
console.log(`Catálogo sincronizado: ${images.length} retratos. Nagi original preservado.`);
