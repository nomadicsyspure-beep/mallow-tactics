/* ---------- battle state ---------- */
let battle=null, cfg=null, evq=[], playing=false, tid=null, gen=0, speed=1;
let stepTarget=null, waitChoice=false, pendingChoice=null, allyCut=false, sumList=[], filled=false, lastBhp=0, loggedRound=0, saidHalf=false, saidStart=false;
let autoMode=false, pausedByTab=false, curTurn=null;
let editing=prof.party[0], detailHero=prof.party[0], gearOpen=null, lastFired=null, defArmed=false, wipeArmed=false, ltab='sum';
const battleEl=$('#battle'), fxEl=$('#fx'), units=[];
function at(el){ const a=el.getBoundingClientRect(), r=battleEl.getBoundingClientRect(); return {x:a.left-r.left+a.width/2,y:a.top-r.top+a.height/2,w:a.width,h:a.height}; }
function dur(ms){ return reduce?0:ms/speed; }
function later(ms,fn){ const g=gen; setTimeout(()=>{ if(g===gen) fn(); },dur(ms)); }
const ONE_SHOT=['quake','jolt','hurt','hit','lunge','roar','acting'];
function retrigger(el,cls){
  if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  /* one-shot shakes are dropped once played, or showing the screen again would replay them (the battle-tab shake) */
  if(!ONE_SHOT.includes(cls)) return;
  const k='_rt_'+cls; if(el[k]) el.removeEventListener('animationend',el[k]);
  el[k]=e=>{ if(e.target!==el) return; el.classList.remove(cls); el.removeEventListener('animationend',el[k]); el[k]=null; };
  el.addEventListener('animationend',el[k]);
}
function sum(a){ return a.reduce((x,y)=>x+y,0); }
function hn(j){ return battle.heroes[j].name; }
function maxStage(){ let n=1; while(n<STAGES.length&&prof.cleared[n]) n++; return n; }
function bossShort(){ return battle.def.name.split(' ').pop(); }
function isTutorial(){ return battle&&battle.stage<=TUTORIAL_STAGES; }
function canAuto(){ return !!battle&&prof.autoOpen&&!isTutorial(); }
/* there is no separate mode switch: stopping the auto battle simply means every hero's turn waits for a manual pick */
function isManual(){ return !autoMode||!canAuto(); }
const MOVE_NAME={swipe:'공격',gaze:'응시',wave:'광역 공격',charge:'돌진',br:'광역 또는 돌진',shell:'껍질 닫기',stun:'기절'};
function moveName(m){ return battle&&battle.def.gk?BOSS_MOVES[m]:MOVE_NAME[m]; }
/* tutorial skill set: stage 1 has only the basic attack and 🩹, stage 2 adds 🧱 once it was unlocked at the first wave */
function tutSkills(st,stage){
  if(stage>TUTORIAL_STAGES) return st;
  const keep=['w_bandage',...(stage===2&&prof.braceOpen?['w_brace']:[])];
  return {...st,skills:st.skills.filter((id,k)=>k===0||keep.includes(id))};
}
function makeCfg(muts,seed){
  const party=prof.party.map(charById).filter(Boolean).slice(0,4);
  return {party:party.map(c=>tutSkills(charStats(c),prof.stage)),rules:party.map(c=>cloneRules(rules[c.uid])),targets:party.map(c=>targets[c.uid]),stage:prof.stage,muts,seed:seed==null?Math.floor(Math.random()*1e9):seed};
}

