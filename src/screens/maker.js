/* ---------- character maker: the first hero, and every companion bought later ---------- */
let mk=null;
function openMaker(first){
  const sex=Math.random()<.5?'m':'f';
  mk={first,look:{sex,hair:Math.floor(Math.random()*HAIRS.length),skin:Math.floor(Math.random()*SKINS.length)}};
  $('#makeTitle').textContent=first?'내 캐릭터 만들기':'새 동료 데려오기';
  $('#mkName').value=''; $('#mkName').placeholder='닉네임 입력';
  $('#mkCancel').hidden=first; renderMaker(); $('#makeModal').hidden=false;
  /* the first companion: what to set, one part at a time */
  if(!first&&prof.chars.length===1) setTimeout(()=>{ if($('#makeModal').hidden) return;
    coach('mkSex','#makeModal .mk-row:has(#mkSex)','성별을 고르고,','characters');
    coach('mkHair','#makeModal .mk-row:has(#mkHair)','헤어를 고르고,','characters');
    coach('mkSkin','#makeModal .mk-row:has(#mkSkin)','피부를 설정한 다음','characters');
    coach('mkName','#mkName','닉네임을 입력하면 돼요!','characters');
  },450); /* after the window's pop-in, so the spot lands on the right place */
}
function renderMaker(){
  const L=mk.look, cost=recruitCost();
  $('#mkPrev').innerHTML=`<img ${spr('wanderer',L)} alt="미리보기">`;
  $('#mkSex').innerHTML=[['m','남'],['f','여']].map(([v,n])=>`<button data-sex="${v}" aria-pressed="${L.sex===v}">${n}</button>`).join('');
  $('#mkHair').innerHTML=HAIRS.map((h,i)=>`<button class="sw" data-hair="${i}" aria-pressed="${L.hair===i}" aria-label="${h.n}" style="background:${swatch(h,.5)}"></button>`).join('');
  $('#mkSkin').innerHTML=SKINS.map((h,i)=>`<button class="sw" data-skin="${i}" aria-pressed="${L.skin===i}" aria-label="${h.n}" style="background:${swatch(h,.95)}"></button>`).join('');
  const ok=$('#mkOk'); ok.textContent=mk.first?'▶ 모험 시작':cost?`🪙${cost} 데려오기`:'데려오기 · 무료'; setWhy(ok,!$('#mkName').value.trim()?'닉네임을 설정하세요.':!mk.first&&prof.gold<cost?`🪙 골드가 모자라요 (${cost} 필요)`:'');
}
$('#makeModal').addEventListener('click',e=>{
  const b=e.target.closest('[data-sex],[data-hair],[data-skin]'); if(!b||!mk) return;
  if(b.dataset.sex) mk.look.sex=b.dataset.sex;
  if(b.dataset.hair) mk.look.hair=+b.dataset.hair; if(b.dataset.skin) mk.look.skin=+b.dataset.skin;
  renderMaker();
});
$('#mkName').addEventListener('input',()=>{ if(mk) renderMaker(); });
$('#mkCancel').onclick=()=>{ $('#makeModal').hidden=true; mk=null; };
$('#mkOk').onclick=()=>{
  if(!mk) return; const cost=mk.first?0:recruitCost(); if(prof.gold<cost) return;
  const name=$('#mkName').value.trim().slice(0,6); if(!name) return;
  const c=makeChar('c'+(prof.nextUid++),name,{...mk.look});
  /* the free companions that fill the first party join at its lowest level so stage 3 isn't a grind; later ones start at Lv1 */
  if(!mk.first&&!cost) c.lvl=Math.max(1,Math.min(...prof.chars.map(x=>x.lvl)));
  prof.gold-=cost; prof.chars.push(c); ensureChar(c); saveRules();
  if(prof.party.length<4){ const f=prof.party.filter(u=>rowOf(u)==='F').length; prof.rows[c.uid]=f>prof.party.length-f?'B':'F'; prof.party.push(c.uid); fixRows(); partyDirty=true; }
  saveProf(); $('#makeModal').hidden=true;
  const first=mk.first; mk=null;
  if(first){ editing=detailHero=c.uid; setupBattle(); openPrep(); firstTips(); }
  else{ detailHero=c.uid; if(!prof.party.includes(c.uid)) charTab='bench'; toast(`🎉 ${c.name} 합류!`); if(!$('#screen-characters').hidden) renderCharacters(); if(!$('#prep').hidden&&!$('#screen-battle').hidden){ partyDirty=false; setupBattle(cfg.muts); renderPrep(); } }
};
$('#recruitBtn').onclick=()=>{ if(prof.chars.length<MAX_CHARS&&prof.gold>=recruitCost()) openMaker(false); };
