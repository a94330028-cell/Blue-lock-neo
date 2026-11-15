/* Master-Striker entry profiles and tactical philosophy. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.NeoMasters=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const CONFIG={bm:{name:'Noel Noa',philosophy:'Eficiência racional',skill:'noa',pressure:'balanced',build:'patient',entryProbability:.94},ba:{name:'Lavinho',philosophy:'Liberdade criativa',skill:'lavinho',pressure:'high',build:'balanced',entryProbability:.94},mc:{name:'Chris Prince',philosophy:'Potência e velocidade',skill:'prince',pressure:'high',build:'direct',entryProbability:.94},ub:{name:'Marc Snuffy',philosophy:'Organização estratégica',skill:'snuffy',pressure:'balanced',build:'patient',entryProbability:.94},px:{name:'Julian Loki',philosophy:'Explosão nas transições',skill:'loki',pressure:'high',build:'direct',entryProbability:.94}};
return {
 CONFIG,
 // Uma janela pode durar até 45 minutos; pode haver uma segunda entrada mais curta.
 WINDOW_SECONDS:2700,
 ENTRY_MINUTES:[30,78],
 MAX_ENTRIES:2
};
});