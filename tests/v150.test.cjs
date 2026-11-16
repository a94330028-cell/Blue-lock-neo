'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const A=require('../web/neo-ascension-v150.js');
const read=p=>fs.readFileSync(p,'utf8');
const maker=(name,side,role,i,x,y,vision=90)=>({name,side,role,i,x,y,stamina:85,
 attributes:{vision,ego:82},activeAbility:{id:name+'-weapon',until:380}});
const rin=maker('Rin',1,'CA',9,540,480,94);
const isagi=maker('Isagi',0,'MEI',8,680,500,96);
const kaiser=maker('Kaiser',0,'CA',9,780,500,91);
const gk=maker('Gagamaru',0,'GOL',0,120,576,85);
const m={time:100,phase:'play',players:[rin,isagi,kaiser,gk],
 teams:[{id:'bm'},{id:'px'}],careerLinks:{'Isagi + Kaiser|bm':{plays:3}},
 careerPlayers:{},ball:{owner:isagi},score:[0,1],stats:{longShots:[3,0],boxShots:[0,0]},
 random:()=>.1,progress:()=>900,opponentPressure:()=>1,offside:()=>false,
 safeLane:()=>78,log(msg){(this.logs||(this.logs=[])).push(msg);}};
const skill={id:'rin-power',stat:'finishing',label:'Finalização Espiral'};
assert.equal(A.observation(m,isagi,rin,skill).seen,1);
assert.equal(A.counterBonus(m,isagi,'positioning'),1,'one reading does not reveal a counter');
assert.equal(A.observation(m,isagi,rin,skill).seen,2);
assert.ok(A.counterBonus(m,isagi,'positioning')>1,'two real sightings improve correct defensive reading');
assert.equal(A.counterBonus(m,isagi,'finishing'),1,'counter does not buff unrelated stats');
assert.equal(A.observation(m,kaiser,rin,{...skill,id:'new-weapon'}).seen,1,'other observer tracks own sighting');
assert.equal(A.observation({...m,time:400},gk,rin,skill),null,'distant goalkeeper cannot observe technique');
const observations=A.details(m).events;
assert.equal(observations.filter(e=>e.type==='reading').length,1);
assert.equal(A.runChoice(m,kaiser,isagi,'box'),'channel','after long shots strikers attack real channels');
assert.equal(A.runChoice({...m,stats:{longShots:[0,0],boxShots:[3,0]}},kaiser,isagi,'box'),'box','ordinary attacking runs remain varied');
assert.equal(A.runChoice({...m,opponentPressure:()=>2},isagi,kaiser,'third-man'),'support','midfield drops to aid pressured ball');
let passed=false;
const ms={...m,ball:{owner:isagi},pass(p,q){passed=true;this.ball={mode:'pass',by:p,to:q,owner:null};},
 passCandidate:()=>({q:kaiser,lane:72,d:145})};
assert.equal(A.recycle(ms,isagi),true,'sensible alternative to repetitive long-range shot');
assert.equal(passed,true);
assert.equal(ms.ball.to,kaiser);
assert.equal(A.recycle({...ms,ball:{owner:kaiser},stats:{longShots:[0,0],boxShots:[0,0]}},kaiser),false,'not a permanent enforced pass');
const cm={...m,_neo150Events:[],_neo150Combo:null,log(){}};
assert.equal(A.coordinatedPass(cm,isagi,kaiser),true,'chemistry and genuine skill activation produce combination');
assert.ok(A.comboBonus(cm,kaiser,'control')>1);
assert.equal(A.comboBonus(cm,isagi,'control'),1);
assert.equal(A.comboBonus({...cm,time:200},kaiser,'control'),1,'combo expires');
assert.equal(A.coordinatedPass({...m,careerLinks:{}},isagi,kaiser),false,'no invented chemistry');
const win=A.learnedDuel(m,isagi,rin,isagi,'tackle');
assert.equal(win.player,'Isagi');
assert.equal(win.opponent,'Rin');
assert.equal(A.learnedDuel(m,isagi,rin,rin,'tackle'),null,'counter only earned by actual learner victory');
const shooting={...m,time:150,shotMap:[{shooter:'Kaiser',onTarget:true,xg:.27,style:'acrobatic'}],
 _moment(side,type,text){this.moment={side,type,text}},_neo150Events:[],random:()=>0};
const genius=A.actualShotMoment(shooting,kaiser,0);
assert.equal(genius?.type,'genius');
assert.equal(shooting.moment.side,0);
assert.equal(A.actualShotMoment(shooting,kaiser,1),null,'no shot, no genius');
const save={...m,time:200,shotMap:[{shooter:'Rin',savedBy:'Gagamaru',outcome:'saved',xg:.32}],
 _moment(side,type,text){this.moment={side,type,text}},_neo150Events:[],random:()=>0};
assert.equal(A.realSaveMoment(save,gk,true)?.type,'save');
assert.equal(A.realSaveMoment(save,gk,false),null,'never award a save not made');
assert.equal(A.details(save).events.length,1);
assert.equal(A.adapt(E),true,'install once');
assert.equal(A.adapt(E),false,'no duplicate wrapping');
const sim=new E.Match('bm','px',1500414);
sim.rollGameplan();
for(let i=0;i<340;i++)sim.step(E.TICK);
const result=sim.result();
assert.ok(result.egoAscension&&Array.isArray(result.egoAscension.events),'genuine events in report');
assert.deepEqual(result.score,sim.score,'never modify goals');
assert.ok(sim.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'no teleport or NaN');
const source=read('web/neo-ascension-v150.js');
assert.ok(!source.includes('localStorage.clear('));
assert.ok(read('web/index.html').includes('neo-ascension-v150.js'));
assert.ok(read('web/index.html').includes('neo-ascension-v150.css'));
assert.ok(read('web/service-worker.js').includes('./neo-ascension-v150.js'));
assert.ok(read('web/service-worker.js').includes('blue-lock-neo-v1.10.1-reference-mobile'));
const changes=JSON.parse(read('CHANGELOG.json'));
assert.equal(changes.current_version,'1.8.0');
assert.equal(changes.releases[0].version,'1.8.0');
assert.equal(read('web/VERSION').trim(),'1.8.0');
assert.equal(read('web/UPDATE_BUILD').trim(),'10.6.13');
assert.ok(read('app/build.gradle').includes("versionName '1.8.0'"));
assert.ok(read('app/build.gradle').includes('versionCode 116'));
console.log('PASS 1.4 EGO ASCENSION: real weapon observations, context counters, box runs, passing combos, historic saves, saves intact.');
