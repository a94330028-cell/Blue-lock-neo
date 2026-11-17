/* Blue Lock NEO 2.0 | 2,520 original procedural techniques.
 * No extra portrait downloads, RNG in saves, global stat inflation or replacement
 * of legacy abilities. Same deterministic catalogue on mobile and desktop.
 */
(function(root,factory){
 'use strict';
 const addon=factory();
 if(typeof module==='object'&&module.exports)module.exports=addon;
 if(root){
  root.Neo2AbilityExpansion=addon;
  if(root.NeoEngine?.Abilities)addon.install(root.NeoEngine.Abilities);
 }
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const RARITIES=['Comum','Incomum','Rara','Épica','Lendária','Mítica','Divina'];
 const CONTEXTS=['shot','dribble','pass','tackle','save'];
 const TITLES=['Treino','Tática','Elite','Avançada','Lenda','Mito','Divindade'];
 const VARIANTS=['Toque Curto','Ritmo Alto','Pressão Controlada','Leitura Dupla','Transição Rápida','Último Segundo'];
 const MOTIFS={
  shot:['Voleio Cruzado','Finalização Rasteira','Chute de Ângulo','Disparo de Primeira','Bicicleta Técnica','Chute Espiral','Ataque ao Rebote','Cabeceio Direcionado','Bola Colocada','Finalização Reversa','Chute na Corrida','Arremate de Precisão'],
  dribble:['Finta de Ombro','Giro de Corpo','Mudança de Direção','Condução Curta','Corte em Diagonal','Arrancada Lateral','Elástico Contínuo','Controle no Espaço','Drible de Proteção','Saída de Pressão','Ruptura de Marcação','Domínio de Calcanhar'],
  pass:['Passe Entrelinhas','Virada de Corredor','Tabela Triangular','Passe de Primeira','Assistência Longa','Passe Vertical','Lançamento Preciso','Passe no Vazio','Toque de Segurança','Passe em Profundidade','Distribuição Tática','Triangulação Curta'],
  tackle:['Bote Calculado','Corte de Linha','Pressão no Portador','Antecipação Central','Bloqueio de Chute','Cobertura de Espaço','Marcação Individual','Interceptação Rápida','Duelo Físico','Desarme em Pé','Proteção de Área','Defesa em Transição'],
  save:['Mergulho Rasteiro','Reflexo de Reação','Defesa no Alto','Bloqueio Próximo','Antecipação de Pênalti','Saída da Área','Defesa de Rebote','Fechamento de Ângulo','Desvio de Pontas','Defesa de Primeira','Leitura de Cruzamento','Mão de Segurança']
 };
 const STATS={
  shot:['finishing','accuracy','power','positioning'],
  dribble:['dribbling','control','acceleration','speed'],
  pass:['passing','vision','tactics','control'],
  tackle:['tackling','defense','tactics','strength'],
  save:['reflexes']
 };
 const KINDS={
  shot:['impact','spiral','predator','acro','aerial','dual'],
  dribble:['monster','speed','shadow','trap','burst','chameleon'],
  pass:['lines','link','radar','puzzle','spiral','flow'],
  tackle:['shield','radar','puzzle','shadow','predator','speed'],
  save:['wild','radar','shield','aerial','speed','ice']
 };
 const ROLES={
  shot:['ST','WING','MID','FB'],
  dribble:['ST','WING','MID','FB','DEF'],
  pass:['GK','DEF','FB','MID','WING','ST'],
  tackle:['GK','DEF','FB','MID'],
  save:['GK']
 };
 const CONDITIONS={
  normal:'Durante uma jogada compatível.',
  pressure:'Com um adversário por perto.',
  space:'Quando existe espaço para executar.',
  box:'Perto da área e em posição adequada.',
  'after-pass':'Após uma troca rápida de posse ou passe.',
  transition:'Em transição ou contra-ataque.',
  wing:'Pelos lados do campo.'
 };
 const CONTEXT_NAMES={shot:'Finalização',dribble:'Drible',pass:'Passe',tackle:'Marcação',save:'Defesa'};
 const ROLE_CONTEXT={GK:['save','pass'],DEF:['tackle','pass','dribble'],FB:['tackle','dribble','pass'],MID:['pass','dribble','shot','tackle'],WING:['dribble','shot','pass'],ST:['shot','dribble','pass']};
 const PALETTE=['#b9d7f0','#6ce2b9','#70baff','#ac81ff','#ffd077','#ff8ed3','#ffe38c'];
 const MIN_GAMES=[0,0,2,5,8,12,17];
 const MIN_IMPACT=[0,0,0,0,10,20,34];
 const BY_ROLE=new Map();
 const ADDED=[];
 let installed=null;
 const stableHash=(value)=>{let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h>>>0;};
 function generate(){
  const out=[];
  for(let tier=0;tier<RARITIES.length;tier++)
   for(const context of CONTEXTS)
    for(let motif=0;motif<12;motif++)
     for(let variant=0;variant<6;variant++){
      const trigger=['normal','pressure','space','box','after-pass','transition','wing'][(motif+variant)%7];
      const id='neo2-r'+tier+'-'+context+'-'+motif+'-'+variant;
      out.push({
       id,
       label:MOTIFS[context][motif]+' · '+VARIANTS[variant]+' ('+TITLES[tier]+')',
       rarity:RARITIES[tier],contexts:[context],category:CONTEXT_NAMES[context],
       stat:STATS[context][(motif+variant)%STATS[context].length],
       kind:KINDS[context][(motif+variant)%KINDS[context].length],
       color:PALETTE[tier],
       roles:ROLES[context],trigger,condition:CONDITIONS[trigger],
       multiplier:Number((1.06+tier*.105+(motif%5)*.006+variant*.007).toFixed(3)),
       cost:2+tier*2+(variant%3),
       cooldown:72+tier*102+((motif+variant)%5)*21,
       duration:28+tier*5+((motif+variant)%4)*5,
       tier,minGames:MIN_GAMES[tier],minPerformance:MIN_IMPACT[tier],
       requiresFlow:tier===6,
       description:'Arte '+CONTEXT_NAMES[context].toLowerCase()+' com '+VARIANTS[variant].toLowerCase()+'. '+CONDITIONS[trigger]+' Altera as chances e movimentos reais; não garante o lance.'
      });
     }
  return out;
 }
 function install(api){
  if(!api||typeof api.register!=='function'||typeof api.loadout!=='function'||typeof api.get!=='function')
   throw Error('Neo2 requires the original Blue Lock NEO Abilities engine');
  if(installed===api)return api;
  if(installed)throw Error('NEO 2.0 expansion cannot be installed on two different engines');
  const originalLoadout=api.loadout.bind(api);
  const originalCommon=api.commonCatalog.bind(api);
  const originalRarity=api.rarityCatalog.bind(api);
  const originalFull=api.fullCatalog.bind(api);
  const all=generate();
  for(const item of all){
   if(api.get(item.id))throw Error('Duplicate NEO 2.0 ability '+item.id);
   const actual=api.register(item);
   ADDED.push(actual);
   for(const role of actual.roles){
    const k=role+'|'+actual.rarity+'|'+actual.contexts[0];
    if(!BY_ROLE.has(k))BY_ROLE.set(k,[]);
    BY_ROLE.get(k).push(actual);
   }
  }
  const roleClass=api.roleClass.bind(api);
  api.loadout=function(name,role,index,career){
   const legacy=originalLoadout(name,role,index,career);
   const job=roleClass(role,index);
   const extras=[];
   const owned=career&&typeof career==='object'?career:{};
   for(const rarity of RARITIES)for(const context of ROLE_CONTEXT[job]||ROLE_CONTEXT.MID){
    const pool=BY_ROLE.get(job+'|'+rarity+'|'+context)||[];
    if(!pool.length)continue;
    // One deterministic signature per relevant action/rarity: no giant
    // 2,520-technique loadout, no character clone skill loops.
    const choice=pool[stableHash(name+'|'+job+'|'+context+'|'+rarity)%pool.length];
    const unlocked=rarity==='Comum'||api.rarityUnlocked(choice,owned);
    extras.push({...choice,locked:!unlocked});
   }
   return legacy.concat(extras);
  };
  api.available=function(name,role,index,career){
   return api.loadout(name,role,index,career).filter(item=>!item.locked);
  };
  api.commonCatalog=function(){return originalCommon().concat(ADDED.filter(x=>x.rarity==='Comum'));};
  api.rarityCatalog=function(){return originalRarity().concat(ADDED.filter(x=>x.rarity!=='Comum'));};
  api.fullCatalog=function(){return originalFull().concat(ADDED);};
  api.neo2CatalogStats=function(){
   return {added:ADDED.length,total:api.list().length,rarities:Object.fromEntries(RARITIES.map(r=>[r,ADDED.filter(a=>a.rarity===r).length]))};
  };
  installed=api;
  return api;
 }
 return Object.freeze({install,generate,rarities:RARITIES.slice(),added:()=>ADDED.slice(),count:2520});
});
