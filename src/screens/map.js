function renderPrep(){
  const st=prof.stage, maxSt=maxStage(), S=STAGES[st-1];
  $('#mapProg').textContent=`${Object.keys(prof.cleared).filter(k=>prof.cleared[k]).length} / ${STAGES.length}`;
  $('#mapList').innerHTML=STAGES.map((x,i)=>{ const n=i+1, open=n<=maxSt, tut='';
    return `<button class="node ${n===st?'sel':''}" data-st="${n}"${open?'':whyAttr('앞 스테이지를 깨면 열려요')}><span class="nic">${open?x.ic:'🔒'}</span><span><b>${n}. ${x.name}${n>=DROP_FROM?'<i class="drop" aria-label="장비가 나와요">🎁</i>':''}</b><small>${open?x.boss+tut:''}</small></span><span class="nst">${prof.cleared[n]?'✓':''}</span></button>`; }).join('');
  const sel=$('#mapList .node.sel'); if(sel) sel.scrollIntoView({block:'nearest'});
  $('#partyLine').innerHTML=battle.heroes.map(h=>{ const c=charById(h.uid); return `<span><img class="thumb" ${spr(h.id,h.look)} alt="${h.name}"><i>Lv${c?c.lvl:1}</i></span>`; }).join('');
  const r=rewardFor(st,cfg.muts.length,true);
  $('#rewardInfo').innerHTML=`보상 🪙 <b>${r.gold}</b> · EXP <b>${r.exp}</b>`;
  $('#toRoster').hidden=!tabOpen('characters');
  const nr=needRecruit(), sb=$('#startBtn'); sb.textContent=nr?`👥 동료 4명 필요 (${prof.party.length}/4)`:'▶ 전투 시작';
  setWhy(sb,nr?(prof.chars.length<4?'캐릭터 탭에서 동료를 데려와 4명을 채워요 (무료)':'캐릭터 탭에서 4명을 출전시켜요'):'');
}
$('#mapList').onclick=e=>{ const b=e.target.closest('[data-st]'); if(!b||b.getAttribute('aria-disabled')) return; prof.stage=+b.dataset.st; saveProf(); setupBattle(); renderPrep(); };
$('#toRoster').onclick=()=>goto('characters');
$('#startBtn').onclick=()=>{ if(needRecruit()) return; if(!prof.guideDone&&prof.stage>RECRUIT_STAGE){ prof.guideDone=true; saveProf(); } enterBattle(); };

