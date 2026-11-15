/* Blue Lock NEO 9.7 — Historic exhibition squads. Players and their roles only;
   portraits for these clubs are intentionally NOT supplied. Users can import them. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.NeoHistoric970=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const R={
 mu08:{id:'mu08',year:2008,country:'Inglaterra',name:'Manchester United 2008',short:'MAN UTD 08',crest:'MU',color:'#ea424c',dark:'#821722',accent:'#ffe1a5',atk:94,def:92,pas:91,style:'build',formationName:'4-3-3 (simulação)',
 starters:[['Edwin van der Sar','GOL',1,88],['Wes Brown','LD',6,83],['Rio Ferdinand','ZAG',5,90],['Nemanja Vidić','ZAG',15,89],['Patrice Evra','LE',3,87],['Michael Carrick','VOL',16,86],['Paul Scholes','MC',18,88],['Owen Hargreaves','MC',4,84],['Cristiano Ronaldo','PD',7,90],['Wayne Rooney','CA',10,89],['Carlos Tévez','PE',32,88]],
 reserves:[['Ryan Giggs','MEI',11,86],['Nani','PD',17,83],['Ji-Sung Park','PE',13,83],['Anderson','MC',8,82],['Darren Fletcher','VOL',24,82],['John O\'Shea','ZAG',22,81],['Gary Neville','LD',2,82],['Gerard Pique','ZAG',19,81],['Tomasz Kuszczak','GOL',29,79],['Ben Foster','GOL',12,78],['Louis Saha','CA',9,81],['Mikaël Silvestre','LE',27,79]]},
 fla19:{id:'fla19',year:2019,country:'Brasil',name:'Flamengo 2019',short:'FLA 19',crest:'FLA',color:'#e8324f',dark:'#771724',accent:'#ffe0e2',atk:91,def:88,pas:92,style:'build',formationName:'4-3-3 (simulação)',
 starters:[['Diego Alves','GOL',1,84],['Rafinha','LD',13,84],['Rodrigo Caio','ZAG',3,85],['Pablo Marí','ZAG',4,86],['Filipe Luis','LE',16,87],['Willian Arão','VOL',5,85],['Gerson','MC',8,85],['Giorgian de Arrascaeta','MEI',14,89],['Éverton Ribeiro','PD',7,88],['Gabriel Barbosa','CA',9,89],['Bruno Henrique','PE',27,89]],
 reserves:[['César','GOL',12,78],['Gabriel Batista','GOL',22,75],['Rodinei','LD',2,79],['Renê','LE',6,79],['Rhodolfo','ZAG',4,78],['Thuler','ZAG',26,79],['Léo Duarte','ZAG',30,78],['Diego','MEI',10,84],['Hugo Moura','VOL',17,76],['Piris da Motta','VOL',25,78],['Reinier','MEI',19,82],['Vitinho','PE',11,83],['Lincoln','CA',20,79],['Orlando Berrío','PD',28,79],['João Lucas','LD',32,75]]},
 sport15:{id:'sport15',year:2015,country:'Brasil',name:'Sport Recife 2015',short:'SPORT 15',crest:'SCR',color:'#e63235',dark:'#721414',accent:'#ffdf9f',atk:85,def:82,pas:84,style:'counter',formationName:'4-3-3 (simulação)',
 starters:[['Danilo Fernandes','GOL',12,81],['Samuel Xavier','LD',2,80],['Matheus Ferraz','ZAG',3,80],['Durval','ZAG',4,81],['Renê','LE',6,80],['Rithely','VOL',8,83],['Wendel','MC',17,80],['Diego Souza','MEI',87,88],['Maikon Leite','PD',7,84],['André','CA',9,85],['Marlone','PE',10,84]],
 reserves:[['Magrão','GOL',1,80],['Luiz Carlos','GOL',23,73],['Ewerton Pascoa','ZAG',3,79],['Henrique Mattos','ZAG',33,76],['Oswaldo','ZAG',22,76],['Alex Silva','LD',13,77],['Evandro','LE',32,75],['Anderson Pedra','VOL',26,76],['Rodrigo Mancha','VOL',5,75],['Ronaldo','VOL',29,76],['Régis','MEI',10,78],['Neto Moura','MC',25,78],['Joelinton','CA',9,82],['Felipe Azevedo','PE',11,79],['Samuel','PD',19,76],['Mike','PD',20,76],['Elber','PE',7,79]]},
 mir25:{id:'mir25',year:2025,country:'Brasil',name:'Mirassol 2025',short:'MIR 25',crest:'MIR',color:'#f1bf31',dark:'#a8790c',accent:'#fff1b3',atk:84,def:86,pas:84,style:'build',formationName:'4-3-3 (simulação)',
 starters:[['Walter','GOL',1,81],['Lucas Ramon','LD',2,80],['João Victor','ZAG',3,82],['Jemmes','ZAG',4,83],['Reinaldo','LE',6,84],['Neto Moura','VOL',5,81],['Danielzinho','MC',8,83],['Gabriel','MEI',10,82],['Negueba','PD',7,82],['Chico da Costa','CA',9,83],['Alesson','PE',11,82]],
 reserves:[['Alex Muralha','GOL',12,78],['Bruno Bertinato','GOL',22,75],['Daniel Borges','LD',13,78],['Gabriel Knesowitsch','ZAG',14,78],['Jose Aldo','VOL',15,80],['Shaylon','MEI',16,81],['Cristian','CA',18,80],['Edson Carioca','PE',19,80],['Fabricio Daniel','PD',20,78],['Leo Gamalho','CA',21,77],['Roni','VOL',23,76],['Maceio','MEI',24,75]]}
};
const teams=Object.values(R);
const all=[];for(const t of teams)for(const [name,role,number,ovr] of [...t.starters,...t.reserves])all.push({name,role,number,ovr,club:t.id});
const getTeam=id=>teams.find(t=>t.id===id);
function install(E){
 if(!E?.registerTeam)throw Error('Atualize o motor para habilitar os clubes históricos.');
 for(const t of teams){
  E.registerTeam({...t,players:t.starters.map(v=>v[0]),reserves:t.reserves.map(v=>v[0]),master:null,
   formation:E.DEFAULT_FORMATION.map((v,i)=>({...v,role:t.starters[i][1]}))});
  for(const [name,role,number,ovr] of [...t.starters,...t.reserves])E.Attr.registerPlayerRatings(name,ovr,{club:t.id,role,number,historic:true});
 }
 return teams.length;
}
if(typeof window!=='undefined'&&window.NeoEngine)install(window.NeoEngine);
return {teams,all,getTeam,install};
});
