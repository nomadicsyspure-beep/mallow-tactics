/* ---------- inventory ---------- */
function renderInventory(){
  $('#iGold').textContent=prof.gold;
  $('#itemCount').textContent=`${prof.items.length}개`;
  const who=it=>prof.chars.find(h=>h.gear[it.slot]===it.id);
  const list=prof.items.slice().sort((a,b)=>b.tier-a.tier||a.slot.localeCompare(b.slot));
  $('#itemList').innerHTML=list.length?list.map(it=>{ const w=who(it);
    return `<div class="item r${it.tier}"><span class="ii">${SLOT[it.slot].ic}</span><span class="it"><b class="tier${it.tier}">${itemName(it)}</b><small>${itemStat(it)}${w?` · ${w.name} 착용 중`:''}</small></span>${w?'':`<button class="outlinebtn" data-sell="${it.id}">🪙${it.tier*25} 판매</button>`}</div>`; }).join(''):'<div class="pempty">아직 장비가 없어요. 보스를 잡거나 반복 전투를 돌려 보세요.</div>';
}
$('#itemList').onclick=e=>{ const b=e.target.closest('[data-sell]'); if(!b) return; const id=+b.dataset.sell, it=itemById(id); if(!it) return; prof.gold+=it.tier*25; prof.items=prof.items.filter(x=>x.id!==id); saveProf(); renderInventory(); };

