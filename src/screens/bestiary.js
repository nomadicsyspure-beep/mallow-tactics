/* ---------- boss guide ---------- */
const MOVE_SHORT={swipe:'🐙 공격',gaze:'👁️ 응시',wave:'🌊 광역',charge:'💥 돌진',shell:'🐚 껍질',br:'❓ 광역 또는 돌진'};
function renderBestiary(){
  const seen=maxStage();
  $('#bestiary').innerHTML=STAGES.slice(0,Math.min(seen,7)).map((S,i)=>`<div class="card">
    <div class="section-title"><span>${S.ic} ${i+1}. ${S.boss}</span><span>HP ${S.hp} · ${spdWord(S.spd)}</span></div>
    <div class="cycle">${S.cycle.map(m=>`<span class="qchip">${MOVE_SHORT[m]}</span>`).join('<span class="arrow">→</span>')}</div>
    ${S.p2?`<div class="section-title" style="margin-top:8px"><span>HP 50% 이하 각성</span></div><div class="cycle">${S.p2.map(m=>`<span class="qchip">${MOVE_SHORT[m]}</span>`).join('<span class="arrow">→</span>')}</div>`:''}
    ${S.mobs?`<div class="section-title" style="margin-top:8px"><span>졸개</span></div><div class="cycle">${S.mobs.map(m=>`<span class="qchip">${m.ic} ${m.name} · HP ${m.hp} · ${{poke:'공격 '+m.pw,heal:'보스 회복 '+m.pw,buff:'보스 공격 강화'}[m.kind]}</span>`).join('')}</div>`:''}</div>`).join('');
}

