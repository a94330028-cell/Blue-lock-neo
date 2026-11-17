'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
require('../web/neo2-history-team-v201.js').install(E);
require('../web/neo-historic-teams-v970.js').install(E);
const original=E.TEAMS.map(t=>t.id);
const clubs=E.allTeams().filter(t=>t.id!=='neo-bestxi').map(t=>t.id);
assert.equal(clubs.length,10,'five Neo Egoist, four historic, and History Team are registered');

function verify(ids,meetings){
  const s=E.createSchedule(meetings,ids);
  const games=s.rounds.flatMap(r=>r.games);
  assert.deepEqual(s.teamIds,ids);
  assert.equal(s.format.meetings,meetings);
  assert.equal(s.rounds.length,meetings*(ids.length%2?ids.length:ids.length-1));
  assert.equal(games.length,meetings*ids.length*(ids.length-1)/2);
  assert.ok(s.rounds.every(r=>r.games.length===Math.floor(ids.length/2)));
  const pairs=new Map(),hosts=new Map();
  for(const r of s.rounds){
    const active=new Set();
    for(const f of r.games){
      assert.ok(!active.has(f.home)&&!active.has(f.away),'a club plays at most once per round');
      active.add(f.home);active.add(f.away);
      const key=[f.home,f.away].sort().join(':');
      pairs.set(key,(pairs.get(key)||0)+1);
      hosts.set(f.home+':'+f.away,(hosts.get(f.home+':'+f.away)||0)+1);
    }
  }
  assert.equal(pairs.size,ids.length*(ids.length-1)/2);
  assert.ok([...pairs.values()].every(count=>count===meetings));
  for(const [key] of pairs){
    const [a,b]=key.split(':');
    assert.equal(hosts.get(a+':'+b),meetings/2,'balanced home matches');
    assert.equal(hosts.get(b+':'+a),meetings/2,'balanced away matches');
  }
  const table=E.standings(s);
  assert.deepEqual(new Set(table.map(r=>r.team.id)),new Set(ids));
  const fixture=games[0];fixture.result=[3,1];
  const after=E.standings(s);
  assert.equal(after.find(r=>r.team.id===fixture.home).PTS,3);
  assert.equal(after.find(r=>r.team.id===fixture.away).GC,3);
  return s;
}
verify(original,4);
const old=E.createSchedule(4);delete old.teamIds;
assert.deepEqual(new Set(E.standings(old).map(r=>r.team.id)),new Set(original),'pre-update save uses original clubs');
verify(clubs.slice(0,6),2);
verify(clubs.slice(0,7),4);
verify(clubs,6);
verify(['ht','mu08','fla19','mir25','sport15'],4);
assert.throws(()=>E.createSchedule(4,['ht']),/Selecione/);
assert.throws(()=>E.createSchedule(4,['invalid','ht']),/Selecione/);
const app=fs.readFileSync('web/app.js','utf8');
const html=fs.readFileSync('web/index.html','utf8');
assert.ok(app.includes('function validLeagueSeason(saved)')&&!app.includes('[10,20,30].includes(restored.rounds?.length)'));
assert.ok(app.includes('E.createSchedule(Number($(\'seasonFormat\').value),clubs)'));
assert.ok(app.includes('neo-season-previous-v2'),'automatic backup before replacing a season');
assert.ok(html.includes('id="leagueTeamPicker"')&&html.includes('id="leagueTeamCount"'));
console.log('PASS: customizable Neo Egoist League, complete round robins, standings and old saves');
