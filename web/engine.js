
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeoEngine = api;
})(typeof window !== 'undefined' ? window : undefined, function() {
'use strict';
const Attr=typeof globalThis!=='undefined'&&globalThis.NeoAttributes||require('./systems/attributes.js');
const Abilities=typeof globalThis!=='undefined'&&globalThis.NeoAbilities||require('./systems/abilities.js');
const Masters=typeof globalThis!=='undefined'&&globalThis.NeoMasters||require('./systems/masters.js');
const Progression=typeof globalThis!=='undefined'&&globalThis.NeoProgression||require('./systems/progression.js');
const PITCH = Object.freeze({ width:1920, height:1152, left:73, right:1847, top:59, bottom:1093, cx:960, cy:576, goalHalf:66, boxDepth:269, boxHalf:286 });
// Country colors for the league clubs (not an assumption about each player's passport).
const COUNTRY_KITS = Object.freeze({
  bm:{name:'Alemanha',flag:'🇩🇪',colors:['#161616','#e33f49','#f4cb4a'],abbr:'DE'},
  ba:{name:'Espanha',flag:'🇪🇸',colors:['#db3c40','#f7d659','#db3c40'],abbr:'ES'},
  mc:{name:'Inglaterra',flag:'🇬🇧',colors:['#f4f5fa','#ee4254','#f4f5fa'],abbr:'EN'},
  px:{name:'França',flag:'🇫🇷',colors:['#2b67d5','#f4f6ff','#ec5368'],abbr:'FR'},
  ub:{name:'Itália',flag:'🇮🇹',colors:['#2cb976','#fbfbf9','#db4851'],abbr:'IT'}
});
const TICK = 1/30;
const GAME_RATE = 18; // 5 minutes at 1x -> 90 minutes of game time
const MAX_SECONDS = 90*60; // base time, stoppage is added dynamically per half
const SKILLS = Object.freeze({
  'Gin Gagamaru':[{id:'wild',label:'Reflexos selvagens',effect:'Reação e alcance nas defesas'}],
  'Yoichi Isagi':[{id:'vision',label:'Visão espacial',effect:'Melhor desmarque e escolha de passes'},{id:'direct',label:'Chute direto',effect:'Finalização rápida'}],
  'Michael Kaiser':[{id:'impact',label:'Kaiser Impact',effect:'Chute potente e preciso'}],
  'Ranze Kurona':[{id:'link',label:'Jogo em dupla',effect:'Apoio e passes curtos'}],
  'Yo Hiori':[{id:'playmaker',label:'Passe cirúrgico',effect:'Passes incisivos'}],
  'Alexis Ness':[{id:'playmaker',label:'Passe técnico',effect:'Precisão na criação'}],
  'Meguru Bachira':[{id:'dribble',label:'Drible monstruoso',effect:'Rompe marcações'}],
  'Eita Otoya':[{id:'offball',label:'Movimentação furtiva',effect:'Ataca espaços livres'}],
  'Seishiro Nagi':[{id:'trap',label:'Domínio perfeito',effect:'Controle de bola no ataque'}],
  'Hyoma Chigiri':[{id:'sprint',label:'Velocidade explosiva',effect:'Arrancadas rápidas'}],
  'Reo Mikage':[{id:'copy',label:'Camaleão',effect:'Equilíbrio entre funções'}],
  'Rin Itoshi':[{id:'curve',label:'Chute colocado',effect:'Precisão no chute'}],
  'Ryusei Shido':[{id:'poacher',label:'Instinto de gol',effect:'Finalização na área'}],
  'Charles Chevalier':[{id:'playmaker',label:'Passe imprevisível',effect:'Criação e assistências'}],
  'Julian Loki':[{id:'sprint',label:'Velocidade divina',effect:'Arrancadas muito rápidas'}],
  'Tabito Karasu':[{id:'press',label:'Análise do rival',effect:'Pressão e recuperação'}],
  'Zantetsu Tsurugi':[{id:'sprint',label:'Arrancada',effect:'Velocidade de corrida'}],
  'Shoei Baro':[{id:'power',label:'Chute do rei',effect:'Potência em finalizações'}],
  'Don Lorenzo':[{id:'mark',label:'Zagueiro caçador',effect:'Marcação individual'}],
  'Oliver Aiku':[{id:'read',label:'Visão defensiva',effect:'Antecipação e desarmes'}],
  'Ikki Niko':[{id:'read',label:'Leitura de jogo',effect:'Antecipação e interceptação'}],
  'Marc Snuffy':[{id:'playmaker',label:'Estratégia perfeita',effect:'Passe e leitura tática'}],
  'Noel Noa':[{id:'impact',label:'Ambidestria',effect:'Precisão ofensiva'}],
  'Chris Prince':[{id:'power',label:'Corpo perfeito',effect:'Finalizações potentes'}],
  'Lavinho':[{id:'dribble',label:'Dança brasileira',effect:'Drible imprevisível'}],
  'Jingo Raichi':[{id:'press',label:'Marcação incansável',effect:'Aumenta a pressão no portador'}],
  'Kenyu Yukimiya':[{id:'dribble',label:'Corte explosivo',effect:'Muda de direção com bola'}],
  'Jyubei Aryu':[{id:'poacher',label:'Alcance aéreo',effect:'Ataca a bola alta na área'}],
  'Shuto Sendo':[{id:'poacher',label:'Chegada surpresa',effect:'Ataca o espaço livre'}],
  'Aoshi Tokimitsu':[{id:'power',label:'Força e aceleração',effect:'Protege a bola sob pressão'}],
  'Jin Kiyora':[{id:'link',label:'Passe de equilíbrio',effect:'Tabelas e passes rápidos'}],
  'Reiji Hiiragi':[{id:'playmaker',label:'Leitura inteligente',effect:'Encontra linhas de passe'}],
  'Agi':[{id:'trap',label:'Controle em profundidade',effect:'Domina passes longos'}],
  'Hajime Nishioka':[{id:'sprint',label:'Ruptura ofensiva',effect:'Ataca espaços livres'}],
  'Gurimu Igarashi':[{id:'press',label:'Pressão intensa',effect:'Disputa a segunda bola'}]
});
const FORMATIONS = Object.freeze({
  bm:[
    {role:'GOL',x:.045,y:.50}, {role:'LD',x:.19,y:.18}, {role:'ZAG',x:.15,y:.38},
    {role:'ZAG',x:.15,y:.62}, {role:'LE',x:.19,y:.82}, {role:'VOL',x:.34,y:.50},
    {role:'MC',x:.46,y:.34}, {role:'MEI',x:.50,y:.66}, {role:'PD',x:.68,y:.23},
    {role:'CA',x:.77,y:.50}, {role:'PE',x:.68,y:.77}
  ],
  ba:[
    {role:'GOL',x:.045,y:.50}, {role:'LD',x:.18,y:.18}, {role:'ZAG',x:.15,y:.38},
    {role:'ZAG',x:.15,y:.62}, {role:'LE',x:.18,y:.82}, {role:'VOL',x:.34,y:.50},
    {role:'MC',x:.45,y:.34}, {role:'MC',x:.45,y:.66}, {role:'PD',x:.69,y:.24},
    {role:'CA',x:.77,y:.50}, {role:'PE',x:.69,y:.76}
  ],
  mc:[
    {role:'GOL',x:.045,y:.50}, {role:'ZAG',x:.16,y:.24}, {role:'ZAG',x:.13,y:.50},
    {role:'ZAG',x:.16,y:.76}, {role:'ALA',x:.29,y:.17}, {role:'MC',x:.37,y:.42},
    {role:'MEI',x:.49,y:.60}, {role:'ALA',x:.29,y:.83}, {role:'PD',x:.67,y:.22},
    {role:'CA',x:.77,y:.50}, {role:'PE',x:.67,y:.78}
  ],
  px:[
    {role:'GOL',x:.045,y:.50}, {role:'LD',x:.18,y:.18}, {role:'ZAG',x:.15,y:.38},
    {role:'ZAG',x:.15,y:.62}, {role:'LE',x:.18,y:.82}, {role:'VOL',x:.33,y:.50},
    {role:'MC',x:.46,y:.35}, {role:'MEI',x:.51,y:.65}, {role:'PD',x:.66,y:.22},
    {role:'CA',x:.76,y:.43}, {role:'PE',x:.73,y:.69}
  ],
  ub:[
    {role:'GOL',x:.045,y:.50}, {role:'ZAG',x:.14,y:.24}, {role:'ZAG',x:.12,y:.50},
    {role:'ZAG',x:.14,y:.76}, {role:'VOL',x:.33,y:.50}, {role:'MC',x:.43,y:.39},
    {role:'ALA',x:.30,y:.82}, {role:'MEI',x:.54,y:.59}, {role:'ALA',x:.30,y:.18},
    {role:'CA',x:.73,y:.42}, {role:'SA',x:.72,y:.68}
  ]
});
const DEFAULT_FORMATION = [
 {role:'GOL',x:.045,y:.5}, {role:'LD',x:.19,y:.18}, {role:'ZAG',x:.15,y:.38},
 {role:'ZAG',x:.15,y:.62}, {role:'LE',x:.19,y:.82}, {role:'VOL',x:.35,y:.5},
 {role:'MC',x:.46,y:.32},{role:'MC',x:.46,y:.68}, {role:'PD',x:.68,y:.20},
 {role:'CA',x:.77,y:.5},{role:'PE',x:.68,y:.8}
];
// Individual playstyles adapt decision-making and off-ball movement, not scripted outcomes.
// Groupings for substitutions in this simulator; not official character assignments.
const BENCH_ROLE_HINTS=Object.freeze({
 'Bachman':'G','Teppei Neru':'D','Theo Sachs':'D','Jin Kiyora':'M','Erik Gesner':'M','Benedict Grim':'F','Gurimu Igarashi':'D',
 'Gomez':'D','Espresso':'M','Aiki Himizu':'M','Itsuki Wakatsuki':'M','Shizuka Haiji':'M','Tetsu Sokura':'D','Teru Kitsunezato':'F',
 'Driver':'M','Swift':'M','Arthur':'M','Kairu Saramadara':'D','Junichi Wanima':'F','Taiga Tsunzaki':'M',
 'Kento Cho':'F','Haruhiko Yuzu':'F','Akira Endoji':'M',
 'Gen Fukaku':'G','Abdi':'D','Kyohei Shiguma':'F','Yukio Ishikari':'D'
});
const roleGroup=(role)=>role==='GOL'?'G':(['ZAG','CB','LD','LE','RB','LB','ALA','LWB','RWB'].includes(role)?'D':['VOL','CDM','MC','CM','MEI','CAM'].includes(role)?'M':'F');
const PLAYER_STYLES = Object.freeze({
  'Yoichi Isagi':{kind:'space',label:'Leitura de espaços',sprint:1.05,shoot:.07},
  'Michael Kaiser':{kind:'finisher',label:'Finalizador decisivo',shoot:.12},
  'Meguru Bachira':{kind:'dribbler',label:'Drible e improviso',carry:1.13},
  'Seishiro Nagi':{kind:'first-touch',label:'Controle orientado',shoot:.10},
  'Hyoma Chigiri':{kind:'runner',label:'Ataque à profundidade',sprint:1.19},
  'Shoei Baro':{kind:'finisher',label:'Chute do rei',shoot:.17},
  'Rin Itoshi':{kind:'creator',label:'Ataque vertical',shoot:.10},
  'Ryusei Shido':{kind:'poacher',label:'Ataque à área',shoot:.12},
  'Charles Chevalier':{kind:'playmaker',label:'Passes inesperados'},
  'Yo Hiori':{kind:'playmaker',label:'Visão e passe vertical'},
  'Ranze Kurona':{kind:'overlap',label:'Ultrapassagens e tabelas'},
  'Reo Mikage':{kind:'connector',label:'Camaleão: criação e cobertura',playmaker:true,cover:true},
  'Ikki Niko':{kind:'anchor',label:'Cobertura posicional'},
  'Don Lorenzo':{kind:'stopper',label:'Marcação do craque'},
  'Oliver Aiku':{kind:'stopper',label:'Antecipação defensiva'},
  'Gin Gagamaru':{kind:'sweeper',label:'Goleiro-líbero'}
});

// v7.6 — perfis ficcionais do simulador. Não são atributos oficiais dos personagens.
const KEEPER_PROFILES=Object.freeze({
 'Gin Gagamaru':{id:'wild',name:'Instinto Selvagem',reach:1.16,reflex:.035,parry:.47,command:.12},
 'Moro':{id:'sweeper',name:'Goleiro-Líbero',reach:1.02,reflex:.005,parry:.26,command:.42},
 'Rook':{id:'aerial',name:'Senhor da Área',reach:1.10,reflex:.015,parry:.35,command:.24},
 'Renoir':{id:'reflex',name:'Reflexos Instantâneos',reach:1.07,reflex:.027,parry:.38,command:.17},
 'Canali':{id:'wall',name:'Muralha Italiana',reach:1.05,reflex:.020,parry:.23,command:.12},
 'Bachman':{id:'wall',name:'Posicionamento Seguro',reach:1.05,reflex:.010,parry:.24,command:.16},
 'Gen Fukaku':{id:'aerial',name:'Domínio Aéreo',reach:1.11,reflex:.010,parry:.31,command:.22}
});
function keeperProfile(name){return KEEPER_PROFILES[name]||{id:'balanced',name:'Equilibrado',reach:1,reflex:0,parry:.29,command:.17};}
const PLAYER_LOOKS = Object.freeze({
  'Yoichi Isagi':{hair:'#17253e',face:'#e7c29d',mark:'#49d1ff'},'Michael Kaiser':{hair:'#f3cd58',face:'#f1d0b1',mark:'#2ba6ff'},'Rensuke Kunigami':{hair:'#d3652d',face:'#f0c49e',mark:'#ff8d4d'},'Alexis Ness':{hair:'#8b6ae0',face:'#edd0bc',mark:'#c9b4ff'},
  'Meguru Bachira':{hair:'#111',face:'#f0caa4',mark:'#ffd84a'},'Otoya Eita':{hair:'#2f4d30',face:'#e8c39d',mark:'#85da8d'},'Lavinho':{hair:'#d8d8d8',face:'#c78e66',mark:'#ffe4a0'},
  'Seichiro Nagi':{hair:'#f4f4f4',face:'#efd7c2',mark:'#bfe8ff'},'Hyoma Chigiri':{hair:'#d25559',face:'#f4d0ba',mark:'#ffb0bf'},'Reo Mikage':{hair:'#8f5ad4',face:'#efcfbf',mark:'#d0b0ff'},'Chris Prince':{hair:'#f1cf63',face:'#ebc8a7',mark:'#ffd45a'},
  'Rin Itoshi':{hair:'#21446a',face:'#efd0b2',mark:'#5ab9ff'},'Ryusei Shidou':{hair:'#ff9dd5',face:'#efc2a6',mark:'#ff7abc'},'Tabito Karasu':{hair:'#544439',face:'#d7a37d',mark:'#d4a574'},'Nanase':{hair:'#b18b5f',face:'#ebc6a7',mark:'#d7c4a0'},'Loki':{hair:'#232323',face:'#b87b56',mark:'#6ad0ff'},
  'Shoei Baro':{hair:'#111',face:'#d9a07b',mark:'#e85f7d'},'Marc Snuffy':{hair:'#d7d7d7',face:'#c7936e',mark:'#f8d688'},'Don Lorenzo':{hair:'#7dd85f',face:'#d2a27c',mark:'#8dff69'},'Oliver Aiku':{hair:'#88683d',face:'#e1b48e',mark:'#91c8ff'},
  'Gin Gagamaru':{hair:'#57422c',face:'#d8ab81',mark:'#79c7ff'},
  'Seishiro Nagi':{hair:'#f3f1f7',face:'#efd7c2',mark:'#bed7ef'},
  'Ryusei Shido':{hair:'#e66ea6',face:'#e8b698',mark:'#ff82c1'},
  'Eita Otoya':{hair:'#263e34',face:'#e7be9c',mark:'#59ce91'},
  'Nijiro Nanase':{hair:'#ad8c58',face:'#edc7a4',mark:'#f3d28e'},
  'Charles Chevalier':{hair:'#cbd3da',face:'#ead0b7',mark:'#c7a7ff'},
  'Yo Hiori':{hair:'#bad5ea',face:'#efd0b8',mark:'#73caff'},
  'Jingo Raichi':{hair:'#d1c35f',face:'#e6bd96',mark:'#e8dc6c'},
  'Kenyu Yukimiya':{hair:'#312c31',face:'#e7c09a',mark:'#78adfc'}
});
function hashCode(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return Math.abs(h);}
function avatarTheme(name,teamColor='#3aa8ff'){const a=PLAYER_LOOKS[name];if(a)return a;const h=hashCode(name),skins=['#f1d1b2','#e9c09f','#d7a27c','#c78e66'],hairs=['#20242f','#663d2f','#a75d38','#c9c9d9','#7a4dd8','#325275'];return {hair:hairs[h%hairs.length],face:skins[h%skins.length],mark:teamColor};}
const REAL_PORTRAITS = Object.freeze({
  "Aiki Himizu": "https://i.postimg.cc/bwdK7dw4/Aiki-Himizu-anime.png",
  "Alexis Ness": "https://image.zeta-ai.io/profile-image/22615e9e-b544-4044-996b-c3b6ef7dce57/58ba1a6c-a925-422e-9c2e-07628d5a1a33/5a9851cf-4710-41cc-910d-5e7f11db7f94.jpeg",
  "Aoshi Tokimitsu": "https://cdn.myanimelist.net/images/characters/10/498305.jpg",
  "Charles Chevalier": "https://shapes.inc/api/public/avatar/charleschevalier-r45o",
  "Chris Prince": "https://i.pinimg.com/736x/8b/f5/40/8bf540d78fbbb2000361442250fbf65d.jpg",
  "Don Lorenzo": "https://i.pinimg.com/1200x/cd/0c/d1/cd0cd139a8033e32dcc3980003a52f6a.jpg",
  "Eita Otoya": "https://thicc-af.mywaifulist.moe/waifus/otoya-eita/F29aCEAlm0iHre7BrWeYWjhromhsbtRn2dPyvieJ.jpg?class=thumbnail",
  "Gen Fukaku": "https://anibase.net/files/f641c5c1b22ba592a3dc1755e5186578",
  "Gin Gagamaru": "https://thicc-uwu.mywaifulist.moe/waifus/gin-gagamaru/A29V6e9EUDyV0f7QehXVAJvOpKIIGbJDXPrnvAHg.jpg?class=thumbnail",
  "Gurimu Igarashi": "https://i.pinimg.com/originals/b1/af/06/b1af06194e63f885e91e8610c2c25310.jpg",
  "Hyoma Chigiri": "https://thicc-uwu.mywaifulist.moe/waifus/hyoma-chigiri/enh65bT0LkO6CZMQapkQAAftRevxQ4bQN0RZULkd.jpg?width=600",
  "Ikki Niko": "https://i.pinimg.com/originals/c1/eb/82/c1eb82a269ecffe8f502ad2f4131b5ac.jpg",
  "Jin Kiyora": "https://i.pinimg.com/736x/41/1d/80/411d80c1277bc618cbd7ad276e9ef797.jpg",
  "Jingo Raichi": "https://cdn.shopify.com/s/files/1/0602/3594/0066/files/e9cc5a2fb4763546c63a5b855a4c9e54.jpg?v=1680189063",
  "Julian Loki": "https://statico.soapcentral.com/editor/2025/12/212af-17649416854271.jpg",
  "Junichi Wanima": "https://i.pinimg.com/originals/6f/6f/ee/6f6feeaf4685fa618ca030feb871002b.jpg",
  "Jyubei Aryu": "https://www.animecharactersdatabase.com/uploads/chars/67712-882882867.png",
  "Kenyu Yukimiya": "https://i.pinimg.com/originals/68/de/35/68de35d25e83a48f996e16ae06f742dc.jpg",
  "Kyohei Shiguma": "https://i.pinimg.com/736x/92/1d/2a/921d2a8ba8b513ed4082219e39dc7df4.jpg",
  "Marc Snuffy": "https://i.pinimg.com/originals/3d/07/68/3d0768fe9444e3679f7dd82b3a91c19b.jpg",
  "Meguru Bachira": "https://pbs.twimg.com/media/FlIb-4DacAE3tKn.jpg",
  "Michael Kaiser": "https://times-abema.ismcdn.jp/mwimgs/a/3/1200w/img_a35b2fbef7a004c49fb4fae6292cc7281768215.jpg",
  "Miroku Darai": "https://cdn.anime-planet.com/characters/primary/miroku-darai-1.webp?t=1732822217",
  "Nijiro Nanase": "https://thicc-uwu.mywaifulist.moe/waifus/nijiro-nanase/GZnaKvPJrwa8poFlienDxpI4R5uo8mt4FwOV0PNd.jpg?width=600",
  "Noel Noa": "https://iweather.edu.vn/upload/2025/04/noel-011.webp",
  "Oliver Aiku": "https://i.pinimg.com/474x/37/a7/c2/37a7c2922eb48e3e781488771666751d.jpg",
  "Ranze Kurona": "https://thicc-af.mywaifulist.moe/waifus/ranze-kurona/3MLScxgAFKJrM50iWp2D35U02eDxp99VIlnSc6Ov.jpg?class=thumbnail",
  "Rensuke Kunigami": "https://i.pinimg.com/736x/93/dc/52/93dc52fb333b1d664ed288633b1b13ea.jpg",
  "Reo Mikage": "https://static.zerochan.net/Mikage.Reo.full.4510341.png",
  "Rin Itoshi": "https://times-abema.ismcdn.jp/mwimgs/a/0/-/img_a07638fe3ea985598e0c825a6962595b109517.jpg",
  "Ryusei Shido": "https://i.pinimg.com/originals/de/5e/e5/de5ee5106fa17deade907092f9cd0057.jpg",
  "Seishiro Nagi": "https://i.pinimg.com/originals/9a/3c/dc/9a3cdcad50598416eaf7666f38aaac0c.jpg",
  "Shingen Tanaka": "https://i.pinimg.com/originals/81/3a/5a/813a5a573440d643fb8e1c66176cceec.jpg",
  "Shoei Baro": "https://lain.bgm.tv/pic/crt/l/9b/ca/111743_crt_x1Xh3.jpg",
  "Shuto Sendo": "https://thicc-uwu.mywaifulist.moe/waifus/shuto-sendo/w3mH4NoCcJubDYiyQCWP80mfQGZf7udUj6kMKYxq.jpg?class=thumbnail",
  "Tabito Karasu": "https://thicc-uwu.mywaifulist.moe/waifus/tabito-karasu-blue-lock/ky4ThuEfzVSPYq4sR6jF3GO662c72mmi1kkGVBXg.jpg?width=600",
  "Taiga Tsunzaki": "https://thicc-uwu.mywaifulist.moe/waifus/taiga-tsunzaki/W5Ibd8DZXzmsFcpxFZBAjh9o6FasPvHKiwIFocMu.jpg?width=600",
  "Yo Hiori": "https://i.pinimg.com/originals/1a/1d/64/1a1d640ea8511dce04c0a2328670c5c8.jpg",
  "Yoichi Isagi": "https://www.crank-in.net/img/db/263060082188223_1200.jpg",
  "Zantetsu Tsurugi": "https://cdn.anime-planet.com/characters/primary/zantetsu-tsurugi-1.webp?t=1669459442"
});

function avatarSVG(name,teamColor='#3aa8ff'){
  const a=avatarTheme(name,teamColor),seed=hashCode(name),initials=name.split(' ').map(v=>v[0]).slice(0,2).join('').toUpperCase();
  const irises=['#48a7da','#3f844f','#876ac3','#765737','#555a71','#be7d59'],iris=irises[seed%irises.length];
  const hairType=seed%5,cut=hairType===0?'M11 30L17 16L29 11L44 14L54 30Q46 23 41 25L34 19L27 28L18 23Z':hairType===1?'M11 32Q9 12 31 10Q54 8 55 32L45 26Q36 16 24 25Z':hairType===2?'M12 34L16 14L28 10L37 14L52 10L55 31L44 25L31 21L24 30Z':hairType===3?'M10 35Q12 8 33 10Q50 10 55 34Q42 17 30 23L21 31Z':'M13 27Q22 8 40 12Q57 18 51 34L40 27L25 26Z';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${teamColor}"/><stop offset="1" stop-color="#0a152c"/></linearGradient><linearGradient id="kit" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${teamColor}"/><stop offset="1" stop-color="#0b1c36"/></linearGradient><clipPath id="circ"><circle cx="60" cy="60" r="57"/></clipPath></defs><circle cx="60" cy="60" r="59" fill="#d6eaff"/><g clip-path="url(#circ)"><rect width="120" height="120" fill="url(#bg)"/><path d="M0 101L30 80L47 75L73 75L89 80L120 101V120H0Z" fill="url(#kit)"/><path d="M42 79L60 96L78 79" fill="none" stroke="#ffffff99" stroke-width="4"/><path d="M54 75H66V93H54Z" fill="${a.face}"/><ellipse cx="60" cy="51" rx="27" ry="31" fill="${a.face}"/><path d="${hairType===0?'M33 48L39 30L52 22L72 26L89 39L87 50L78 40L65 37L54 44L42 39Z':hairType===1?'M33 47Q28 19 60 17Q92 17 88 51L76 37L59 33L43 40Z':hairType===2?'M31 52L35 23L48 16L61 24L73 17L87 26L90 51L75 38L62 41L46 37Z':hairType===3?'M34 49Q32 12 61 15Q88 17 88 47Q70 36 55 36L41 46Z':'M31 47Q43 17 70 18Q87 21 89 49L77 40L56 37L41 47Z'}" fill="${a.hair}"/><path d="M46 52Q51 49 56 52M64 52Q69 49 74 52" stroke="#263243" stroke-width="2" fill="none"/><ellipse cx="51" cy="54" rx="3" ry="3.5" fill="${iris}"/><ellipse cx="69" cy="54" rx="3" ry="3.5" fill="${iris}"/><circle cx="51" cy="54" r="1.3"/><circle cx="69" cy="54" r="1.3"/><path d="M59 58L57 67L62 68" fill="none" stroke="#b47966" stroke-width="2"/><path d="M52 74Q60 79 68 74" fill="none" stroke="#a2605b" stroke-width="2" stroke-linecap="round"/><rect x="78" y="82" width="24" height="21" rx="6" fill="#07172bbb"/><text x="90" y="96" font-family="Arial,sans-serif" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">${initials}</text></g><circle cx="60" cy="60" r="57" fill="none" stroke="#ffffffbb" stroke-width="3"/></svg>`;
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function avatarHTML(name,teamColor,cls='player-avatar'){
  const safe=String(name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const src=REAL_PORTRAITS[name]||avatarSVG(name,teamColor);
  return `<img class="${cls}" data-portrait="1" data-player-name="${encodeURIComponent(name)}" data-fallback="${avatarSVG(name,teamColor)}" src="${src}" alt="${safe}" loading="lazy">`;
}

const TEAMS = Object.freeze([
 {id:'bm',country:'Alemanha',name:'Bastard München',short:'BASTARD',crest:'BM',formationName:'4-3-3',formation:FORMATIONS.bm,color:'#22a7ff',dark:'#074c8e',accent:'#94dcff',atk:93,def:89,pas:92,style:'build',master:'Noel Noa',players:['Gin Gagamaru','Ranze Kurona','Mensah','Birkenstock','Kenyu Yukimiya','Jingo Raichi','Yo Hiori','Alexis Ness','Michael Kaiser','Yoichi Isagi','Rensuke Kunigami'],reserves:['Bachman','Teppei Neru','Theo Sachs','Jin Kiyora','Erik Gesner','Benedict Grim','Gurimu Igarashi']},
 {id:'ba',country:'Espanha',name:'FC Barcha',short:'BARCHA',crest:'BA',formationName:'4-3-3',formation:FORMATIONS.ba,color:'#f7b744',dark:'#a34b1c',accent:'#ffe2a8',atk:88,def:79,pas:93,style:'dribble',master:'Lavinho',players:['Moro','Ruiz','Urzaiz','Miroku Darai','Haru Hayate','Bos','So','Ignacio Lara','Eita Otoya','Picasso','Meguru Bachira'],reserves:['Gomez','Espresso','Aiki Himizu','Itsuki Wakatsuki','Shizuka Haiji','Tetsu Sokura','Teru Kitsunezato']},
 {id:'mc',country:'Inglaterra',name:'Manshine City',short:'MANSHINE',crest:'MC',formationName:'3-4-3',formation:FORMATIONS.mc,color:'#ff647d',dark:'#98295e',accent:'#ffbed0',atk:91,def:85,pas:86,style:'pace',master:'Chris Prince',players:['Rook','Damon','Busby','Kazuma Nio','Young','Reo Mikage','Reiji Hiiragi','Hyoma Chigiri','Agi','Seishiro Nagi','Hajime Nishioka'],reserves:['Driver','Swift','Arthur','Kairu Saramadara','Junichi Wanima','Taiga Tsunzaki']},
 {id:'px',country:'França',name:'PXG',short:'PXG',crest:'PX',formationName:'4-3-3',formation:FORMATIONS.px,color:'#ba85ff',dark:'#5235a4',accent:'#e2c8ff',atk:95,def:85,pas:91,style:'counter',master:'Julian Loki',players:['Renoir','Chapa','Gabin','Michelin','Aoshi Tokimitsu','Tabito Karasu','Nijiro Nanase','Charles Chevalier','Zantetsu Tsurugi','Rin Itoshi','Ryusei Shido'],reserves:['Kento Cho','Haruhiko Yuzu','Akira Endoji']},
 {id:'ub',country:'Itália',name:'Ubers',short:'UBERS',crest:'UB',formationName:'3-5-2',formation:FORMATIONS.ub,color:'#e7ecef',dark:'#6a707a',accent:'#ffffff',atk:90,def:97,pas:87,style:'defend',master:'Marc Snuffy',players:['Canali','Oliver Aiku','Don Lorenzo','Jyubei Aryu','Ikki Niko','Drago','Rico','Shuto Sendo','Peron','Shoei Baro','Shingen Tanaka'],reserves:['Gen Fukaku','Abdi','Kyohei Shiguma','Yukio Ishikari']}
]);
function mulberry32(seed) { let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;} }
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const length=(dx,dy)=>Math.hypot(dx,dy);
const distance=(a,b)=>length(a.x-b.x,a.y-b.y);
// External squads are exhibition/cup-only; the original Neo Egoist schedule
// continues to use the five immutable league teams (TEAMS).
const EXTRA_TEAMS=[];
const userCreatedPlayers=new Map();
const teamById=id=>TEAMS.find(t=>t.id===id)||EXTRA_TEAMS.find(t=>t.id===id);
const allTeams=()=>[...TEAMS,...EXTRA_TEAMS];
function registerTeam(team){
 if(!team||!/^[a-z][a-z0-9-]{2,18}$/.test(team.id||'')||!Array.isArray(team.players)||team.players.length!==11||!Array.isArray(team.reserves))throw Error('Elenco incompleto: 11 titulares e reservas obrigatórios.');
 if(teamById(team.id))return teamById(team.id);
 const fresh={...team,players:team.players.slice(),reserves:team.reserves.slice(),formation:team.formation||DEFAULT_FORMATION};
 EXTRA_TEAMS.push(fresh);return fresh;
}
function unregisterCreatedPlayer(id){
 const entry=userCreatedPlayers.get(id);if(!entry)return false;
 const t=teamById(entry.club);if(t){
   if(t.players[entry.slot]===entry.name)t.players[entry.slot]=entry.replaced;
   if(entry.previousRole&&t.formation?.[entry.slot])t.formation[entry.slot].role=entry.previousRole;
   const index=t.reserves.indexOf(entry.replaced);if(index>=0)t.reserves.splice(index,1);
 }
 userCreatedPlayers.delete(id);return true;
}
function registerCreatedPlayer(input){
 const name=String(input?.name||'').trim(),club=String(input?.club||'').trim();
 const role=String(input?.role||'MEI').toUpperCase(),t=teamById(club);
 if(!t||name.length<2||name.length>36||!['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'].includes(role))return null;
 const id=name+'|'+club;if(userCreatedPlayers.has(id))return userCreatedPlayers.get(id);
 if(allTeams().some(team=>[...team.players,...team.reserves,team.master].includes(name)))return null;
 const choice=t.formation||DEFAULT_FORMATION;
 const wanted=Attr.roleClass(role,role==='GOL'?0:1);
 let slot=choice.findIndex((f,i)=>i===0?wanted==='GK':Attr.roleClass(f.role,i)===wanted&&!userCreatedPlayersHasSlot(t.id,i));
 if(slot<0)slot=choice.findIndex((f,i)=>i>0&&!userCreatedPlayersHasSlot(t.id,i));
 if(slot<0)return null;
 const replaced=t.players[slot],previousRole=choice[slot].role;
 // Make the new position influence actual football decisions, not just the profile.
 if(t.formation===DEFAULT_FORMATION)t.formation=t.formation.map(f=>({...f}));
 t.formation[slot].role=role;
 t.players[slot]=name;t.reserves.push(replaced);
 const data={id,name,club,slot,replaced,previousRole,role,number:Math.max(1,Math.min(99,Number(input.number)||10)),foot:input.foot||'destro',style:input.style||'equilibrado',ovr:Math.max(60,Math.min(90,Number(input.ovr)||74))};
 userCreatedPlayers.set(id,data);Attr.registerPlayerRatings(name,data.ovr,{role,style:data.style,custom:true});return data;
}
function userCreatedPlayersHasSlot(club,slot){return [...userCreatedPlayers.values()].some(p=>p.club===club&&p.slot===slot);}
function listCreatedPlayers(){return [...userCreatedPlayers.values()].map(p=>({...p}));}

const has=(p,key)=>(SKILLS[p.name]||[]).some(v=>v.id===key);
const minLabel=t=>`${Math.min(90,Math.max(0,Math.floor(t/60)))}'`;
function rankQuality(t,axis){return (t[axis]-75)/25;}
function createSchedule(meetings=4) {
  const cycles=[2,4,6].includes(Number(meetings))?Number(meetings):4;
  // Four round-robins. Each pair meets four times, home and away twice; 20 rounds, two matches per round.
  const teams=TEAMS.map(t=>t.id),arr=[...teams,null],single=[];
  for(let r=0;r<5;r++) {
    const games=[];
    for(let k=0;k<3;k++){const a=arr[k],b=arr[5-k];if(a&&b)games.push({home:a,away:b});}
    single.push(games);arr.splice(1,0,arr.pop());
  }
  const rounds=[];
  for(let cycle=0;cycle<cycles;cycle++)for(let r=0;r<5;r++) {
    const games=single[r].map(({home,away})=>cycle%2?{home:away,away:home,result:null}: {home,away,result:null});
    rounds.push({round:cycle*5+r+1,games});
  }
  return {schema:2,rounds,format:{meetings:cycles},scorers:{},assists:{},goalLog:[],created:Date.now()};
}
function standings(season) {
  const rows=TEAMS.map(team=>({team,J:0,V:0,E:0,D:0,GP:0,GC:0,SG:0,PTS:0}));
  for(const round of season.rounds)for(const f of round.games){if(!f.result)continue;const a=rows.find(x=>x.team.id===f.home),b=rows.find(x=>x.team.id===f.away),[h,w]=f.result;
    a.J++;b.J++;a.GP+=h;a.GC+=w;b.GP+=w;b.GC+=h;
    if(h>w){a.V++;b.D++;a.PTS+=3}else if(h<w){b.V++;a.D++;b.PTS+=3}else{a.E++;b.E++;a.PTS++;b.PTS++;}}
  rows.forEach(r=>r.SG=r.GP-r.GC);
  return rows.sort((a,b)=>b.PTS-a.PTS||b.SG-a.SG||b.GP-a.GP||a.team.name.localeCompare(b.team.name));
}

// Ready-to-play tactical blueprints. Every new fixture draws independently for both teams.
// Randomness is seeded with each match so a given seed reproduces the same strategies.
const GAMEPLAN_TEMPLATES=Object.freeze([
  {name:'Posse paciente',pressure:'balanced',width:'normal',build:'patient',stance:'balanced',cross:'low',corner:'short'},
  {name:'Pressão sufocante',pressure:'high',width:'wide',build:'direct',stance:'attack',cross:'driven',corner:'near'},
  {name:'Contra-ataque',pressure:'low',width:'normal',build:'direct',stance:'defend',cross:'low',corner:'far'},
  {name:'Ataque pelas pontas',pressure:'balanced',width:'wide',build:'balanced',stance:'attack',cross:'high',corner:'far'},
  {name:'Defesa compacta',pressure:'low',width:'narrow',build:'patient',stance:'defend',cross:'low',corner:'short'},
  {name:'Vertical e agressivo',pressure:'high',width:'normal',build:'direct',stance:'attack',cross:'driven',corner:'mixed'},
  {name:'Tabelas pelo meio',pressure:'balanced',width:'narrow',build:'patient',stance:'balanced',cross:'mixed',corner:'near'},
  {name:'Movimentação fluida',pressure:'balanced',width:'wide',build:'direct',stance:'balanced',cross:'mixed',corner:'mixed'}
]);

class Match {
  constructor(homeId='bm', awayId='px', seed=Date.now(), careerPlayers=null, seasonContext=null) {
    if(!teamById(homeId)||!teamById(awayId)||homeId===awayId)throw new Error('Escolha duas equipes diferentes.');
    this.seed=seed>>>0;this.rand=mulberry32(this.seed);this.teams=[teamById(homeId),teamById(awayId)];
    // Pre-match coaching uses only genuine results; clones prevent league roster mutation.
    const Coach=(typeof globalThis!=='undefined'?globalThis.NeoCoach980:null);
    this.coachPlans=this.teams.map(t=>Coach?.planLineup?.(t,seasonContext,Attr)||null);
    this.teams=this.teams.map((t,i)=>this.coachPlans[i]?.changes.length?{...t,players:this.coachPlans[i].players.slice(),reserves:this.coachPlans[i].reserves.slice(),formation:(t.formation||DEFAULT_FORMATION).map(x=>({...x}))}:t);
    this.startingLineups=this.teams.map(t=>t.players.map((name,i)=>({name,role:(t.formation||DEFAULT_FORMATION)[i]?.role||'MC',slot:i})));
    this.coachDecisions=[];this.gameplayPreset='authentic';this.weather='clear';this.pressing=['balanced','balanced'];this.attackWidth=['normal','normal'];this.buildUp=['balanced','balanced'];this.half=1;this.halftimeDone=false;this.firstKickoffSide=0;this.addedTimeFirst=60+Math.floor(this.random()*121);this.addedTimeSecond=120+Math.floor(this.random()*121);this.firstHalfEnd=45*60+this.addedTimeFirst;this.fullTimeEnd=90*60+this.addedTimeSecond;
    this.careerPlayers=careerPlayers?.players||careerPlayers||{};this.careerLinks=careerPlayers?.links||{};this.careerRivals=careerPlayers?.rivals||{};this.masterStates=[null,null];this.pendingMasters=[false,false];this.masterEntries=[];this.masterRoll=[0,0];this.masterHidden=[];
    this.tactics=['balanced','balanced'];this.crossPreference=['mixed','mixed'];this.autoSubs=true;this.autoCoach=true;this.coachLocked=[false,false];this.subsUsed=[0,0];this.subWindowsUsed=[0,0];this.benchUsed=[[],[]];this.subRecords=[];this.retiredPlayers=[];this.pendingSubs=[null,null];this.lastCoachCheck=-180;this.setPieceStyle=['mixed','mixed'];this.lastSetPiece=null;this.cardRecords=[];this.time=0;this.phase='play';this.wait=0;this.nextKick=0;this.events=[];this.keyEvents=[];this.lastAction='';this.goalFlash=0;
    this.stats={shots:[0,0],onTarget:[0,0],passes:[0,0],completed:[0,0],possession:[0,0],tackles:[0,0],saves:[0,0],fouls:[0,0],offsides:[0,0],corners:[0,0],yellows:[0,0],xg:[0,0],runs:[0,0],overlaps:[0,0],boxRuns:[0,0],crosses:[0,0],crossLow:[0,0],crossDriven:[0,0],crossHigh:[0,0],cutbacks:[0,0],headers:[0,0],aerialWins:[0,0],dribbles:[0,0],dribblesWon:[0,0],oneTwos:[0,0],interceptions:[0,0],throughBalls:[0,0],keyPasses:[0,0],switches:[0,0],substitutions:[0,0],freeKicks:[0,0],directFreeKickShots:[0,0],goalKicks:[0,0],throwIns:[0,0],penalties:[0,0],penaltiesScored:[0,0],redCards:[0,0],advantages:[0,0],backpasses:[0,0],keeperDelays:[0,0],cornerShots:[0,0],heavyTouches:[0,0],counterAttacks:[0,0],pressingRecoveries:[0,0],invertedRuns:[0,0],halfSpaceRuns:[0,0],blindsideRuns:[0,0],thirdManRuns:[0,0],counterPressWaves:[0,0],restDefenceRecoveries:[0,0],carries:[0,0],progressiveCarries:[0,0],specialMoves:[0,0],specialMovesWon:[0,0],recycles:[0,0],sweeperRecoveries:[0,0],shotBlocks:[0,0],pressuredPasses:[0,0],setPieceRoutines:[0,0],flowAwakenings:[0,0],visionReads:[0,0],masterEntries:[0,0],defenderAttacks:[0,0],boxEntries:[0,0],boxShots:[0,0],longShots:[0,0],legendaryGoals:[0,0],keeperParries:[0,0],boxCombinations:[0,0],unionPlays:[0,0],soloRuns:[0,0],duelsWon:[0,0],abilityActivations:[0,0]};
    this.celebration=null;this.score=[0,0];this.actionEffects=[];this.specialMoments=[];this.lastMomentAt={};this.players=[];this.shotMap=[];this.finished=false;this.lastGoal=null;this.goalClips=[];this.goalRecords=[];this.lastSkill=null;this.skillEffects=[];this.abilityHistory=[];this.history=[];this.historyTimer=0;this.duelHistory=[];
    this.duelReads=Object.create(null);this.duelReadAlerts=Object.create(null);this.runPlannerTimer=0;this.lastPressWave=[-1000,-1000];this.lastPass=null;this.combination=null;this.possessionSide=-1;this.lastTurnover=[-999,-999];this.phaseCache=['build','block'];
    this.ball={x:PITCH.cx,y:PITCH.cy,vx:0,vy:0,owner:null,mode:'dead',by:null,to:null,lock:0,lastTouch:null,shotXg:0};
    this.seq=0;this._buildPlayers();this.firstKickoffSide=this.random()<.5?0:1;this.kickoff(this.firstKickoffSide);this.log('Apito inicial! A bola está rolando.','start');
  }

  // Fully automatic new-match setup. Leaves all player and fixture data intact.
  rollGameplan(){
    const choose=(items)=>items[Math.floor(this.random()*items.length)];
    const first=choose(GAMEPLAN_TEMPLATES);
    const second=choose(GAMEPLAN_TEMPLATES.filter(t=>t.name!==first.name));
    const picks=[first,second];
    this.planNames=picks.map(t=>t.name);
    this.pressing=picks.map(t=>t.pressure);
    this.attackWidth=picks.map(t=>t.width);
    this.buildUp=picks.map(t=>t.build);
    this.tactics=picks.map(t=>t.stance);
    this.crossPreference=picks.map(t=>t.cross);
    this.setPieceStyle=picks.map(t=>t.corner);
    this.coachLocked=[false,false];
    this.gameplayPreset=this.random()<.35?'fast':'authentic';
    const w=this.random();this.weather=w<.65?'clear':w<.87?'rain':'wind';
    this.autoGameplan=true;
    return {plans:[...this.planNames],preset:this.gameplayPreset,weather:this.weather};
  }
  random(){return this.rand();}
  range(a,b){return a+(b-a)*this.random();}
  pick(items){return items[Math.floor(this.random()*items.length)];}
  _emitSkill(p,label,kind='burst',ttl=70){
    if(!p||this.time<(p.skillFxCooldown||0))return false;
    p.skillFxCooldown=this.time+94;
    const fx={id:++this.seq,player:p.name,side:p.side,x:p.x,y:p.y,label,kind,start:this.time,until:this.time+ttl,success:true,dir:p.side===0?1:-1,lateral:p.baseY<PITCH.cy?-1:1};
    this.skillEffects.push(fx);if(this.skillEffects.length>35)this.skillEffects.shift();
    this.lastSkill={name:p.name,label,time:this.time};
    return true;
  }
  _attributes(p,key){
    const ovr=p.attributes?.ovr||75;
    // OVR now matters in every actual on-ball contest, not just in menus.
    const ovrFactor=clamp(1+(ovr-80)*.0075,.87,1.155);
    const multiplier=Abilities.bonus(p,key,this.time)*ovrFactor;
    let value=Attr.effective({...p,matchTime:this.time},key,multiplier);
    // Reo's Camaleão mirrors a fraction of his best teammate's technical skill
    // on real attempts only. It doesn't create possession, assists or goals.
    if(has(p,'copy')&&['passing','vision','tactics','control','dribbling','tackling','defense'].includes(key)){
      let peak=0;for(const q of this.players)if(q!==p&&q.side===p.side&&q.i!==0)peak=Math.max(peak,q.attributes?.[key]||0);
      value=Math.max(value,Math.min(99,peak*.96)*ovrFactor);
    }
    return value;
  }
  _activateAbility(p,context){
    // Cada atleta possui um arsenal extenso. IA seleciona a arma certa para o lance,
    // respeitando energia, recarga global, evolução, Flow e histórico de repetição.
    const career=this.careerPlayers[p.name+'|'+this.teams[p.side].id]||{};
    if(!p._arsenal||p._arsenalName!==p.name){p._arsenal=Abilities.available(p.name,p.role,p.i,career);p._arsenalName=p.name;}
    const arsenal=p._arsenal;
    const options=arsenal.filter(a=>Abilities.canActivate(p,a,this.time,context)&&Abilities.conditionMet(a,p,this,context));
    if(!options.length)return null;
    const fatigue=p.stamina<55?.50:p.stamina<72?.68:1;
    if(this.random()>.72*fatigue)return null;
    const nearGoal=Math.abs(p.x-(p.side===0?PITCH.right:PITCH.left));
    const last=p.abilityLastId;
    // Probabilidade ligada aos atributos e à ocasião: um passe não dispara um chute.
    const scored=options.map(a=>{
      const attr=this._attributes(p,a.stat),suitability=Math.min(1.5,Math.max(.65,attr/85));
      const prestige=a.rarity==='Divina'?1.5:a.rarity==='Mítica'?1.40:a.rarity==='Lendária'?1.30:a.rarity==='Épica'?1.20:a.rarity==='Rara'?1.10:a.tier===3?1.30:a.tier===2?1.12:1;
      const inArea=nearGoal<PITCH.boxDepth&&Math.abs(p.y-PITCH.cy)<PITCH.boxHalf;
      const tactical=(context==='shot'&&inArea&&['finishing','positioning'].includes(a.stat))?1.18:
        (context==='pass'&&a.stat==='vision'&&this.opponentPressure(p,60)>0)?1.16:
        (context==='dribble'&&a.stat==='acceleration'&&this.nearestOpponent(p).d<80)?1.15:1;
      const novelty=a.id===last?.28:1/(1+((p.abilityUses||{})[a.id]||0)*.035);
      return {a,weight:(.55+this.random()*.9)*suitability*prestige*tactical*novelty};
    }).sort((x,y)=>y.weight-x.weight);
    const ability=Abilities.activate(p,scored[0].a.id,this.time,context);if(!ability)return null;
    this.stats.abilityActivations[p.side]++;
    const fx={id:++this.seq,player:p.name,side:p.side,x:p.x,y:p.y,label:ability.label,kind:ability.kind,
      color:ability.color,abilityId:ability.id,start:this.time,until:this.time+ability.duration,success:true,
      dir:p.side===0?1:-1,lateral:p.baseY<PITCH.cy?-1:1};
    this.skillEffects.push(fx);if(this.skillEffects.length>45)this.skillEffects.shift();
    this.lastSkill={name:p.name,label:ability.label,id:ability.id,time:this.time};
    this.abilityHistory.push({name:p.name,team:this.teams[p.side].id,id:ability.id,label:ability.label,time:Math.floor(this.time),context});
    if(this.abilityHistory.length>160)this.abilityHistory.shift();
    this.log(`✦ ${p.name}: ${ability.label}!`,'skill',p.name);return ability;
  }
  _ego(p,delta,reason='jogada'){if(!p)return;
    const sensitivity=.7+(p.attributes?.ego||75)/250;p.ego=clamp((p.ego||0)+delta*sensitivity,0,100);
    if(p.ego>=88&&this.time>=(p.flowCooldown||0)&&p.flowUntil<this.time){
      p.flowUntil=this.time+185;p.flowCooldown=this.time+720;p.flowCount=(p.flowCount||0)+1;p.ego=25;
      this.stats.flowAwakenings[p.side]++;
      this.skillEffects.push({id:++this.seq,player:p.name,side:p.side,x:p.x,y:p.y,label:'FLOW — DESPERTAR',kind:'flow',color:'#b3ddff',start:this.time,until:this.time+115,success:true,dir:p.side===0?1:-1,lateral:1});
      if(this.skillEffects.length>40)this.skillEffects.shift();this.lastSkill={name:p.name,label:'FLOW — DESPERTAR',time:this.time};
      this.log(`⚡ FLOW! ${p.name} desperta após ${reason}!`,'flow',p.name);
    }
  }
  _masterEntry(side){const cfg=Masters.CONFIG[this.teams[side].id];if(!cfg||this.masterStates[side])return false;
    const slot=this.players.filter(p=>p.side===side&&p.i!==0&&p!==this.ball.owner&&p!==this.ball.to).sort((a,b)=>(b.i>=8?1:0)-(a.i>=8?1:0)||a.rating-b.rating)[0];if(!slot)return false;
    const hidden={...slot,run:null};const master={...slot,name:cfg.name,attributes:Attr.generate(cfg.name,slot.role,slot.i),
      isMaster:true,stamina:100,ego:65,flowUntil:0,flowCount:0,abilityCooldowns:{},activeAbility:null,activeAbilities:{},abilityUses:{},abilityGlobalUntil:0,skillFxCooldown:0,
      goals:0,assists:0,shots:0,pases:0,pasesOK:0,tackles:0,saves:0,dribblesWon:0,rating:7.5,
      speed:slot.speed*1.16,run:null};
    const index=this.players.indexOf(slot);this.players[index]=master;
    const remaining=this.fullTimeEnd-this.time;
    const baseDuration=Masters.WINDOW_SECONDS;
    const duration=Math.min(remaining,baseDuration);
    const record={side,master:cfg.name,out:slot.name,minute:Math.floor(this.time/60),start:this.time,until:this.time+duration,plannedSeconds:duration,ended:false,philosophy:cfg.philosophy};
    this.masterStates[side]={original:hidden,player:master,record,prior:{press:this.pressing[side],build:this.buildUp[side]}};
    this.masterHidden.push(hidden);this.masterEntries.push(record);this.stats.masterEntries[side]++;
    this.pressing[side]=cfg.pressure;this.buildUp[side]=cfg.build;
    this._emitSkill(master,`MASTER STRIKER — ${cfg.name}`,'master',115);
    this.log(`🌟 MASTER STRIKER! ${cfg.name} entra por ${Math.ceil(duration/60)} minutos no lugar de ${slot.name}!`,'master',cfg.name);
    return true;
  }
  _updateMasters(atStoppage=false){for(let side=0;side<2;side++){
    const state=this.masterStates[side];if(!state||this.time<state.record.until)continue;
    // Hard 45-minute cap: exit on this tick, not at an unknown later stoppage.
    const current=state.player,pos=this.players.indexOf(current);if(pos<0){this.masterStates[side]=null;continue;}
    const old=state.original;old.x=current.x;old.y=current.y;old.vx=current.vx;old.vy=current.vy;old.decision=.4;
    if(this.ball.owner===current){this.ball.owner=old;this.ball.lastTouch=old;this.ball.by=null;}
    this.players[pos]=old;this.masterHidden=this.masterHidden.filter(p=>p!==old);
    this.retiredPlayers.push({...current,run:null});state.record.ended=true;state.record.exitMinute=Math.floor(this.time/60);
    if(!this.coachLocked[side]){this.pressing[side]=state.prior.press;this.buildUp[side]=state.prior.build;}
    this.log(`🌟 ${current.name} encerra a janela Master Striker; ${old.name} retorna.`,'master',current.name);
    this.masterStates[side]=null;
  }}
  _buildPlayers(){
    for(let side=0;side<2;side++)for(let i=0;i<11;i++){
      const t=this.teams[side],formation=t.formation||DEFAULT_FORMATION,f=formation[i]||DEFAULT_FORMATION[i],x=PITCH.left+(PITCH.right-PITCH.left)*(side===0?f.x:1-f.x),y=PITCH.top+(PITCH.bottom-PITCH.top)*f.y,name=t.players[i];
      const s=has({name},'sprint')?1.16:1;const profile=PLAYER_STYLES[name];
      const attributes=Attr.generate(name,f.role,i,this.careerPlayers[name+'|'+t.id]);
      const speed=(i===0?80:97+(i>=8?7:0)+this.range(-3,3))*s*(profile?.sprint||1)*(.80+attributes.speed/375);
      this.players.push({id:side*11+i,side,i,name,role:f.role,keeperStyle:i===0?keeperProfile(name).name:null,attributes,ego:18+(attributes.ego||70)*.25,flowUntil:0,flowCooldown:0,flowCount:0,abilityCooldowns:{},activeAbility:null,activeAbilities:{},abilityUses:{},abilityGlobalUntil:0,saves:0,dribblesWon:0,interceptions:0,shotBlocks:0,aerialWins:0,duelsWon:0,keyPasses:0,x,y,baseX:x,baseY:y,vx:0,vy:0,speed,stamina:100,decision:.15,challenge:0,skillLock:0,goals:0,assists:0,shots:0,pases:0,pasesOK:0,tackles:0,rating:6.0,run:null,runCooldown:0,runCount:0,overlapCount:0,maxAdvance:0,distanceCovered:0,dribbleCooldown:0,dribbleShift:0,dribbleUntil:0,carryDistance:0,carryActive:false,skillAction:null,skillFxCooldown:0,insideBox:false,soloUntil:0,soloCooldown:0});
    }
  }
  _recordDuel(attacker,defender,winner,kind){
    if(!attacker||!defender||attacker.side===defender.side)return;
    this.duelHistory.push({minute:Math.floor(this.time/60),time:+this.time.toFixed(1),attacker:attacker.name,defender:defender.name,winner:winner.name,kind,side:winner.side});
    if(this.duelHistory.length>160)this.duelHistory.shift();
    winner.duelsWon=(winner.duelsWon||0)+1;
  }
  log(text,type='info',player=null){const e={id:++this.seq,minute:Math.min(90,Math.floor(this.time/60)),text,type,player};this.events.unshift(e);if(this.events.length>180)this.events.length=180;if(['goal','card','penalty','corner','freeKick','halftime'].includes(type))this.keyEvents.push(e);this.lastAction=text;}
  kickoff(side){
    this._applyPendingSubs();
    // Every kickoff resets each team wholly to its OWN half.
    // This applies after goals too. Dynamic attack is unrestricted once play resumes.
    this.players.forEach(p=>{
      const home=p.side===0;
      const cap=home?PITCH.cx-34:PITCH.cx+34;
      p.x=home?Math.min(p.baseX,cap):Math.max(p.baseX,cap);
      p.y=p.baseY;p.vx=p.vy=0;p.decision=.25;p.challenge=.25;p.run=null;p.runCooldown=0;p.carryActive=false;p.carryDistance=0;p.skillAction=null;
    });
    const taker=this.players.find(p=>p.side===side&&p.i===9)||this.players.find(p=>p.side===side&&p.i!==0)||this.players.find(p=>p.side===side);taker.x=PITCH.cx+(side===0?-15:15);taker.y=PITCH.cy;
    this.ball={x:taker.x,y:taker.y,vx:0,vy:0,owner:taker,mode:'carry',by:null,to:null,lock:0,lastTouch:taker,shotXg:0};
    this.runPlannerTimer=0;this.lastPass=null;this.combination=null;this.phase='play';this.wait=0;this.possessionSide=side;this.lastTurnover=[this.time,this.time];
  }
  phaseFor(side){
    const owner=this.ball.owner,last=this.ball.lastTouch,dir=side===0?1:-1;
    if(owner&&owner.side===side){
      if(this.time-this.lastTurnover[side]<7)return 'transition-attack';
      const prog=(owner.x-PITCH.cx)*dir;
      return prog<80?'build':'attack';
    }
    if(owner&&owner.side!==side)return this.time-this.lastTurnover[1-side]<5?'transition-defense':'block';
    if(last&&last.side===side)return 'transition-attack';
    return 'block';
  }
  currentPhases(){this.phaseCache=[this.phaseFor(0),this.phaseFor(1)];return this.phaseCache;}
  roleSlot(team, role){const formation=team.formation||DEFAULT_FORMATION;return formation.findIndex(v=>v.role===role);}
  centerBacks(side){const cache=this._movementShapeCache;if(cache&&cache.backs[side])return cache.backs[side];const backs=this.players.filter(p=>p.side===side&&(p.role==='ZAG'||p.role==='CB')).sort((a,b)=>a.baseY-b.baseY);if(cache)cache.backs[side]=backs;return backs;}
  fullbackLane(p){if(/ALA|LWB|RWB/.test(p.role))return 'wing';if(['LD','RB'].includes(p.role))return 'right';if(['LE','LB'].includes(p.role))return 'left';return null;}
  wingBias(p){if(['PD','RW'].includes(p.role))return -1;if(['PE','LW'].includes(p.role))return 1;return p.baseY<PITCH.cy?-1:1;}
  // Modern positional occupation, using team shape rather than moving everyone toward the ball.
  // Dynamic shapes are phase-specific, rather than the fixed starting formation.
  // These labels are paired with actual off-ball targets below.
  modernPattern(side){
    const cache=this._movementShapeCache;if(cache&&cache.patterns[side])return cache.patterns[side];
    const pattern=this._calculateModernPattern(side);if(cache)cache.patterns[side]=pattern;return pattern;
  }
  _calculateModernPattern(side){
    const ph=this.phaseFor(side),back3=this.centerBacks(side).length>=3;
    if(ph==='block')return back3?'5-3-2':this.pressing[side]==='low'?'4-5-1':'4-4-2';
    if(ph==='transition-defense')return back3?'5-4-1':'4-2-3-1';
    if(ph==='transition-attack')return back3?'3-4-3':'4-3-3';
    if(ph==='build')return back3?'3-4-3':this.buildUp[side]==='patient'?'4-2-3-1':'3-2-4-1';
    if(back3)return '3-2-5';
    return this.attackWidth[side]==='wide'&&this.buildUp[side]==='direct'?'2-3-5':'3-2-5';
  }
  modernPrinciple(side){
    const pattern=this.modernPattern(side),ph=this.phaseFor(side);
    if(ph==='transition-defense')return 'Perdeu a bola · recomposição';
    if(ph==='block')return this.pressing[side]==='low'?'Defesa baixa · linhas compactas':'Sem bola · linhas de marcação';
    if(ph==='transition-attack')return 'Recuperou a bola · atacando espaços';
    if(ph==='build')return 'Saída organizada · aproximações';
    return pattern==='2-3-5'?'Ataque posicional · laterais ofensivos':'Ataque posicional · corredores ocupados';
  }
  _defensivePositionalTarget(p,target,phase){
    if(p.i===0||p===this.ball.owner||p.run||this.phase!=='play'||!['block','transition-defense'].includes(phase))return target;
    const side=p.side,dir=side===0?1:-1,back3=this.centerBacks(side).length>=3;
    const pattern=this.modernPattern(side),progress=this.progress(side,this.ball.x);
    const back=clamp(progress-160,120,920),middle=clamp(back+155,280,1110),front=clamp(middle+180,390,1370);
    const centreBack=['ZAG','CB'].includes(p.role),fullback=['LD','LE','RB','LB'].includes(p.role);
    const wingback=['ALA','LWB','RWB'].includes(p.role),holder=['VOL','CDM'].includes(p.role);
    const middleRole=['MC','CM','MEI','CAM'].includes(p.role),winger=['PD','PE','RW','LW'].includes(p.role);
    const striker=['CA','ST','CF','SA'].includes(p.role),wingSign=p.baseY<PITCH.cy?-1:1;
    let x=target.x,y=target.y,blend=phase==='transition-defense'?.21:.34;
    if(centreBack){x=this.progressToX(side,back);y=PITCH.cy+(p.baseY-PITCH.cy)*.80;}
    else if(fullback){x=this.progressToX(side,back+14);y=PITCH.cy+wingSign*300;}
    else if(wingback){x=this.progressToX(side,back3?back+24:middle-12);y=PITCH.cy+wingSign*(back3?350:310);}
    else if(holder){x=this.progressToX(side,middle-24);y=PITCH.cy+wingSign*100;}
    else if(middleRole){x=this.progressToX(side,middle+(p.role==='MEI'||p.role==='CAM'?45:0));y=PITCH.cy+wingSign*133;}
    else if(winger){x=this.progressToX(side,middle+38);y=PITCH.cy+wingSign*(pattern==='4-5-1'?305:338);}
    else if(striker){x=this.progressToX(side,pattern==='5-4-1'||pattern==='4-5-1'?front-55:front);y=PITCH.cy+wingSign*(back3?66:50);}
    if(pattern==='4-4-2'&&['MEI','CAM'].includes(p.role)){x=this.progressToX(side,front-20);y=PITCH.cy+wingSign*68;}
    return {x:lerp(target.x,clamp(x,PITCH.left+38,PITCH.right-38),blend),y:lerp(target.y,clamp(y,PITCH.top+36,PITCH.bottom-36),blend)};
  }
  _modernPositionalTarget(p,target,phase,support){
    if(!support||this.time<9||p.i===0||p===this.ball.owner||p.run||this.phase!=='play')return target;
    if(!['build','attack','transition-attack'].includes(phase))return target;
    const side=p.side,dir=side===0?1:-1,ball=this.ball,prog=this.progress(side,ball.x);
    const wingSign=p.baseY<PITCH.cy?-1:1;
    const ballSign=ball.y<PITCH.cy?-1:1;
    const near=wingSign===ballSign;
    const centreBacks=this.centerBacks(side),threeBack=centreBacks.length>=3;
    const fullback=['LD','LE','RB','LB'].includes(p.role),wingback=['ALA','RWB','LWB'].includes(p.role);
    const holder=['VOL','CDM'].includes(p.role),middle=['MC','CM'].includes(p.role);
    const advanced=['MEI','CAM'].includes(p.role),wide=['PD','PE','LW','RW'].includes(p.role),striker=['CA','CF','ST','SA'].includes(p.role);
    const shape=this.modernPattern(side),backDepth=clamp(prog-165,130,625),pivotDepth=clamp(prog-80,225,740);
    const limit=this.offsideRunLimit(side),highDepth=clamp(prog+Math.max(92,Math.min(195,(prog-730)*.30)),390,Math.max(390,limit-11));
    const nearFullbackInverts=!threeBack&&['3-2-5','3-2-4-1'].includes(shape);
    const nearFB=nearFullbackInverts&&near;
    const isPivotMid=middle&&((threeBack&&p.i<=6)||(!threeBack&&shape==='2-3-5'&&p.i<=6));
    let desired=null,blend=.64;
    if(['ZAG','CB'].includes(p.role)){
      desired={x:this.progressToX(side,backDepth),y:PITCH.cy+(p.baseY-PITCH.cy)*(threeBack?.94:.70)};
      blend=phase==='build'?.80:.74;
    }else if(fullback){
      if(nearFB){
        desired={x:this.progressToX(side,pivotDepth),y:PITCH.cy+wingSign*61};blend=.76;
      }else if(shape==='2-3-5'&&near){
        const dep=clamp(prog+46,270,Math.max(300,limit-27));
        desired={x:this.progressToX(side,dep),y:PITCH.cy+wingSign*224};blend=.64;
      }else{
        // In a 4-2-3-1 build-up both fullbacks remain behind the ball.
        desired={x:this.progressToX(side,backDepth+14),y:PITCH.cy+wingSign*(shape==='4-2-3-1'?275:205)};blend=.79;
      }
    }else if(wingback){
      // Three-back teams use the wingbacks as providers of width, not extra defenders.
      const dep=clamp(prog+(near?83:47),355,Math.max(380,limit-12));
      desired={x:this.progressToX(side,dep),y:PITCH.cy+wingSign*255};blend=.74;
    }else if(holder){
      desired={x:this.progressToX(side,pivotDepth),y:PITCH.cy+((nearFullbackInverts&&!threeBack)?-ballSign*54:wingSign*49)};
      blend=.70;
    }else if(isPivotMid){
      desired={x:this.progressToX(side,pivotDepth+17),y:PITCH.cy+wingSign*67};blend=.70;
    }else if(middle||advanced){
      const dep=clamp(prog+(advanced?59:36),260,Math.max(315,limit-48));
      desired={x:this.progressToX(side,dep),y:PITCH.cy+wingSign*(advanced?105:93)};
      blend=.71;
    }else if(wide){
      const hasOverlappingFB=shape==='2-3-5'&&!threeBack&&near;
      const yOffset=hasOverlappingFB?126:245;
      desired={x:this.progressToX(side,clamp(highDepth+(near?0:15),320,Math.max(365,limit-14))),y:PITCH.cy+wingSign*yOffset};
      blend=.78;
    }else if(striker){
      const falseNine=this.buildUp[side]==='patient'&&prog<450&&p.role==='CA'&&Math.sin(this.time*.007+p.id)>0.68;
      const dep=falseNine?clamp(prog-20,300,670):clamp(highDepth+14,335,Math.max(365,limit-9));
      desired={x:this.progressToX(side,dep),y:PITCH.cy+(p.role==='SA'?wingSign*57:(ballSign*13))};blend=.73;
    }
    if(!desired)return target;
    return {x:lerp(target.x,desired.x,blend),y:lerp(target.y,desired.y,blend)};
  }
  roleXAdvance(role){return ({'ZAG':-12,'CB':-12,'VOL':20,'CDM':20,'MC':38,'CM':38,'MEI':58,'CAM':58,'ALA':52,'LWB':55,'RWB':55,'LD':42,'LE':42,'RB':42,'PD':82,'PE':82,'RW':82,'LW':82,'CA':88,'ST':88,'SA':76,'CF':76}[role]??34);}
  // Positions in metres-on-canvas along the team's attacking direction.
  progress(side,x){return (side===0?x-PITCH.left:PITCH.right-x);}
  progressToX(side,d){return side===0?PITCH.left+d:PITCH.right-d;}
  offsideRunLimit(side){
    const dir=side===0?1:-1,opponents=this.players.filter(p=>p.side!==side).map(p=>this.progress(side,p.x)).sort((a,b)=>b-a);
    // Second-last defender: runners should seek the line, not stand beyond it.
    const line=opponents[1]??750,ball=this.progress(side,this.ball.x);
    return clamp(Math.max(line-22,ball-14),390,PITCH.right-PITCH.left-55);
  }
  _runDestination(p,owner,type){
    const dir=p.side===0?1:-1,base=this.progress(p.side,p.x),ball=this.progress(p.side,owner.x),limit=this.offsideRunLimit(p.side),sign=p.baseY<PITCH.cy?-1:1;
    let forward=Math.max(base+70,ball+84),y=p.y;
    if(type==='overlap'){
      forward=Math.max(base+118,ball+128);
      y=sign<0?PITCH.top+40:PITCH.bottom-40;
    }else if(type==='byline'){
      forward=Math.max(base+140,ball+152);
      y=sign<0?PITCH.top+20:PITCH.bottom-20;
    }else if(type==='underlap'){
      forward=Math.max(base+96,ball+105);
      y=PITCH.cy+sign*93;
    }else if(type==='box'){
      forward=Math.max(base+100,ball+115);
      y=PITCH.cy+sign*52;
    }else if(type==='diagonal'){
      forward=Math.max(base+115,ball+124);
      y=PITCH.cy+sign*73;
    }else if(type==='channel'){
      forward=Math.max(base+122,ball+134);
      y=PITCH.cy+sign*132;
    }else if(type==='third-man'){
      forward=Math.max(base+102,ball+110);
      y=PITCH.cy+sign*61;
    }else if(type==='check'){
      forward=Math.max(base-56,ball-66);y=PITCH.cy+sign*36;
    }else if(type==='far-post'){
      forward=Math.max(base+89,ball+122);
      y=PITCH.cy+(owner.y<PITCH.cy?82:-82);
    }else if(type==='cutback'){
      forward=Math.max(base+66,ball+52);
      y=PITCH.cy+sign*44;
    }else if(type==='support'){
      forward=Math.max(base+22,ball-76);
      y=clamp(owner.y+sign*85,PITCH.top+58,PITCH.bottom-58);
    }else if(type==='half-space'){
      forward=Math.max(base+72,ball+79);
      y=PITCH.cy+sign*104;
    }else if(type==='inside-cut'){
      forward=Math.max(base+110,ball+99);
      y=PITCH.cy+sign*39;
    }else if(type==='late-box'){
      forward=Math.max(base+92,ball+81);
      y=PITCH.cy+sign*86;
    }else if(type==='blindside'){
      forward=Math.max(base+119,ball+134);
      y=PITCH.cy+(owner.y<PITCH.cy?1:-1)*63;
    }else if(type==='decoy'){
      forward=Math.max(base+108,ball+103);
      y=PITCH.cy+sign*180;
    }else if(type==='drop-off'){
      forward=Math.max(base-70,ball-36);
      y=PITCH.cy+sign*54;
    }
    const adv=clamp(forward,75,['check','support','drop-off'].includes(type)?Math.min(1320,limit):limit);
    return {x:clamp(this.progressToX(p.side,adv),PITCH.left+19,PITCH.right-19),y:clamp(y,PITCH.top+24,PITCH.bottom-24)};
  }
  _runType(p,owner){
    const role=p.role,profile=PLAYER_STYLES[p.name]?.kind,sideLane=(p.baseY<PITCH.cy?-1:1),nearLane=Math.sign(owner.y-PITCH.cy)===sideLane;
    if(['LD','LE','RB','LB','ALA','LWB','RWB'].includes(role)){
      const prog=this.progress(p.side,owner.x);
      if(nearLane&&prog>1050&&this.random()<.28)return 'byline';
      return nearLane?(this.random()<.76?'overlap':'underlap'):this.random()<.48?'underlap':'overlap';
    }
    const attackThird=this.progress(p.side,owner.x)>900;
    const wingBall=Math.abs(owner.y-PITCH.cy)>135;
    if(['MC','CM','MEI','CAM'].includes(role)){
      const r=this.random();
      if(attackThird&&wingBall)return r<.25?'late-box':r<.48?'cutback':r<.69?'box':r<.88?'half-space':'third-man';
      if(profile==='space'||profile==='runner')return r<.35?'half-space':'third-man';
      return r<.24?'support':r<.48?'half-space':r<.68?'box':'third-man';
    }
    if(['PD','PE','RW','LW'].includes(role)){
      const r=this.random();
      if(attackThird&&wingBall&&!nearLane)return r<.61?'far-post':'blindside';
      const prog=this.progress(p.side,owner.x);if(nearLane&&prog>1030&&r<.30)return 'byline';
      return r<.20?'inside-cut':r<.39?'half-space':r<.58?'blindside':r<.79?'channel':'diagonal';
    }
    if(['CA','ST','CF','SA'].includes(role)){
      const r=this.random();
      if(attackThird&&wingBall)return r<.36?'far-post':r<.63?'cutback':'blindside';
      if(profile==='first-touch'&&r<.16)return 'check';
      return r<.14?'drop-off':r<.35?'decoy':r<.64?'channel':'box';
    }
    return null;
  }
  // Plans persist across frames: a player actually sprints to a destination.
  _updateRunPlans(dt){
    const attackingSide=this.ball.owner?.side??(this.ball.mode==='pass'?this.ball.by?.side:-1);
    for(const p of this.players){if(p.run&&(
       attackingSide!==p.side||p===this.ball.owner||this.time>p.run.until||distance(p,p.run)<27)){
       p.run=null;p.runCooldown=this.time+64+this.random()*72;
    }}
    this.runPlannerTimer+=dt;
    if(this.runPlannerTimer<.52)return;
    this.runPlannerTimer=0;
    const owner=this.ball.owner;
    if(!owner||this.phase!=='play'||owner.i===0||this.time<9)return;
    const side=owner.side,phase=this.phaseFor(side),dir=side===0?1:-1;
    if(!['attack','build','transition-attack'].includes(phase))return;
    const progression=this.progress(side,owner.x),maxRunners=phase==='build'?3:phase==='attack'?5:4;
    const active=this.players.filter(p=>p.side===side&&p.run).length;
    if(active>=maxRunners)return;
    const eligible=this.players.filter(p=>p.side===side&&p.i>0&&p!==owner&&p.runCooldown<=this.time&&!p.run&&
      !['VOL','CDM','ZAG','CB'].includes(p.role));
    const ranked=eligible.map(p=>{
      const kind=PLAYER_STYLES[p.name]?.kind,wide=['LD','LE','RB','LB','ALA','LWB','RWB'].includes(p.role),mid=['MC','CM','MEI','CAM'].includes(p.role);
      const near=Math.abs(p.baseY-owner.y)<190;
      let weight=wide?(near?45:24):mid?38:48;
      if(kind==='runner'||kind==='overlap'||kind==='space'||kind==='poacher')weight+=24;
      if(kind==='connector'||kind==='playmaker')weight+=9;
      if(mid&&progression>650)weight+=8;
      if(wide&&progression>710)weight-=25;
      if(this.tactics[side]==='attack')weight+=9;
      if(this.tactics[side]==='defend')weight-=19;
      return {p,weight:weight+this.random()*35};
    }).sort((a,b)=>b.weight-a.weight);
    let slots=Math.min(maxRunners-active,phase==='build'?1:2);
    for(const item of ranked){if(slots<=0)break;
      const p=item.p,type=this._runType(p,owner);if(!type)continue;
      const dest=this._runDestination(p,owner,type);
      const span=this.progress(side,dest.x)-this.progress(side,p.x);
      if(!['check','support','cutback','drop-off'].includes(type)&&span<35)continue;
      if(this.random()>(phase==='build'?.66:.80))continue;
      p.run={type,x:dest.x,y:dest.y,started:this.time,until:this.time+this.range(45,90),originX:p.x,originY:p.y};
      p.runCount++;this.stats.runs[side]++;
      if(type==='overlap'||type==='underlap'||type==='byline'){p.overlapCount++;this.stats.overlaps[side]++;}
      if(['box','third-man','far-post','cutback','blindside','half-space','late-box','inside-cut'].includes(type))this.stats.boxRuns[side]++;
      if(type==='blindside')this.stats.blindsideRuns[side]++;
      if((type==='half-space'||type==='inside-cut'))this.stats.halfSpaceRuns[side]++;
      if(type==='third-man')this.stats.thirdManRuns[side]++;
      slots--;
      // Narrate only occasional runs; avoid 100 commentary lines per game.
      if(this.random()<.20){const label=type==='inside-cut'?'corta da ponta para o meio':type==='late-box'?'chega de trás na área':type==='overlap'?'faz a ultrapassagem':type==='underlap'?'infiltra por dentro':type==='box'?'ataca a área':type==='channel'?'ataca o corredor':type==='diagonal'?'corta em diagonal':type==='third-man'?'infiltra como terceiro homem':type==='far-post'?'ataca o segundo pau':type==='cutback'?'ataca a entrada da área':type==='support'?'abre uma linha de passe':type==='half-space'?'ocupa o meio-espaço':type==='blindside'?'ataca as costas da defesa':type==='decoy'?'arrasta a marcação':type==='drop-off'?'recua como falso nove':'recuou para tabelar';this.log(`🏃 ${p.name} ${label}!`,'run',p.name);}
    }
  }
  nearestOpponent(p){let best=null,bestD=1e10;for(const q of this.players)if(q.side!==p.side){const d=distance(p,q);if(d<bestD){bestD=d;best=q}}return {p:best,d:bestD};}
  opponentPressure(p,radius=54){let n=0;for(const q of this.players)if(q.side!==p.side&&q.i!==0&&distance(p,q)<radius)n++;return n;}
  safeLane(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy||1;let closest=999;
    for(const p of this.players)if(p.side!==a.side){const ratio=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/len2,0,1);if(ratio<=.03||ratio>=.97)continue;const d=length(p.x-a.x-ratio*dx,p.y-a.y-ratio*dy);closest=Math.min(closest,d);}
    return closest;
  }
  offside(receiver,passer){if(receiver.i===0)return false;const dir=passer.side===0?1:-1;
    if((receiver.x-PITCH.cx)*dir<=0 || (receiver.x-passer.x)*dir<=2)return false;
    const defense=this.players.filter(p=>p.side!==passer.side).map(p=>p.x).sort((a,b)=>dir===1?b-a:a-b);
    const penultimate=defense[1];return (receiver.x-penultimate)*dir>6;
  }
  passCandidate(p){
    const dir=p.side===0?1:-1;const t=this.teams[p.side];let ranked=[];
    for(const q of this.players){if(q.side!==p.side||q===p||q.i===0)continue;
      const d=distance(p,q);if(d<40||d>450)continue;
      const ahead=(q.x-p.x)*dir, lane=this.safeLane(p,q);
      const offside=this.offside(q,p);
      if(offside&&this.random()<.82)continue;
      let value=ahead*.10-d*.067+(lane>70?29:lane>37?17:lane>24?-5:-86)+(q.i>=8?9:0)+this.range(-16,16);
      if(this.buildUp[p.side]==='direct')value+=ahead*.085+(q.run?14:0)-(d<85?12:0);
      if(this.buildUp[p.side]==='patient')value+=d<165?24:-16;
      // Actual reading: intelligent players favour unmarked third-man runners.
      value+=(this._attributes(p,'vision')-75)*.29+(this._attributes(q,'positioning')-75)*.15;
      if(has(p,'playmaker')||has(p,'copy'))value+=has(p,'copy')?17:11;if(has(p,'vision'))value+=7;
      if(has(p,'copy')&&q.name==='Seishiro Nagi'&&lane>30&&ahead>50)value+=32; // real passing partnership
      if(has(q,'copy')&&this.progress(q.side,q.x)>250&&lane>33)value+=27; // central playmaking outlet
      if(t.style==='build'&&d<145)value+=13;
      if(t.style==='counter'&&ahead>90)value+=16;
      if(t.style==='dribble'&&d>220)value-=18;
      if(q.i>=8&&Math.abs(q.y-PITCH.cy)<150)value+=5;
      if(this.progress(p.side,p.x)>850&&this.progress(p.side,q.x)>PITCH.right-PITCH.left-PITCH.boxDepth-45&&Math.abs(q.y-PITCH.cy)<PITCH.boxHalf&&lane>25)value+=53; // pass into area
      const crowd=this.players.filter(k=>k.side!==p.side&&k.i>0&&distance(k,q)<88).length;
      value-=crowd*(this.buildUp[p.side]==='patient'?32:24);
      // Side-on receiving lanes, safe third-man outlets and goalkeeper distribution.
      // Runners remain possible, but marked receivers lose priority under pressure.
      if(q.run&&lane>35&&crowd===0)value+=15;
      if(p.i===0){value+=d<310&&lane>35?31:-22;value-=crowd*27;}
      if(this.progress(p.side,p.x)>740&&this.inOpponentBox(q)&&crowd===0)value+=26;
      if(lane<24&&d>200)value-=25;
      if(Math.abs(p.y-PITCH.cy)<130&&Math.abs(q.y-PITCH.cy)>155&&ahead>20)value+=17;
      if(q.run&&['far-post','byline','cutback','blindside','half-space','inside-cut','late-box'].includes(q.run.type))value+=20;
      if(['VOL','CDM','MC','CM','MEI','CAM'].includes(q.role)&&ahead<75&&ahead>-200&&this.opponentPressure(p,85)>0&&lane>30)value+=42; // recycle to pivot under pressure
      if(['PD','PE','LW','RW'].includes(q.role)&&Math.abs(q.y-PITCH.cy)>185&&Math.abs(p.y-PITCH.cy)<115)value+=12;
      if(q.run?.type==='decoy')value-=20; // draws defenders, not a prime direct pass target
      // Reward a purposeful run only if the passing lane remains viable.
      if(q.run&&q.run.type!=='check'&&lane>23)value+=19;
      if(q.run&&q.run.type==='check'&&d<230)value+=18;
      if(this.combination&&this.combination.partner===p&&q===this.combination.passer&&this.time<this.combination.until&&lane>18)value+=68;
      if(offside)value-=70;
      ranked.push({q,value,lane,d});
    }
    ranked.sort((a,b)=>b.value-a.value);return ranked[0]||null;
  }
  inOpponentBox(p){return this.progress(p.side,p.x)>PITCH.right-PITCH.left-PITCH.boxDepth&&Math.abs(p.y-PITCH.cy)<PITCH.boxHalf;}
  // Effects are generated only for real actions and never change the score by themselves.
  _actionFx(kind,player,x,y,label,side=player?.side??0){
    this.actionEffects.push({kind,side,player:player?.name||null,x,y,label,start:this.time,until:this.time+38});
    if(this.actionEffects.length>20)this.actionEffects.shift();
  }
  _moment(side,type,description,players=[]){
    if(this.time-(this.lastMomentAt[type+'|'+side]??-1000)<135)return false;
    this.lastMomentAt[type+'|'+side]=this.time;
    const item={type,side,minute:Math.floor(this.time/60),time:+this.time.toFixed(1),description,players:[...players]};
    this.specialMoments.unshift(item);if(this.specialMoments.length>38)this.specialMoments.pop();
    this.log(description,type==='duel'?'tackle':type==='union'?'pass':type==='solo'?'skill':'shot',players[0]||null);return true;
  }
  canShoot(p){const goal={x:p.side===0?PITCH.right:PITCH.left,y:PITCH.cy},d=distance(p,goal);
    const regular=p.i>=5||['VOL','CDM','MEI','CAM','CA','ST','CF','SA'].includes(p.role);
    const lateDefender=['ZAG','CB','LD','LE','RB','LB'].includes(p.role)&&this.time>74*60&&this.score[p.side]<this.score[1-p.side];
    return (regular||lateDefender)&&d<500&&Math.abs(p.y-PITCH.cy)<285;
  }
  shotQuality(p){
    const goal={x:p.side===0?PITCH.right:PITCH.left,y:PITCH.cy};const d=distance(p,goal),pressure=this.opponentPressure(p,49),angle=Math.abs(p.y-PITCH.cy);
    const tech=has(p,'impact')||has(p,'curve')||has(p,'poacher')||has(p,'power')||has(p,'direct');
    const skillBoost=tech?.038:0;
    return clamp(.08+(390-d)*.00070-angle*.00018-pressure*.012+skillBoost+(rankQuality(this.teams[p.side],'atk'))*.024,.016,.49);
  }
  _launch(p,targetX,targetY,power,mode,to=null){if(p?.i===0)p.handControl=false;const b=this.ball,dx=targetX-b.x,dy=targetY-b.y,d=length(dx,dy)||1;
    b.owner=null;b.by=p;b.lastTouch=p;b.to=to;b.mode=mode;b.vx=power*dx/d;b.vy=power*dy/d;b.lock=.13;b.setPiece=null;b.isPenalty=false;b.saveAttempted=false;b.blockChecked=[];b.shotStyle=null;p.decision=.45;if(mode!=='pass'&&mode!=='shot')this.lastPass=null;
  }
  pass(p,to){
    if(this.offside(to,p)) {this.stats.offsides[p.side]++;this.log(`🚩 Impedimento de ${to.name}!`,'offside',to.name);this._setRestart(1-p.side,to.x,to.y,'Impedimento');return;}
    this._activateAbility(p,'pass');
    const t=this.teams[p.side],pressure=this.opponentPressure(p,38),bonus=has(p,'copy')?.44:has(p,'playmaker')?.30:has(p,'vision')?.18:0;
    const pairId=[p.name,to.name].sort().join(' + ')+'|'+t.id;
    const chemistry=this.careerLinks[pairId]?.plays||0;
    const error=Math.max(2.4,(23-(t.pas-75)*.27-bonus*9-(this._attributes(p,'passing')-75)*.13-(this._attributes(p,'vision')-75)*.07-(this._attributes(p,'tactics')-75)*.035-Math.min(4,chemistry*.6)+pressure*3.1+(this.weather==='rain'?4.5:0)+(this.gameplayPreset==='fast'?-3:0))*(1-.21*Abilities.tacticalBonus(p,'pass',this.time)));
    const dir=p.side===0?1:-1,lead=to.run&&to.run.type!=='check'?clamp(to.speed*.30,10,31):0;
    const targetX=clamp(to.x+dir*lead+this.range(-error*.60,error*.60),PITCH.left+56,PITCH.right-56),targetY=clamp(to.y+this.range(-error*.62,error*.62),PITCH.top+65,PITCH.bottom-65);
    const through=!!to.run&&to.run.type!=='check'&&((to.x-p.x)*dir)>50;
    this._launch(p,targetX,targetY,clamp(distance(p,{x:targetX,y:targetY})*1.85+125,255,575),'pass',to);this.stats.passes[p.side]++;p.pases++;
    if(through)this.stats.throughBalls[p.side]++;
    this.lastPass={p,time:this.time,side:p.side};if((to.x-p.x)*(p.side===0?1:-1)>30)this._ego(p,.5,'passe');
    if((has(p,'playmaker')||has(p,'vision')||has(p,'link')||has(p,'copy'))&&this.random()<.19)this._emitSkill(p,has(p,'copy')?'CAMALEÃO: LEITURA DE JOGO':has(p,'vision')?'VISÃO ESPACIAL':has(p,'link')?'TABELA RELÂMPAGO':'PASSE CIRÚRGICO','vision',57);
    // Short pass followed by an active forward run: give-and-go, not an automatic return.
    if(!this.combination&&distance(p,to)<175&&p.i>0&&to.i>0&&this.progress(p.side,p.x)>240&&this.random()<.16){
      const forward=clamp(this.progress(p.side,p.x)+108,70,this.offsideRunLimit(p.side));
      const tx=this.progressToX(p.side,forward);
      p.run={type:'third-man',x:tx,y:clamp(p.y+(p.baseY<PITCH.cy?-22:22),PITCH.top+25,PITCH.bottom-25),started:this.time,until:this.time+86,originX:p.x,originY:p.y};
      p.runCount++;this.stats.runs[p.side]++;
      this.combination={passer:p,partner:to,side:p.side,until:this.time+95};
    }
    if(this.random()<.075)this.log(`${p.name} encontra ${to.name} com um passe.`,'pass',p.name);
  }
  cross(p,requestedType=null){
    const dir=p.side===0?1:-1;
    const options=this.players.filter(q=>q.side===p.side&&q!==p&&q.i>0&&
      this.progress(p.side,q.x)>PITCH.right-PITCH.left-500&&Math.abs(q.y-PITCH.cy)<PITCH.boxHalf&&!this.offside(q,p));
    if(!options.length)return false;
    const sideSign=p.y<PITCH.cy?-1:1;
    const posts=[PITCH.cy-sideSign*43,PITCH.cy+sideSign*52,PITCH.cy];
    options.sort((a,b)=>((b.run?34:0)+(b.i>=8?38:0)+(['CA','ST','CF','SA'].includes(b.role)?20:0)-distance(p,b)*.035)-((a.run?34:0)+(a.i>=8?38:0)+(['CA','ST','CF','SA'].includes(a.role)?20:0)-distance(p,a)*.035));
    let target=options[0];const farPost=this.random()<.41,postY=posts[farPost?1:0];
    const nearByline=this.progress(p.side,p.x)>PITCH.right-PITCH.left-380;
    const reachingByline=nearByline&&Math.abs(p.y-PITCH.cy)>150;
    const n=this.random(),preferred=this.crossPreference[p.side],type=requestedType||(preferred!=='mixed'&&this.random()<.74?preferred:(nearByline?(n<.30?'low':n<.58?'driven':'high'):(n<.23?'low':n<.54?'driven':'high')));
    const isCutback=reachingByline&&type==='low'&&this.random()<.42;
    if(isCutback){
      const late=options.filter(q=>['MC','MEI','VOL','SA','CAM','CM'].includes(q.role)&&this.progress(p.side,q.x)<this.progress(p.side,p.x)+16);
      if(late.length){late.sort((a,b)=>this.opponentPressure(a,65)-this.opponentPressure(b,65));target=late[0];}
    }
    const pressure=this.opponentPressure(p,55),error=(type==='low'?12:type==='driven'?18:25)+pressure*5;
    const targetY=clamp(target.y*(isCutback?.89:.56)+postY*(isCutback?.11:.44)+this.range(-error,error),PITCH.top+18,PITCH.bottom-18);
    const targetX=clamp(target.x+dir*(type==='high'?3:target.run?16:5)+this.range(-error,error),PITCH.left+20,PITCH.right-20);
    const power=type==='low'?this.range(360,430):type==='driven'?this.range(405,470):this.range(325,388);
    this._launch(p,targetX,targetY,power,type==='high'?'air':'pass',target);
    const b=this.ball;b.crossType=type;b.crossOrigin={x:p.x,y:p.y};
    if(type==='high'){
      b.airTotal=clamp(distance(p,{x:targetX,y:targetY})/power,.42,1.72);
      b.airTime=b.airTotal;b.height=0;
    }
    this.stats.passes[p.side]++;p.pases++;this.stats.crosses[p.side]++;
    this.stats[type==='low'?'crossLow':type==='driven'?'crossDriven':'crossHigh'][p.side]++;
    if(isCutback)this.stats.cutbacks[p.side]++;
    this.lastPass={p,time:this.time,side:p.side};
    const label=type==='low'?'cruzamento rasteiro':type==='driven'?'cruzamento forte':'cruzamento alto';
    this._actionFx('cross',p,p.x,p.y,type==='high'?'CRUZAMENTO!':isCutback?'ROLA PARA TRÁS!':'BOLA NA ÁREA!');
    this.log(isCutback?`🎯 ${p.name} chega à linha de fundo e rola para trás buscando ${target.name}!`:`🎯 ${p.name} faz ${label} buscando ${target.name}!`,'cross',p.name);
    return true;
  }
  _header(p){
    const b=this.ball,dir=p.side===0?1:-1,goalX=dir===1?PITCH.right:PITCH.left;
    const d=distance(p,{x:goalX,y:PITCH.cy}),skill=has(p,'poacher')||has(p,'trap')||PLAYER_STYLES[p.name]?.kind==='first-touch';
    const onTarget=this.random()<clamp(.48+(250-d)*.00075+(skill?.15:0),.22,.72);
    const aimY=onTarget?PITCH.cy+this.range(-PITCH.goalHalf+5,PITCH.goalHalf-5):PITCH.cy+(this.random()<.5?-1:1)*this.range(PITCH.goalHalf+12,110);
    const xg=clamp(.12+(252-d)*.00085+(skill?.07:0),.05,.38);
    this._launch(p,goalX+dir*38,aimY,this.range(420,530),'shot');
    b.onTarget=onTarget;b.shotXg=xg;b.height=0;b.airTime=0;b.crossType=null;b.shotStyle='header';
    this.stats.shots[p.side]++;this.stats.headers[p.side]++;if(this.lastPass?.setPiece==='corner')this.stats.cornerShots[p.side]++;this.stats.xg[p.side]+=xg;p.shots++;
    if(onTarget)this.stats.onTarget[p.side]++;
    this.shotMap.push({x:p.x,y:p.y,side:p.side,shooter:p.name,role:p.role,onTarget,xg:+xg.toFixed(3),outcome:'pending',header:true,style:'header',goal:false,minute:Math.floor(this.time/60)});
    if(this.inOpponentBox(p))this.stats.boxShots[p.side]++;
    this._actionFx('header',p,p.x,p.y,'CABECEIO!');
    if(this.random()<.18)this._moment(p.side,'aerial',`🪽 ${p.name} sobe mais alto que todo mundo e testa firme!`,[p.name]);
    this.log(`⚽ ${p.name} CABECEIA após cruzamento!`,'shot',p.name);
  }
  _aerialChallenge(b){
    // One contest on an airborne ball: height and players' relative positions matter.
    const inRange=this.players.filter(q=>q.i>0&&distance(q,b)<44);
    if(!inRange.length)return false;
    const ranked=inRange.map(q=>({q,score:(q.role==='ZAG'?18:0)+(q.i>=8?11:0)+(has(q,'poacher')?15:0)+(has(q,'trap')?7:0)+this.random()*30-distance(q,b)*.6})).sort((a,c)=>c.score-a.score);
    const winner=ranked[0].q;
    if(b.by?.side!==winner.side&&this.random()<.012){
      const ownGoal=winner.side===0?PITCH.left:PITCH.right;
      const inBox=Math.abs(winner.x-ownGoal)<PITCH.boxDepth&&Math.abs(winner.y-PITCH.cy)<PITCH.boxHalf;
      this.stats.fouls[winner.side]++;
      const offense=inBox?'Pênalti':'Falta';
      if(inBox)this.stats.penalties[1-winner.side]++;else this.stats.freeKicks[1-winner.side]++;
      this.log(`✋ Toque irregular com a mão de ${winner.name}: ${inBox?'PÊNALTI':'falta'} para ${this.teams[1-winner.side].short}!`,'foul',winner.name);
      this._setRestart(1-winner.side,winner.x,winner.y,offense);return true;
    }
    this.stats.aerialWins[winner.side]++;winner.aerialWins=(winner.aerialWins||0)+1;winner.rating=clamp(winner.rating+.045,5,10);this._actionFx('aerial',winner,winner.x,winner.y,'DISPUTA AÉREA');
    if(winner.side===b.by?.side&&this.progress(winner.side,b.x)>PITCH.right-PITCH.left-445&&this.random()<.90){this._header(winner);return true;}
    const dir=winner.side===0?1:-1;
    this._launch(winner,clamp(winner.x+dir*155,PITCH.left+18,PITCH.right-18),clamp(winner.y+this.range(-70,70),PITCH.top+17,PITCH.bottom-17),this.range(270,360),'clear');
    b.airTime=0;b.height=0;b.crossType=null;
    this.stats.interceptions[winner.side]++;winner.interceptions=(winner.interceptions||0)+1;
    this.log(`🛡️ ${winner.name} vence a bola aérea e afasta!`,'block',winner.name);
    this.lastPass=null;return true;
  }
  shoot(p){
    const dir=p.side===0?1:-1,goal={x:dir===1?PITCH.right:PITCH.left,y:PITCH.cy},xg=this.shotQuality(p),pressure=this.opponentPressure(p,47);
    const d=distance(p,goal),tech=has(p,'curve')||has(p,'impact')||has(p,'direct')||has(p,'poacher');
    const inside=this.inOpponentBox(p),quickBoxPlay=!!(inside&&this.lastPass&&this.lastPass.side===p.side&&this.lastPass.p!==p&&this.time-this.lastPass.time<60);
    const keeper=this.players.find(q=>q.side!==p.side&&q.i===0);
    const keeperAdvanced=!!(keeper&&Math.abs(keeper.x-goal.x)>95);
    const comingFast=quickBoxPlay&&this.time-this.lastPass.time<30;
    const angle=(p.y-PITCH.cy);
    // Comportamento situacional: nenhuma variante cria um gol automático.
    let kind='placed';
    if(inside){
      const roll=this.random();
      if((has(p,'trap')||has(p,'poacher')||quickBoxPlay)&&roll<(quickBoxPlay?.20:.11))kind='acrobatic';
      else if(keeperAdvanced&&roll<.35)kind='chip';
      else if(comingFast&&roll<.65)kind='first-time';
      else if(quickBoxPlay&&roll<.83)kind='box-combo';
      else if(d<125&&roll<.57)kind='tap-in';
      else if(roll<.72)kind='low-drive';
      else if(Math.abs(angle)>105&&roll<.91)kind='far-post';
      else kind='turn-shot';
    }else kind=d>350?'long':(this.random()<.38?'curve':'placed');
    const acrobatic=kind==='acrobatic';
    this._activateAbility(p,'shot');
    const accuracy=clamp(.44+(380-d)*.00066-pressure*.038+(tech?.08:0)+(inside?.14:0)+(quickBoxPlay?.08:0)+(acrobatic?.07:0)+
       (kind==='tap-in'?.09:kind==='first-time'?.035:kind==='chip'?-.035:kind==='far-post'?-.01:kind==='low-drive'?.03:0)+(this._attributes(p,'finishing')-77)*.0032+(this._attributes(p,'accuracy')-77)*.0021+(this._attributes(p,'positioning')-77)*.0014+Abilities.tacticalBonus(p,'shot',this.time)*.065,.19,.87);
    const onTarget=this.random()<accuracy*.89;
    let aimY;
    if(onTarget){
      if(kind==='far-post')aimY=PITCH.cy+(angle<0?1:-1)*this.range(PITCH.goalHalf*.42,PITCH.goalHalf-7);
      else if(kind==='low-drive')aimY=PITCH.cy+this.range(-PITCH.goalHalf*.45,PITCH.goalHalf*.45);
      else aimY=PITCH.cy+this.range(-PITCH.goalHalf+9,PITCH.goalHalf-9);
    }else aimY=PITCH.cy+(this.random()<.5?-1:1)*this.range(PITCH.goalHalf+10,135);
    const basePower=(has(p,'impact')?820:has(p,'power')?755:has(p,'poacher')?720:690);
    const power=(basePower+this.range(-25,25))*(kind==='tap-in'?.67:kind==='chip'?.70:kind==='low-drive'?1.08:kind==='first-time'?1.06:1)*(.84+this._attributes(p,'power')/410);
    this._launch(p,goal.x+dir*40,aimY,power,'shot');
    this.ball.shotStyle=kind;this.ball.shotLaunchX=p.x;this.ball.shotLaunchY=p.y;
    this.ball.onTarget=onTarget;this.ball.shotXg=xg;this.stats.shots[p.side]++;p.shots++;this.stats.xg[p.side]+=xg;this._ego(p,onTarget?3.5:-3,'finalização');
    if(kind==='box-combo'||kind==='first-time')this.stats.boxCombinations[p.side]++;
    this._actionFx(kind==='chip'?'chip':kind==='first-time'?'volley':kind==='acrobatic'?'acro-shot':kind==='low-drive'?'low-shot':kind==='tap-in'?'tap-in':'shot',p,p.x,p.y,kind==='chip'?'COBERTURA!':kind==='tap-in'?'EMPURRA PRO GOL!':kind==='first-time'?'DE PRIMEIRA!':kind==='acrobatic'?'ACROBACIA!':kind==='low-drive'?'RASTEIRO!':'FINALIZAÇÃO!');
    if(onTarget)this.stats.onTarget[p.side]++;
    this.shotMap.push({x:p.x,y:p.y,side:p.side,shooter:p.name,role:p.role,onTarget,xg:+xg.toFixed(3),pressure:+pressure.toFixed(2),outcome:'pending',header:false,style:kind,solo:p.soloUntil>this.time,goal:false,minute:Math.floor(this.time/60)});
    if(inside)this.stats.boxShots[p.side]++;else if(d>350)this.stats.longShots[p.side]++;
    if(inside&&quickBoxPlay&&this.random()<.19)this._moment(p.side,'legend',`🌪️ ${p.name} aparece dentro da área e finaliza num lance relâmpago!`,[p.name]);
    if(acrobatic)this._emitSkill(p,'FINALIZAÇÃO ACROBÁTICA','shot',91);
    if(this.lastPass&&this.lastPass.side===p.side&&this.lastPass.p!==p&&this.time-this.lastPass.time<145){this.stats.keyPasses[p.side]++;this.lastPass.p.keyPasses=(this.lastPass.p.keyPasses||0)+1;}
    if(tech||has(p,'power'))this._emitSkill(p,has(p,'impact')?'KAISER IMPACT':has(p,'direct')?'CHUTE DIRETO':has(p,'curve')?'CHUTE COLOCADO':has(p,'power')?'CHUTE DO REI':'FINALIZAÇÃO INSTINTIVA','shot',83);
    this.log(`⚽ ${p.name} ${({'tap-in':'completa a jogada de perto','chip':'tenta cobertura','far-post':'cruza o chute','low-drive':'bate rasteiro','turn-shot':'gira e finaliza','first-time':'bate de primeira','box-combo':'conclui a tabela','acrobatic':'arrisca finalização acrobática'})[kind]||'FINALIZA'}!${tech?' ✦ '+(SKILLS[p.name]?.find(s=>['curve','impact','direct','poacher'].includes(s.id))?.label||'Habilidade especial'):''}`,'shot',p.name);
  }
  _switchFlank(p){
    if(this.phase!=='play')return false;
    const currentY=p.y-PITCH.cy;
    if(Math.abs(currentY)<115||this.progress(p.side,p.x)>800)return false;
    const receivers=this.players.filter(q=>q.side===p.side&&q!==p&&q.i!==0&&
      (q.y-PITCH.cy)*currentY<0&&Math.abs(q.y-p.y)>235&&distance(q,p)<480&&
      !this.offside(q,p)&&this.safeLane(p,q)>20);
    if(!receivers.length)return false;
    receivers.sort((a,b)=>Math.abs(b.y-PITCH.cy)-Math.abs(a.y-PITCH.cy));
    const to=receivers[0],error=this.opponentPressure(p,48)*5+8;
    const tx=clamp(to.x+this.range(-error,error),PITCH.left+16,PITCH.right-16);
    const ty=clamp(to.y+this.range(-error,error),PITCH.top+16,PITCH.bottom-16);
    this._launch(p,tx,clamp(ty,PITCH.top+80,PITCH.bottom-80),clamp(distance(p,to)*1.8+100,320,580),'pass',to);
    this.stats.passes[p.side]++;this.stats.switches[p.side]++;p.pases++;
    this.lastPass={p,time:this.time,side:p.side};
    this.log(`↔️ ${p.name} inverte o jogo para ${to.name} na outra ponta!`,'pass',p.name);
    return true;
  }
  _ownerDecision(p){if(this.phase!=='play')return;const goalX=p.side===0?PITCH.right:PITCH.left,goalDist=distance(p,{x:goalX,y:PITCH.cy}),pressure=this.opponentPressure(p,50),candidate=this.passCandidate(p),profile=PLAYER_STYLES[p.name];
    // Players with excellent vision briefly expose opponent lanes, without predicting outcomes perfectly.
    if((p.attributes?.vision||0)>=93&&this.progress(p.side,p.x)>370&&this.time>(p.lastVisionRead||-999)+115){
      p.lastVisionRead=this.time;this.stats.visionReads[p.side]++;if(this.random()<.45)this._activateAbility(p,'pass');
    }
    if(p.i===0){
      const outlets=this.players.filter(q=>q.side===p.side&&q!==p&&q.i>0&&
        distance(p,q)<350&&!this.offside(q,p)&&this.safeLane(p,q)>34)
        .map(q=>({q,d:distance(p,q),crowd:this.opponentPressure(q,85)}))
        .sort((a,b)=>a.crowd-b.crowd||a.d-b.d);
      if(outlets.length&&this.random()<.88){this.pass(p,outlets[0].q);return;}
    }
    // Zagueiros pressionados às vezes recuam ao goleiro para reorganizar a posse.
    // O goleiro usa os pés neste caso; agarrar o recuo é uma infração separada.
    if(p.i!==0&&['ZAG','CB','LD','LE','RB','LB','VOL'].includes(p.role)&&
       this.progress(p.side,p.x)<620&&pressure>0&&this.random()<.095){
      const gk=this.players.find(q=>q.side===p.side&&q.i===0);
      if(gk&&distance(p,gk)<425){this.pass(p,gk);return;}
    }
    const tactical=this.tactics[p.side];const aggressive=tactical==='attack';const defensive=tactical==='defend';
    const inside=this.inOpponentBox(p),prog=this.progress(p.side,p.x);
    const soloType=['Shoei Baro','Meguru Bachira','Rin Itoshi','Michael Kaiser','Ryusei Shido','Hyoma Chigiri'].includes(p.name);
    const soloReady=soloType&&prog>470&&prog<1320&&p.soloCooldown<this.time&&p.ego>39;
    if(soloReady&&this.random()<(.095+(p.name==='Shoei Baro'?.10:p.name==='Meguru Bachira'?.065:0))){
      p.soloUntil=this.time+this.range(36,76);p.soloCooldown=this.time+this.range(290,520);
      this.stats.soloRuns[p.side]++;this._moment(p.side,'solo',`🔥 ${p.name} ignora a opção de passe e parte no um contra um!`,[p.name]);
    }
    const solo=p.soloUntil>this.time;
    // Long-range goals remain possible, but most attackers now seek the box before shooting.
    const takesShot=this.canShoot(p),shotChance=takesShot?clamp(.17+(370-goalDist)*.00070+pressure*.009+(p.i>=8?.045:0)+(aggressive?.040:0)-(defensive?.015:0)+(profile?.shoot||0)*.65+(this._attributes(p,'finishing')-75)*.0013,.045,.62)*(inside?1.62:goalDist>345?(solo?.31:.17):goalDist>270?.58:1):0;
    if(takesShot&&Math.abs(p.y-PITCH.cy)<265&&this.random()<shotChance){this.shoot(p);return;}
    if(solo&&goalDist>205&&pressure<2){p.decision=this.range(.55,.90);return;}
    const isWide=Math.abs(p.y-PITCH.cy)>230,closeToEnd=goalDist<495,progress=this.progress(p.side,p.x),nearCorner=progress>1150&&Math.abs(p.y-PITCH.cy)>240;
    const winger=['PE','PD','LW','RW','LE','LD','ALA','LWB','RWB','RB','LB'].includes(p.role);
    if(winger&&(nearCorner||(isWide&&closeToEnd))&&this.random()<(nearCorner?.48:(profile?.kind==='overlap'?.27:.18))){
      if(this.cross(p))return;
    }
    if(this.progress(p.side,p.x)>400&&this.progress(p.side,p.x)<1180&&Math.abs(p.y-PITCH.cy)>200&&this.opponentPressure(p,102)>0&&this.random()<.14){if(this._switchFlank(p))return;}
    const foe=this.nearestOpponent(p),dribbleSkill=has(p,'dribble')||profile?.kind==='dribbler'||profile?.kind==='runner';
    if(foe.p&&foe.d<94&&p.dribbleCooldown<=this.time&&this.random()<clamp((dribbleSkill?.53:.23)+(p.soloUntil>this.time?.19:0)+(this._attributes(p,'dribbling')-75)*.004, .11,.83)) {
      this.stats.dribbles[p.side]++;this.stats.specialMoves[p.side]++;
      const profiles={
        'Meguru Bachira':['Elástico','elastico'],'Seishiro Nagi':['Controle orientado','first-touch'],'Hyoma Chigiri':['Arrancada explosiva','burst'],
        'Michael Kaiser':['Finta de corpo','body-feint'],'Yoichi Isagi':['Corte e aceleração','cut'],'Rin Itoshi':['Giro e corte','roulette'],
        'Ryusei Shido':['Giro agressivo','roulette'],'Shoei Baro':['Arranque de força','burst'],'Reo Mikage':['Pedalada','stepover'],
        'Kenyu Yukimiya':['Elástico','elastico'],'Eita Otoya':['Corte de direção','cut'],'Zantetsu Tsurugi':['Aceleração','burst'],
        'Alexis Ness':['Pedalada','stepover'],'Rensuke Kunigami':['Proteção de bola','shield']
      };
      const kinds=[['Pedalada','stepover'],['Roleta','roulette'],['Corte seco','cut'],['Finta de corpo','body-feint']];
      // O defensor estuda o drible repetido; craques mudam o movimento quando são lidos.
      const readKey=p.id+'>'+foe.p.id+':';
      let move=profiles[p.name]||this.pick(kinds);
      const attempts=this.duelReads[readKey+move[1]]||0;
      if(attempts>=2){
        const alternatives=kinds.filter(k=>k[1]!==move[1]);
        alternatives.sort((a,b)=>(this.duelReads[readKey+a[1]]||0)-(this.duelReads[readKey+b[1]]||0));
        if(alternatives.length&&this.random()<.63)move=alternatives[0];
      }
      const reads=this.duelReads[readKey+move[1]]||0;
      this.duelReads[readKey+move[1]]=Math.min(30,reads+1);
      const anticipation=Math.min(.12,Math.max(0,reads-1)*.036);
      if(anticipation>.03&&!this.duelReadAlerts[readKey+move[1]]){
        this.duelReadAlerts[readKey+move[1]]=true;
        this.log(`🧠 ${foe.p.name} começa a antecipar o ${move[0]} de ${p.name}!`,'tackle',foe.p.name);
      }
      const lateral=p.y<=foe.p.y?-1:1;
      const fx={id:++this.seq,player:p.name,side:p.side,x:p.x,y:p.y,label:move[0],kind:move[1],start:this.time,until:this.time+83,success:false,dir:p.side===0?1:-1,lateral};
      this.skillEffects.push(fx);if(this.skillEffects.length>28)this.skillEffects.shift();
      p.skillAction=fx;
      this._activateAbility(p,'dribble');
      const skill=(dribbleSkill?.72:.42)+(this._attributes(p,'dribbling')-75)*.0032+(this._attributes(p,'control')-75)*.0010+(this._attributes(p,'acceleration')-75)*.0009+(this._attributes(p,'strength')-75)*.00045+Abilities.tacticalBonus(p,'dribble',this.time)*.085;
      const rivalId=[p.name,foe.p.name].sort().join(' × ');const rivalry=(this.careerRivals[rivalId]?.duels||0);
      const stopper=(has(foe.p,'mark')||has(foe.p,'read')?.16:0)+(this._attributes(foe.p,'tackling')-75)*.0024;
      const duelBoost=Math.min(.045,rivalry*.012);
      const success=this.random()<clamp(skill-stopper+duelBoost-anticipation+(foe.d-25)*.003,.19,.87);
      p.dribbleCooldown=this.time+52;
      if(success){
        fx.success=true;this._recordDuel(p,foe.p,p,'dribble');this.stats.dribblesWon[p.side]++;this.stats.specialMovesWon[p.side]++;p.dribblesWon++;this._ego(p,5,'drible bem-sucedido');
        p.dribbleShift=lateral*(move[1]==='elastico'?98:move[1]==='roulette'?84:move[1]==='burst'?35:70);
        p.dribbleUntil=this.time+(move[1]==='burst'?32:24);
        p.decision=this.range(.75,1.05);foe.p.challenge=.65;
        this.log(`✨ ${p.name} usa ${move[0].toUpperCase()} e supera ${foe.p.name}!`,'skill',p.name);
      }else{
        p.soloUntil=0;this._recordDuel(p,foe.p,foe.p,'dribble');this._ego(p,-6,'drible bloqueado');this._ego(foe.p,4,'desarme');this.ball.owner=foe.p;this.ball.lastTouch=foe.p;this.ball.by=null;this.ball.mode='carry';foe.p.decision=.2;
        this.possessionSide=foe.p.side;this.lastTurnover=[this.time,this.time];this.lastPass=null;
        this.stats.tackles[foe.p.side]++;foe.p.tackles++;foe.p.rating=clamp(foe.p.rating+.08,5,10);
        this.log(`🛡️ ${foe.p.name} neutraliza ${move[0]} de ${p.name}!`,'tackle',foe.p.name);
      }
      return;
    }
    // Complete a one-two only when the original passer is open.
    if(this.combination&&this.combination.partner===p&&this.time<this.combination.until){
      const q=this.combination.passer;
      if(q.side===p.side&&distance(p,q)<270&&this.safeLane(p,q)>20&&!this.offside(q,p)&&this.random()<.76){
        this.combination=null;this.stats.oneTwos[p.side]++;this.log(`🔁 TABELA! ${p.name} devolve para ${q.name} em movimento!`,'pass',p.name);
        this.pass(p,q);return;
      }
    }
    const dribbleBonus=has(p,'dribble')?.22:has(p,'sprint')?.07:0;
    const carryDrive=(p.i>=8?.22:p.i>=5?.12:.035)+(profile?.kind==='dribbler'?.20:0)+(profile?.kind==='runner'?.11:0)+(pressure===0?.09:0)-(p.stamina<70?.07:0);
    const safePass=!!candidate&&candidate.lane>28&&candidate.value>-42;
     // Modern teams retain possession instead of automatically forcing a long low-quality ball.
     const danger=(Math.abs(p.y-PITCH.cy)>PITCH.height*.34)?1:0;
     const passChance=clamp(.50+pressure*.16+(p.i<8?.14:0)-(this.teams[p.side].style==='dribble'?.10:0)-dribbleBonus+(defensive?.10:0)+(profile?.kind==='playmaker'?.16:0)+(profile?.kind==='connector'?.24:0)-(profile?.kind==='dribbler'?.15:0)+(this.buildUp[p.side]==='patient'?.18:this.buildUp[p.side]==='direct'?-.05:0)+(this.gameplayPreset==='fast'?-.05:0)-carryDrive+(danger?.18:0),.13,.94);
     if(candidate&&!safePass&&pressure>0){
       const backwards=this.players.filter(q=>q.side===p.side&&q!==p&&q.i>0&&!this.offside(q,p)&&distance(p,q)<310&&this.safeLane(p,q)>38)
         .sort((a,b)=>(this.progress(p.side,a.x)-this.progress(p.side,b.x)));
       if(backwards.length){this.pass(p,backwards[0]);this.stats.recycles[p.side]++;this.log(`🔄 ${p.name} recicla a posse em vez de rifar!`,'pass',p.name);return;}
     }
    if(candidate&&safePass&&this.random()<passChance){this.pass(p,candidate.q);return;}
    p.decision=this.range(.50,.94);if(profile?.kind==='dribbler'&&pressure>0&&this.time-(this.lastSkill?.time||-100)>220){this.lastSkill={name:p.name,label:profile.label,time:this.time};this.log(`✨ ${p.name} tenta superar a marcação no drible!`,'skill',p.name);}
  }
  _tacticTarget(p){
    const b=this.ball,side=p.side,dir=side===0?1:-1,owner=b.owner,team=this.teams[side],phase=this.phaseFor(side);
    const ownGoal=side===0?PITCH.left:PITCH.right;
    let shift=clamp((b.x-PITCH.cx)*.28,-126,126),x=p.baseX+shift,y=p.baseY+(b.y-p.baseY)*.10;
    const support=owner?.side===side||(!owner&&b.mode==='pass'&&b.by?.side===side);
    const lane=this.fullbackLane(p);
    const wingSide=this.wingBias(p);
    const build=phase==='build',attack=phase==='attack',transA=phase==='transition-attack',block=phase==='block',transD=phase==='transition-defense';
    if(this.tactics[side]==='attack')shift+=dir*52;
    if(this.tactics[side]==='defend')shift-=dir*52;
    x=p.baseX+shift;y=p.baseY+(b.y-p.baseY)*.12;
    if(p.i===0){
      x=ownGoal+dir*(phase==='build'?42:28+clamp(Math.abs(shift)*.08,0,16));
      y=clamp(b.y,PITCH.cy-84,PITCH.cy+84);
      // Anticipate shot trajectories without teleporting to the ball.
      if(b.mode==='shot'&&b.by&&b.by.side!==side&&b.vx*dir<0){
        const arrival=Math.abs((ownGoal+dir*18-b.x)/(Math.abs(b.vx)>1?b.vx:dir));
        const projected=clamp(b.y+b.vy*Math.min(1.1,arrival),PITCH.cy-PITCH.goalHalf+7,PITCH.cy+PITCH.goalHalf-7);
        x=ownGoal+dir*21;y=projected;
      }else if(!owner&&distance(p,b)<90){x=b.x;y=b.y;}
      else if(!owner&&['pass','loose','deflect','clear'].includes(b.mode)&&this.progress(side,b.x)<245){
        // A sweeper keeper can leave the line for a through ball, but only when the
        // last defender is not already closer and the ball is still in the area.
        const closest=this.players.filter(q=>q.side===side&&q.i!==0)
          .reduce((best,q)=>Math.min(best,distance(q,b)),Infinity);
        const drive=(side===0?b.vx<0:b.vx>0);
        if(drive&&closest>distance(p,b)*.75&&Math.abs(b.y-PITCH.cy)<PITCH.boxHalf+30){
          x=lerp(x,clamp(b.x,Math.min(ownGoal,ownGoal+dir*178),Math.max(ownGoal,ownGoal+dir*178)),.65);
          y=lerp(y,clamp(b.y,PITCH.cy-105,PITCH.cy+105),.68);
        }
      }
      return {x,y};
    }
    if(build&&support){
      if(p.role==='VOL'||p.role==='CDM'){
        const cbs=this.centerBacks(side),top=cbs[0],bot=cbs[cbs.length-1];
        if(top&&bot){x=(top.baseX+bot.baseX)/2+dir*4;y=(top.baseY+bot.baseY)/2;}
        else {x=p.baseX-dir*26;y=PITCH.cy;}
      }
      if(p.role==='ZAG'||p.role==='CB'){
        x+=dir*(p.baseY<PITCH.cy?-8:-8);
        y+=(p.baseY<PITCH.cy?-26:26);
      }
      if(lane==='right' || lane==='left' || lane==='wing'){
        x+=dir*(lane==='wing'?86:74);
        y=lane==='right'?Math.min(PITCH.cy-138,p.baseY-18):lane==='left'?Math.max(PITCH.cy+138,p.baseY+18):p.baseY;
      }
      if(['MC','CM','MEI','CAM'].includes(p.role)){
        x+=dir*(40+(p.role==='MEI'||p.role==='CAM'?15:0));
        y+=(p.baseY<PITCH.cy?-20:20);
      }
      if(['PD','PE','RW','LW'].includes(p.role)){
        x+=dir*46;y+=wingSide*clamp(PITCH.cy-p.baseY,-8,8);x-=dir*6;y+=wingSide*(wingSide<0?16:-16);
      }
      if(['CA','CF','ST'].includes(p.role)){
        x+=dir*12;y+=(PITCH.cy-p.y)*.06;
        x-=dir*24*Math.max(0,Math.sin(this.time*.009+p.id));
      }
      if(p.role==='SA')x+=dir*42;
    }
    if((attack||transA)&&support){
      x+=dir*(this.roleXAdvance(p.role)+6);
      if(['PD','PE','RW','LW'].includes(p.role)){
        x+=dir*10;y+=wingSide*(wingSide<0?22:-22);
        if(lane)y+=wingSide*10*Math.max(0,Math.sin(this.time*.006+p.id));
        if(this.progress(side,b.x)>620){y=wingSide<0?Math.min(y,PITCH.top+40):Math.max(y,PITCH.bottom-40);}
      }
      if(['CA','CF','ST'].includes(p.role)){
        x+=dir*18;y+=(PITCH.cy-p.baseY)*.12;
        const weave=Math.max(0,Math.sin(this.time*.011+p.id*.7));x-=dir*30*weave;y+=wingSide*14*weave;
      }
      if(['MEI','CAM'].includes(p.role)){x+=dir*16;y+=(p.baseY<PITCH.cy?-15:15);}
      if(['MC','CM'].includes(p.role)){x+=dir*12;y+=(p.baseY<PITCH.cy?-10:10);}
      if(lane==='right' || lane==='left' || lane==='wing'){
        x+=dir*24;y=lane==='right'?Math.min(PITCH.cy-148,p.baseY-30):lane==='left'?Math.max(PITCH.cy+148,p.baseY+30):y;
        if(this.progress(side,b.x)>640){y=lane==='right'?PITCH.top+28:lane==='left'?PITCH.bottom-28:y;}
      }
      if(p.role==='VOL'||p.role==='CDM'){x-=dir*6;}
    }
    if(block||transD){
      const defensiveOwner=owner&&owner.side!==side?owner:null;
      // Four distinct lines shift with play instead of all retreating to the six-yard box.
      const ballDepth=this.progress(side,b.x);
      const back=['ZAG','CB','LD','LE','RB','LB'].includes(p.role);
      const holder=['VOL','CDM'].includes(p.role);
      const mid=['MC','CM','MEI','CAM','ALA','LWB','RWB'].includes(p.role);
      const gap=back?(transD?157:164):holder?108:mid?77:36;
      const depth=clamp(ballDepth-gap,back?110:holder?175:mid?205:275,back?710:holder?790:mid?845:872);
      x=lerp(x,this.progressToX(side,depth),back?.75:holder?.65:mid?.54:.43);
      // Zonal lateral shape: hold two wings and a central lane, shift toward ball only partially.
      y=lerp(y,PITCH.cy+(p.baseY-PITCH.cy)*1.04+(b.y-PITCH.cy)*.12,.61);
      if(['PD','PE','RW','LW','ALA','LWB','RWB','LD','LE','RB','LB'].includes(p.role))y=lerp(y,p.baseY,.28);
      if(defensiveOwner){
        if(lane==='right')y=Math.min(y,PITCH.cy-104);
        if(lane==='left')y=Math.max(y,PITCH.cy+104);
      }
      if(defensiveOwner&&!back&&['CA','CF','ST','SA','PD','PE','RW','LW'].includes(p.role)){
        x=lerp(x,defensiveOwner.x-dir*38,.18);
      }
    }
    // Defenders mark dangerous off-ball runners while preserving the line.
    if((block||transD)&&owner?.side!==side&&this.progress(side,b.x)<415&&['ZAG','CB','LD','LE','RB','LB'].includes(p.role)){
      const candidates=this.players.filter(q=>q.side!==side&&q.i>0&&q!==owner&&
        ['CA','ST','CF','SA','PE','PD','LW','RW','MEI','CAM'].includes(q.role)&&
        Math.abs(q.y-p.baseY)<150&&Math.abs(q.x-ownGoal)<385);
      if(candidates.length){
        candidates.sort((a,b)=>distance(a,p)-distance(b,p));const mark=candidates[0];
        x=lerp(x,mark.x-dir*42,.30);y=lerp(y,mark.y,.28);
      }
    }
    // Distinct player identities: off-ball routes react to space and match phase.
    const profile=PLAYER_STYLES[p.name];
    if(support&&(build||attack||transA)&&profile&&p!==owner){
      const wave=Math.sin(this.time*.006+p.id*1.3);
      if(profile.kind==='space'){x+=dir*(22+wave*18);y+=(PITCH.cy-y)*.16;}
      if(profile.kind==='runner'||profile.kind==='overlap'){x+=dir*(26+wave*17);y+=(p.baseY<PITCH.cy?-14:14);}
      if(profile.kind==='poacher'){x+=dir*(24+Math.max(0,wave)*23);y+=(PITCH.cy-y)*.18;}
      if(profile.kind==='first-touch'){x+=dir*(12+wave*13);y+=(PITCH.cy-y)*.22;}
      if(profile.kind==='playmaker'||profile.kind==='connector'){x+=dir*8;y+=(PITCH.cy-y)*.22;}
      if(profile.kind==='anchor'){x-=dir*18;}
    }
    if((block||transD)&&profile?.kind==='stopper'&&owner&&owner.side!==side){x=lerp(x,owner.x-dir*30,.19);y=lerp(y,owner.y,.19);}
    // When a back/wingback overlaps, its winger moves inside to release the lane.
    if(support&&['PD','PE','RW','LW'].includes(p.role)){
      const overlapper=this.players.find(q=>q.side===side&&q.run&&(q.run.type==='overlap'||q.run.type==='underlap')&&Math.sign(q.baseY-PITCH.cy)===Math.sign(p.baseY-PITCH.cy));
      if(overlapper){y=lerp(y,PITCH.cy+(p.baseY<PITCH.cy?-62:62),.68);x+=dir*22;}
    }
    if(support&&p.run&&p!==owner){
      // Keep the destination persistent, but react laterally if the ball changes wings.
      x=lerp(x,p.run.x,.93);y=lerp(y,p.run.y,.93);
    }
    if(!owner&&b.mode==='pass'&&b.to===p){x=b.x+b.vx*.24;y=b.y+b.vy*.24;}
    // Instructions act on shape, not just probability: narrow teams offer central combinations;
    // wide teams stretch opponents and open genuine byline lanes.
    const width=this.attackWidth[side]||'normal';
    const wideRole=['PD','PE','RW','LW','LD','LE','RB','LB','ALA','RWB','LWB'].includes(p.role);
    if(support&&wideRole&&p!==owner){
      if(width==='wide')y=lerp(y,p.baseY<PITCH.cy?PITCH.top+58:PITCH.bottom-58,.40);
      else if(width==='narrow')y=lerp(y,PITCH.cy+(p.baseY<PITCH.cy?-78:78),.38);
    }
    // Midfield support triangle: offer a short pass and a diagonal without parking on the ball.
    if(support&&p!==owner&&!p.run&&owner&&owner.side===side&&
       ['VOL','CDM','MC','CM','MEI','CAM'].includes(p.role)&&this.progress(side,owner.x)>200&&
       Math.abs(p.x-owner.x)<235){
      const nearMid=this.players.filter(q=>q.side===side&&q!==owner&&
         ['VOL','CDM','MC','CM','MEI','CAM'].includes(q.role)).sort((a,b)=>distance(a,owner)-distance(b,owner));
      const slot=nearMid.indexOf(p);
      if(slot>=0&&slot<2){
        const sgn=slot===0?-1:1;
        const tx=clamp(owner.x-dir*(slot===0?92:36),PITCH.left+36,PITCH.right-36);
        const ty=clamp(owner.y+sgn*(slot===0?118:136),PITCH.top+62,PITCH.bottom-62);
        x=lerp(x,tx,.38);y=lerp(y,ty,.46);
      }
    }
    if((block||transD)&&owner?.side!==side){
      const press=this.pressing[side]||'balanced';
      if(press==='high'&&['CA','ST','CF','SA','PD','PE','MEI','CAM','MC'].includes(p.role)){
        x=lerp(x,owner?owner.x-dir*38:x,.18);y=lerp(y,b.y,.09);
      }
      if(press==='low'){x=lerp(x,ownGoal+dir*(p.i>=8?300:p.i>=5?225:135),.35);y=lerp(y,PITCH.cy+(p.baseY-PITCH.cy)*.82,.22);}
    }
    // Rest-defence 3+2, inverted fullbacks, half-space midfielders and far-side width.
    const modern=this._modernPositionalTarget(p,{x,y},phase,support);
    const defensive=this._defensivePositionalTarget(p,modern,phase);
    x=defensive.x;y=defensive.y;
    // Defenders read the trajectory and step into its lane; physical contact
    // with the moving ball remains necessary for an actual block.
    if(b.mode==='shot'&&b.by?.side!==side&&['ZAG','CB','VOL','CDM'].includes(p.role)&&
       this.progress(side,p.x)<310&&Math.abs(b.vx)>70){
      const projectedY=b.y+(p.x-b.x)*b.vy/b.vx;
      if(Number.isFinite(projectedY)&&Math.abs(projectedY-p.y)<115&&
         (p.x-b.x)*b.vx>0&&Math.abs(p.x-b.x)<255){
        y=lerp(y,clamp(projectedY,PITCH.top+35,PITCH.bottom-35),.57);
        x=lerp(x,p.x,.65);
      }
    }
    // At the end, one centre-back joins the attack if behind. Another CB stays, pivot covers.
    const latePush=this.time>78*60&&this.score[side]<this.score[1-side]&&support&&owner?.side===side;
    if(latePush&&['ZAG','CB'].includes(p.role)){
      const cb=this.centerBacks(side);if(cb[0]===p){x=lerp(x,owner.x-dir*165,.58);y=lerp(y,PITCH.cy+(p.baseY-PITCH.cy)*.2,.35);
        if(!p.lateRunLogged&&this.progress(side,p.x)>PITCH.width*.46){p.lateRunLogged=true;this.stats.defenderAttacks[side]++;this.log(`⬆️ ${p.name} avança, buscando o empate!`,'run',p.name);}
      }else{x=lerp(x,ownGoal+dir*270,.45);}
    }
    if(latePush&&['VOL','CDM'].includes(p.role))x=lerp(x,ownGoal+dir*320,.48);
    return {x:clamp(x,PITCH.left+22,PITCH.right-22),y:clamp(y,PITCH.top+34,PITCH.bottom-34)};
  }
  // Target-space avoidance spreads team-mates before their movement becomes a collision.
  _laneSpacingTarget(p,target){
    if(p.i===0||p===this.ball.owner)return target;
    let ax=0,ay=0;
    for(const q of this.players){
      if(q===p||q.side!==p.side||q.i===0)continue;
      const dx=target.x-q.x,dy=target.y-q.y,d=Math.hypot(dx,dy);
      if(d>=118)continue;
      // Preserve declared runs and occupied wings. Stagger receivers into passing lanes.
      const d0=Math.max(d,10),force=(118-d)/118;
      ax+=dx/d0*force*58;
      ay+=(dy/d0||((p.id%2)?1:-1))*force*62;
    }
    return {x:clamp(target.x+clamp(ax,-56,56),PITCH.left+17,PITCH.right-17),
            y:clamp(target.y+clamp(ay,-72,72),PITCH.top+18,PITCH.bottom-18)};
  }
  // Solid physics spacing: teammates do not overlap their portraits; opponents can still duel.
  _resolveCrowding(){
    for(let pass=0;pass<2;pass++)for(let i=0;i<this.players.length;i++)for(let j=i+1;j<this.players.length;j++){
      const a=this.players[i],b=this.players[j];if(a.i===0&&b.i===0)continue;
      const same=a.side===b.side;
      const minDist=same?(a.i===0||b.i===0?31:42):23;
      const dx=a.x-b.x,dy=a.y-b.y,dist2=dx*dx+dy*dy;
      if(dist2>=minDist*minDist)continue;const d=Math.sqrt(dist2);
      const angle=(a.id*13+b.id*7)%30,ux=d>1?dx/d:Math.cos(angle),uy=d>1?dy/d:Math.sin(angle);
      const push=(minDist-d)*.52;
      const aMob=a.i===0?.10:(this.ball.owner===a?.43:.5);
      const bMob=b.i===0?.10:(this.ball.owner===b?.43:.5);
      a.x=clamp(a.x+ux*push*(aMob*2),PITCH.left+9,PITCH.right-9);
      a.y=clamp(a.y+uy*push*(aMob*2),PITCH.top+9,PITCH.bottom-9);
      b.x=clamp(b.x-ux*push*(bMob*2),PITCH.left+9,PITCH.right-9);
      b.y=clamp(b.y-uy*push*(bMob*2),PITCH.top+9,PITCH.bottom-9);
    }
  }
  _movePlayers(dt){
    // Only during player movement: the ball, possession and shape do not change.
    this._movementShapeCache={backs:[null,null],patterns:[null,null]};
    const b=this.ball,owner=b.owner;
    const chasing=[null,null],pressers=[[],[]];
    for(let s=0;s<2;s++){
      const candidates=this.players.filter(p=>p.side===s&&p.i!==0).sort((a,c)=>distance(a,b)-distance(c,b));
      chasing[s]=candidates[0];
      // High press is led by forwards/midfielders, not the entire centre-back line.
      const danger=this.progress(s,b.x)<255;
      const allowed=candidates.filter(p=>danger||!['ZAG','CB','LD','LE','RB','LB'].includes(p.role));
      const pressure=this.pressing[s],sideline=Math.abs(b.y-PITCH.cy)>174;
      const trigger=!!owner&&owner.side!==s&&(sideline||owner.decision<.14||this.time-this.lastTurnover[owner.side]<5);
      pressers[s]=(allowed.length?allowed:candidates).slice(0,pressure==='high'&&trigger?2:1);
      if(trigger&&pressure==='high'&&this.time-(this.lastPressWave[s]||-1000)>120){
        this.lastPressWave[s]=this.time;this.stats.counterPressWaves[s]++;
        if(this.random()<.30)this.log(`📢 ${this.teams[s].short} aciona pressão coordenada!`,'press');
      }
    }
    for(const p of this.players){
      let target=this._tacticTarget(p);let boost=1;
      // Count an actual inverted full-back movement, never a render-only target lookup.
      const invertedNow=!!owner&&owner.side===p.side&&p!==owner&&!p.run&&['LD','LE','RB','LB'].includes(p.role)
        &&this.modernPattern(p.side)==='3-2-5'&&Math.sign(p.baseY-PITCH.cy)===Math.sign(b.y-PITCH.cy)
        &&Math.abs(p.y-PITCH.cy)<145;
      if(invertedNow&&!p.invertedActive&&this.time-(p.lastInversion??-1000)>90){
        p.lastInversion=this.time;this.stats.invertedRuns[p.side]++;
      }
      p.invertedActive=invertedNow;
      if(p===owner){
        const dir=p.side===0?1:-1,nearest=this.nearestOpponent(p),phase=this.phaseFor(p.side);
        const avoid=nearest.d<66?(p.y<=nearest.p.y?-46:46):0;
        const carry=phase==='transition-attack'?228:phase==='build'?112:154;
        const wideCarrier=['PD','PE','RW','LW','LD','LE','RB','LB','ALA','LWB','RWB'].includes(p.role);
        const advance=this.progress(p.side,p.x);
        const sprintToByline=wideCarrier&&advance>820&&Math.abs(p.y-PITCH.cy)>150;
        const requestedY=sprintToByline?(p.baseY<PITCH.cy?PITCH.top+92:PITCH.bottom-92):
          wideCarrier?(p.baseY<PITCH.cy?PITCH.cy-242:PITCH.cy+242):PITCH.cy;
        const yBias=sprintToByline?.19:wideCarrier?.16:.14;
        const limited=advance>1360?44:carry;
        target={x:clamp(p.x+dir*limited,PITCH.left+18,PITCH.right-18),y:clamp(p.y+avoid+(requestedY-p.y)*yBias+(p.dribbleUntil>this.time?p.dribbleShift*Math.sin(Math.PI*Math.min(1,(p.skillAction?this.time-p.skillAction.start:8)/34)):0),PITCH.top+58,PITCH.bottom-58)};
        boost=((phase==='transition-attack'?1.14:.84)+(has(p,'dribble')?.16:0)+(has(p,'sprint')?.10:0)+(p.dribbleUntil>this.time?.17:0))*(PLAYER_STYLES[p.name]?.carry||1);
      } else if(p.i!==0){
        if(!owner&&chasing[p.side]===p){target={x:b.x+b.vx*.16,y:b.y+b.vy*.16};boost=1.21;}
        else if(!owner&&b.mode==='pass'&&b.by&&b.by.side!==p.side&&pressers[p.side].includes(p)&&distance(p,b)<115){target={x:b.x+b.vx*.18,y:b.y+b.vy*.18};boost=1.17;}
        else if(owner&&owner.side!==p.side&&pressers[p.side].includes(p)){
          const k=pressers[p.side][0]===p?1:.71;
          const counterPress=this.time-this.lastTurnover[owner.side]<5;
          target={x:lerp(target.x,owner.x,k*(counterPress?1:.86)),y:lerp(target.y,owner.y,k*(counterPress?1:.86))};boost=(counterPress?1.22:1.10)*(this.pressing[p.side]==='high'?1.10:this.pressing[p.side]==='low'?.91:1);
        }
      }
      if(owner&&owner.side!==p.side&&['VOL','CDM','MC','CM','ZAG','CB'].includes(p.role)&&!pressers[p.side].includes(p)){
        const threatened=this.players.filter(q=>q.side===owner.side&&q.i!==0&&q!==owner&&distance(q,owner)<180)
          .sort((a,b)=>distance(a,p)-distance(b,p))[0];
        if(threatened&&distance(threatened,p)<135){
          target.x=lerp(target.x,(owner.x+threatened.x)/2,.13);
          target.y=lerp(target.y,(owner.y+threatened.y)/2,.13);
        }
      }
      if(p.run&&(owner?.side===p.side||(!owner&&b.mode==='pass'&&b.by?.side===p.side))&&p!==owner)boost=Math.max(boost,1.36+(PLAYER_STYLES[p.name]?.kind==='runner'?.18:0));
      if(p!==owner&&p.i!==0)target=this._laneSpacingTarget(p,target);
      let dx=target.x-p.x,dy=target.y-p.y,d=length(dx,dy);
      if(d<1){p.vx*=.69;p.vy*=.69;continue;}
      const staminaScale=.75+.25*p.stamina/100;
      const sp=p.speed*boost*staminaScale*(.83+this._attributes(p,'acceleration')/485);
      let ux=dx/d,uy=dy/d;
      // Local collision avoidance: keep circles from stacking indefinitely.
      let ax=0,ay=0;
      for(const q of this.players){if(q===p)continue;const x=p.x-q.x,y=p.y-q.y,near=x*x+y*y;
        if(near>0.1&&near<(p.side===q.side?50:25)**2){const limit=p.side===q.side?50:25,mag=(limit-Math.sqrt(near))/limit;ax+=x/Math.sqrt(near)*mag;ay+=y/Math.sqrt(near)*mag;}}
      ux+=ax*.80;uy+=ay*.80;const norm=Math.max(1,length(ux,uy));ux/=norm;uy/=norm;
      const acceleration=5.8,alpha=1-Math.exp(-acceleration*dt);
      p.vx+=(ux*sp-p.vx)*alpha;p.vy+=(uy*sp-p.vy)*alpha;
      const limit=sp*dt,dMove=Math.min(limit,Math.hypot(p.vx,p.vy)*dt);
      if(dMove>0){let movingD=Math.hypot(p.vx,p.vy)||1;p.x+=p.vx/movingD*Math.min(d,dMove);p.y+=p.vy/movingD*Math.min(d,dMove);}
      p.x=clamp(p.x,PITCH.left+12,PITCH.right-12);p.y=clamp(p.y,PITCH.top+15,PITCH.bottom-15);
      const nowInBox=this.inOpponentBox(p);
      if(nowInBox&&!p.insideBox&&p.i!==0&&this.ball.owner?.side===p.side){this.stats.boxEntries[p.side]++;if(['ZAG','CB'].includes(p.role)&&this.time>70*60&&this.random()<.32)this._moment(p.side,'defender',`🛡️ ${p.name} surge como opção dentro da área!`,[p.name]);}
      p.insideBox=nowInBox;
      p.maxAdvance=Math.max(p.maxAdvance,this.progress(p.side,p.x));p.distanceCovered+=dMove;
      if(this.ball.owner===p){
        if(!p.carryActive){p.carryActive=true;p.carryDistance=0;this.stats.carries[p.side]++;}
        const forward=(p.side===0?p.vx:-p.vx)>0;
        if(forward){p.carryDistance+=dMove;if(p.carryDistance>=70){this.stats.progressiveCarries[p.side]++;p.carryDistance=0;}}
      }else{p.carryActive=false;p.carryDistance=0;}

      if(p.i!==0){p.stamina=clamp(p.stamina-dMove*(p.run?.type==='byline'?.00165:.00132)*(this.pressing[p.side]==='high'?1.24:1)*(this.weather==='rain'?1.06:1),44,100);}
    }
    this._resolveCrowding();
    this._movementShapeCache=null;
  }
  _applyPendingSubs(){
    this._updateMasters(true);
    for(let side=0;side<2;side++){
      if(this.pendingMasters[side]){this.pendingMasters[side]=false;this._masterEntry(side);}
      const pending=this.pendingSubs[side];if(!pending)continue;
      this.pendingSubs[side]=null;
      if(!this.autoSubs)continue;
      let applied=0;
      for(const sub of (Array.isArray(pending)?pending:[pending])){
        const p=this.players.find(p=>p.id===sub.id);
        if(p&&this._makeSubstitution(side,p,sub.reserve))applied++;
      }
      if(applied)this.subWindowsUsed[side]=(this.subWindowsUsed[side]||0)+1;
    }
  }
  _makeSubstitution(side,p,reserve){
    if(!p||!reserve||p.side!==side||p.i===0||p===this.ball.owner)return false;
    if(this.subsUsed[side]>=5||this.benchUsed[side].includes(reserve))return false;
    const oldName=p.name;
    this.retiredPlayers.push({...p,run:null});
    this.benchUsed[side].push(reserve);this.subsUsed[side]++;this.stats.substitutions[side]++;
    p.name=reserve;p.attributes=Attr.generate(reserve,p.role,p.i,this.careerPlayers[reserve+'|'+this.teams[side].id]);p.ego=20;p.flowUntil=0;p.flowCooldown=0;p.flowCount=0;p.abilityCooldowns={};p.activeAbility=null;p.dribblesWon=0;p.saves=0;p.speed=(83+(p.i>=8?7:0)+this.range(-3,3))*(.8+p.attributes.speed/380)*(PLAYER_STYLES[reserve]?.sprint||1);
    p.stamina=100;p.decision=.3;p.challenge=0;p.run=null;p.runCooldown=this.time+50;
    p.dribbleCooldown=0;p.dribbleShift=0;p.dribbleUntil=0;p.skillFxCooldown=0;
    p.goals=0;p.assists=0;p.shots=0;p.pases=0;p.pasesOK=0;p.tackles=0;p.interceptions=0;p.shotBlocks=0;p.aerialWins=0;p.duelsWon=0;p.keyPasses=0;p.rating=6.0;
    p.runCount=0;p.overlapCount=0;p.distanceCovered=0;p.maxAdvance=this.progress(side,p.x);
    const rec={side,out:oldName,in:reserve,role:p.role,minute:Math.max(1,Math.floor(this.time/60))};
    this.subRecords.push(rec);
    this.log(`🔄 ${this.teams[side].short}: ${reserve} entra no lugar de ${oldName}!`,'sub',reserve);
    return true;
  }
  _coachDecisions(){
    if(this.finished||this.phase!=='play'||this.time<29*60)return;
    if(this.time-this.lastCoachCheck<72)return;
    this.lastCoachCheck=this.time;
    const min=this.time/60;
    for(let s=0;s<2;s++){
      const roll=this.masterRoll[s]||0;
      const slots=Masters.ENTRY_MINUTES||[29,66];
      if(roll<(Masters.MAX_ENTRIES||2)&&min>=slots[roll]&&!this.pendingMasters[s]&&!this.masterStates[s]){
        this.masterRoll[s]=roll+1;
        const c=Masters.CONFIG[this.teams[s].id];
        const need=this.score[s]<this.score[1-s]||this.tactics[s]==='attack';
        // Primeira entrada muito provável; segunda é tática, sem obrigação
        // de virar a partida ou garantir gols ao mestre.
        const chance=Math.min(.99,(c?.entryProbability||.9)-(roll?.13:0)+(need?.06:0));
        if(c&&this.random()<chance){
          this.pendingMasters[s]=true;
          this.log(`🌟 ${c.name} se prepara para uma ${roll===0?'primeira':'nova'} entrada na próxima parada!`,'coach');
        }
      }
      // Automatic coach reacts to the score but respects manually chosen tactics.
      if(this.autoCoach&&!this.coachLocked[s]){
        const lead=this.score[s]-this.score[1-s];
        // Adapt earlier when trailing badly, instead of waiting until minute 74.
        const urgency=lead<=-2&&min>=34||lead===-1&&min>=49;
        const desired=urgency?'attack':lead>=2&&min>=77?'defend':lead===0&&min>=78?'attack':this.tactics[s];
        if(this.tactics[s]!==desired){
          this.tactics[s]=desired;
          if(urgency){this.pressing[s]='high';this.buildUp[s]='direct';this.attackWidth[s]='wide';}
          if(lead>=2&&min>=77){this.pressing[s]='balanced';this.buildUp[s]='patient';}
          const reason=lead<0?'reagir à desvantagem':lead>0?'segurar a vantagem':'buscar a vitória';
          this.coachDecisions.push({side:s,minute:Math.floor(min),type:'tactic',stance:desired,reason});
          this.log(`🧠 ${this.teams[s].short}: técnico muda a estratégia para ${desired==='attack'?'ATACAR':desired==='defend'?'DEFENDER':'EQUILIBRAR'} — ${reason}!`,'coach');
        }
      }
      // Cinco trocas distribuídas por até três janelas (intervalo não consumiria janela).
      const used=this.subWindowsUsed[s]||0;
      if(!this.autoSubs||this.subsUsed[s]>=5||used>=3||this.pendingSubs[s])continue;
      const lead=this.score[s]-this.score[1-s];
      const thresholds=lead<=-2?[39,57,73]:lead<0?[48,64,78]:[61,74,85];
      if(min<thresholds[used])continue;
      const options=this.players.filter(p=>p.side===s&&p.i!==0&&p!==this.ball.owner&&!p.isMaster);
      // A poor-performing forward/midfielder is considered earlier while losing.
      const urgency=lead<0;
      options.sort((a,b)=>{
        const grade=p=>p.rating*4+p.stamina*.10+(PLAYER_STYLES[p.name]?4:0)-(urgency&&roleGroup(p.role)==='F'?7:0);
        return grade(a)-grade(b);
      });
      const planned=[],reserved=new Set(this.benchUsed[s]),maxBatch=Math.min(5-this.subsUsed[s],used===2?1:2);
      for(const p of options){
        if(planned.length>=maxBatch)break;
        if(!urgency&&p.stamina>93&&used>=1)continue;
        const group=roleGroup(p.role);
        const Coach=(typeof globalThis!=='undefined'?globalThis.NeoCoach980:null);
        const candidates=this.teams[s].reserves.filter(name=>!reserved.has(name)&&(Coach?.compatible?.(p.role,Coach?.reserveRole?.(this.teams[s],name)||BENCH_ROLE_HINTS[name]||'MC')??roleGroup(Coach?.reserveRole?.(this.teams[s],name)||BENCH_ROLE_HINTS[name]||'MC')===group));
        const reserve=candidates.sort((a,b)=>{
          const role=Coach?.reserveRole?.(this.teams[s],a)||p.role;
          const ra=Attr.generate(a,role,p.i,this.careerPlayers[a+'|'+this.teams[s].id])?.ovr||70;
          const role2=Coach?.reserveRole?.(this.teams[s],b)||p.role;
          const rb=Attr.generate(b,role2,p.i,this.careerPlayers[b+'|'+this.teams[s].id])?.ovr||70;
          return rb-ra;
        })[0];
        if(reserve){planned.push({id:p.id,reserve});reserved.add(reserve);}
      }
      if(planned.length){
        this.pendingSubs[s]=planned;
        const reason=lead<0?'time está perdendo':lead>0?'manter o resultado':'buscar vantagem';
        this.coachDecisions.push({side:s,minute:Math.floor(min),type:'substitution-plan',count:planned.length,reason});
        this.log(`🔄 Técnico de ${this.teams[s].short} prepara ${planned.length} troca(s): ${reason}.`, 'coach');
      }
    }
  }
  _setRestart(side,x,y,reason){
    const kinds={'Escanteio':'corner','Lateral':'throwIn','Tiro de meta':'goalKick','Pênalti':'penalty','Falta':'freeKick','Impedimento':'indirect','Recuo ao goleiro':'indirect'};
    const kind=kinds[reason]||'indirect';
    this.phase='restart';this.wait=kind==='penalty'?1.55:kind==='corner'?1.1:.85;
    const r={side,x:clamp(x,PITCH.left+10,PITCH.right-10),y:clamp(y,PITCH.top+10,PITCH.bottom-10),reason,kind};
    if(kind==='corner'){r.x=side===0?PITCH.right-8:PITCH.left+8;r.y=y<PITCH.cy?PITCH.top+8:PITCH.bottom-8;}
    if(kind==='penalty'){r.x=side===0?PITCH.right-105:PITCH.left+105;r.y=PITCH.cy;}
    if(kind==='goalKick'){r.x=side===0?PITCH.left+62:PITCH.right-62;r.y=PITCH.cy+this.range(-30,30);}
    this.restart=r;
    const b=this.ball;b.owner=null;b.x=r.x;b.y=r.y;b.vx=0;b.vy=0;b.mode='dead';b.by=null;b.to=null;b.lock=.3;b.airTime=0;b.height=0;b.setPiece=null;this.lastPass=null;this.combination=null;
    this._stageRestart(r);
    this.lastSetPiece={side,kind,reason,minute:Math.max(1,Math.floor(this.time/60)),taker:r.takerName||'',time:this.time};
    this.log(`${kind==='penalty'?'🎯':kind==='corner'?'🚩':kind==='freeKick'?'🟨':kind==='goalKick'?'🥅':'⚽'} ${reason} — ${this.teams[side].short} prepara a cobrança!`,'restart');
  }
  _stageRestart(r){
    const {side,kind}=r,dir=side===0?1:-1,ownGoal=side===0?PITCH.left:PITCH.right,oppGoal=side===0?PITCH.right:PITCH.left;
    const team=this.players.filter(p=>p.side===side&&p.i!==0),enemies=this.players.filter(p=>p.side!==side&&p.i!==0);
    let taker;
    if(kind==='goalKick')taker=this.players.find(p=>p.side===side&&p.i===0);
    else if(kind==='penalty')taker=team.slice().sort((a,b)=>(b.i>=8?24:0)+(has(b,'impact')?18:0)+(has(b,'curve')?14:0)-(a.i>=8?24:0)-(has(a,'impact')?18:0)-(has(a,'curve')?14:0))[0];
    else if(kind==='corner'||kind==='freeKick')taker=team.slice().sort((a,b)=>(has(b,'playmaker')?25:0)+(has(b,'vision')?18:0)-distance(b,r)*.12-((has(a,'playmaker')?25:0)+(has(a,'vision')?18:0)-distance(a,r)*.12))[0];
    else taker=team.slice().sort((a,b)=>distance(a,r)-distance(b,r))[0];
    taker=taker||team[0];if(!taker)return;
    r.takerId=taker.id;r.takerName=taker.name;taker.x=r.x;taker.y=r.y;taker.vx=taker.vy=0;taker.decision=1.2;
    if(kind==='corner'){
      const attack=team.filter(p=>p!==taker).sort((a,b)=>(b.i>=8?20:0)-(a.i>=8?20:0));
      const offsets=[[-48,-68],[-58,70],[-105,15],[-127,-112],[-154,112],[-196,6],[-228,-170],[-230,155],[-285,0]];
      attack.forEach((p,i)=>{const [dx,dy]=offsets[i%offsets.length];p.x=clamp(oppGoal+dir*dx,PITCH.left+13,PITCH.right-13);p.y=clamp(PITCH.cy+dy,PITCH.top+14,PITCH.bottom-14);p.run=null;});
      // Real set-piece gamble: one centre-back attacks the near/second post.
      // His partner stays deeper to reduce the counterattack risk.
      const aerialCB=attack.find(p=>['ZAG','CB'].includes(p.role));
      if(aerialCB&&this.random()<.72){
        aerialCB.x=clamp(oppGoal-dir*this.range(66,112),PITCH.left+15,PITCH.right-15);
        aerialCB.y=PITCH.cy+(r.y<PITCH.cy?1:-1)*this.range(38,92);
        this.stats.defenderAttacks[side]++;
        if(this.random()<.23)this.log(`⬆️ ${aerialCB.name}, zagueiro, sobe para disputar o escanteio!`,'run',aerialCB.name);
      }
      const defOffsets=[[-23,-60],[-29,52],[-70,1],[-98,96],[-105,-107],[-158,15],[-225,130],[-215,-140],[-280,25],[-310,0]];
      enemies.forEach((p,i)=>{const [dx,dy]=defOffsets[i%defOffsets.length];p.x=clamp(oppGoal+dir*dx,PITCH.left+13,PITCH.right-13);p.y=clamp(PITCH.cy+dy,PITCH.top+14,PITCH.bottom-14);p.run=null;});
      const keeper=this.players.find(p=>p.side!==side&&p.i===0);if(keeper){keeper.x=oppGoal-dir*18;keeper.y=PITCH.cy;}
    }
    if(kind==='penalty'){
      const a=team.filter(p=>p!==taker),d=enemies;
      a.forEach((p,i)=>{p.x=clamp(r.x-dir*(145+(i%2)*22),PITCH.left+15,PITCH.right-15);p.y=clamp(PITCH.cy+((i%2===0?1:-1)*(138+Math.floor(i/2)*16)),PITCH.top+20,PITCH.bottom-20);p.run=null;});
      d.forEach((p,i)=>{p.x=clamp(r.x-dir*(178+(i%3)*24),PITCH.left+15,PITCH.right-15);p.y=clamp(PITCH.cy+((i%2===0?-1:1)*(138+Math.floor(i/2)*12)),PITCH.top+20,PITCH.bottom-20);p.run=null;});
      const keeper=this.players.find(p=>p.side!==side&&p.i===0);if(keeper){keeper.x=oppGoal-dir*8;keeper.y=PITCH.cy+this.range(-17,17);keeper.decision=1.4;}
    }
    if(kind==='freeKick'&&distance(r,{x:oppGoal,y:PITCH.cy})<360){
      const wall=enemies.filter(p=>p.role!=='GOL').sort((a,b)=>distance(a,r)-distance(b,r)).slice(0,3);
      wall.forEach((p,i)=>{p.x=clamp(r.x+dir*90,PITCH.left+10,PITCH.right-10);p.y=clamp(r.y+(PITCH.cy-r.y)*.35+(i-1)*21,PITCH.top+10,PITCH.bottom-10);});
    }
  }
  _deliverRestart(taker,to,kind,mode='pass',power=365,tx=to.x,ty=to.y){
    this._launch(taker,tx,ty,power,mode,to);
    const b=this.ball;b.setPiece=kind;
    if(mode==='air'){
      b.crossType='high';b.airTotal=clamp(distance(taker,{x:tx,y:ty})/power,.32,1.45);b.airTime=b.airTotal;b.height=0;
    }
    this.stats.passes[taker.side]++;taker.pases++;
    this.lastPass={p:taker,time:this.time,side:taker.side,setPiece:kind};
  }
  _performRestart(){
    const r=this.restart;if(!r)return;this._applyPendingSubs();
    const {side,kind}=r,dir=side===0?1:-1,oppGoal=side===0?PITCH.right:PITCH.left;
    let taker=this.players.find(p=>p.id===r.takerId)||this.players.find(p=>p.side===side&&p.i!==0);
    if(!taker)return;
    taker.x=r.x;taker.y=r.y;taker.vx=taker.vy=0;
    this.ball.x=r.x;this.ball.y=r.y;this.ball.vx=this.ball.vy=0;this.ball.owner=taker;this.ball.by=null;this.ball.lastTouch=taker;this.ball.mode='carry';
    this.phase='play';this.restart=null;this.possessionSide=side;this.lastTurnover=[this.time,this.time];
    const mates=this.players.filter(p=>p.side===side&&p!==taker&&p.i!==0);
    const select=(arr,near)=>arr.slice().sort((a,b)=>distance(a,near)-distance(b,near))[0];
    if(kind==='penalty'){
      const onTarget=this.random()<.87;
      const aimY=onTarget?PITCH.cy+this.range(-PITCH.goalHalf+5,PITCH.goalHalf-5):PITCH.cy+(this.random()<.5?-1:1)*this.range(PITCH.goalHalf+10,PITCH.goalHalf+85);
      this._launch(taker,oppGoal+dir*40,aimY,this.range(395,485),'shot');
      this.ball.onTarget=onTarget;this.ball.isPenalty=true;this.ball.setPiece='penalty';this.ball.shotXg=.75;
      this.stats.shots[side]++;taker.shots++;this.stats.xg[side]+=.75;if(onTarget)this.stats.onTarget[side]++;
      this.shotMap.push({x:r.x,y:r.y,side,onTarget,xg:.75,outcome:'pending',header:false,goal:false,minute:Math.floor(this.time/60),setPiece:'penalty'});
      this.log(`🎯 ${taker.name} cobra o PÊNALTI!`,'penalty',taker.name);return;
    }
    if(kind==='corner'){
      const style=this.setPieceStyle[side]||'mixed';
      const routine=style==='mixed'?this.pick(['near','far','short','short','near']):style;
      const sign=r.y<PITCH.cy?-1:1;
      if(routine==='short'){
        let short=select(mates,{x:r.x-dir*78,y:r.y-sign*78});
        if(short){short.x=clamp(r.x-dir*70,PITCH.left+15,PITCH.right-15);short.y=clamp(r.y-sign*72,PITCH.top+15,PITCH.bottom-15);this._deliverRestart(taker,short,'corner','pass',this.range(270,330),short.x,short.y);this.stats.setPieceRoutines[side]++;this.log(`🚩 ESCANTEIO ENSAIADO: ${taker.name} toca para ${short.name}, buscando tabelar e abrir espaço!`,'corner',taker.name);return;}
      }
      const spot={x:oppGoal-dir*(routine==='far'?84:55),y:PITCH.cy+(routine==='far'?-sign*78:sign*54)};
      const receiver=select(mates,spot)||mates[0];
      if(receiver){this._deliverRestart(taker,receiver,'corner','air',this.range(350,420),spot.x+this.range(-13,13),spot.y+this.range(-14,14));this.stats.setPieceRoutines[side]++;this.log(`🚩 Bola parada trabalhada! ${taker.name} busca o ${routine==='far'?'SEGUNDO':'PRIMEIRO'} PAU!`,'corner',taker.name);return;}
    }
    if(kind==='freeKick'){
      const d=distance(r,{x:oppGoal,y:PITCH.cy}),angle=Math.abs(r.y-PITCH.cy);
      const shoot=d<370&&angle<210&&this.random()<.55;
      if(shoot){
        const accuracy=clamp(.37+(300-d)*.00062+(has(taker,'curve')?.1:0)+(has(taker,'impact')?.1:0),.2,.62);
        const onTarget=this.random()<accuracy;
        const aimY=onTarget?PITCH.cy+this.range(-PITCH.goalHalf+4,PITCH.goalHalf-4):PITCH.cy+(this.random()<.5?-1:1)*this.range(PITCH.goalHalf+8,96);
        this._launch(taker,oppGoal+dir*45,aimY,this.range(465,565),'shot');this.ball.onTarget=onTarget;this.ball.shotXg=.085;this.ball.setPiece='freeKick';
        this.stats.shots[side]++;this.stats.directFreeKickShots[side]++;this.stats.xg[side]+=.085;taker.shots++;if(onTarget)this.stats.onTarget[side]++;
        this.shotMap.push({x:r.x,y:r.y,side,onTarget,xg:.085,outcome:'pending',header:false,goal:false,minute:Math.floor(this.time/60),setPiece:'freeKick'});
        this.log(`🎯 ${taker.name} bate a FALTA DIRETA buscando o gol!`,'freeKick',taker.name);return;
      }
      if(d<520&&mates.length){
         const shortOption=mates.filter(p=>distance(p,taker)<230&&this.safeLane(taker,p)>25);
         if(shortOption.length&&this.random()<.34){
           shortOption.sort((a,b)=>this.opponentPressure(a,85)-this.opponentPressure(b,85));
           const target=shortOption[0];this._deliverRestart(taker,target,'freeKick','pass',clamp(distance(taker,target)*1.7,260,440),target.x,target.y);
           this.stats.setPieceRoutines[side]++;this.log(`🧠 FALTA ENSAIADA: ${taker.name} faz a cobrança curta para ${target.name}!`,'freeKick',taker.name);return;
         }
         const spot={x:oppGoal-dir*105,y:PITCH.cy+this.range(-93,93)};const target=select(mates,spot);
         this._deliverRestart(taker,target,'freeKick','air',this.range(440,540),spot.x,spot.y);
         this.stats.setPieceRoutines[side]++;this.log(`🎯 ${taker.name} levanta a falta na área!`,'freeKick',taker.name);return;
       }
    }
    if(kind==='goalKick'){
      const options=mates.filter(p=>p.i>0&&p.i<7);
      const long=this.random()<.12&&this.opponentPressure(taker,135)>1;
      const chosen=long?select(mates,{x:r.x+dir*370,y:PITCH.cy+this.range(-120,120)}):select(options,{x:r.x+dir*175,y:PITCH.cy+this.range(-145,145)});
      if(chosen){this._deliverRestart(taker,chosen,'goalKick','pass',long?this.range(385,460):this.range(290,350),chosen.x+dir*(long?18:0),chosen.y);this.log(`🥅 ${taker.name} cobra o tiro de meta ${long?'longo':'curto'}!`,'goalKick',taker.name);return;}
    }
    // Throw-ins and indirect free kicks: short moving passes, not instant possession.
    const target=select(mates,{x:r.x+dir*(kind==='throwIn'?95:110),y:clamp(r.y+(PITCH.cy-r.y)*.30,PITCH.top+30,PITCH.bottom-30)})||mates[0];
    if(target){
      const tx=clamp(target.x+dir*12,PITCH.left+15,PITCH.right-15),ty=clamp(target.y,PITCH.top+15,PITCH.bottom-15);
      this._deliverRestart(taker,target,kind,'pass',kind==='throwIn'?this.range(245,300):this.range(310,375),tx,ty);
      this.log(kind==='throwIn'?`↪️ ${taker.name} cobra o lateral procurando ${target.name}!`:`⚽ ${taker.name} rola a falta para ${target.name}!`,kind,taker.name);
    }else{this.ball.owner=taker;this.ball.mode='carry';}
  }
  _deflectToCorner(defender){
    // The deflection is a moving ball, not a teleported/canned corner.
    const b=this.ball,ownGoal=defender.side===0?PITCH.left:PITCH.right;
    b.owner=null;b.lastTouch=defender;b.by=null;b.to=null;b.mode='deflect';b.lock=.16;
    b.vx=(ownGoal>b.x?1:-1)*340;
    b.vy=(b.y<PITCH.cy?-1:1)*245;
  }
  _shotBlock(b,oldX,oldY){
    if(b.mode!=='shot'||!b.by)return false;
    const vx=b.x-oldX,vy=b.y-oldY,len2=Math.max(1,vx*vx+vy*vy);
    const blockers=this.players.filter(p=>p.side!==b.by.side&&p.i!==0&&
      this.progress(p.side,p.x)<500&&Math.abs(p.y-PITCH.cy)<PITCH.boxHalf+100);
    for(const p of blockers){
      if(b.blockChecked?.includes(p.id))continue;
      const t=clamp(((p.x-oldX)*vx+(p.y-oldY)*vy)/len2,0,1);
      const d=Math.hypot(p.x-(oldX+vx*t),p.y-(oldY+vy*t));
      if(d>21)continue;
      if(!b.blockChecked)b.blockChecked=[];
      b.blockChecked.push(p.id);
      const tackle=this._attributes(p,'tackling'),position=this._attributes(p,'positioning');
      const chance=clamp(.29+(tackle-75)*.004+(position-75)*.003+(21-d)*.014,.19,.83);
      if(this.random()>=chance)continue;
      this.stats.shotBlocks[p.side]++;p.shotBlocks=(p.shotBlocks||0)+1;p.rating=clamp(p.rating+.13,5,10);
      const shot=this.shotMap.slice().reverse().find(x=>x.side===b.by.side&&x.outcome==='pending');
      if(shot){shot.outcome='blocked';shot.blockedBy=p.name;if(b.onTarget)this.stats.onTarget[b.by.side]=Math.max(0,this.stats.onTarget[b.by.side]-1);}
      this._actionFx('block',p,p.x,p.y,'CHUTE BLOQUEADO!');
      this.log(`🛡️ ${p.name} se coloca na frente e bloqueia o chute!`,'block',p.name);
      b.lastTouch=p;b.owner=null;b.by=null;b.to=null;b.mode='deflect';b.lock=.13;
      const backward=p.side===0?1:-1;
      b.vx=backward*this.range(65,170);
      b.vy=(p.y<PITCH.cy?-1:1)*this.range(120,240);
      this.lastPass=null;
      return true;
    }
    return false;
  }
  _keeperAttempt(keeper,b,dt){
    if(keeper.i!==0||keeper.side===b.by?.side||b.mode!=='shot'||!b.onTarget)return false;
    const ownGoal=keeper.side===0?PITCH.left:PITCH.right;
    if(Math.abs(b.x-ownGoal)>146||Math.abs(b.y-PITCH.cy)>100)return false;
    const profile=keeperProfile(keeper.name);
    const d=distance(keeper,b),reach=(has(keeper,'wild')?55:47)*profile.reach;
    if(d>reach||b.saveAttempted)return false;
    b.saveAttempted=true;
    // Styles change the *kind* of save and chance slightly, never force a result.
    const style=b.shotStyle||'placed';
    const tricky=(style==='chip'||style==='acrobatic'||style==='first-time');
    const chance=b.isPenalty?clamp((has(keeper,'wild')?.46:.36)+(d<20?.10:0),.28,.60):
      clamp((has(keeper,'wild')?.83:.73)+(d<23?.10:0)-(b.shotXg>.30?.07:0)+(this.gameplayPreset==='fast'?.04:0),.53,.96);
    this._activateAbility(keeper,'save');
    const adjusted=clamp(chance+profile.reflex-(tricky?.035:0)+(this._attributes(keeper,'reflexes')-78)*.0023+
      Abilities.tacticalBonus(keeper,'save',this.time)*.072,.23,.94);
    if(this.random()>=adjusted)return false;
    const savedShot=this.shotMap.slice().reverse().find(x=>x.side===b.by?.side&&x.outcome==='pending');
    if(savedShot){savedShot.outcome='saved';savedShot.savedBy=keeper.name;}
    if(b.by)this._recordDuel(b.by,keeper,keeper,'save');
    this.stats.saves[keeper.side]++;keeper.saves=(keeper.saves||0)+1;keeper.lastSaveAt=this.time;
    this._ego(keeper,13,'grande defesa');
    if(has(keeper,'wild'))this._emitSkill(keeper,'INSTINTO SELVAGEM','save',77);
    const leap=Math.abs(b.y-keeper.y)>19;
    const parryChance=clamp(profile.parry+(tricky?.09:0)+(leap?.07:0),.12,.63);
    const parry=this.random()<parryChance;
    const fx=parry?(profile.id==='aerial'?'keeper-air':profile.id==='wild'?'keeper-wild':'keeper-dive'):
      (profile.id==='wall'?'keeper-wall':profile.id==='reflex'?'keeper-reflex':'keeper-hold');
    this._actionFx(fx,keeper,b.x,b.y,parry?'ESPALMA!':'DEFENDE!');
    this.log(parry?`🧤 ${keeper.name} (${profile.name}) VOA E ESPALMA!`:
      `🧤 ${keeper.name} (${profile.name}) segura a finalização!`,'save',keeper.name);
    keeper.x=b.x;keeper.y=b.y;keeper.rating=clamp(keeper.rating+.12,5,10);this.lastPass=null;
    if(parry){
      this.stats.keeperParries[keeper.side]++;
      this._moment(keeper.side,'save',`🧤 DEFESA ABSURDA! ${keeper.name} salva a equipe com ${profile.name}!`,[keeper.name]);
      this._deflectToCorner(keeper);return true;
    }
    b.owner=keeper;b.mode='carry';b.by=null;b.to=null;b.vx=b.vy=0;b.lock=.1;keeper.decision=.25;keeper.handControlStart=this.time;keeper.handControl=true;
    this.lastTurnover=[this.time,this.time];this.possessionSide=keeper.side;return true;
  }
  _ballMotion(dt){
    const b=this.ball;if(b.owner){const p=b.owner;const dir=p.side===0?1:-1;b.x=p.x+dir*8;b.y=p.y;return;}
    // Target-aware ground passing: the ball still travels physically, but the
    // receiver can cushion a pass instead of watching it fly into touch.
    if(b.mode==='pass'&&b.to&&b.by&&b.by.side===b.to.side){
      const tx=clamp(b.to.x,PITCH.left+55,PITCH.right-55);
      const ty=clamp(b.to.y,PITCH.top+72,PITCH.bottom-72);
      const ex=tx-b.x,ey=ty-b.y,d=Math.hypot(ex,ey);
      if(d>2){
        const speed=clamp(d*2.35,140,570),steer=1-Math.exp(-8.0*dt);
        b.vx+=(ex/d*speed-b.vx)*steer;
        b.vy+=(ey/d*speed-b.vy)*steer;
      }
    }
    const oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.mode==='air'){
      b.airTime=Math.max(0,(b.airTime||0)-dt);
      const progress=1-b.airTime/Math.max(.001,b.airTotal||1);
      b.height=Math.max(0,Math.sin(Math.PI*Math.min(1,progress))*40);
    }else {b.height=0;}

    const decay=Math.exp(-(b.mode==='shot'?.10:this.weather==='rain'?.26:.38)*dt);b.vx*=decay;b.vy*=decay;
    if(this.weather==='wind'&&b.mode==='air')b.vy+=Math.sin(this.time*.003)*18*dt;
    if(Math.hypot(b.vx,b.vy)<18){b.vx=b.vy=0;}
    // Shot blocking uses actual swept line-segment contact; defenders must
    // physically meet the ball rather than getting automatic proximity saves.
    if(b.mode==='shot'&&this._shotBlock(b,oldX,oldY))return;
    // The ball crossing the line between posts is a goal immediately.
    // Keepers cannot claim a save after the ball has already crossed the line.
    if(b.mode==='shot'&&(b.x>PITCH.right||b.x<PITCH.left)&&Math.abs(b.y-PITCH.cy)<=PITCH.goalHalf){
      this._goal(b.x>PITCH.right?0:1);return;
    }
    // Keeper saves are based on actual interception proximity, not a random goal-line event.
    if(b.mode==='shot'){for(const p of this.players)if(p.i===0&&this._keeperAttempt(p,b,dt))return;}
    // Outs are awarded by last touch; no invisible goal-line scoring.
    const OUT_X=5,OUT_Y=5;
    if(b.x>PITCH.right+OUT_X||b.x<PITCH.left-OUT_X){
      if(b.mode==='shot'&&b.by){
        const missed=this.shotMap.slice().reverse().find(x=>x.side===b.by.side&&x.outcome==='pending');
        if(missed){missed.outcome='missed';
          if((missed.xg||0)>=.23&&Math.abs(b.y-PITCH.cy)<PITCH.goalHalf+42)
            this._moment(b.by.side,'near',`🔥 QUASE GOL! ${b.by.name} manda rente à trave!`,[b.by.name]);
        }
      }
      const scoringSide=b.x>PITCH.right?0:1;
      const defending=1-scoringSide;
      // Any attacker touch beyond the goal line -> goal kick; defender touch -> corner.
      const last=b.lastTouch;if(last&&last.side===defending){
        this.stats.corners[scoringSide]++;this.log(`🚩 Escanteio para ${this.teams[scoringSide].short}!`,'corner');
        this._setRestart(scoringSide,scoringSide===0?PITCH.right-14:PITCH.left+14,b.y>PITCH.cy?PITCH.bottom-8:PITCH.top+8,'Escanteio');
      } else {this.stats.goalKicks[defending]++;this._setRestart(defending,defending===0?PITCH.left+79:PITCH.right-79,PITCH.cy+this.range(-80,80),'Tiro de meta');}
      return;
    }
    if(b.y>PITCH.bottom+OUT_Y||b.y<PITCH.top-OUT_Y){
      const receiving=b.lastTouch?1-b.lastTouch.side:(this.random()<.5?0:1);
      this.stats.throwIns[receiving]++;this._setRestart(receiving,clamp(b.x,PITCH.left+25,PITCH.right-25),b.y>PITCH.bottom?PITCH.bottom-10:PITCH.top+10,'Lateral');return;
    }
    if(b.lock>0)return;
    if(b.mode==='air'){
      if(b.height<27||b.airTime<.18){if(this._aerialChallenge(b))return;}
      if(b.airTime<=0){b.mode='pass';b.crossType=null;}
    }
    let best=null,bestD=1e9;
    for(const p of this.players){const d=distance(p,b),reach=p.i===0?19:((['ZAG','CB','LD','LE'].includes(p.role)&&this.progress(p.side,b.x)<520)?20:16);
      if(b.mode==='air'&&b.height>9)continue;
      if(d<reach&&d<bestD){best=p;bestD=d;}}
    if(best){
      if(best.i===0&&b.mode!=='shot'&&b.by?.side!==best.side&&
        this.progress(best.side,b.x)<PITCH.boxDepth&&Math.abs(b.y-PITCH.cy)<PITCH.boxHalf){
        this.stats.sweeperRecoveries[best.side]++;
        this._actionFx('sweep',best,b.x,b.y,'GOLEIRO ANTECIPA');
        if(this.random()<.22+keeperProfile(best.name).command*.23)this.log(`🧤 ${best.name} (${keeperProfile(best.name).name}) sai do gol e antecipa o ataque!`,'save',best.name);
      }
      if(b.mode==='shot'&&best.side!==b.by?.side&&best.i===0){if(this._keeperAttempt(best,b,dt))return;/* A failed attempt must not magically catch the ball. */return;}
      if(b.mode==='pass'&&b.by&&b.by.side===best.side){
        if(best.i===0&&b.by.i!==0){
          best.handControl=false;
          // Recuo intencional pode ser dominado com os pés. Só é infração se usar as mãos.
          if(this.random()<.065){
            this.log(`🧤 RECUO IRREGULAR: ${best.name} segura com as mãos um passe deliberado de ${b.by.name}!`,'foul',best.name);
            this.stats.backpasses[best.side]++;
            this.stats.freeKicks[1-best.side]++;
            this._setRestart(1-best.side,b.x,b.y,'Recuo ao goleiro');return;
          }
        }
        const passTeam=this.teams[best.side],pressure=this.opponentPressure(best,38),talent=(has(best,'trap')||has(best,'link')||has(best,'playmaker'))?.035:0;
        const miscontrol=clamp(.015+pressure*.025+(this.weather==='rain'?.033:0)+(this.gameplayPreset==='fast'?-.010:0)-(passTeam.pas-80)*.001-talent,.002,.145);
        if(best.i!==0&&this.random()<miscontrol){
          this.stats.heavyTouches[best.side]++;b.mode='loose';b.to=null;b.by=best;b.lock=.11;b.lastTouch=best;
          b.vx=this.range(-105,105);b.vy=this.range(-115,115);best.decision=.24;
          if(this.random()<.3)this.log(`⚡ ${best.name} domina mal e a bola fica dividida!`,'skill',best.name);
          return;
        }
        this.stats.completed[best.side]++;b.by.pasesOK++;
        const pair=[b.by.name,best.name].sort().join('|');
        const pairs=new Set(['Ranze Kurona|Yoichi Isagi','Alexis Ness|Michael Kaiser','Reo Mikage|Seishiro Nagi','Charles Chevalier|Rin Itoshi','Eita Otoya|Meguru Bachira']);
        const identity=[...pairs].some(x=>x===pair);
        if(identity&&distance(b.by,best)<290&&this.progress(best.side,best.x)>500&&this.random()<.18){
          this.stats.unionPlays[best.side]++;
          this._moment(best.side,'union',`🤝 UNIÃO! ${b.by.name} e ${best.name} combinam para quebrar a marcação!`,[b.by.name,best.name]);
          if(best.i>0&&this.progress(best.side,best.x)<this.offsideRunLimit(best.side)-120){
            const dep=clamp(this.progress(best.side,best.x)+90,210,this.offsideRunLimit(best.side)-30);
            best.run={type:'third-man',x:this.progressToX(best.side,dep),y:clamp(best.y+(best.baseY<PITCH.cy?-42:42),PITCH.top+50,PITCH.bottom-50),started:this.time,until:this.time+58};
          }
        }
      }
      if(b.mode==='shot'&&best.side!==b.by?.side&&best.i!==0){
        this.log(`${best.name} bloqueia o chute!`,'block');
        if(Math.abs((best.side===0?PITCH.left:PITCH.right)-best.x)<210&&this.random()<.36){this._deflectToCorner(best);return;}
      }
      const prev=this.possessionSide;
      if(b.by&&b.by.side!==best.side)this.lastPass=null;
      b.owner=best;b.mode='carry';b.vx=b.vy=0;b.to=null;b.by=null;b.lastTouch=best;best.decision=.26;
      if(prev!==best.side){this.lastTurnover=[this.time,this.time];this.possessionSide=best.side;this.combination=null;this.stats.interceptions[best.side]++;best.interceptions=(best.interceptions||0)+1;best.rating=clamp(best.rating+.055,5,10);if(has(best,'copy')&&this.random()<.10)this._emitSkill(best,'CAMALEÃO: ANTECIPAÇÃO','tackle',55);if(this.pressing[best.side]==='high'&&this.progress(best.side,best.x)>450)this.stats.pressingRecoveries[best.side]++;}
    }
  }
  _sendOff(p,reason){
    if(!p||p.i===0||!this.players.includes(p))return;
    this.stats.redCards[p.side]++;
    this.cardRecords.push({team:p.side,name:p.name,minute:Math.max(1,Math.floor(this.time/60)),type:'red',reason});
    this.log(`🟥 ${p.name} EXPULSO — ${reason}! ${this.teams[p.side].short} fica com 10 jogadores!`,'card',p.name);
    this.retiredPlayers.push({...p,sentOff:true});this.players=this.players.filter(q=>q!==p);
  }
  _tackles(dt){const owner=this.ball.owner;if(!owner||owner.i===0)return;
    for(const q of this.players){if(q.side===owner.side||q.i===0||q.challenge>0)continue;const d=distance(q,owner);
      const isBack=['ZAG','CB','LD','LE','RB','LB'].includes(q.role);
      const reach=isBack?38:['VOL','CDM'].includes(q.role)?32:['MC','CM','MEI'].includes(q.role)?26:23;
      if(d>reach)continue;
      if(this.random()<dt*.40)this._activateAbility(q,'tackle');
      const defense=rankQuality(this.teams[q.side],'def'),dribble=(has(owner,'dribble')?.23:has(owner,'trap')?.10:0)+(this._attributes(owner,'dribbling')-78)*.002,bonus=(has(q,'mark')?.18:has(q,'read')?.16:has(q,'press')?.08:0)+(this._attributes(q,'tackling')-78)*.0017+(this._attributes(q,'defense')-78)*.00065+(this._attributes(q,'tactics')-78)*.0005+Abilities.tacticalBonus(q,'tackle',this.time)*.073;
      const tackleRate=clamp((.61+defense*.14+bonus-dribble)*(isBack?1.18:q.role==='VOL'?1.1:0.88),.19,.94);
      if(this.random()<tackleRate*dt){
        if(this.random()<.20){
          this.stats.fouls[q.side]++;
          const ownGoal=q.side===0?PITCH.left:PITCH.right;
          const inPenaltyArea=Math.abs(owner.x-ownGoal)<=PITCH.boxDepth&&Math.abs(owner.y-PITCH.cy)<=PITCH.boxHalf;
          const offence=inPenaltyArea?'Pênalti':'Falta';
          this.log(`${inPenaltyArea?'🎯 PÊNALTI!':'🟨 FALTA!'} ${q.name} derruba ${owner.name}.`,'foul',q.name);
          if(inPenaltyArea)this.stats.penalties[owner.side]++;
          else this.stats.freeKicks[owner.side]++;
          if(!inPenaltyArea&&this.progress(owner.side,owner.x)>890&&this.random()<.19){
            this.stats.advantages[owner.side]++;
            this.log(`🟢 Árbitro aplica VANTAGEM para ${this.teams[owner.side].short}!`,'foul',owner.name);
            q.challenge=.6;owner.decision=.16;return;
          }
          const severity=this.random();
          if(severity<.18){
            q.yellows=(q.yellows||0)+1;this.stats.yellows[q.side]++;
            this.cardRecords.push({team:q.side,name:q.name,minute:Math.max(1,Math.floor(this.time/60)),type:'yellow'});
            this.log(`🟨 Cartão amarelo para ${q.name}!`,'card',q.name);
            if(q.yellows>=2){this._sendOff(q,'segundo amarelo');}
          }else if(severity>.994){this._sendOff(q,'cartão vermelho direto');}
          this._setRestart(owner.side,owner.x,owner.y,offence);return;
        }
        this.ball.owner=q;this.ball.lastTouch=q;this.ball.by=null;this.ball.mode='carry';q.decision=.36;q.challenge=.4;owner.challenge=.45;
        this._recordDuel(owner,q,q,'tackle');this.stats.tackles[q.side]++;this.stats.duelsWon[q.side]++;this._actionFx('duel',q,q.x,q.y,'1x1 PESADO!');q.tackles++;q.rating=clamp(q.rating+.09,5,10);
        if(this.progress(q.side,q.x)<650&&this.random()<.24)this._moment(q.side,'duel',`⚔️ DISPUTA INTENSA! ${q.name} engole ${owner.name} no um contra um!`,[q.name,owner.name]);this._ego(q,5,'desarme');this.lastPass=null;this.combination=null;this.possessionSide=q.side;this.lastTurnover=[this.time,this.time];if(this.pressing[q.side]==='high'&&this.progress(q.side,q.x)>450)this.stats.pressingRecoveries[q.side]++;
        if(this.random()<.16)this.log(`${q.name} desarma ${owner.name}!`,'tackle',q.name);return;
      }
    }
  }
  _goal(side){const b=this.ball,thisSide=b.by?.side===side?b.by:null;
    const shot=[...this.shotMap].reverse().find(s=>s.side===side&&!s.goal);if(shot){shot.goal=true;shot.outcome='goal';}
    this.score[side]++;let scorer=thisSide;
    if(!scorer){const striker=this.players.filter(p=>p.side===side&&p.i>=8);scorer=striker.reduce((a,p)=>distance(p,b)<distance(a,b)?p:a,striker[0]);}
    scorer.goals++;scorer.rating=clamp(scorer.rating+.75,5,10);this._ego(scorer,39,'gol decisivo');let assister=null;
    if(this.lastPass&&this.lastPass.side===side&&this.lastPass.p!==scorer&&this.time-this.lastPass.time<135){assister=this.lastPass.p;assister.assists++;assister.rating=clamp(assister.rating+.32,5,10);this._ego(assister,19,'assistência');}
    if(b.isPenalty){this.stats.penaltiesScored[side]++;assister=null;}
    const scoredFrom=b.isPenalty?'penalty':b.setPiece||((this.lastPass&&this.time-this.lastPass.time<135)?this.lastPass.setPiece:null)||null;
    const kind=b.isPenalty?'penalty':shot?.style||(shot?.header?'header':'normal');
    const legendary=kind==='acrobatic'||kind==='box-combo'||kind==='first-time'||(kind==='tap-in'&&scorer.soloUntil>this.time)||(kind==='turn-shot'&&(scorer.flowUntil>this.time||has(scorer,'trap')))||(kind==='inside'&&(scorer.soloUntil>this.time||has(scorer,'poacher')||has(scorer,'trap')))||(kind==='header'&&(['ZAG','CB'].includes(scorer.role)||has(scorer,'poacher')))||(kind==='long'&&!!(scorer.flowUntil>this.time||has(scorer,'impact')||has(scorer,'curve')));
    if(legendary){this.stats.legendaryGoals[side]++;this._moment(side,'legend',`🌟 GOLAÇO LENDÁRIO! ${scorer.name} faz uma finalização extraordinária!`,[scorer.name]);}
    this._actionFx(legendary?'legend':'goal',scorer,b.x,b.y,legendary?'GOLAÇO!':'GOOOOL!');
    const celebrations=[{id:'slide',label:'Deslizando no gramado'},{id:'jump',label:'Salto do ego'},{id:'arms',label:'Braços abertos para a torcida'},{id:'team',label:'Abraço coletivo'},{id:'point',label:'Apontando para o céu'}];
    const choice=scorer.name==='Michael Kaiser'?celebrations[2]:scorer.name==='Yoichi Isagi'?celebrations[1]:scorer.name==='Shoei Baro'?celebrations[4]:celebrations[Math.floor(this.random()*celebrations.length)];
    this.celebration={...choice,scorer:scorer.name,side,minute:Math.max(1,Math.ceil(this.time/60))};
    this.goalRecords.push({side,scorer:scorer.name,assister:assister?.name||null,setPiece:scoredFrom,goalType:kind,legendary,celebration:{...choice},minute:Math.max(1,Math.ceil(this.time/60)),score:[...this.score]});
    this.lastGoal={side,scorer:scorer.name,goalType:kind,legendary,assister:assister?.name||null,minute:Math.floor(this.time/60),frames:[...this.history.slice(-90).map(f=>({time:f.time,ball:{...f.ball},positions:f.positions.map(pos=>[...pos])})),{time:this.time,ball:{x:b.x,y:b.y,height:b.height||0,mode:'shot'},positions:this.players.map(p=>[p.x,p.y])}]};
    this.goalClips.push(this.lastGoal);if(this.goalClips.length>28)this.goalClips.shift();
    this.log(`⚽ GOOOOOL! ${this.teams[side].short} — ${scorer.name}${assister?' (assistência de '+assister.name+')':''}`,'goal',scorer.name);
    this.phase='goal';this.wait=3.25;this.nextKick=1-side;b.owner=null;b.vx=b.vy=0;b.mode='dead';this.goalFlash=1.7;this.lastPass=null;
  }
  _snapshot(dt){this.historyTimer+=dt;if(this.historyTimer<.087)return;this.historyTimer=0;
    this.history.push({time:this.time,ball:{x:this.ball.x,y:this.ball.y,height:this.ball.height||0,mode:this.ball.mode},positions:this.players.map(p=>[p.x,p.y])});if(this.history.length>125)this.history.shift();
  }
  step(dt=TICK){
    if(this.finished)return;dt=clamp(dt,.001,.08);this.goalFlash=Math.max(0,this.goalFlash-dt);
    if(this.phase==='halftime'){
      this.wait-=dt;
      if(this.wait<=0){this.half=2;this.kickoff(1-this.firstKickoffSide);this.log('▶️ Começa o segundo tempo!','start');}
      return;
    }
    if(this.phase==='goal'||this.phase==='restart'){
      this.wait-=dt;if(this.wait<=0){if(this.phase==='goal')this.kickoff(this.nextKick);else this._performRestart();}
      return;
    }
    this.time=Math.min(this.fullTimeEnd,this.time+dt*(Number.isFinite(this.gameRate)&&this.gameRate>0?this.gameRate:GAME_RATE));this._updateMasters();
    if(!this.halftimeDone&&this.time>=this.firstHalfEnd){
      this.halftimeDone=true;this.time=this.firstHalfEnd;this.half=1;this.phase='halftime';this.wait=1.65;
      this.ball.owner=null;this.ball.mode='dead';this.ball.vx=this.ball.vy=0;
      this.lastPass=null;this.combination=null;this._applyPendingSubs();
      this.log(`⏸️ INTERVALO! ${this.teams[0].short} ${this.score[0]} × ${this.score[1]} ${this.teams[1].short}`,'halftime');
      return;
    }
    const b=this.ball;b.lock=Math.max(0,b.lock-dt);
    for(const p of this.players){p.decision=Math.max(0,p.decision-dt);p.challenge=Math.max(0,p.challenge-dt);p.skillLock=Math.max(0,p.skillLock-dt);
      if(p.activeAbility&&this.time>=p.activeAbility.until)p.activeAbility=null;
      // Recuperação leve fora de esforços máximos; nunca concede energia infinita.
      if(p.i!==0&&p!==this.ball.owner&&!(p.run&&p.run.until>this.time))p.stamina=Math.min(100,p.stamina+dt*.24);
      if(p.flowUntil>this.time&&this.random()<.001)this._emitSkill(p,'FLOW','flow',65);
    }
    if(b.owner?.i===0&&b.owner.handControl&&this.time-b.owner.handControlStart>=8){
      const keeper=b.owner,attacking=1-keeper.side;
      this.stats.keeperDelays[keeper.side]++;this.stats.corners[attacking]++;
      this.log(`⏱️ ${keeper.name} segurou a bola com as mãos por mais de oito segundos: ESCANTEIO para ${this.teams[attacking].short}!`,'foul',keeper.name);
      keeper.handControl=false;
      this._setRestart(attacking,attacking===0?PITCH.right:PITCH.left,keeper.y,'Escanteio');return;
    }
    if(b.owner)this.stats.possession[b.owner.side]+=dt;
    this._updateRunPlans(dt);
    this._movePlayers(dt);
    this._ballMotion(dt);
    this.currentPhases();
    if(!this.shapeHistory)this.shapeHistory=[[],[]];
    for(let s=0;s<2;s++){
      const pattern=this.modernPattern(s),history=this.shapeHistory[s];
      if(!history.length||history[history.length-1].shape!==pattern){
        history.push({minute:Math.floor(this.time/60),time:+this.time.toFixed(1),shape:pattern,phase:this.phaseFor(s)});
        if(history.length>100)history.shift();
      }
    }
    if(this.phase==='play'&&this.ball.owner){const p=this.ball.owner;
      if(p.decision<=0)this._ownerDecision(p);
      if(this.ball.owner)this._tackles(dt);
    }
    this._coachDecisions();
    this._snapshot(dt);
    if(this.time>=this.fullTimeEnd)this.finish();
  }
  finish(){if(this.finished)return;this.time=this.fullTimeEnd;this._updateMasters(true);this.finished=true;this.phase='finished';this.log('🏁 Fim de jogo!','finish');}
  runToEnd(){let i=0;while(!this.finished&&i++<14000)this.step(TICK);if(!this.finished)this.finish();return this.result();}
  result(){return {home:this.teams[0].id,away:this.teams[1].id,score:[...this.score],startingLineups:this.startingLineups.map(rows=>rows.map(p=>({...p}))),coachPlans:this.coachPlans.map(x=>x?{reason:x.reason,form:x.form,changes:x.changes}:null),coachDecisions:this.coachDecisions.map(x=>({...x})),gameplayPreset:this.gameplayPreset,weather:this.weather,autoGameplan:!!this.autoGameplan,planNames:[...(this.planNames||[])],modernPatterns:[this.modernPattern(0),this.modernPattern(1)],specialMoments:this.specialMoments.map(m=>({...m})),shapeHistory:(this.shapeHistory||[[],[]]).map(h=>h.map(x=>({...x}))),tacticalSettings:{pressing:[...this.pressing],attackWidth:[...this.attackWidth],buildUp:[...this.buildUp],stance:[...this.tactics],crosses:[...this.crossPreference],corners:[...this.setPieceStyle]},stats:JSON.parse(JSON.stringify(this.stats)),players:[...this.retiredPlayers,...this.masterHidden,...this.players].map(p=>({name:p.name,side:p.side,role:p.role,attributes:p.attributes,ovr:p.attributes?.ovr||75,isMaster:!!p.isMaster,goals:p.goals,assists:p.assists,shots:p.shots,dribblesWon:p.dribblesWon||0,saves:Math.max(p.saves||0,p.i===0?this.shotMap.filter(s=>s.outcome==='saved'&&s.savedBy===p.name&&s.side!==p.side).length:0),passes:p.pases||0,flowCount:p.flowCount||0,abilityUses:{...(p.abilityUses||{})},tackles:p.tackles||0,interceptions:p.interceptions||0,shotBlocks:p.shotBlocks||0,aerialWins:p.aerialWins||0,duelsWon:p.duelsWon||0,keyPasses:p.keyPasses||0,runs:p.runCount,overlaps:p.overlapCount,distance:Math.round(p.distanceCovered),rating:+p.rating.toFixed(1)})),masterEntries:this.masterEntries.map(r=>({...r})),substitutions:this.subRecords.map(s=>({...s})),cards:this.cardRecords.map(c=>({...c})),shots:this.shotMap.map(s=>({...s})),events:this.keyEvents.map(e=>({...e})),goalRecords:this.goalRecords.map(r=>({...r,score:[...r.score]})),abilityHistory:this.abilityHistory.map(a=>({...a})),duelHistory:this.duelHistory.map(d=>({...d})),seed:this.seed};}
}
function recordFixture(season,fixture,match){
  if(fixture.result)return false;
  const r=match.result();fixture.result=r.score;
  // Histórico compacto no armazenamento: conserva placares, gols, estatísticas,
  // jogadores e progressão; evita crescimento descontrolado do save no celular.
  fixture.details={...r,
    abilityHistory:(r.abilityHistory||[]).slice(-65),
    events:(r.events||[]).slice(-90),
    duelHistory:(r.duelHistory||[]).slice(-90),
    shots:(r.shots||[]).slice(-110),
    specialMoments:(r.specialMoments||[]).slice(-40),
    shapeHistory:(r.shapeHistory||[]).map(h=>h.slice(-40)),
    players:(r.players||[]).map(p=>({...p,abilityUses:Object.fromEntries(Object.entries(p.abilityUses||{}).sort((a,b)=>b[1]-a[1]).slice(0,18))}))
  };
  for(const p of r.players){const id=(p.side===0?fixture.home:fixture.away),key=p.name+'|'+id;
    if(p.goals)season.scorers[key]=(season.scorers[key]||0)+p.goals;
    if(p.assists)season.assists[key]=(season.assists[key]||0)+p.assists;
  }
  if(!Array.isArray(season.goalLog))season.goalLog=[];
  const round=season.rounds.find(x=>x.games.includes(fixture))?.round||0;
  for(const rec of r.goalRecords||[])season.goalLog.push({round,home:fixture.home,away:fixture.away,team:rec.side===0?fixture.home:fixture.away,scorer:rec.scorer,assister:rec.assister,setPiece:rec.setPiece||null,minute:rec.minute,score:[...rec.score]});
  const before=Progression.rank(season).map(p=>p.name+'|'+p.club);
  Progression.record(season,fixture,match,round);
  const ranks=Progression.rank(season);ranks.forEach((p,i)=>{const prev=before.indexOf(p.name+'|'+p.club);p.rankChange=prev<0?0:prev-i;});
  return true;
}
function migrateLegacySeason(legacy){
  if(!legacy||!Array.isArray(legacy.fixtures)||legacy.fixtures.length!==20)return null;
  const season=createSchedule();
  const oldGames=legacy.fixtures.flatMap(r=>r.games||[]);const newGames=season.rounds.flatMap(r=>r.games);
  if(oldGames.length!==newGames.length)return null;
  for(const newGame of newGames){const original=oldGames.find(g=>g.home===newGame.home&&g.away===newGame.away&&Array.isArray(g.result)&&!g._migrated);
    if(original){original._migrated=true;newGame.result=[...original.result];newGame.details=original.stats?{stats:original.stats}:null;}}
  season.scorers={...legacy.scorers};season.assists={...legacy.assists};season.goalLog=[];return season;
}
function lerp(a,b,t){return a+(b-a)*t;}
return {PITCH,TICK,GAME_RATE,MAX_SECONDS,TEAMS,EXTRA_TEAMS,allTeams,registerTeam,registerCreatedPlayer,unregisterCreatedPlayer,listCreatedPlayers,COUNTRY_KITS,SKILLS,PLAYER_STYLES,GAMEPLAN_TEMPLATES,Attr,Abilities,Masters,Progression,avatarTheme,avatarHTML,avatarSVG,REAL_PORTRAITS,Match,createSchedule,standings,teamById,recordFixture,migrateLegacySeason,FORMATIONS,DEFAULT_FORMATION};
});

