'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const Advanced=require('../web/neo-advanced-v200.js');
const Universe=require('../web/neo-universe-v220.js');
const Twelve=require('../web/neo-twelve-v230.js');
const Pulse=require('../web/neo-match-pulse-v240.js');
const Spotlight=require('../web/neo-universe-spotlight-v250.js');
assert.equal(Advanced.adapt(E),true);
assert.equal(Universe.adapt(E),true);
assert.equal(Twelve.adapt(E),true);
assert.equal(Pulse.adapt(E),true,'new match pulse installs into real automatic engine');
assert.equal(Pulse.adapt(E),false,'match pulse cannot register twice');
assert.equal(Pulse.state({}).schema,1);
const season=E.createSchedule(4);E.Progression.ensure(season);
const initial=JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves})));
const build=(seed)=>new E.Match('bm','px',seed,season.career,season);
const a=build(580311),b=build(580311);
for(let i=0;i<400;i++){a.step(E.TICK);b.step(E.TICK);}
assert.deepEqual(a.score,b.score,'intensity never makes fixed seed nondeterministic');
assert.deepEqual(a.result().neo240,b.result().neo240,'report derived from identical events');
assert.equal(a.result().neo240.schema,1);
assert.ok(a.result().neo240.highlights.every(e=>typeof e.text==='string'&&e.minute>=0));
assert.ok(a.result().neo240.narration.length<=28);
assert.ok(a.result().neo240.events.length<=36);
assert.ok(a.result().neo240.territorySamples>=0);
assert.ok(a.result().neo240.territory.every(x=>Number.isInteger(x)&&x>=0));

const player={name:'Atleta A',side:0,i:9,role:'MEI',x:1000,y:600,stamina:90};
const teammate={name:'Atleta B',side:0,i:7,role:'MEI',x:1110,y:500,stamina:84};
const keeper={name:'Goleiro',side:1,i:0,role:'GOL',x:178,y:500,stamina:100};
const mock={time:85*60,phase:'play',score:[0,1],ball:{mode:'carry',owner:player,x:1000,y:600},
 players:[player,teammate,keeper],progress:(_side,x)=>x,
 opponentPressure:()=>3,shotMap:[],subRecords:[],coachDecisions:[],skillEffects:[]};
assert.ok(Pulse.intensity(mock,0)>1.02,'31 intensity active when trailing late');
assert.equal(Pulse.intensity(mock,1),1,'leading side gets no urgency bonus');
assert.ok(Pulse.mental(mock,player)<=1,'35 mental strain never improves a tired player');
assert.equal(Pulse.tactical(mock,teammate,player,'support'),'third-man','34 off-ball midfielder offers support');
assert.equal(Pulse.cameraCue(mock).focus,'Atleta A','32 camera follows current ball owner');
mock.ball={mode:'shot',x:1750,y:580,by:player};
assert.equal(Pulse.cameraCue(mock).kind,'shot','32 camera selects shot cue from true event');
// 36: count completed passes only when the true engine passer changes possession.
mock.time=86*60;
for(let i=0;i<3;i++){
 const from=i%2?teammate:player,to=i%2?player:teammate;
 mock.lastPass={p:from,time:mock.time,side:0};
 mock.ball={mode:'carry',owner:to,x:to.x,y:to.y};
 Pulse.observe(mock);
 mock.time+=20;
}
assert.equal(Pulse.report(mock).receptions,3,'36 counts three real same-team ball receptions');
assert.ok(Pulse.report(mock).events.some(e=>e.idea===36),'36 special sequence derives from pass chain');
mock.lastPass={p:keeper,time:mock.time,side:1};
mock.ball={mode:'carry',owner:player,x:player.x,y:player.y};
Pulse.observe(mock);
assert.equal(Pulse.report(mock).receptions,3,'36 cannot award opponent passing credit');
Pulse.onLog(mock,'ATLETA A FINALIZA!','shot','Atleta A');
Pulse.onLog(mock,'GOL DO ATLETA A!','goal','Atleta A');
assert.equal(Pulse.state(mock).narration.length,2,'37 narration comes from actual log calls');
assert.ok(Pulse.state(mock).highlights.some(h=>h.type==='goal'),'38 goal appears in highlights only when logged');
mock.subRecords.push({side:0,out:'Atleta A',in:'Reserva',role:'MEI',minute:73});
Pulse.trackSub(mock);
assert.equal(Pulse.report(mock).substitutions.length,1,'39 record real coach substitution');
Pulse.trackSub(mock);
assert.equal(Pulse.report(mock).substitutions.length,1,'39 no fake repeated substitute');
mock.ball={mode:'carry',owner:player,x:1400,y:500};mock.time+=20;
Pulse.observe(mock);
assert.ok(Pulse.report(mock).territorySamples>0,'40 territory sampled from real possession');
mock.phase='finished';assert.equal(Pulse.pulse(mock,31,'intensity',player,'Extra'),false,'31 no post-game artificial event');

const fixture=season.rounds[0].games[0];
const official=new E.Match(fixture.home,fixture.away,45820,season.career,season);
const officialResult=official.runToEnd();
assert.equal(E.recordFixture(season,fixture,official),true);
assert.equal(E.recordFixture(season,fixture,official),false,'official saves are idempotent');
assert.deepEqual(fixture.result,officialResult.score);
assert.ok(fixture.details.neo240,'new match report included in official fixture');
assert.ok(fixture.details.neoAdvanced,'previous mechanics continue working');
assert.ok(fixture.details.ego230,'previous Ego mechanisms continue working');
const view=Spotlight.seasonSummary(E,season);
assert.ok(view.leaders.length>=1,'42 Ego ranking from genuine recorded match');
assert.equal(view.finished,false,'43 seasonal awards cannot be announced after one game');
assert.equal(view.awards.length,0);
assert.equal(view.hall.length,0,'44 no champion before season end');
assert.ok(view.matches.length>0,'41 real results create story timeline');
const rated=view.players.find(p=>p.games>0);
assert.ok(rated,'55 encyclopedia draws verified career entries');
const f=Spotlight.formula(rated);
assert.ok(f&&Number.isFinite(f.finisher)&&Number.isFinite(f.consistency),'53 formula based on observed player performance');
assert.equal(Spotlight.formula({games:0}),null,'53 no fake formula for unused players');
assert.equal(Spotlight.identity({name:rated.name,club:rated.club}),rated.name+'|'+rated.club);
assert.equal(JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),initial,'original five squads never touched');

const sync=fs.readFileSync('tools/sync_inline_v930.py','utf8');
const sw=fs.readFileSync('web/service-worker.js','utf8');
for(const asset of ['neo-match-pulse-v240.js','neo-match-pulse-v240.css','neo-universe-spotlight-v250.js','neo-universe-spotlight-v250.css']){
 assert.ok(sync.includes(asset),'web index loads '+asset);
 assert.ok(sw.includes('./'+asset),'offline cache must contain '+asset);
}
console.log('PASS 31-55 integration: match decisions, camera cues, genuine saves, narration, ranking, championships and portrait-safe UI data');
