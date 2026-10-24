/* ---------- characters: party, EXP, job change, skills, gear ---------- */
/* 출전 파티 (formation, details, skills) and 대기 파티 (bench, swaps, recruiting) are two tabs; recruiting the first
   party opens on the bench tab, the formation lesson and the job guide on the party tab */
let charTab='party';
$('#charTabs').onclick=e=>{ const b=e.target.closest('[data-ctab]'); if(!b) return; charTab=b.dataset.ctab; gearOpen=null; renderCharacters(); };
function renderCharacters(){
  if(!charById(detailHero)) detailHero=prof.chars[0].uid;
  if(!prof.guideDone&&prof.party.length<4) charTab='bench';
  if(jobTutOn()||prof.party.length>=4&&!prof.tips.formB) charTab='party';
  const waiting=prof.chars.filter(c=>!prof.party.includes(c.uid));
  if(charTab==='party'&&!prof.party.includes(detailHero)) detailHero=prof.party[0];
  if(charTab==='bench'&&prof.party.includes(detailHero)) detailHero=waiting.length?waiting[0].uid:null;
  $('#partyPane').hidden=charTab!=='party'; $('#benchPane').hidden=charTab!=='bench';
  document.querySelectorAll('#charTabs [data-ctab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ctab===charTab)));
  $('#benchCount').textContent=waiting.length||'';
  $('#partyCount').textContent=`${prof.party.length} / 4`;
  const fcard=(c,r)=>c?`<button class="fslot ${c.uid===detailHero?'sel':''}" data-row="${r}" data-id="${c.uid}"><img ${spr(c.job,c.look)} alt="">${c.name}<small>${HERO_DB[c.job].name} · Lv${c.lvl}</small></button>`:`<button class="fslot empty" data-row="${r}" aria-label="빈 자리">＋</button>`;
  $('#formation').innerHTML=['F','B'].map(r=>{ const m=prof.party.filter(u=>rowOf(u)===r).map(charById); return `<div class="fcol"><b>${r==='F'?'전열':'후열'}</b>${fcard(m[0],r)}${fcard(m[1],r)}</div>`; }).join('');
  const bench=prof.chars.filter(c=>!prof.party.includes(c.uid));
  $('#roster').innerHTML=bench.length?'':'<div class="pempty" style="grid-column:1/-1;text-align:center">대기 중인 동료가 없어요</div>';
  $('#roster').innerHTML+=bench.map(c=>`<button class="rh ${c.uid===detailHero?'sel':''}" data-id="${c.uid}">${c.job==='wanderer'&&c.lvl>=JOB_LVL?'<span class="inp" style="color:var(--gold)">전직!</span>':''}<img class="thumb" ${spr(c.job,c.look)} alt="">${c.name}<small>Lv${c.lvl} · ${HERO_DB[c.job].name}</small></button>`).join('');
  const cost=recruitCost(), rb=$('#recruitBtn'), full=prof.chars.length>=MAX_CHARS;
  rb.textContent=full?'동료가 가득 찼어요':`＋ 새 동료 데려오기 · ${cost?'🪙'+cost:'무료'}`; setWhy(rb,full?`동료는 ${MAX_CHARS}명까지예요`:prof.gold<cost?`🪙 골드가 모자라요 (${cost} 필요)\n스테이지를 깨서 모아요`:'');
  /* the screen is shown for a moment before the recruit button is pointed out */
  if(!prof.tips.recruit3&&prof.party.length<4) setTimeout(()=>{ coach('recruit2','#recruitBtn',`여기서 새 동료를 데려와요.\n${FREE_RECRUITS}명이 될 때까지 무료예요!`,'characters',false,true); coach('recruit3','#recruitBtn','자, 어서 동료를 데려와 봐요!','characters',true); },SHOW_CHARS_MS);
  if(prof.party.length>=4){
    coach('formDrag','#formation','캐릭터를 끌어다 놓으면\n배치를 바꿀 수 있어요.','characters');
    coachDo('formDemo',dragDemo,'characters');
    coach('formF','#formation .fcol:nth-child(1)','전열: 주는 피해 +20%','characters');
    coach('formB','#formation .fcol:nth-child(2)','후열: 받는 피해 -20%','characters');
  }
  if(jobTutOn()){
    const c=charById(detailHero), r=jobReadyChars();
    if(c&&c.job==='wanderer'&&c.lvl>=JOB_LVL) coach('jobTut3'+jobR(),'#dJob','🎓 전직하기를 눌러\n직업을 골라요.','characters',true);
    else if(r.length) coach('jobTut2'+jobR(),`#formation .fslot[data-id="${r[0].uid}"]`,'전직할 캐릭터를 골라요.','characters',true);
  }
  renderDetail();
}
function renderDetail(){
  $('#heroDetail').hidden=!charById(detailHero); if(!charById(detailHero)) return;
  const c=charById(detailHero), hd=HERO_DB[c.job], st=charStats(c), inParty=prof.party.includes(c.uid);
  const need=expNeed(c.lvl), canJob=c.job==='wanderer'&&c.lvl>=JOB_LVL;
  const pool=skillPool(c);
  const skRow=id=>{ const s=SKILLS[id], learned=c.learned.includes(id), eq=c.equip.includes(id), lock=c.lvl<s.lv, cost=learnCost(id);
    const btn=lock?`<span class="lock">Lv${s.lv} 필요</span>`:!learned?`<button class="outlinebtn" data-learn="${id}"${whyAttr(prof.gold<cost?`🪙 골드가 모자라요 (${cost} 필요)`:'')}>배우기 🪙${cost}</button>`:eq?`<button class="outlinebtn on" data-unequip="${id}">장착 해제</button>`:`<button class="outlinebtn" data-equip="${id}"${whyAttr(c.equip.length>=EQUIP_SLOTS?`장착 칸(${EQUIP_SLOTS})이 가득 찼어요\n먼저 하나를 해제해요`:'')}>장착</button>`;
    return `<div class="skrow ${lock?'locked':''} ${eq?'eq':''}"><span class="ic t-${s.ty}">${s.pic}</span><span class="tx"><b>${s.n}</b><small>${s.cost?'SP '+s.cost:'SP 0'}${s.cd?` · 쿨 ${s.cd}`:''} · ${s.tip}</small></span>${btn}</div>`; };
  $('#heroDetail').innerHTML=`<div class="section-title"><span>${c.name} · ${hd.name} (${hd.role})</span><span>Lv ${c.lvl} / ${MAX_LVL}</span></div>
    <div class="expbar"><div style="width:${c.lvl>=MAX_LVL?100:c.exp/need*100}%"></div></div>
    <div class="desc" style="margin-top:3px">EXP ${c.lvl>=MAX_LVL?'MAX':`${c.exp} / ${need}`}</div>
    <div class="statgrid"><div>체력<b>${st.maxhp}</b></div><div>피해 배율<b>×${st.dmg.toFixed(2)}</b></div><div>속도<b>${spdWord(st.spd)}</b></div></div>
    <div class="rowbtns">
      <button class="outlinebtn" id="dParty">${inParty?'출전 해제':'출전시키기'}</button>
      ${c.job==='wanderer'?`<button class="mainbtn" id="dJob"${whyAttr(canJob?'':`Lv${JOB_LVL}가 되면 전직할 수 있어요`)}>${canJob?'🎓 전직하기':`전직은 Lv${JOB_LVL}부터`}</button>`:''}
    </div>
    ${!inParty&&prof.party.length?`<div class="swaprow"><span>출전 파티의 누구와 바꿀까요?</span><div class="swapbtns">${prof.party.map(u=>{ const p=charById(u); return `<button class="swapbtn" data-swap="${u}"><img class="thumb" ${spr(p.job,p.look)} alt="">${p.name}<small>${rowOf(u)==='F'?'전열':'후열'} · Lv${p.lvl}</small></button>`; }).join('')}</div></div>`:''}
    <div class="section-title" style="margin-top:12px"><span>스킬 (장착 ${c.equip.length}/${EQUIP_SLOTS})</span><span>🪙 ${prof.gold}</span></div>
    <div class="sklist">
      <div class="skrow eq"><span class="ic t-atk">${SKILLS[hd.basic].pic}</span><span class="tx"><b>${SKILLS[hd.basic].n}</b><small>기본기 · ${SKILLS[hd.basic].tip}</small></span><span class="lock">기본</span></div>
      ${pool.map(skRow).join('')}
    </div>
    <div class="section-title" style="margin-top:12px"><span>장비</span></div>
    <div class="gear">${['wpn','arm','acc'].map(s=>{ const it=c.gear[s]&&itemById(c.gear[s]);
      return `<button class="gslot ${gearOpen===s?'open':''}" data-slot="${s}">${SLOT[s].ic} ${SLOT[s].n}<b>${it?itemName(it):'비어 있음'}</b>${it?itemStat(it):'눌러서 장착'}</button>`; }).join('')}</div>
    <div id="gearPick"></div>`;
  $('#dParty').onclick=()=>{
    if(inParty){ if(prof.party.length<=1){ alertLine('최소 1명은 출전해야 해요'); return; } prof.party=prof.party.filter(x=>x!==c.uid); }
    else{ if(prof.party.length>=4){ alertLine('파티는 4명까지예요. 아래에서 바꿀 동료를 골라요'); return; } prof.party.push(c.uid); charTab='party'; }
    fixRows(); saveProf(); partyDirty=true; renderCharacters();
  };
  document.querySelectorAll('#heroDetail [data-swap]').forEach(b=>b.onclick=()=>{ const u=b.dataset.swap, out=charById(u); placeAt(c.uid,rowOf(u),u); charTab='party'; detailHero=c.uid; renderCharacters(); toast(`${c.name} 출전 · ${out.name} 대기`); });
  const dj=$('#dJob'); if(dj) dj.onclick=()=>{ if(canJob) openJobPicker(c,null); };
  document.querySelectorAll('#heroDetail [data-learn]').forEach(b=>b.onclick=()=>{ const id=b.dataset.learn, cost=learnCost(id); if(prof.gold<cost) return; prof.gold-=cost; c.learned.push(id); if(c.equip.length<EQUIP_SLOTS) c.equip.push(id); saveProf(); partyDirty=true; renderCharacters(); });
  document.querySelectorAll('#heroDetail [data-equip]').forEach(b=>b.onclick=()=>{ if(c.equip.length>=EQUIP_SLOTS) return; c.equip.push(b.dataset.equip); saveProf(); partyDirty=true; renderCharacters(); });
  document.querySelectorAll('#heroDetail [data-unequip]').forEach(b=>b.onclick=()=>{ c.equip=c.equip.filter(x=>x!==b.dataset.unequip); saveProf(); partyDirty=true; renderCharacters(); });
  document.querySelectorAll('.gslot').forEach(b=>b.onclick=()=>{ gearOpen=gearOpen===b.dataset.slot?null:b.dataset.slot; renderDetail(); });
  if(gearOpen){
    const owned=prof.items.filter(x=>x.slot===gearOpen).sort((a,b)=>b.val-a.val);
    const who=itId=>prof.chars.find(h=>h.gear[gearOpen]===itId);
    $('#gearPick').innerHTML=`<div class="gpick">${c.gear[gearOpen]?`<button class="item" data-it="0"><span class="ii">✖</span><span class="it"><b>장착 해제</b></span></button>`:''}${owned.length?owned.map(it=>{ const w=who(it.id);
      return `<button class="item r${it.tier}" data-it="${it.id}"><span class="ii">${SLOT[it.slot].ic}</span><span class="it"><b class="tier${it.tier}">${itemName(it)}</b><small>${itemStat(it)}${w?` · ${w.name} 착용 중`:''}</small></span></button>`; }).join(''):'<div class="pempty">이 부위 장비가 없어요. 보스를 잡으면 나와요.</div>'}</div>`;
    document.querySelectorAll('#gearPick .item').forEach(b=>b.onclick=()=>{
      const itId=+b.dataset.it;
      if(itId){ const w=who(itId); if(w) w.gear[gearOpen]=null; c.gear[gearOpen]=itId; } else c.gear[gearOpen]=null;
      gearOpen=null; saveProf(); partyDirty=true; renderCharacters();
    });
  }
}
let partyDirty=false;
function alertLine(t){ const d=$('#heroDetail'); const n=document.createElement('p'); n.className='sub'; n.style.color='var(--gold)'; n.style.margin='8px 0 0'; n.textContent=t; d.prepend(n); setTimeout(()=>n.remove(),2200); }
/* formation: drag a hero onto another place to move them. Dropping on a party member swaps the two, a waiting
   hero takes the spot and benches whoever was there, and dropping on 대기 파티 benches. A tap shows the hero's details */
function placeAt(uid,row,occ){
  const inP=prof.party.includes(uid);
  if(occ){
    if(inP){ const i=prof.party.indexOf(uid), j=prof.party.indexOf(occ), r=rowOf(uid); prof.rows[uid]=rowOf(occ); prof.rows[occ]=r; [prof.party[i],prof.party[j]]=[prof.party[j],prof.party[i]]; }
    else{ prof.party[prof.party.indexOf(occ)]=uid; prof.rows[uid]=row; }
  }else{
    if(inP){ if(rowOf(uid)===row) return; prof.rows[uid]=row; }
    else{ if(prof.party.length>=4) return; prof.party.push(uid); prof.rows[uid]=row; }
  }
  fixRows(); saveProf(); partyDirty=true;
}
/* the formation tip plays one drag by itself: a front-row hero slides onto a back-row hero and they swap */
function dragDemo(done){
  const fs=[...document.querySelectorAll('#formation .fslot[data-id]')], a=fs.find(x=>x.dataset.row==='F'), b=fs.find(x=>x.dataset.row==='B'), c=a&&charById(a.dataset.id);
  if(!a||!b||!c){ done(); return; }
  const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect(), g=document.createElement('div');
  g.className='dragghost'; g.innerHTML=`<img ${spr(c.job,c.look)} alt="">${c.name}<span class="demo-hand">👆</span>`;
  g.style.left=ra.left+ra.width/2+'px'; g.style.top=ra.top+ra.height/2+'px'; document.body.appendChild(g); a.classList.add('dragging');
  setTimeout(()=>{ g.style.transition='left .9s ease-in-out,top .9s ease-in-out'; g.style.left=rb.left+rb.width/2+'px'; g.style.top=rb.top+rb.height/2+'px'; b.classList.add('over'); },500);
  setTimeout(()=>{ g.remove(); placeAt(a.dataset.id,'B',b.dataset.id); renderCharacters(); },1650);
  setTimeout(done,2400);
}
let drag=null, dragDone=0;
function dropAt(uid,over){
  if(!over) return;
  if(over.classList.contains('fslot')){ const occ=over.dataset.id||null; if(occ!==uid) placeAt(uid,over.dataset.row,occ); detailHero=uid; renderCharacters(); return; }
  if(!prof.party.includes(uid)) return;
  if(prof.party.length<=1){ alertLine('최소 1명은 출전해야 해요'); return; }
  prof.party=prof.party.filter(x=>x!==uid); fixRows(); saveProf(); partyDirty=true; renderCharacters();
}
function dragOver(x,y){ const t=document.elementFromPoint(x,y); return t&&(t.closest('#formation .fslot')||t.closest('#benchCard')); }
function dragStop(e,drop){
  const d=drag; drag=null; if(!d||!d.on) return;
  d.ghost.remove(); d.src.classList.remove('dragging'); if(d.over) d.over.classList.remove('over');
  dragDone=Date.now(); if(drop) dropAt(d.uid,dragOver(e.clientX,e.clientY));
}
['#formation','#roster'].forEach(id=>$(id).addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-id]'); if(!b||e.button>0) return;
  if(e.pointerType==='mouse') e.preventDefault();
  drag={uid:b.dataset.id,src:b,x:e.clientX,y:e.clientY,on:false,ghost:null,over:null};
}));
document.addEventListener('pointermove',e=>{
  if(!drag) return;
  if(!drag.on){
    if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8) return;
    const c=charById(drag.uid); if(!c){ drag=null; return; }
    drag.on=true; drag.src.classList.add('dragging');
    const g=drag.ghost=document.createElement('div'); g.className='dragghost'; g.innerHTML=`<img ${spr(c.job,c.look)} alt="">${c.name}`; document.body.appendChild(g);
  }
  drag.ghost.style.left=e.clientX+'px'; drag.ghost.style.top=e.clientY+'px';
  const over=dragOver(e.clientX,e.clientY);
  if(over!==drag.over){ if(drag.over) drag.over.classList.remove('over'); drag.over=over; if(over) over.classList.add('over'); }
});
document.addEventListener('pointerup',e=>dragStop(e,true));
document.addEventListener('pointercancel',e=>dragStop(e,false));
['#formation','#roster'].forEach(id=>$(id).addEventListener('click',e=>{
  const b=e.target.closest('[data-id]'); if(!b||Date.now()-dragDone<300) return;
  detailHero=b.dataset.id; gearOpen=null; renderCharacters();
}));

