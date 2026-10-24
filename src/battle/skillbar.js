/* ---------- skill bar: one tab per character. Tapping a skill opens its info pop-up over the bar; on that
   character's manual turn an attack then waits for an enemy tap, anything else has a 사용 button ---------- */
let tgtPick=null, pendingTgt=null, skTab=0, skPick=null, waitHero=-1, lastSnap=null, flashState=null;
const CAT={atk:'공격',def:'방어',heal:'회복',cc:'특수'};
function inBattle(){ return battle&&!(battle.over&&!evq.length); }
function renderSkillPanel(){
  if(!battle) return;
  if(skTab>=battle.heroes.length) skTab=0;
  const hs=lastSnap?lastSnap.h:battle.heroes;
  $('#ctabs').innerHTML=battle.heroes.map((h,i)=>{ const c=charById(h.uid), sh=hs[i]||h;
    return `<button class="ctab ${i===skTab?'on':''} ${sh.hp<=0?'dead':''} ${waitChoice&&waitHero===i?'wait':''}" data-i="${i}" role="tab" aria-selected="${i===skTab}">${h.name}<small>${HERO_DB[h.id].name} · Lv${c?c.lvl:1}</small></button>`; }).join('');
  const h=battle.heroes[skTab], sh=hs[skTab]||h, waiting=waitChoice&&waitHero===skTab;
  $('#mSkills').className='mskills'+(waiting?' choose':'')+(h.sk.length>5?' many':''); $('#mSkills').style.setProperty('--n',Math.max(4,h.sk.length));
  $('#mSkills').innerHTML=h.sk.map((s,k)=>{
    const cd=(sh.cd||h.cd)[k], ok=h.hp>0&&s.cost<=sh.sp&&!cd;
    const last=flashState&&flashState.i===skTab&&flashState.k===k&&Date.now()-flashState.t<900;
    return `<button class="sk t-${s.ty} ${ok?'':'dim'} ${skPick===k?'sel':''} ${last?'last':''}" data-k="${k}"><span class="ic">${s.pic}${cd?`<i>${cd}</i>`:''}</span><span class="tx"><b>${s.n}</b><small>${s.cost?'SP '+s.cost:'기본'}</small></span></button>`; }).join('');
  renderSkPop();
}
function renderSkPop(){
  const pop=$('#skPop'), h=battle&&battle.heroes[skTab], s=h&&skPick!=null&&h.sk[skPick];
  if(!s){ pop.hidden=true; return; }
  const sh=(lastSnap?lastSnap.h:battle.heroes)[skTab]||h, cd=(sh.cd||h.cd)[skPick], mine=myTurn(skTab);
  const why=!mine?(isManual()?`${h.name} 차례에 쓸 수 있어요`:'자동 전투 중 · 멈추면 직접 골라요'):cd?`쿨타임 ${cd}턴 남음`:s.cost>sh.sp?'SP가 모자라요':'';
  pop.className=`skpop t-${s.ty}${why?'':' tap'}`; pop.hidden=false;
  pop.innerHTML=`<div class="sp-head"><span class="ic">${s.pic}</span><span class="tt"><b>${s.n}<span class="sp-cat">${CAT[s.ty]}</span></b><small>${s.cost?'SP '+s.cost:'SP 0'}${s.cd?` · 쿨타임 ${s.cd}턴`:''}</small></span><button class="sp-x" aria-label="닫기">✕</button></div>
    <p class="sp-tip">${s.tip}</p>
    <div class="sp-float ${why?'off':''}">${why||(needsTarget(s)?'👆 한 번 더 누르면 공격 · 적 선택도 가능':'👆 한 번 더 누르면 사용')}</div>`;
  /* tapping the info window again uses the skill (attacks still wait for an enemy tap) */
  pop.onclick=e=>{ if(e.target.closest('.sp-x')){ closeSkPop(); return; } useSkill(); };
}
/* this hero is waiting for a hand-picked skill: manual play, or a scripted tutorial step during auto */
function myTurn(i){ return (isManual()||!!forceSk&&forceSk.i===i)&&inBattle()&&battle.heroes[i].hp>0&&waitChoice&&waitHero===i; }
function closeSkPop(){ skPick=null; setTgtPick(null); renderSkillPanel(); setButtons(); }
function flashSkill(i,k){
  if(!isManual()) return;
  flashState={i,k,t:Date.now()};
  renderSkillPanel();
  if(skTab===i){ const b=document.querySelector(`#mSkills .sk[data-k="${k}"]`); retrigger(b,'pick'); }
}
$('#ctabs').onclick=e=>{ const b=e.target.closest('[data-i]'); if(!b) return; skTab=+b.dataset.i; skPick=null; setTgtPick(null); renderSkillPanel(); };
$('#mSkills').onclick=e=>{
  const b=e.target.closest('.sk'); if(!b) return;
  const k=+b.dataset.k, i=skTab, h=battle.heroes[i], s=h.sk[k], mine=myTurn(i);
  skPick=k; setTgtPick(null);
  if(mine&&ready(battle,i,k)&&needsTarget(s)) setTgtPick(k);
  renderSkillPanel(); setButtons();
  if(mine){
    coach('desc','#skPop','스킬을 누르면 설명 창이 떠요.');
    if(needsTarget(s)) atkTips(); else coach('use','#skPop','설명 창을 한 번 더 누르면 써요.');
  }
};
function atkTips(){
  coach('tgt','#skPop','설명 창을 한 번 더 누르면 공격해요.');
  if(battle.boss.hp>0) coach('tgt2','#bossWrap','적을 직접 눌러\n때릴 적을 고를 수도 있어요.');
  if(battle.mobs.some(m=>m.hp>0)) coach('tgtMob','#skPop','공격 스킬은 타겟을 선택하지 않으면\n체력이 가장 낮은 졸개부터 때려요.\n설명 창을 한 번 더 눌러 봐요!','battle',true);
}
/* single-target attacks ask who to hit (the boss is always a choice); aoe and self skills don't */
function needsTarget(s){ return !!s.ef.dmg&&!s.ef.aoe; }
function useSkill(){
  if(!waitChoice||skPick==null||!myTurn(skTab)) return;
  const s=battle.heroes[waitHero].sk[skPick];
  if(ready(battle,waitHero,skPick)) commitChoice(skPick,needsTarget(s)?autoTgt(s):null);
}
/* an attack used from the info window (no enemy tapped) hits the weakest living minion first, then the boss.
   A gaze-breaking 🪨 and an enemy marked for focus fire are left to the battle rules (null) */
function autoTgt(s){
  if(s.ef.breakGaze||battle.focus!=null) return null;
  let j=-1; battle.mobs.forEach((m,n)=>{ if(m.hp>0&&(j<0||m.hp<battle.mobs[j].hp)) j=n; });
  return j>=0?j:'B';
}
function setTgtPick(k){
  tgtPick=k;
  $('#bossAvatar').classList.toggle('tgtable',k!=null&&battle.boss.hp>0);
  document.querySelectorAll('#mobs .mob').forEach(el=>el.classList.toggle('tgtable',k!=null&&battle.mobs[+el.dataset.m].hp>0));
}
function commitChoice(k,t){
  setTgtPick(null);
  if(forceSk){ prof.tips[forceSk.tip]=true; saveProf(); forceSk=null; }
  /* a 🩹 picked by hand counts for the stage's heal step too */
  const heal={1:'bandUse',2:'healUse'}[battle.stage];
  if(heal&&battle.heroes[waitHero]&&battle.heroes[waitHero].sk[k].id==='w_bandage'&&!prof.tips[heal]){ prof.tips[heal]=true; saveProf(); }
  pendingChoice=k; pendingTgt=t; waitChoice=false; waitHero=-1; skPick=null; playing=true;
  setButtons(); renderSkillPanel(); if(lastSnap) renderHeroes(lastSnap); if(!tid) pump();
}
/* tap an enemy: picks it as the target while an attack waits for one; in a manual battle (or before the fight)
   it shows the enemy's info; during the auto battle it marks it for focus fire */
$('#bossAvatar').addEventListener('click',()=>{ if(!battle) return; const up=battle.boss.hp>0; if(tgtPick!=null&&up&&!preFight) return commitChoice(tgtPick,'B'); if(preFight||isManual()||!up) return infoTip($('#bossAvatar'),bossInfo()); setFocus('B'); });
$('#mobs').addEventListener('click',e=>{ const m=e.target.closest('.mob'); if(!m||!battle) return; const j=+m.dataset.m, up=battle.mobs[j].hp>0; if(tgtPick!=null&&up&&!preFight) return commitChoice(tgtPick,j); if(preFight||isManual()||!up) return infoTip(m,mobInfo(j)); setFocus(j); });
/* status check: before the fight enemies can be tapped, and allies any time */
$('#party').addEventListener('click',e=>{ const u=e.target.closest('.unit'); if(u&&battle) infoTip(u,heroInfo(+u.dataset.unit)); });
function infoTip(el,text){ if(whyTip.el===el&&Date.now()-(whyTip.skip||0)<700) return; el.dataset.why=text; whyTip(el,true); }
function bossInfo(){ const b=battle, o=b.boss; return `${b.def.ic} ${b.def.name} · HP ${o.hp}/${o.max}\n속도 ${spdWord(o.spd)}\n행동: ${b.def.cycle.map(m=>BOSS_ICON[m]+' '+moveName(m)).join(' → ')}`; }
function mobInfo(j){ const m=battle.mobs[j]; return `${m.ic} ${m.name} · HP ${m.hp}/${m.max}\n${m.kind==='heal'?`보스 HP 회복 ${m.pw}`:m.kind==='buff'?'보스의 다음 공격 강화':`공격 ${m.pw}`}`; }
function heroInfo(i){ const h=(lastSnap?lastSnap.h:battle.heroes)[i], x=battle.heroes[i], c=charById(x.uid); return `${x.name} · ${HERO_DB[x.id].name} Lv${c?c.lvl:1}\nHP ${h.hp}/${h.max} · SP ${h.sp}\n${x.row==='F'?'전열: 주는 피해 +20%':'후열: 받는 피해 -20%'}`; }
function showNext(){ renderSkillPanel(); }

