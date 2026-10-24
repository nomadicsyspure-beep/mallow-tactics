/* ---------- log: kept for the battle log sheet ---------- */
function addLog(msg,cls=''){
  const box=$('#logStore');
  box.insertAdjacentHTML('beforeend',`<div class="entry ${cls}"><span class="turn">B${String(battle?battle.round:0).padStart(2,'0')}</span>${msg}</div>`);
  while(box.children.length>300) box.firstChild.remove();
  liveLog();
}
function addSum(ic,txt,v,c){ sumList.push({r:battle.round,ic,txt,v,c}); liveLog(); }

/* ---------- fx primitives ---------- */
function popNum(p,text,cls,size){
  const d=document.createElement('div'); d.className='num '+cls; d.textContent=text;
  d.style.left=(p.x+(Math.random()*24-12))+'px'; d.style.top=(p.y-6+(Math.random()*10-5))+'px';
  if(size) d.style.fontSize=size+'px';
  fxEl.appendChild(d); setTimeout(()=>d.remove(),1100);
}
function sparks(p,color,n=8,spread=46){
  if(reduce) return;
  for(let k=0;k<n;k++){
    const s=document.createElement('div'); s.className='spark'; s.style.background=color; s.style.boxShadow=`0 0 8px ${color}`;
    s.style.left=p.x+'px'; s.style.top=p.y+'px'; fxEl.appendChild(s);
    const a=Math.random()*Math.PI*2, r=spread*(.5+Math.random()*.7);
    s.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*r}px),calc(-50% + ${Math.sin(a)*r}px)) scale(.2)`,opacity:0}],{duration:420+Math.random()*260,easing:'cubic-bezier(.1,.8,.3,1)'}).onfinish=()=>s.remove();
  }
}
function rise(p,color,n=7){
  if(reduce) return;
  for(let k=0;k<n;k++){
    const s=document.createElement('div'); s.className='spark'; s.style.background=color; s.style.boxShadow=`0 0 8px ${color}`;
    s.style.left=(p.x+(Math.random()*50-25))+'px'; s.style.top=(p.y+10)+'px'; fxEl.appendChild(s);
    s.animate([{transform:'translate(-50%,0)',opacity:0},{opacity:1,offset:.2},{transform:`translate(-50%,-${40+Math.random()*30}px)`,opacity:0}],{duration:700+Math.random()*300,delay:k*40,easing:'ease-out',fill:'both'}).onfinish=()=>s.remove();
  }
}
function shoot(from,to,kind,delay,cb){
  if(reduce){ cb(); return; }
  const p=document.createElement('div'); p.className='proj '+kind; if(kind==='note') p.textContent='♪'; fxEl.appendChild(p);
  p.style.left=from.x+'px'; p.style.top=from.y+'px';
  const dx=to.x-from.x, dy=to.y-from.y, ang=kind==='note'?0:Math.atan2(dy,dx)*180/Math.PI;
  const arc=kind==='orb'||kind==='fire'||kind==='note'?-46:kind==='light'?-30:-8;
  const T=(a,b,s)=>`translate(-50%,-50%) translate(${a}px,${b}px) rotate(${ang}deg) scale(${s})`;
  const anim=p.animate([{transform:T(0,0,.5),opacity:0},{transform:T(dx*.2,dy*.2+arc*.6,1),opacity:1,offset:.2},{transform:T(dx*.55,dy*.55+arc,1.1),offset:.55},{transform:T(dx,dy,1),opacity:1}],
    {duration:dur(kind==='fire'?380:kind==='arrow'||kind==='dagger'?200:300),delay:dur(delay),easing:'ease-in',fill:'both'});
  const g=gen; anim.onfinish=()=>{ p.remove(); if(g===gen) cb(); };
}
function slashAt(p){
  ['','x'].forEach(c=>{ const s=document.createElement('div'); s.className='slash '+c; if(c) s.style.setProperty('--r','35deg');
    s.style.left=p.x+'px'; s.style.top=p.y+'px'; fxEl.appendChild(s); setTimeout(()=>s.remove(),500); });
}
function skillPop(p,pic,name,ty,boss){
  const d=document.createElement('div'); d.className='skillpop t-'+ty+(boss?' boss':'');
  d.innerHTML=`<span class="ic">${pic}</span><b>${name}</b>`;
  d.style.left=Math.min(Math.max(p.x,52),battleEl.clientWidth-52)+'px'; d.style.top=(p.y-p.h/2+2)+'px';
  fxEl.appendChild(d); setTimeout(()=>d.remove(),1200);
}
function banner(t,cls,sub){
  const b=$('#banner'); b.className='banner '+cls; b.innerHTML=`<b>${t}</b>${sub?`<small>${sub}</small>`:''}`;
  b.hidden=false; retrigger(b,'show');
  clearTimeout(banner.t); banner.t=setTimeout(()=>{ b.hidden=true; },1300);
}
function toast(t){ const el=$('#toast'); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>{ el.hidden=true; },2400); }
function bossHit(kind,v,mobJ){
  const isMob=mobJ!=null, av=isMob?mobEl(mobJ):$('#bossAvatar'); if(!av) return; const p=at(av);
  if(isMob) retrigger(av,'hurt'); else{ retrigger(av,'hurt'); av.classList.add('flash'); setTimeout(()=>av.classList.remove('flash'),70); }
  const col={slash:'#cfe3ff',orb:'#b39cff',fire:'#ffb04f',arrow:'#7ff0e0',light:'#ffe9a8',dagger:'#c8f59a',note:'#ffb3e6'}[kind];
  sparks(p,col,kind==='fire'?14:8,kind==='fire'?62:44);
  if(kind==='slash') slashAt(p);
  const big=v>=150;
  popNum(p,v,big?'big':'dmg',Math.min(34,15+v/9));
  if(big||kind==='fire') retrigger(battleEl,'jolt');
}

/* ---------- cut-ins ---------- */
const CUT_MS=980;
function cutinFor(e){
  if(!settings.cutin||reduce) return null;
  if(e.t==='act'){
    if(allyCut) return null;
    const tot=sum(e.hits), sk=battle.heroes[e.i].sk[e.k]; let sub=null;
    if(e.brk) sub='BREAK!';
    else if(e.exec&&tot>=180) sub='처형!';
    else if(e.combo&&tot>=200) sub='BREAK 추격!';
    else if(e.fire&&tot>=250) sub='CRITICAL!';
    else if(sk.ef.aoe&&e.hits.length>=3) sub='모든 적에게!';
    else if(e.ward==='team'&&e.snap.stun===0&&isBig(e.snap.q[0])) sub='강공격 대비!';
    if(!sub) return null;
    allyCut=true;
    return {side:'ally',key:e.id,look:battle.heroes[e.i].look,who:e.nm,skill:sk.n,sub};
  }
  if(e.t==='boss'&&(e.m==='wave'||e.m==='charge')) return {side:'enemy',key:'boss',who:battle.def.name,skill:e.m==='wave'?(battle.def.gk?'심연 파동':'광역 공격'):(battle.def.gk?'심연 돌진':'돌진'),sub:e.m==='wave'?'전원 공격!':'일격 필살!'};
  if(e.t==='phase') return {side:'enemy',key:'boss',who:battle.def.name,skill:'각성',sub:'PHASE 2 · 피해 +20%'};
  return null;
}
function showCutin(c){
  const el=$('#cutin'); el.hidden=true;
  el.className=`cutin ${c.side} h-${c.key}`; el.style.setProperty('--d',dur(CUT_MS)+'ms');
  $('#ciPortrait').innerHTML=c.side==='enemy'?'<div class="ci-eye"></div><i class="ci-tag">BOSS ART</i>':`<img class="ci-spr" ${spr(c.key,c.look)} alt="">`;
  $('#ciWho').textContent=c.who; $('#ciSkill').textContent=c.skill; $('#ciSub').textContent=c.sub;
  void el.offsetWidth; el.hidden=false;
  if(navigator.vibrate) try{ navigator.vibrate(c.side==='enemy'?[30,40,60]:25); }catch(err){}
  clearTimeout(showCutin.t); showCutin.t=setTimeout(()=>{ el.hidden=true; },dur(CUT_MS)+40);
}

