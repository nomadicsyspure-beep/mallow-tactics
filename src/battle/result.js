/* ---------- result, rewards, growth ---------- */
function applyExp(exp){
  const ready=[];
  prof.party.map(charById).filter(Boolean).forEach(c=>{
    gainExp(c,exp);
    if(c.job==='wanderer'&&c.lvl>=JOB_LVL&&!prof.jobNotified[c.uid]){ prof.jobNotified[c.uid]=true; ready.push(c); }
  });
  /* the first job-ready notice leads straight into one guided job change */
  if(ready.length){ introQueue.push({title:'🎓 전직할 수 있어요!',body:jobReadyCard(ready)}); if(!prof.jobTutDone) prof.jobTut=true; }
}
function expSnap(){ return prof.party.map(charById).filter(Boolean).map(c=>({uid:c.uid,lvl:c.lvl,exp:c.exp})); }
function expPct(c){ return c.lvl>=MAX_LVL?100:c.exp/expNeed(c.lvl)*100; }
/* one row per character with the EXP they got and their bar filling up, then gold, then item drops (the loudest part) */
function fillRewards(p,rw,before,drops){
  $(`#${p}Cur`).innerHTML=`<span>🪙 +${rw.gold}</span>`;
  $(`#${p}Chars`).innerHTML=before.map(x=>{ const c=charById(x.uid); if(!c) return ''; const up=c.lvl>x.lvl, job=c.job==='wanderer'&&c.lvl>=JOB_LVL;
    return `<div class="rw-char ${up?'up':''}"><img class="thumb" ${spr(c.job,c.look)} alt=""><div><b>${c.name}</b> <small>Lv${c.lvl}</small>${up?'<span class="lvup">LEVEL UP</span>':''}${job?'<span class="lvup job">전직 가능</span>':''}<div class="expbar"><div style="width:${up?0:expPct(x)}%" data-to="${expPct(c)}"></div></div></div><span class="gain">+${rw.exp}<small>EXP</small></span></div>`; }).join('');
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll(`#${p}Chars [data-to]`).forEach(d=>{ d.style.width=d.dataset.to+'%'; })));
  $(`#${p}Items`).innerHTML=drops.length?`<div class="rw-tiles">${drops.map(it=>`<button class="rw-tile r${it.tier}" data-it="${it.id}" aria-label="${itemName(it)}">${SLOT[it.slot].ic}</button>`).join('')}</div><div class="rw-detail" hidden></div>`:'';
}
['#resultItems','#repeatItems'].forEach(id=>$(id).addEventListener('click',e=>{
  const t=e.target.closest('.rw-tile'); if(!t) return; const it=itemById(+t.dataset.it), box=$(id), d=box.querySelector('.rw-detail'), on=!t.classList.contains('on');
  box.querySelectorAll('.rw-tile').forEach(x=>x.classList.toggle('on',x===t&&on));
  d.hidden=!on||!it; if(on&&it) d.innerHTML=`<span class="tier${it.tier}">${SLOT[it.slot].ic} ${itemName(it)}</span><small>${itemStat(it)}</small>`;
}));
let resultPending=false;
/* a battle that ends while another tab is open waits for the player to come back to the battle tab */
function showResult(){
  const nb=document.querySelector('[data-screen="battle"]');
  if($('#screen-battle').hidden){ resultPending=true; nb.classList.add('badge'); return; }
  resultPending=false; nb.classList.remove('badge'); resultAt=Date.now();
  $('#resultModal').hidden=false; $('#retryNew').focus();
  if(introQueue.length) later(900,nextIntro);
}
function finish(){
  playing=false; setButtons(); if(!battle) return; if(battle.done){ showResult(); return; }
  battle.done=true;
  const b=battle, won=b.over==='win';
  lastFired={party:b.heroes.map(h=>h.uid),fired:b.stats.fired.map(a=>a.slice())};
  const rw=rewardFor(b.stage,b.muts.length,won), before=expSnap();
  prof.gold+=rw.gold;
  applyExp(rw.exp);
  const drops=[]; if(won){ const it=rollItem(b.stage,Math.random); if(it) drops.push(addItem(it)); }
  let autoJustOpened=false;
  const firstClear=won&&!prof.cleared[b.stage];
  if(won) prof.cleared[b.stage]=true;
  if(!won&&b.stage===JOB_TUT_STAGE&&jobReadyChars().length&&!(prof.jobRound>1)){ prof.jobRound=2; prof.jobTut=true; prof.jobTutDone=false; }
  if(firstClear){
    if(b.stage===TUTORIAL_STAGES&&!prof.autoOpen){ prof.autoOpen=true; autoJustOpened=true; }
    if(b.stage===TUTORIAL_END) autoJustOpened=false;
    if(b.stage<STAGES.length) prof.stage=b.stage+1;
  }
  saveProf(); renderNav();
  const stName=STAGES[b.stage-1].name;
  if(b.def.talk&&!(won&&b.downShown)) later(won?600:300,()=>bossSay(won?b.def.talk.die:b.def.talk.win));
  save(LOG_KEY,{cap:`${stName} · ${won?`승리 · 보스 ${b.round}턴`:'파티 전멸'}`,sum:sumList,text:$('#logStore').innerHTML});
  liveLog(); showNext();
  if(!won) banner('전멸','lose');
  later(won?300:1100,()=>{
    const t=$('#resultTitle'); t.textContent=won?'승리!':'파티 전멸'; t.className=won?'win':'lose';
    fillRewards('result',rw,before,drops);
    const hint=$('#resultHint'); hint.hidden=won; hint.innerHTML=won?'':'💡 '+hintFor(b);
    $('#resultNear').textContent=firstClear&&b.stage===RECRUIT_STAGE?'🔓 자동 전투 · 캐릭터 탭이 열렸어요!':autoJustOpened?'🤖 자동 전투가 열렸어요!':firstClear&&b.stage===TABS_STAGE?'🔓 작전 · 가방 · 보스 탭이 열렸어요!':firstClear&&b.stage<STAGES.length?`🗺️ ${STAGES[b.stage].name} 열림`:(!won&&b.boss.hp<=b.boss.max*.25?`아깝다! 보스 HP ${b.boss.hp} 남음`:'');
    $('#retryNew').textContent=firstClear&&b.stage<STAGES.length?'▶ 다음 스테이지':'▶ 지도로';
    $('#toStrategy').hidden=!tabsOpen();
    $('#retrySame').hidden=won&&b.stage<=JOB_TUT_STAGE;
    showResult();
  });
}
function hintFor(b){
  if(jobTutOn()) return '🎓 Lv5부터 전직할 수 있어요. 전직하면 훨씬 강해져요!';
  if(b.stats.resist>0) return '각성한 보스는 ◎ 약점 표식이 있어야 응시가 끊겨요.';
  if(b.stats.gazes>b.stats.breaks) return '👁️ 응시 예고엔 🪨 돌팔매나 📣 유인 외침으로 끊어요.';
  if(b.stage<=TUTORIAL_STAGES) return '다치면 🩹 붕대, 큰 공격 예고엔 🧱 버티기!';
  return '큰 공격 예고에 🧱 버티기·🛡️ 가드를 걸거나, 레벨을 올려 보세요.';
}
$('#retrySame').onclick=()=>{ setupBattle(cfg.muts,cfg.seed); enterBattle(); };
$('#retryNew').onclick=()=>{ setupBattle(); openPrep(); if(needRecruit()) coach('recruitTab','[data-screen="characters"]','캐릭터 탭이 열렸어요!\n동료를 데려와 4명을 채워야\n다음 스테이지로 가요.','battle',true);
  if(jobTutOn()) coach('jobTut'+jobR(),'[data-screen="characters"]',jobR()?'한 명 더 전직하면\n훨씬 수월해져요!\n캐릭터 탭에서 전직해 봐요.':'전직하면 훨씬 강해져요!\n캐릭터 탭에서 전직해 봐요.','battle',true); else goTips(); };
/* the second guided job change (after losing stage 7) has its own tips */
function jobR(){ return prof.jobRound>1?'B':''; }
/* map tips: what the map is (before stage 2), where to start stages 4 and 5, and which areas drop gear (before stage 7) */
function goTips(){
  if($('#prep').hidden||$('#screen-battle').hidden) return;
  const st=prof.stage, fresh=!prof.cleared[st];
  if(st===2&&fresh) coach('map2','#mapList','여기는 모험 지도예요.\n파티를 편성하고 모험을 떠날\n장소들이 있어요.');
  if((st===4||st===5)&&fresh) coach('go'+st,'#startBtn',`${st}스테이지로 출발!`,'battle',true);
  if(st===JOB_TUT_STAGE&&fresh) coach('dropMap',`#mapList .node[data-st="${DROP_FROM}"]`,`🎁 표시가 있는 곳은\n장비 아이템이 나오는 지역이에요!\n${DROP_FROM}스테이지부터 나와요.`);
}
$('#toStrategy').onclick=()=>{ $('#resultModal').hidden=true; goto('strategy'); };
function repeatRun(){
  const N=5; let wins=0, gold=0, exp=0; const drops=[];
  for(let n=0;n<N;n++){
    const c=makeCfg([]); const b=simulate(c), won=b.over==='win';
    const rw=rewardFor(c.stage,c.muts.length,won); gold+=rw.gold; exp+=rw.exp;
    if(won){ wins++; const it=rollItem(c.stage,Math.random); if(it) drops.push(addItem(it)); }
  }
  const before=expSnap();
  prof.gold+=gold; applyExp(exp); saveProf();
  $('#repeatRows').innerHTML=`<div><span>${STAGES[prof.stage-1].name} 승리</span><b class="${wins===N?'ok':wins?'':'bad'}">${wins} / ${N}</b></div>`;
  fillRewards('repeat',{gold,exp},before,drops);
  $('#repeatModal').hidden=false;
}
$('#repeatClose').onclick=()=>{ $('#repeatModal').hidden=true; renderPrep(); if(introQueue.length) nextIntro(); };

