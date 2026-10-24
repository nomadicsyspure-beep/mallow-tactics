/* ---------- stage rendering ---------- */
/* party grid: left column = front row (next to the boss), right column = back row */
function buildParty(){
  const n={F:0,B:0};
  $('#party').innerHTML='<div class="lane" data-lane="F" style="grid-column:1"></div><div class="lane" data-lane="B" style="grid-column:2"></div><span class="rowlab" data-lab="F" style="grid-column:1">전열</span><span class="rowlab" data-lab="B" style="grid-column:2">후열</span>'+battle.heroes.map((h,i)=>{ const c=charById(h.uid), col=h.row==='B'?2:1, r=2+n[h.row]++;
    return `<div class="unit" data-unit="${i}" style="grid-column:${col};grid-row:${r}"><span class="turntag">▶ 차례</span><div class="unit-spr"><img class="spr" ${spr(h.id,h.look)} alt="${h.name}"><span class="lv">Lv${c?c.lvl:1}</span><span class="st"></span></div>
    <div class="nm">${h.name}</div><div class="bar hp"><div></div><span class="bt mono"></span></div><div class="bar sp"><div></div><span class="bt mono"></span></div>
    <div class="bar atb" title="행동 게이지"><div></div></div></div>`; }).join('');
  units.length=0; document.querySelectorAll('.unit').forEach(u=>units[+u.dataset.unit]=u);
}
/* heroes the boss's next move will hit: their row glows red (or just the covering hero) */
function aimedSet(s){
  if(!battle||battle.over||s.stun>0) return new Set();
  const t=s.q[0]; if(t==='wave') return new Set(s.h.map((h,j)=>h.hp>0?j:-1).filter(j=>j>=0));
  return t==='swipe'||t==='charge'||t==='br'?new Set(s.aim):new Set();
}
function aimText(s){ const j=s.aim[0]; if(j==null) return '-'; const h=s.h[j]; return s.aim.length===1&&(h.guard||h.taunt)?hn(j):battle.heroes[j].row==='F'?'전열':'후열'; }
function renderHeroes(s){
  lastSnap=s; queueMicrotask(renderSkillPanel);
  const aimed=aimedSet(s), t=s.q[0], cover=aimed.size===1&&t!=='wave'&&s.h[[...aimed][0]]&&(s.h[[...aimed][0]].guard||s.h[[...aimed][0]].taunt);
  ['F','B'].forEach(r=>{ const on=!cover&&[...aimed].some(j=>battle.heroes[j].row===r); const ln=document.querySelector(`.lane[data-lane="${r}"]`); if(ln){ ln.classList.toggle('danger',on); document.querySelector(`.rowlab[data-lab="${r}"]`).classList.toggle('danger',on); } });
  $('#party').classList.toggle('waiting',waitChoice);
  s.h.forEach((h,i)=>{
    const u=units[i]; if(!u) return; const r=h.hp/h.max;
    const hp=u.querySelector('.bar.hp'); hp.firstElementChild.style.width=r*100+'%'; hp.classList.toggle('low',r<=.35);
    u.querySelector('.bar.sp>div').style.width=h.sp/SP_MAX*100+'%';
    hp.querySelector('.bt').textContent=`${h.hp}/${h.max}`; u.querySelector('.bar.sp .bt').textContent=`SP ${h.sp}`;
    const ab=u.querySelector('.bar.atb'), af=ab.firstElementChild;
    af.style.transitionDuration=''; af.style.width=(h.hp>0?Math.min(100,Math.max(0,h.g)):0)+'%'; ab.classList.remove('ready'); u.classList.toggle('turn',waitChoice?waitHero===i:curTurn===i);
    u.querySelector('.st').textContent=(h.guard?'🛡️':'')+(h.brace?'🧱':'')+(h.taunt?'📣':'')+(h.ward?'🌙':'')+(h.insp?'🎵':'');
    u.classList.toggle('dead',h.hp<=0); u.classList.toggle('guarding',h.guard||h.taunt||h.brace); u.classList.toggle('warded',h.ward>0&&h.hp>0); u.classList.toggle('danger',!!cover&&aimed.has(i));
    if(saidStart&&isManual()&&battle.stage<MANUAL_FROM&&h.hp>0&&r<=.5) coach('low',`.unit[data-unit="${i}"]`,`${hn(i)}의 HP가 낮아요!\n🩹 붕대로 회복해요.`);
  });
}
function statusOf(s){
  if(s.bhp<=0) return ['calm','💀 격파 · 남은 졸개를 잡아요'];
  if(s.stun>0) return ['break','💫 BREAK'];
  const t=s.q[0];
  if(t==='gaze') return s.p2&&!s.mark?['alert','👁️ 응시 · 표식 필요']:['chance','👁️ 응시 · 끊을 기회'];
  if(t==='wave') return ['alert',`🌊 ${moveName(t)} → 전원`];
  if(t==='charge'||t==='br') return ['alert',`${BOSS_ICON[t]} ${moveName(t)} → ${aimText(s)}`];
  if(t==='shell') return ['calm','🐚 껍질 닫기'];
  return ['calm',`🐙 공격 → ${aimText(s)}`];
}
function renderBoss(s){
  $('#bossHPText').textContent=`${s.bhp} / ${s.bmax}`;
  $('#bossHPBar').style.width=s.bhp/s.bmax*100+'%'; $('#bossHPLag').style.width=s.bhp/s.bmax*100+'%';
  const w=$('#bossWrap'), t=s.q[0], st=s.stun>0?'break':t==='gaze'?'gaze':isBig(t)?'big':s.shell?'shell':'';
  ['st-gaze','st-big','st-shell','st-break'].forEach(c=>{ w.classList.remove(c); battleEl.classList.remove(c); });
  if(s.shell) w.classList.add('st-shell');
  if(st&&!battle.over){ w.classList.add('st-'+st); battleEl.classList.add('st-'+st); }
  w.classList.toggle('p2',s.p2); w.classList.toggle('marked',s.mark>0); w.classList.toggle('turn',curTurn==='B'&&!battle.over);
  const [cls,txt]=battle.over?['calm',battle.over==='win'?`${bossShort()} 격파`:`${bossShort()}의 승리`]:statusOf(s);
  const pill=$('#bossStatus'); pill.className='boss-status '+cls; pill.textContent=txt;
  $('#debuffs').innerHTML=(s.stun>0?'<span class="db stun">💫 기절</span>':'')+(s.shell?'<span class="db shell">🐚 껍질</span>':'')+(s.rage?'<span class="db vuln">😾 강화</span>':'')+(s.mark?`<span class="db mark">◎ 표식 ${s.mark}</span>`:'')+(s.vuln?`<span class="db vuln">🔻 약화 ${s.vuln}</span>`:'')+(s.poison?`<span class="db poison">☠ 독 ${s.poison}</span>`:'');
  const bf=$('#bossAtb>div'); bf.style.transitionDuration=''; bf.style.width=(s.bhp>0?Math.min(100,Math.max(0,s.bg)):0)+'%'; $('#bossAtb').classList.remove('ready');
  if(!$('#speed')){ $('#order').innerHTML='<span class="sep"></span><button class="speed" id="logBtn" aria-label="전투 로그">📜</button><button class="speed" id="speed" aria-label="전투 속도">×'+speed+'</button>'; $('#speed').onclick=cycleSpeed; $('#logBtn').onclick=openLog; }
  $('#roundInfo').innerHTML=`${STAGES[battle.stage-1].name} · 턴 <b class="mono">${s.round}</b>`;
  (s.mobs||[]).forEach((m,j)=>{
    const el=mobEl(j); if(!el) return;
    el.querySelector('.bar.mhp>div').style.width=m.hp/m.max*100+'%';
    const af=el.querySelector('.bar.atb>div'); af.style.transitionDuration=''; af.style.width=(m.hp>0?Math.min(100,Math.max(0,m.g)):0)+'%';
    el.classList.toggle('dead',m.hp<=0||battle.over==='win'); el.classList.toggle('turn',curTurn==='M'+j&&m.hp>0);
  });
  renderFocus();
  if(!saidHalf&&battle.def.talk&&!battle.over&&s.bhp<=s.bmax/2&&s.bhp>0){ saidHalf=true; bossSay(battle.def.talk.half); }
  if(saidStart&&!battle.over){
    if(battle.stage===3&&s.round>=1&&!isManual()) coach('focus','#mobs','적 하나를 눌러 지정하면\n모두 그 적을 집중 공격해요.');
    if(s.stun>0) { coach('break','#bossWrap','💫 BREAK!\n큰 공격을 쓰기 전의 보스 행동을\n끊어냈을 때 나오는 상태예요.'); coach('break2','#bossWrap','보스가 한 차례 쉬고\n받는 피해가 30% 늘어요.'); }
    else if(t==='gaze'){ coach('gaze','#bossStatus','👁️ 보스가 아군을 \'응시\'하려 해요!\n이 다음엔 큰 공격이 올 거예요.'); const k=battle.heroes[skTab].sk.findIndex(x=>x.breakGaze||x.ef.breakGaze); coach('gaze2',k>=0?`#mSkills .sk[data-k="${k}"]`:'#mSkills','🪨 돌팔매로 맞히면\n\'응시\'를 끊어낼 수 있어요.'); }
    else if((t==='wave'||t==='charge')&&battle.stage>TUTORIAL_STAGES) coach('big','#bossStatus',`큰 공격 예고!\n🧱 버티기는 보스가 공격할 때까지 유지돼요.`);
    if(s.shell) coach('shell','#bossWrap','🐚 껍질을 닫았어요.\n다음 차례까지 받는 피해가 절반이에요.');
  }
}
/* focus fire: tap an enemy during auto battle and every attack goes there first */
function renderFocus(){
  const f=battle&&!battle.over?battle.focus:null;
  $('#bossWrap').classList.toggle('focus',f==='B');
  document.querySelectorAll('#mobs .mob').forEach(el=>{ const j=+el.dataset.m; el.classList.toggle('focus',f===j&&battle.mobs[j].hp>0); });
}
function setFocus(t){
  if(!inBattle()||isManual()) return;
  battle.focus=battle.focus===t?null:t; renderFocus();
  toast(battle.focus==null?'집중 공격 해제':`🎯 ${tgtName(battle,t)} 집중 공격`);
}
function mobEl(j){ return document.querySelector(`#mobs .mob[data-m="${j}"]`); }
function buildMobs(){
  $('#mobs').innerHTML=battle.mobs.map((m,j)=>`<div class="mob" data-m="${j}" title="${m.name}"><span class="mic">${m.ic}</span><small>${m.name}</small><div class="bar mhp"><div></div></div><div class="bar atb"><div></div></div></div>`).join('');
}
/* boss lines: a speech bubble over the boss, also written to the battle log */
function bossSay(t){
  if(!t) return;
  const p=at($('#bossAvatar')), d=document.createElement('div'); d.className='say'; d.textContent=t;
  d.style.left=Math.max(p.x+20,90)+'px'; d.style.top=(p.y-p.h/2-6)+'px';
  fxEl.appendChild(d); setTimeout(()=>d.remove(),3100);
  addLog(`💬 <b>${battle.def.name}</b>: “${t}”`,'boss');
}
