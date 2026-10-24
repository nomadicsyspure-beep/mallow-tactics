/* ---------- strategy (patterns) ---------- */
function renderStrategy(){
  const order=[...prof.party,...prof.chars.map(c=>c.uid).filter(u=>!prof.party.includes(u))];
  if(!order.includes(editing)) editing=order[0];
  const c=charById(editing), hd=HERO_DB[c.job], list=rules[c.uid];
  $('#tabs').innerHTML=order.map(u=>{ const x=charById(u); return `<button class="tab ${prof.party.includes(u)?'party':''}" data-edit="${u}" aria-pressed="${u===editing}"><img class="thumb" ${spr(x.job,x.look)} alt="">${x.name}<small>${HERO_DB[x.job].name}${prof.party.includes(u)?'':' · 대기'}</small></button>`; }).join('');
  const opts=[hd.basic,...c.equip];
  const fi=lastFired?lastFired.party.indexOf(editing):-1, f=fi>=0?lastFired.fired[fi]:null;
  $('#ruleRows').innerHTML=list.map(([cd,sid],r)=>{ const o=opts.includes(sid)?opts:[...opts,sid];
    return `<div class="rule-row">
    <span class="prio">${r+1}</span>
    <label class="sr" for="c${r}">${r+1}순위 조건</label>
    <select id="c${r}" data-r="${r}" data-t="c">${CONDS.map(x=>`<option value="${x.id}"${x.id===cd?' selected':''}>${x.label}</option>`).join('')}</select>
    <label class="sr" for="s${r}">${r+1}순위 스킬</label>
    <select id="s${r}" data-r="${r}" data-t="s">${o.map(id=>{ const s=SKILLS[id]; return `<option value="${id}"${id===sid?' selected':''}>${s.pic} ${s.n}${opts.includes(id)?(s.cost?' · SP '+s.cost:''):' (미장착)'}</option>`; }).join('')}</select>
    <div class="mv"><button data-mv="-1" data-r="${r}" aria-label="${r+1}순위 위로"${whyAttr(r===0?'이미 1순위예요':'')}>▲</button><button data-mv="1" data-r="${r}" aria-label="${r+1}순위 아래로"${whyAttr(r===list.length-1?'이미 맨 아래예요':'')}>▼</button></div>
    ${f?`<span></span><div class="fired">지난 전투 ${f[r]?`<b>${f[r]}회 발동</b>`:'발동 안 함'}</div>`:''}
  </div>`; }).join('');
  $('#ruleNote').hidden=!f; if(f) $('#ruleNote').textContent=`지난 전투 기본 공격 ${f[RULE_SLOTS]}회`;
  $('#tgtRow').innerHTML=`<span>공격 대상</span><div class="seg2"><button data-tgt="mob" aria-pressed="${targets[editing]!=='boss'}">졸개 먼저</button><button data-tgt="boss" aria-pressed="${targets[editing]==='boss'}">보스 먼저</button></div>`;
  $('#heroSpd').textContent=hd.name;
  $('#skillTips').innerHTML=opts.map(id=>skillLine(id,id===hd.basic?'기본기 · ':'')).join('')+(c.learned.filter(id=>!c.equip.includes(id)).length?`<p class="sub" style="margin:6px 0 0">배웠지만 장착하지 않은 스킬: ${c.learned.filter(id=>!c.equip.includes(id)).map(id=>SKILLS[id].n).join(', ')}</p>`:'');
  $('#defaultBtn').textContent=defArmed?'정말 되돌리기':'기본값으로';
}
$('#tabs').onclick=e=>{ const b=e.target.closest('[data-edit]'); if(!b) return; editing=b.dataset.edit; defArmed=false; renderStrategy(); };
$('#ruleRows').onchange=e=>{
  const s=e.target.closest('select'); if(!s) return; const r=+s.dataset.r;
  rules[editing][r][s.dataset.t==='c'?0:1]=s.value;
  saveRules(); partyDirty=true;
};
$('#tgtRow').onclick=e=>{ const b=e.target.closest('[data-tgt]'); if(!b) return; targets[editing]=b.dataset.tgt; saveRules(); partyDirty=true; renderStrategy(); };
$('#ruleRows').onclick=e=>{
  const b=e.target.closest('[data-mv]'); if(!b) return;
  const r=+b.dataset.r, to=r+(+b.dataset.mv), a=rules[editing]; if(to<0||to>=a.length) return;
  [a[r],a[to]]=[a[to],a[r]];
  const fi=lastFired?lastFired.party.indexOf(editing):-1; if(fi>=0){ const f=lastFired.fired[fi]; [f[r],f[to]]=[f[to],f[r]]; }
  saveRules(); partyDirty=true; renderStrategy();
};
$('#defaultBtn').onclick=()=>{ if(!defArmed){ defArmed=true; renderStrategy(); return; } rules[editing]=cloneRules(DEFAULT_RULES[charById(editing).job]); defArmed=false; saveRules(); partyDirty=true; renderStrategy(); };

