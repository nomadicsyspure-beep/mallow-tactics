/* ---------- loop ---------- */
function pump(){
  tid=null;
  if(!playing) return;
  if(coachBlocking()){ tid=setTimeout(pump,200); return; }
  if(!evq.length){
    if(battle.over){ finish(); return; }
    if(stepTarget!==null&&battle.actions>=stepTarget){ stepTarget=null; pause(); showNext(); return; }
    if(!filled){ filled=true; const ms=animateFill(); tid=setTimeout(pump,dur(ms)+60); return; }
    const nx=nextActor(battle,true), heroTurn=typeof nx==='number', force=heroTurn&&pendingChoice==null?tutForce(nx):null;
    if(heroTurn&&pendingChoice==null&&(isManual()||force)){
      /* a skill pop-up opened for this hero while the enemy moved stays open and becomes usable */
      forceSk=force;
      const keep=skTab===nx&&skPick!=null&&(!force||skPick===force.k)?skPick:null, h=battle.heroes[nx];
      playing=false; waitChoice=true; waitHero=nx; skTab=nx; skPick=keep; setTgtPick(null);
      const aim=keep!=null&&ready(battle,nx,keep)&&needsTarget(h.sk[keep]); if(aim) setTgtPick(keep);
      setButtons(); renderSkillPanel(); if(lastSnap) renderHeroes(lastSnap);
      coach('wait',`.unit[data-unit="${nx}"]`,`${h.name} 차례예요!\n금색으로 빛나는 캐릭터가 지금 움직여요.`);
      if(keep!=null){ if(aim) atkTips(); else if(ready(battle,nx,keep)) coach('use','#skPop','설명 창을 한 번 더 누르면 써요.'); }
      coach('cats','#mSkills','스킬은 크게 4가지로,\n아래와 같이 구분해요.\n🟥 공격  🟩 회복  🟦 방어  🟨 특수');
      /* every battle opens in manual: the first manual turn once auto is open points at the auto button */
      if(canAuto()&&!force) coach('auto2','#fightBtn','🤖 자동 전투를 누르면\n정해진 패턴대로 싸워요.\n다시 누르면 직접 조작해요.','battle',true);
      if(force){ const fs=`#mSkills .sk[data-k="${force.k}"]`;
        if(force.tip==='stoneUse') coach('stoneTap',fs,'🪨 돌팔매를 직접 눌러\n보스에게 던져 봐요!');
        if(force.tip==='punchUse') coach('punchTap',fs,'👊 먼저 주먹질로\n보스를 때려 봐요!');
        if(force.tip==='bandUse') coach('bandTap',fs,'🩹 이번엔 응급 붕대로\nHP를 회복해 봐요!');
        if(force.tip==='healUse') coach('healTap',fs,'🩹 HP가 많이 줄었어요!\n응급 붕대로 회복해요.'); }
      { const k=h.cd.findIndex(v=>v>0); if(k>=0) coach('cd',`#mSkills .sk[data-k="${k}"]`,'숫자가 덮인 스킬은 쿨타임 중이에요.\n숫자만큼 내 차례가 지나야 써요.'); }
      if(h.sp<15) coach('sp','#mSkills',`SP가 모자라요.\n기본기(${h.sk[0].pic})는 SP 없이 쓸 수 있어요.`);
      return;
    }
    filled=false;
    evq=step(battle,heroTurn?pendingChoice:null,heroTurn?pendingTgt:null); pendingChoice=null; pendingTgt=null;
  }
  const e=evq.shift();
  const wait=play(e);
  tid=setTimeout(pump,dur(wait));
}
function setButtons(){
  const b=$('#fightBtn');
  const idle=!battle||!$('#prep').hidden;
  $('#screen-battle').classList.toggle('prepping',!$('#prep').hidden); renderNav();
  setWhy(b,idle?'전투를 시작하면 쓸 수 있어요':'');
  /* one button: auto ⇄ manual. Stopping the auto battle drops straight into manual picks */
  if(battle&&battle.over&&!evq.length) b.textContent='결과 보기';
  else if(preFight&&!idle) b.textContent='▶ 전투 시작';
  else if(!canAuto()){ b.textContent='✋ 수동 전투'; setWhy(b,idle?'전투를 시작하면 쓸 수 있어요':prof.autoOpen?`${TUTORIAL_STAGES}스테이지까지는 직접 조작해요`:`자동 전투는 ${TUTORIAL_STAGES}스테이지를 깨면 열려요\n지금은 차례마다 스킬을 골라요`); }
  else if(autoMode) b.textContent='⏸ 멈추고 직접 조작';
  else b.textContent='🤖 자동 전투';
  b.classList.toggle('manual',!!battle&&!autoMode&&canAuto()&&!preFight);
}
/* scripted tutorial moments: stage 1 tries 👊 then 🩹 (once hurt), stage 2 heals once after the 🧱 step, 🧱 unlocks at stage 2's first wave warning and must be used once,
   and at stage 4's first gaze the player throws 🪨 by hand even in auto battle */
let forceSk=null;
function tutForce(nx){
  const b=battle, h=b.heroes[nx], idx=id=>h.sk.findIndex(x=>x.id===id);
  if(b.stage===1&&!prof.tips.punchUse) return {i:nx,k:0,tip:'punchUse'};
  if(b.stage===1&&!prof.tips.bandUse&&h.hp<h.max){ const k=idx('w_bandage'); if(k>=0&&ready(b,nx,k)) return {i:nx,k,tip:'bandUse'}; }
  if(b.stage===2&&intent(b)==='wave'&&idx('w_brace')<0) unlockBrace();
  if(b.stage===2&&prof.tips.braceUse&&!prof.tips.healUse&&h.hp<h.max*.7){ const k=idx('w_bandage'); if(k>=0&&ready(b,nx,k)) return {i:nx,k,tip:'healUse'}; }
  if(b.stage===2&&!prof.tips.braceUse&&intent(b)==='wave'){ const k=idx('w_brace'); if(k>=0&&ready(b,nx,k)) return {i:nx,k,tip:'braceUse'}; }
  if(b.stage===4&&!prof.tips.stoneUse&&intent(b)==='gaze'&&!b.boss.stun){ const k=idx('w_stone'); if(k>=0&&ready(b,nx,k)) return {i:nx,k,tip:'stoneUse'}; }
  return null;
}
function unlockBrace(){
  prof.braceOpen=true; saveProf();
  battle.heroes.forEach(h=>{ const c=charById(h.uid); if(h.sk.some(x=>x.id==='w_brace')||!c||!c.equip.includes('w_brace')) return; h.sk.push(Object.assign({id:'w_brace'},SKILLS.w_brace)); h.cd.push(0); });
  renderSkillPanel(); toast('🧱 새 스킬: 버티기');
  const k=battle.heroes[skTab].sk.findIndex(x=>x.id==='w_brace'), bs=k>=0?`#mSkills .sk[data-k="${k}"]`:'#mSkills';
  coach('braceOpen',bs,'🧱 버티기가 열렸어요!');
  coach('braceOpen2','#bossStatus','🌊 광역 공격 예고엔 버티기로\n받는 피해를 절반으로 줄여요.');
  coach('braceOpen3',bs,'SP도 30을 채워줘요!');
}
function pause(){ playing=false; clearTimeout(tid); tid=null; setButtons(); }
function start(){
  if(!battle||preFight) return;
  if(battle.over&&!evq.length){ finish(); return; }
  stepTarget=null; playing=true; setButtons();
  if(!saidStart&&battle.actions===0){
    saidStart=true;
    if(battle.def.talk) bossSay(battle.def.talk.start);
    clearTimeout(tid); tid=setTimeout(pump,dur(battle.def.talk?1400:300)); return;
  }
  if(!tid) pump();
}
