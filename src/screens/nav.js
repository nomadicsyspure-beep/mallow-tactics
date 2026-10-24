/* ---------- navigation + settings ---------- */
/* leaving the battle tab doesn't pause: an auto battle keeps running and its result waits for the player */
function goto(id){
  if(id!=='battle'&&battle&&battle.stage<BG_STAGE&&playing){ pause(); pausedByTab=true; }
  if(id==='battle'&&partyDirty){
    partyDirty=false;
    if(!battle||battle.actions===0||battle.over){ setupBattle(cfg?cfg.muts:null); openPrep(); }
    else toast('바뀐 편성 · 스킬 · 작전은 다음 판부터 적용돼요');
  }
  document.querySelectorAll('[id^="screen-"]').forEach(s=>s.hidden=s.id!=='screen-'+id);
  document.querySelectorAll('[data-screen]').forEach(b=>{ if(b.dataset.screen===id) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  if(id==='strategy'){ defArmed=false; renderStrategy(); }
  if(id==='boss') renderBestiary();
  if(id==='characters'){ charsAt=Date.now(); charTab='party'; renderCharacters(); }
  if(id==='inventory') renderInventory();
  if(id==='battle'&&resultPending) showResult();
  if(id==='battle'&&pausedByTab){ pausedByTab=false; start(); }
  if(TAB_TIPS[id]) coach('tab-'+id,TAB_TIPS[id][0],TAB_TIPS[id][1],id);
  if(id==='battle'&&!jobTutOn()) goTips();
  window.scrollTo(0,0);
}
document.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>{ const id=b.dataset.screen; if(!tabOpen(id)||fightLock(id)){ b.dataset.why=tabOpen(id)?'⚔️ 전투가 끝나면 갈 수 있어요':tabLockWhy(id); whyTip(b); return; } goto(id); });
const TAB_TIPS={strategy:['#ruleRows','캐릭터마다 "이럴 때 → 이 스킬"을 정해요.\n위 규칙부터 확인해서\n맞는 첫 스킬을 써요.'],inventory:['#itemList','얻은 장비예요.\n캐릭터 탭에서 장착해요.'],boss:['#bestiary','만난 적의 행동 순서예요.\n작전을 짜기 전에 확인해요.']};
$('#fightBtn').onclick=()=>{
  if(!battle) return;
  if(preFight){ preFight=false; setButtons(); start(); return; }
  if(battle.over&&!evq.length){ finish(); return; }
  if(!canAuto()) return;
  autoMode=!autoMode;
  if(autoMode&&waitChoice){ waitChoice=false; waitHero=-1; skPick=null; setTgtPick(null); }
  if(!autoMode){ battle.focus=null; renderFocus(); }
  toast(autoMode?(tabsOpen()?'🤖 자동 전투 · 작전 탭의 패턴대로':'🤖 자동 전투 · 기본 설정된 패턴대로'):'✋ 직접 조작 · 차례마다 스킬을 골라요');
  setButtons(); renderSkillPanel(); if(lastSnap) renderHeroes(lastSnap);
  if(autoMode) start();
};
$('#resetBtn').onclick=()=>{ setupBattle(); openPrep(); };
$('#menuBtn').onclick=()=>{ $('#setCutin').checked=settings.cutin; wipeArmed=false; $('#setWipe').textContent='초기화'; $('#settingsModal').hidden=false; };
$('#setCutin').onchange=e=>{ settings.cutin=e.target.checked; save(SET_KEY,settings); };
$('#setWipe').onclick=()=>{
  if(!wipeArmed){ wipeArmed=true; $('#setWipe').textContent='정말 초기화'; return; }
  prof=defaultProfile(); saveProf();
  Object.keys(rules).forEach(k=>delete rules[k]); Object.keys(targets).forEach(k=>delete targets[k]); saveRules();
  try{ localStorage.removeItem(LOG_KEY); }catch(e){}
  lastFired=null; pause(); battle=null; partyDirty=false;
  $('#settingsModal').hidden=true; goto('battle'); openMaker(true);
};
/* full screen hides the mobile browser bars; iPhone Safari has no API for it, so there the button stays hidden (add to home screen instead) */
(function(){
  const el=document.documentElement, req=el.requestFullscreen||el.webkitRequestFullscreen, btn=$('#fsBtn');
  if(!req) return;
  const isFs=()=>document.fullscreenElement||document.webkitFullscreenElement;
  btn.hidden=false;
  btn.onclick=()=>{ if(isFs()) (document.exitFullscreen||document.webkitExitFullscreen).call(document); else{ const p=req.call(el); if(p&&p.catch) p.catch(()=>{}); } };
  const sync=()=>{ btn.textContent=isFs()?'🗗':'⛶'; btn.setAttribute('aria-label',isFs()?'전체 화면 끄기':'전체 화면'); };
  document.addEventListener('fullscreenchange',sync); document.addEventListener('webkitfullscreenchange',sync);
})();
$('#setClose').onclick=()=>{ $('#settingsModal').hidden=true; };

function firstTips(){ coach('start','#startBtn','눌러서 전투 시작!','battle',true); }

