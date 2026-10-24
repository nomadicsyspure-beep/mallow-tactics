/* ---------- battle log ---------- */
function renderLog(){
  const cur=battle&&battle.actions>0, last=load(LOG_KEY);
  const src=cur?{cap:`현재 전투 · ${STAGES[battle.stage-1].name} · 보스 ${battle.round}턴${battle.over?(battle.over==='win'?' · 승리':' · 패배'):' 진행 중'}`,sum:sumList,text:$('#logStore').innerHTML}:last?{cap:'지난 전투 · '+last.cap,sum:last.sum||[],text:last.text||''}:null;
  if(!src){ $('#logCap').textContent=''; $('#logSum').innerHTML='<div class="pempty">아직 기록이 없어요. 전투가 끝나도 여기서 다시 볼 수 있어요.</div>'; $('#logText').innerHTML=''; return; }
  $('#logCap').textContent=src.cap;
  $('#logSum').innerHTML=src.sum.length?src.sum.map(x=>`<div class="sumrow"><span class="r">B${String(x.r).padStart(2,'0')}</span><span>${x.ic}</span><span>${x.txt}</span><span class="v v-${x.c||'mid'}">${x.v}</span></div>`).join(''):'<div class="pempty">보스 턴이 지나면 응시·강공격 대응 결과가 쌓여요.</div>';
  $('#logText').innerHTML=src.text||'<div class="pempty">기록이 없어요.</div>';
}
function openLog(){ $('#logModal').hidden=false; renderLog(); ['#logSum','#logText'].forEach(id=>{ const b=$(id); b.scrollTop=b.scrollHeight; }); }
/* an open log follows the battle live; it stays at the bottom unless the player scrolled up to read */
function liveLog(){
  if($('#logModal').hidden||liveLog.q) return;
  liveLog.q=requestAnimationFrame(()=>{ liveLog.q=0; if($('#logModal').hidden) return;
    const bs=[$('#logSum'),$('#logText')], end=bs.map(b=>b.scrollHeight-b.scrollTop-b.clientHeight<40);
    renderLog(); bs.forEach((b,i)=>{ if(end[i]) b.scrollTop=b.scrollHeight; }); });
}
document.querySelector('.log-tabs').onclick=e=>{
  const b=e.target.closest('[data-ltab]'); if(!b) return; ltab=b.dataset.ltab;
  document.querySelectorAll('[data-ltab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  $('#logSum').hidden=ltab!=='sum'; $('#logText').hidden=ltab!=='text';
  const v=$(ltab==='sum'?'#logSum':'#logText'); v.scrollTop=v.scrollHeight;
};
$('#resultLog').onclick=openLog; $('#setLog').onclick=()=>{ $('#settingsModal').hidden=true; openLog(); };
$('#logClose').onclick=()=>{ $('#logModal').hidden=true; };

