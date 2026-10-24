/* every battle opens paused: enemies, allies and skills can be tapped to check them, then ▶ 전투 시작 starts it */
let preFight=false;
function battleTips(){
  const tips={1:[['boss','#bossWrap','이게 적이에요.'],['bossHp','.hp-track','빨간 줄이 체력이에요.'],['party','.unit[data-unit="0"]','내 캐릭터예요.'],['hpBar','.unit[data-unit="0"] .bar.hp','빨간 줄은 HP예요.'],['spBar','.unit[data-unit="0"] .bar.sp','파란 줄은 SP예요.\n스킬을 쓰면 줄어요.'],
      ['gauge','#bossAtb','금색 게이지가 먼저 꽉 찬 쪽부터\n움직여요.'],['aim','#party','아군은 전열과 후열에 설 수 있어요.'],['aimRed','.lane.danger','배경이 빨갛게 물든 열을\n보스가 노려요.'],
      ['front','.lane[data-lane="F"]','전열: 상대에게 주는 피해가 증가해요.'],['back','.lane[data-lane="B"]','후열: 상대로부터 받는 피해가 감소해요.']],
    2:[['mobs','#mobs','보스 옆의 몬스터는 졸개예요.\n보스와 따로 움직이며 공격해요.']],
    3:[['inspect','#bossAvatar','싸우기 전에 보스를 눌러 봐요!\n어떤 스킬을 쓰는지 볼 수 있어요.','battle',true,false,500],['inspectMob','#mobs .mob','졸개도 눌러 봐요!\n어떤 공격을 하는지 볼 수 있어요.','battle',true,false,500],['inspectAlly','.unit[data-unit="0"]','아군을 누르면\n지금 상태를 볼 수 있어요.','battle',true,false,500]],
    [BG_STAGE]:[['hard','#bossWrap','여기부터는 진짜 전략 싸움!\n전직 · 스킬 · 배치를 잘 골라야 이겨요.'],['tabs','#nav','이제 자동 전투 중에\n다른 탭을 봐도 전투가 계속돼요.']]};
  (tips[battle.stage]||[]).forEach(t=>coach(...t));
  coach(battle.stage>1&&battle.stage<=TUTORIAL_END?'fight'+battle.stage:'fight','#fightBtn','준비가 되면 전투 시작!','battle',true);
}
function enterBattle(){ $('#prep').hidden=true; preFight=true; setButtons(); battleTips(); }
function cycleSpeed(){ speed=speed===2?1:2; const s=$('#speed'); if(s) s.textContent='×'+speed; }
function speedOk(){ return !!battle&&battle.stage>=6&&!!prof.cleared[battle.stage]; }
function clearStage(){
  gen++; fxEl.innerHTML=''; $('#banner').hidden=true; $('#cutin').hidden=true; $('#toast').hidden=true; clearCoach();
  $('#bossWrap').classList.remove('dying'); $('#resultModal').hidden=true;
}
function setupBattle(muts,seed){
  if(!prof.chars.length) return;
  pause(); clearStage(); evq=[]; waitChoice=false; pendingChoice=null; preFight=false; stepTarget=null; sumList=[]; filled=false;
  waitHero=-1; skPick=null; skTab=0; lastSnap=null; flashState=null; saidHalf=false; saidStart=false;
  if(!prof.party.length) prof.party=[prof.chars[0].uid];
  cfg=makeCfg(muts||[],seed); pausedByTab=false; curTurn=null;
  battle=newBattle(cfg); lastBhp=battle.boss.max; loggedRound=0; autoMode=false;
  $('#logStore').innerHTML='';
  $('#bossName').textContent=battle.def.name;
  $('#bossBody').style.filter=battle.def.hue?`hue-rotate(${battle.def.hue}deg)`:'';
  buildParty(); buildMobs(); setTgtPick(null); pendingTgt=null; renderSnap(snap(battle)); showNext(); setButtons();
  if(!speedOk()) speed=1; $('#speed').hidden=!speedOk(); $('#speed').textContent='×'+speed;
  addLog(`${STAGES[cfg.stage-1].name} · ${battle.def.ic} ${battle.def.name}`);
}
function openPrep(){ $('#prep').hidden=false; renderPrep(); setButtons(); }
