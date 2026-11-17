/* History Team: dedicated opt-in squad for exhibitions and cups.
 * Loaded before web/app.js; legacy league and history tests keep 5 teams.
 * Portraits remain user-controlled and can be attached one by one.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root){root.NeoHistoryTeam=api;if(root.NeoEngine)api.install(root.NeoEngine);}
})(typeof window!=='undefined'?window:undefined,function(){
 'use strict';
 function install(E){
  if(!E?.registerTeam||!E?.Attr?.registerPlayerRatings)throw Error('History Team requires NeoEngine.');
  if(E.teamById('ht'))return false;
  const Attr=E.Attr,FORMATIONS=E.FORMATIONS,registerTeam=E.registerTeam;
  // History Team is available in exhibitions and cups. Preserve the five-club
  // original NEL league, its standings and all existing seasons.
  const HISTORY_RATINGS=Object.freeze([
   ['Dexter Morgan','PE',94],['Gustavo Grace','PD',94],['Hao','CA',90],
   ['Saiko','CA',92],['Gb','MC',93],['Fuyuki','MC',92],['Zenkai','VOL',90],
   ['Oliver Grace','ZAG',92],['Zeus','ZAG',93],['Charles','ZAG',93],
   ['Gin','GOL',91],['Soul','MC',88],['Toko','GOL',90],['Kanzaku','GOL',90],
   ['Taiju','MC',90],['Akira','ZAG',88],['Dots','MC',87],
   ['Lacerda','VOL',86],['Shiro','PD',88]
  ]);
  for(const [name,role,ovr] of HISTORY_RATINGS)
   Attr.registerPlayerRatings(name,ovr,{allowHigh:true,club:'ht',role});
  registerTeam({
   id:'ht',country:'Fictício',name:'History Team',short:'HISTORY',crest:'HT',
   formationName:'3-3-4',formation:FORMATIONS.ht,
   color:'#f9ce46',dark:'#4c357f',accent:'#fff3b1',
   atk:94,def:92,pas:93,style:'build',master:'Gustavo Grace',
   players:['Gin','Oliver Grace','Zeus','Charles','Zenkai','Gb','Fuyuki',
            'Gustavo Grace','Dexter Morgan','Hao','Saiko'],
   reserves:['Soul','Toko','Kanzaku','Taiju','Akira','Dots','Lacerda','Shiro'],
   reserveRoles:{Soul:'MC',Toko:'GOL',Kanzaku:'GOL',Taiju:'MC',Akira:'ZAG',
                 Dots:'MC',Lacerda:'VOL',Shiro:'PD'},
   suppliedRatings:Object.fromEntries(HISTORY_RATINGS.map(([name,role,ovr])=>[name,{role,ovr}]))
  });
  
  return E.teamById('ht');
 }
 return {install};
});
