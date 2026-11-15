'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../web');
const E=require(path.join(root,'engine.js'));
const A=E.Attr,P=E.Progression;
const all=[];
for(const team of E.TEAMS){for(const [i,name] of team.players.entries()){
 const role=team.formation[i].role;
 const attr=A.generate(name,role,i);
 assert.equal(attr.ovr,A.overall(attr,role,i),'OVR must derive from real skills: '+name);
 assert.ok(attr.ovr>=60&&attr.ovr<=90,'Non-master OVR never exceeds 90: '+name);
 all.push({name,role,ovr:attr.ovr});
}}
const ovr=name=>all.find(x=>x.name===name)?.ovr;
for(const [name,min] of [['Michael Kaiser',90],['Yoichi Isagi',89],['Rin Itoshi',90],['Reo Mikage',88],['Don Lorenzo',90],['Oliver Aiku',90],['Seishiro Nagi',87],['Gin Gagamaru',89]]) assert.ok(ovr(name)>=min,'Calibrated role '+name);
for(const club of E.TEAMS){
 const master=E.Attr.generate(club.master,'CA',9);
 assert.ok(master.ovr>=96&&master.ovr<=99,'Masters rank above regular players: '+club.master);
 const boosted=E.Attr.generate(club.players[9],club.formation[9].role,9,{boosts:{finishing:20,power:20,tactics:20}});
 assert.ok(boosted.ovr<=90,'Training never breaks the non-master cap');
}
assert.equal(E.Masters.WINDOW_SECONDS,600);
assert.equal(E.Masters.MAX_ENTRIES,2);
const masterRuns=[101,102,103,104].map(seed=>new E.Match('mc','ub',seed).runToEnd());
const entries=masterRuns.flatMap(r=>r.masterEntries||[]);
assert.ok(entries.length>=4,'Masters appear regularly across games');
assert.ok(entries.some(x=>x.ended&&x.exitMinute-x.minute>3),'Masters remain beyond three minutes');
assert.ok(masterRuns.some(x=>x.masterEntries.some((r,i,all)=>all.some((other,j)=>j!==i&&other.side===r.side))),'A team can deploy its master more than once');
for(const r of masterRuns){const counts=[0,0];for(const e of r.masterEntries)counts[e.side]++;assert.ok(counts.every(x=>x<=2),'Maximum two interventions per side');}
const match=new E.Match('mc','ub',112211);
const reo=match.players.find(p=>p.name==='Reo Mikage');
assert.equal(reo.attributes.ovr,ovr('Reo Mikage'));
const original=reo.attributes.ovr;
const good=match._attributes(reo,'passing');reo.attributes.ovr=70;
const weak=match._attributes(reo,'passing');reo.attributes.ovr=original;
assert.ok(good>weak,'Higher overall must affect the actual passing contest');
const r=match.runToEnd();
assert.ok(r.score.every(x=>x>=0&&Number.isInteger(x)));
assert.equal(r.goalRecords.length,r.score.reduce((a,b)=>a+b,0),'Never invent goals');
const perPlayer=r.players;
for(const key of ['tackles','interceptions','shotBlocks','aerialWins','duelsWon','keyPasses']){
 for(const p of perPlayer)assert.ok(Number.isFinite(p[key])&&p[key]>=0,'Real personal '+key);
}
assert.ok(r.stats.tackles.some(x=>x>0));
const season=E.createSchedule(4);
const fixture=season.rounds.flatMap(round=>round.games).find(f=>f.home==='mc'&&f.away==='ub');
assert.ok(fixture,'Fixture exists for season progression');
const m2=new E.Match(fixture.home,fixture.away,223344);
m2.runToEnd();
assert.equal(E.recordFixture(season,fixture,m2),true);
const career=season.career?.players?.['Reo Mikage|mc'];
assert.ok(career&&career.games===1,'Reo season is stored');
for(const k of ['interceptions','shotBlocks','aerialWins','duelsWon','keyPasses'])assert.ok(Number.isFinite(career[k]),'Season field '+k);
assert.equal(P.estimateValue({games:0,goals:99,interceptions:99},99,'ZAG'),0,'Do not start with fake bids');
const defender={games:4,role:'ZAG',tackles:14,interceptions:13,shotBlocks:7,aerialWins:8,duelsWon:18,passes:80,ratingSum:29,wins:2};
const striker={games:4,role:'CA',goals:2,assists:0,passes:80,ratingSum:29,wins:2};
assert.ok(P.estimateValue(defender,94,'ZAG')>P.estimateValue(striker,94,'CA'),'Strong defenders deserve fair prices');
assert.ok(P.estimateValue(defender,94,'ZAG')<=650e6,'Values are bounded');
assert.ok(fs.readFileSync(path.join(root,'neo-v930.js'),'utf8').includes('neo930-defense-rank'));
const mobile=fs.readFileSync(path.join(root,'mobile-upgrade.js'),'utf8');
assert.ok(mobile.includes('neo-v930.js?v=9.3.0'),'App must load the new UI');
assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'9.3.0');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('const TARGET_OVR=Object.freeze('),'Actual running HTML embeds new OVR code');
assert.ok(html.includes('interceptions*(defender?2.1:.60)'),'Actual running HTML embeds new transfer values');
assert.ok(html.includes('winner.duelsWon=(winner.duelsWon||0)+1'),'Actual running HTML embeds duel recording');
console.log('OK: '+all.length+' calibrated starters, real OVR advantage, Reo, defending, market, persisted season, embedded game UI');