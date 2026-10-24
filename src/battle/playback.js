/* ---------- event playback ---------- */
const PICK_MS=300;
function delayOf(e,cut){
  if(e.t==='act'){ const base=e.hits.length?640+(Math.min(e.hits.length,4)-1)*120:540; return PICK_MS+(e.brk&&!cut?base+500:base); }
  if(e.t==='boss'){ if(e.skip) return 700; if(e.m==='wave') return 1250+(e.perfect?500:0); if(e.m==='charge') return 1000+(e.perfect?400:0); return 820; }
  if(e.t==='tick') return 520;
  if(e.t==='mob') return e.heal!=null||e.buff?640:720;
  if(e.t==='phase') return cut?500:1350;
  if(e.t==='bossDown') return 1500;
  if(e.t==='win') return 1700;
  return 240;
}
function play(e){
  if(e.t==='boss') allyCut=false;
  if((e.t==='boss'||e.t==='tick')&&e.snap.round>loggedRound){ loggedRound=e.snap.round; addLog(`── 보스 ${e.snap.round}턴 ──`,'turnrow'); }
  const c=cutinFor(e);
  if(e.t==='act') flashSkill(e.i,e.k);
  if(c){ const lead=e.t==='act'?PICK_MS:0; later(lead,()=>showCutin(c)); later(lead+CUT_MS-120,()=>playInner(e,true)); return lead+CUT_MS-120+delayOf(e,true)-(e.t==='act'?PICK_MS:0); }
  if(e.t==='act'){ later(PICK_MS,()=>playInner(e,false)); return delayOf(e,false); }
  playInner(e,false); return delayOf(e,false);
}
function playInner(e,cut){
  const s=e.snap;
  if(e.t==='act') return playAct(e,cut);
  if(e.t==='boss') return playBoss(e);
  if(e.t==='mob') return playMob(e);
  if(e.t==='tick'){ renderSnap(s); popNum(at($('#bossAvatar')),'☠ '+e.v,'tox',18); addLog(`☠ 독 피해 <b>${e.v}</b> <span class="hp">→ ${bossShort()} (${lastBhp} > ${s.bhp})</span>`,'good'); lastBhp=s.bhp; return; }
  if(e.t==='phase'){
    later(cut?0:120,()=>{ renderSnap(s); if(!cut) banner('PHASE 2','phase','수문장 각성 · 피해 +20%'); retrigger(battleEl,'quake'); retrigger($('#bossBody'),'roar'); });
    addLog('⚠️ 수문장이 각성했다! 껍질 닫기와 돌진이 추가되고 피해가 20% 늘어난다.','alert'); addSum('😡','2페이즈 돌입','',''); return;
  }
  /* the boss fell but minions are still up: the stage is cleared only when every enemy is down */
  if(e.t==='bossDown'){
    battle.downShown=true;
    later(250,()=>{ $('#bossWrap').classList.add('dying'); sparks(at($('#bossAvatar')),'#f2c25b',26,110); banner('보스 격파!','win','남은 졸개를 모두 잡아요'); renderSnap(s); if(battle.def.talk) bossSay(battle.def.talk.die); });
    addLog(`💀 <strong>${battle.def.name}</strong> 격파! 남은 졸개를 모두 잡아야 이겨요.`,'good'); addSum('💀','보스 격파','✓','ok'); return;
  }
  if(e.t==='win'){
    const down=battle.downShown;
    later(250,()=>{ if(!down){ $('#bossWrap').classList.add('dying'); sparks(at($('#bossAvatar')),'#f2c25b',26,110); } banner(down?'승리!':'격파!','win',down?'모든 적 처치':`${battle.def.name} 쓰러짐`); renderSnap(s); });
    addLog(down?'🏆 모든 적 처치!':`🏆 <strong>${battle.def.name}</strong> 격파!`,'good'); addSum('🏆',down?'모든 적 처치':'격파','✓','ok');
  }
}
function playMob(e){
  const s=e.snap, m=battle.mobs[e.j], el=mobEl(e.j); if(el) retrigger(el,'act');
  const bp=at($('#bossAvatar'));
  if(e.heal!=null){
    later(200,()=>{ popNum(bp,'+'+e.heal,'heal',18); renderSnap(s); });
    addLog(`${m.ic} <b>${m.name}</b>: ${bossShort()} HP <strong>+${e.heal}</strong> <span class="hp">(${lastBhp} > ${s.bhp})</span>`,'boss'); lastBhp=s.bhp; return;
  }
  if(e.buff){ later(200,()=>{ popNum(bp,'공격력 ↑','warn',13); renderSnap(s); }); addLog(`${m.ic} <b>${m.name}</b>: ${bossShort()}의 다음 공격이 강해진다!`,'boss'); return; }
  later(180,()=>{ e.hits.forEach(h=>{ const u=units[h.j], p=at(u); retrigger(u,'hit'); popNum(p,'-'+h.v,'hurt',Math.min(24,13+h.v/8)); if(h.red) popNum({x:p.x,y:p.y+22},h.red,'info'); }); renderSnap(s); });
  e.hits.forEach(h=>addLog(`${m.ic} <b>${m.name}</b>: ${hn(h.j)} ${h.v} 피해${h.red?` (${h.red})`:''}`,'boss'));
  logDowns(e);
}
function playAct(e,cut){
  const hd=HERO_DB[e.id], u=units[e.i], sk=battle.heroes[e.i].sk[e.k], s=e.snap;
  retrigger(u,'acting');
  skillPop(at(u),sk.pic,sk.n,sk.ty);
  addLog(`<b>▸ ${e.nm}</b> · ${sk.pic} ${sk.n}<em>${e.rule>=0?'패턴 '+(e.rule+1):e.rule===-3?'직접':'기본'}</em><br>${e.txt}${e.tgts.includes('B')?` <span class="hp">→ ${bossShort()} (${lastBhp} > ${s.bhp})</span>`:''}`,e.brk?'good':(e.resist?'alert':''));
  lastBhp=s.bhp;
  if(e.brk) addSum('👁️',`${e.nm} ${sk.n}`,'✓ 응시 끊음','ok');
  if(e.resist) addSum('👁️',`${e.nm} ${sk.n}`,'✗ 표식 없음','bad');
  renderHeroes(s);
  if(e.hits.length){
    const from=at(u), kind=e.fire?'fire':hd.fx;
    e.hits.forEach((v,n)=>{
      const tg=e.tgts[n], mj=tg==='B'?null:tg, tEl=mj==null?$('#bossAvatar'):mobEl(mj), to=at(tEl);
      const go=()=>{ bossHit(kind,v,mj); if(mj!=null&&e.kills&&e.kills.includes(mj)&&e.tgts.lastIndexOf(mj)===n){ popNum({x:to.x,y:to.y-14},'처치!','info',13); sparks(to,'#ff9e8a',10,40); } if(n===e.hits.length-1) renderBoss(s); };
      if(kind==='slash') later(130+n*90,go); else shoot(from,{x:to.x+(n-1)*8,y:to.y+(n-1)*6},kind,n*110,go);
    });
    if(e.delay){ const dEl=e.delay.t==='B'?$('#bossAvatar'):mobEl(e.delay.t); if(dEl) later(420,()=>popNum({...at(dEl),y:at(dEl).y+18},`⏳ -${e.delay.v}%`,'sp',13)); }
  }else renderBoss(s);
  const p=at(u), bp=at($('#bossAvatar'));
  if(e.insp) popNum({x:p.x,y:p.y-30},'♪ +30%','info');
  if(e.guard){ popNum(p,'GUARD','info'); sparks(p,'#7fb2e5',8,36); }
  if(e.brace){ popNum(p,'버티기','info'); sparks(p,'#d8c48a',6,30); }
  if(e.taunt&&!e.resist) popNum(p,'도발!','info');
  if(e.resist){ popNum(p,'안 통한다!','warn'); popNum(bp,'무시','warn'); retrigger($('#bossBody'),'roar'); }
  if(e.sp){ popNum(p,'SP +'+e.sp,'sp'); rise(p,'#7fb2e5',8); }
  if(e.spGive){ const q=at(units[e.spGive.j]); popNum(q,'SP +'+e.spGive.v,'sp'); rise(q,'#7fb2e5',6); }
  if(e.spAll) units.forEach((x,j)=>{ if(j!==e.i&&s.h[j].hp>0){ rise(at(x),'#7fb2e5',4); } });
  if(e.heal){ const q=at(units[e.heal.j]); popNum(q,'+'+e.heal.v,'heal',22); rise(q,'#7ff0bf',10); }
  if(e.healAll) e.healAll.forEach(x=>{ const q=at(units[x.j]); if(x.v) popNum(q,'+'+x.v,'heal',17); rise(q,'#7ff0bf',5); });
  if(e.ward==='team'){ units.forEach((x,j)=>{ if(s.h[j].hp>0) rise(at(x),'#9fd0ff',5); }); popNum(at($('#party')),'보호막!','info'); }
  else if(typeof e.ward==='number'){ rise(at(units[e.ward]),'#9fd0ff',7); }
  if(e.mark) popNum(bp,'약점!','big',20);
  if(e.vuln) popNum({x:bp.x,y:bp.y+20},'방어 약화','warn');
  if(e.poison) later(200,()=>popNum(bp,'☠ 독','tox',18));
  if(e.inspire) units.forEach((x,j)=>{ if(j!==e.i&&s.h[j].hp>0) rise(at(x),'#ffb3e6',5); });
  if(e.haste){ units.forEach((x,j)=>{ if(j!==e.i&&s.h[j].hp>0) rise(at(x),'#ffd29a',5); }); popNum(at($('#party')),'가속!','info'); }
  if(e.brk) later(cut?0:200,()=>{ if(!cut) banner('BREAK!','brk','보스가 한 차례 쉼'); retrigger(battleEl,'quake'); sparks(bp,'#f2c25b',18,80); });
}
function playBoss(e){
  const s=e.snap, nm=moveName(e.m), bp=at($('#bossAvatar'));
  if(e.skip){ renderSnap(s); popNum(bp,'💫 기절','info',14); addLog(`${bossShort()}는 비틀거리며 아무것도 하지 못했다`,'good'); addSum('💫','BREAK로 쉼','✓','ok'); return; }
  skillPop({x:bp.x,y:bp.y-bp.h/2+8,h:0},BOSS_ICON[e.m],nm,'atk',true);
  if(e.m==='swipe'||e.m==='charge'){
    retrigger($('#bossBody'),'lunge');
    later(200,()=>{
      e.hits.forEach((h,n)=>later(n*140,()=>{ const u=units[h.j], p=at(u); retrigger(u,'hit'); popNum(p,'-'+h.v,'hurt',Math.min(30,15+h.v/8)); sparks(p,'#ff7b8a',6,30); if(h.red) popNum({x:p.x,y:p.y+22},h.red,'info'); }));
      renderSnap(s);
      if(e.m==='charge'&&e.perfect) later(300,()=>banner('막아냈다!','perfect','돌진을 받아냈다'));
    });
    e.hits.forEach(h=>addLog(`${BOSS_ICON[e.m]} ${nm}: <strong>${hn(h.j)}</strong> ${h.v} 피해${h.red?` (${h.red})`:''}`,'boss'));
    if(e.m==='charge'){ const dn=e.hits.some(h=>h.down); addSum('💥',`돌진 → ${e.cover&&e.hits[0]?hn(e.hits[0].j):e.row==='B'?'후열':'전열'}`,dn?'✗ 쓰러짐':e.perfect?'✓ 막음':'△ 피해',dn?'bad':e.perfect?'ok':'mid'); }
    logDowns(e); return;
  }
  if(e.m==='wave'){
    retrigger($('#bossBody'),'roar');
    later(220,()=>{ const w=document.createElement('div'); w.className='wave'; w.style.left=bp.x+'px'; w.style.top=bp.y+'px'; fxEl.appendChild(w); setTimeout(()=>w.remove(),700); retrigger(battleEl,'quake'); retrigger($('#vignette'),'flash'); });
    later(380,()=>{
      e.hits.forEach(h=>{ const u=units[h.j], p=at(u); retrigger(u,'hit'); popNum(p,'-'+h.v,'hurt',Math.min(30,15+h.v/8)); if(h.red) popNum({x:p.x,y:p.y+22},h.red,'info'); });
      renderSnap(s);
      if(e.perfect) later(320,()=>banner('완벽 방어!','perfect','광역 공격을 전부 받아냈다'));
    });
    const dn=e.hits.filter(h=>h.down).length;
    addLog(`🌊 <strong>${nm}!</strong> ${e.hits.map(h=>`${hn(h.j)} -${h.v}`).join(', ')}`,'boss');
    addSum('🌊',nm,e.perfect?'✓ 완벽 방어':dn?`✗ ${dn}명 쓰러짐`:`△ 대비 ${e.hits.filter(h=>h.red).length}/${e.hits.length}`,e.perfect?'ok':dn?'bad':'mid');
    logDowns(e); return;
  }
  renderSnap(s);
  if(e.m==='gaze'){ popNum(bp,`${BOSS_ICON[e.next]} 준비…`,'warn'); addLog(`👁️ ${nm}: 다음 차례에 <strong>${moveName(e.next)}</strong>`,'alert'); addSum('👁️','응시를 못 끊음',`✗ ${BOSS_ICON[e.next]} 예고`,'bad'); return; }
  popNum(bp,'껍질 닫기','info'); addLog(`🐚 ${nm}: 다음 차례까지 받는 피해 절반`,'boss');
}
function logDowns(e){ e.hits.filter(h=>h.down).forEach(h=>addLog(`💀 <strong>${hn(h.j)}</strong> 쓰러졌다`,'boss')); }

