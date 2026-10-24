/* gauges run at each unit's speed until the first one reaches 100%; that unit acts next */
function animateFill(){
  const b=battle, us=actors(b);
  let bt=Infinity, who=null;
  us.forEach(x=>{ const t=(100-x.u.g)/x.u.spd; if(t<bt-1e-9){ bt=t; who=x.k; } });
  bt=Math.max(0,bt);
  const ms=Math.min(700,Math.max(160,bt*900));
  curTurn=null; $('#bossWrap').classList.remove('turn'); document.querySelectorAll('#mobs .mob.turn,.unit.turn').forEach(x=>x.classList.remove('turn'));
  us.forEach(x=>{
    const el=x.k==='B'?$('#bossAtb>div'):typeof x.k==='string'?(mobEl(+x.k.slice(1))||{querySelector:()=>null}).querySelector('.bar.atb>div'):units[x.k]&&units[x.k].querySelector('.bar.atb>div'); if(!el) return;
    el.style.transitionDuration=dur(ms)+'ms'; el.style.width=Math.min(100,Math.max(0,x.u.g+x.u.spd*bt))+'%';
  });
  later(ms,()=>{
    curTurn=who;
    if(who==='B'){ $('#bossAtb').classList.add('ready'); $('#bossWrap').classList.add('turn'); }
    else if(typeof who==='string'){ const m=mobEl(+who.slice(1)); if(m) m.classList.add('turn'); }
    else{ units[who].querySelector('.bar.atb').classList.add('ready'); units[who].classList.add('turn'); }
  });
  return ms;
}
function renderSnap(s){ renderHeroes(s); renderBoss(s); }
function renderWallet(){ $('#wGold').textContent=prof.gold; }

