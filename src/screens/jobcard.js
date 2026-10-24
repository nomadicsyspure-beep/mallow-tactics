/* ---------- intro cards: job change ---------- */
function skillLine(id,extra){ const s=SKILLS[id]; return `<div><dt class="t-${s.ty}">${s.pic} ${s.n}<small>${extra||''}${s.cost?'SP '+s.cost:'SP 0'}${s.cd?` · 쿨 ${s.cd}`:''}</small></dt><dd>${s.tip}</dd></div>`; }
function jobCard(job,c){
  const hd=HERO_DB[job], lv=c?c.lvl:1, hp=Math.round(hd.hp*(1+.06*(lv-1)));
  return `<div class="intro"><img class="intro-spr" ${spr(job,c&&c.look)} alt=""><div><b>${c?c.name+' · ':''}${hd.name}</b><small>${hd.role} · 체력 ${hp} · 속도 ${spdWord(hd.spd)}</small><p>${hd.trait}</p></div></div>
    <div class="jsk-row">${[hd.basic,...hd.skills].map(id=>`<button class="jsk t-${SKILLS[id].ty}" data-jsk="${id}" aria-label="${SKILLS[id].n}">${SKILLS[id].pic}</button>`).join('')}</div>
    <div class="jsk-desc" id="jskDesc">👆 스킬을 눌러 설명을 봐요</div>
    <div class="hint" style="margin-top:10px">💡 ${hd.tip}</div>`;
}
function jobReadyCard(cs){ return `<div class="intro"><img class="intro-spr" ${spr('wanderer',cs[0].look)} alt=""><div><b>Lv${JOB_LVL}부터 전직할 수 있어요!</b><p>캐릭터 탭에서 <b>전직하기</b>를 눌러보세요!</p><p>꼭 모두 전직할 필요는 없어요. 동료는 언제든 새로 데려올 수 있으니 여러 직업을 키워 보며 특성을 알아 가는 걸 추천해요!</p></div></div>`; }
let introQueue=[];
function openIntro(title,body){ $('#introTitle').textContent=title; $('#introBody').innerHTML=body; $('#introModal').hidden=false; $('#introClose').hidden=false; $('#introClose').focus(); }
function nextIntro(){ const it=introQueue.shift(); if(it) openIntro(it.title,it.body); }
function resetIntroBtn(){ $('#introClose').textContent='확인'; $('#introClose').className='mainbtn'; }
$('#introClose').onclick=()=>{
  resetIntroBtn();
  if(introQueue.length){ nextIntro(); return; }
  $('#introModal').hidden=true;
};
/* job change picker lives in the intro modal */
function openJobPicker(c,picked){
  const list=JOB_IDS.map(j=>{ const hd=HERO_DB[j]; return `<button class="jobpick ${picked===j?'sel':''}" data-job="${j}"><img class="thumb" ${spr(j,c.look)} alt=""><span><b>${hd.name}</b><small>${hd.role}</small></span></button>`; }).join('');
  openIntro(`${c.name}의 전직`,`<div class="jobgrid">${list}</div>${picked?jobCard(picked,c)+`<div class="btnrow"><button class="mainbtn" id="jobConfirm">${HERO_DB[picked].name}(으)로 전직</button></div>`:''}`);
  $('#introClose').textContent='닫기'; $('#introClose').className='outlinebtn';
  document.querySelectorAll('.jobpick').forEach(b=>b.onclick=()=>openJobPicker(c,b.dataset.job));
  /* skills are read one by one; in the guided job change every one is opened before the change */
  const seen=new Set(), all=picked?[HERO_DB[picked].basic,...HERO_DB[picked].skills]:[];
  document.querySelectorAll('.jsk').forEach(b=>b.onclick=()=>{
    const id=b.dataset.jsk, s=SKILLS[id], hd=HERO_DB[picked]; seen.add(id);
    document.querySelectorAll('.jsk').forEach(x=>x.classList.toggle('on',x===b));
    $('#jskDesc').innerHTML=`<b class="t-${s.ty}">${s.pic} ${s.n}</b><small>${id===hd.basic?'기본기':`Lv${s.lv}`} · ${s.cost?'SP '+s.cost:'SP 0'}${s.cd?` · 쿨타임 ${s.cd}턴`:''}</small><p>${s.tip}</p>`;
    const ok=$('#jobConfirm'); if(ok&&all.every(x=>seen.has(x))) setWhy(ok,'');
  });
  if(picked&&jobTutOn()){ setWhy($('#jobConfirm'),'스킬을 하나씩 눌러 확인해요'); setTimeout(()=>coach('jobSk'+jobR(),'.jsk-row','스킬을 하나씩 눌러\n설명을 확인해요.','characters'),120); }
  const ok=$('#jobConfirm'); if(ok) ok.onclick=()=>{ changeJob(c,picked); if(jobTutOn()){ prof.jobTutDone=true; saveProf(); } $('#introModal').hidden=true; resetIntroBtn(); renderCharacters(); toast(`${c.name}: ${HERO_DB[picked].name}(으)로 전직!`); };
}
function changeJob(c,job){
  const hd=HERO_DB[job], first=hd.skills[0];
  c.job=job;
  if(!c.learned.includes(first)) c.learned.push(first);
  if(c.equip.length<EQUIP_SLOTS) c.equip.push(first); else c.equip[EQUIP_SLOTS-1]=first;
  rules[c.uid]=cloneRules(DEFAULT_RULES[job]); saveRules(); saveProf(); partyDirty=true;
}

