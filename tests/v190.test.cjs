'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js'),W=require('../web/neo-living-career-v190.js');
const read=f=>fs.readFileSync(f,'utf8');
const season=E.createSchedule(),career=E.Progression.ensure(season);
const league=E.TEAMS.map(t=>t.id);
assert.deepEqual(league,['bm','ba','mc','px','ub']);
assert.equal(W.gameCount(season),0);
assert.equal(W.currentRound(season),1);
const world=W.ensure(season);
assert.deepEqual(world.market.moves,[]);
const a=W.squadsFor(season,E);
assert.equal(W.validateSquads(a).length,0,'all clubs have unique starting lineups');
assert.ok(E.TEAMS.every(t=>Object.isFrozen(t)===false||t.players.length===11));
const deals=W.availableDeals(season,E,'bm','px');
assert.ok(deals.length>0,'at least one legal starter transfer');
const deal=deals.find(d=>d.name==='Yoichi Isagi')||deals[0];
career.players[deal.name+'|bm']={name:deal.name,club:'bm',role:deal.role,
 games:5,goals:3,ratingSum:38.1,boosts:{finishing:2},history:[{round:1,goals:1}]};
const beforeJSON=JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves})));
const moved=W.recordMove(season,E,{name:deal.name,from:'bm',to:'px'});
assert.equal(moved.name,deal.name);assert.equal(moved.round,1);
assert.equal(world.market.moves.length,1);
const newSquads=W.squadsFor(season,E);
assert.equal(newSquads.bm.players[deal.fromSlot],deal.replacement,'former reserve promoted');
assert.equal(newSquads.px.players[deal.toSlot],deal.name,'player joins target starting lineup');
assert.ok(newSquads.px.reserves.includes(deal.demoted),'replaced player goes to bench');
assert.equal(W.validateSquads(newSquads).length,0,'no duplicate players or eleven-player failures');
assert.equal(JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),beforeJSON,
 'original team definitions are never mutated');
assert.ok(!career.players[deal.name+'|bm'],'no duplicate old career entry');
assert.equal(career.players[deal.name+'|px'].goals,3,'old career stats carried across club changes');
assert.equal(career.players[deal.name+'|px'].clubHistory[0].club,'bm');
assert.throws(()=>W.recordMove(season,E,{name:deal.name,from:'bm',to:'px'}),/rodada/);
assert.equal(W.availableDeals(season,E,'bm','bm').length,0,'cannot transfer to same club');
assert.equal(W.availableDeals(season,E,'bm','notreal').length,0,'no fake clubs');
assert.equal(W.adapt(E),true,'install market engine extension before creating a new fixture');
const sim=new E.Match('bm','px',190109,E.Progression.ensure(season),season);
assert.equal(sim.teams[1].players[deal.toSlot],deal.name,'real league match receives transfer');
assert.equal(sim.teams[0].players[deal.fromSlot],deal.replacement);
assert.ok(sim.players.some(p=>p.side===1&&p.name===deal.name),'actual moving players updated');
assert.equal(sim.players.filter(p=>p.name===deal.name).length,1,'one physical copy of transferred player');
assert.deepEqual(sim.startingLineups[1][deal.toSlot].name,deal.name);
const created=E.registerCreatedPlayer({name:'Atleta Teste Neo',club:'mc',role:'MEI',number:14});
assert.ok(created,'player career uses the real existing creator');
const own=created.name,round=1;
career.players[own+'|mc']={name:own,club:'mc',role:'MEI',games:3,goals:1,assists:1,
 ratingSum:23.8,boosts:{},history:[]};
const m1={players:[{name:own,side:0,role:'MEI',rating:8.1,goals:1,assists:1,saves:0,flowCount:1},
 {name:'Gagamaru',side:0,role:'GOL',saves:6,rating:8},
 {name:'Defensor',side:1,role:'ZAG',rating:6.7,goals:0}],
 score:[2,0],duelHistory:[
 {attacker:own,defender:'Defensor',winner:own,kind:'dribble'},
 {attacker:own,defender:'Defensor',winner:'Defensor',kind:'tackle'}]};
const fixture={home:'mc',away:'px',result:[2,0],details:m1};
season.rounds[0].games[0]=fixture;
assert.equal(W.recordSeason(E,season,fixture,{result:()=>m1},round),true);
assert.equal(W.recordSeason(E,season,fixture,{result:()=>m1},round),false,'same fixture cannot be counted twice');
assert.equal(world.players[own].totalMatches,1);
assert.ok(world.players[own].achievements.includes('Primeira partida'));
assert.ok(world.players[own].achievements.includes('Primeiro gol'));
assert.equal(world.training[own].earned,1,'good third official appearance earns one training');
assert.equal(career.players[own+'|mc'].boosts.passing,1,'training changes actual engine attribute');
const boosted=E.Attr.generate(own,'MEI',8,career.players[own+'|mc']);
assert.ok(boosted.passing>=0);
assert.ok(world.articles.some(x=>x.type==='result'&&x.text.includes('MC 2 × 0 PX')),
 'news comes from reported score');
assert.equal(world.articles.filter(x=>x.type==='result').length,1,'no repeated report spam');
assert.equal(world.rivals['Atleta Teste Neo × Defensor'].duels,2);
assert.equal(world.rivals['Atleta Teste Neo × Defensor'].level,1,'actual 2 duels start rivalry');
assert.ok(W.records(season,E).played===1);
assert.equal(W.records(season,E).champion,null,'no premature champion');
assert.equal(W.records(season,E).biggest.gap,2);
const noReport={score:[0,0],players:[],duelHistory:[]};
const empty=E.createSchedule();
W.ensure(empty);
assert.equal(W.recordSeason(E,empty,{home:'bm',away:'px'},null,1),false);
assert.equal(empty.career.neoWorld.articles.length,0,'no fabricated article without a match');
assert.ok(W.postNews(world,{round:2,type:'training',headline:'a',text:'Partida verificada'}));
assert.equal(W.postNews(world,{round:2,type:'training',headline:'a',text:'Partida verificada'}),null,
 'news deduplicated');
const competitions=W.competitions({NeoTournament1030:{safeLoad:()=>[
 {name:'Copa dos Egoístas',rounds:[{games:[{result:[2,1]}]}],champion:'mc'}]},
 localStorage:{}},season,E);
assert.ok(competitions.some(c=>c.name==='Copa dos Egoístas'&&c.winner==='mc'),'only confirmed cup titles');
assert.equal(W.adapt(E),false,'idempotent engine adaptation');
const checkA=new E.Match('bm','px',90019,E.Progression.ensure(season),season);
const checkB=new E.Match('bm','px',90019,E.Progression.ensure(season),season);
checkA.rollGameplan();checkB.rollGameplan();
for(let i=0;i<540;i++){checkA.step(E.TICK);checkB.step(E.TICK);}
assert.deepEqual(checkA.score,checkB.score,'same seeded 40x physics steps, identical results');
assert.equal(checkA.ball.mode,checkB.ball.mode);
assert.ok(checkA.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
const report=checkA.result();assert.deepEqual(report.score,checkA.score);
assert.ok(read('web/app.js').includes("fast.value='40'"));
assert.ok(read('web/app.js').includes('window.NeoCareerBridge'));
assert.ok(read('web/engine.js').includes('this.neoSeasonContext=seasonContext'));
assert.ok(read('tools/sync_inline_v930.py').includes('neo-living-career-v190.js'));
assert.ok(read('web/index.html').includes('neo-living-career-v190.js'));
assert.ok(read('web/index.html').includes('neo-living-career-v190.css'));
assert.ok(read('web/service-worker.js').includes('blue-lock-neo-v1.9.2-ego12'));
assert.ok(read('web/service-worker.js').includes('./neo-living-career-v190.js'));
const changelog=JSON.parse(read('CHANGELOG.json'));
assert.equal(changelog.current_version,'1.8.0');
assert.equal(changelog.releases[0].version,'1.8.0');
assert.equal(read('web/VERSION').trim(),'1.8.0');
assert.equal(read('web/UPDATE_BUILD').trim(),'10.6.11');
assert.ok(read('app/build.gradle').includes("versionName '1.8.0'"));
assert.ok(read('app/build.gradle').includes('versionCode 116'));
console.log('PASS 1.8: player career, rivalry, training, real transfer lineups, tournaments, records, seeded turbo and truthful news');
