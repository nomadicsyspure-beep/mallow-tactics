/* ---------- guided start: from the first hero until the companions are recruited, only the next step can be
   tapped and everything else is dimmed. Scripted battle steps (forceSk) use the same layer later on ---------- */
function guideOn(){ return !prof.guideDone||!!forceSk||jobTutOn(); }
/* first job-ready notice: walk the player through one job change; losing stage 7 with a Lv5 wanderer left does it once more */
function jobTutOn(){ return !!prof.jobTut&&!prof.jobTutDone; }
function jobReadyChars(){ return prof.party.map(charById).filter(c=>c&&c.job==='wanderer'&&c.lvl>=JOB_LVL); }
/* screens get a moment to be seen before the next point lights up */
let resultAt=0, charsAt=0;
const SHOW_RESULT_MS=1700, SHOW_CHARS_MS=1300;
/* {dim: the lit targets, the only things that can be tapped} for the current state, or null when free */
function guideSel(){
  if(!guideOn()) return null;
  if(coachCur) return coachCur.fn?{dim:[]}:null;
  const vis=id=>!$(id).hidden, wait=(t,ms)=>Date.now()-t<ms;
  /* settings (and the log opened from it) work freely */
  if(vis('#settingsModal')||vis('#logModal')) return null;
  if(vis('#makeModal')) return {dim:['#makeModal .modal-inner']};
  if(vis('#introModal')) return {dim:[jobTutOn()?'#introModal .modal-inner':'#introClose']};
  if(vis('#resultModal')) return {dim:wait(resultAt,SHOW_RESULT_MS)?[]:['#retryNew']};
  if(jobTutOn()&&!forceSk){
    if(!vis('#screen-characters')) return {dim:['[data-screen="characters"]']};
    const c=charById(detailHero);
    return {dim:c&&c.job==='wanderer'&&c.lvl>=JOB_LVL?['#dJob']:jobReadyChars().map(x=>`#formation .fslot[data-id="${x.uid}"]`)};
  }
  if(!forceSk){
    if(vis('#screen-characters')){
      if(wait(charsAt,SHOW_CHARS_MS)) return {dim:[]};
      if(prof.party.length<4) return {dim:['#recruitBtn']};
      /* party full and the formation explained: straight on to the battle tab and stage 3 */
      if(prof.tips.formB){ goto('battle'); coach('go3','#startBtn',`${RECRUIT_STAGE+1}스테이지로 출발!`,'battle',true); return null; }
      return {dim:[]};
    }
    if(!vis('#screen-battle')) return {dim:['[data-screen="battle"]']};
    if(vis('#prep')) return {dim:[needRecruit()?'[data-screen="characters"]':'#startBtn']};
    if(preFight) return {dim:['#fightBtn']};
  }
  if(!battle||battle.over) return {dim:[]};
  if(waitChoice){
    const i=waitHero, f=forceSk&&forceSk.i===i?forceSk.k:null;
    if(f!=null&&skPick!==f) return {dim:[`#mSkills .sk[data-k="${f}"]`]};
    if(skPick==null||skTab!==i) return {dim:['#mSkills']};
    if(tgtPick!=null) return {dim:['#skPop',...(battle.boss.hp>0?['#bossAvatar']:[]),...(f!=null?[]:['#mobs .mob.tgtable'])]};
    return {dim:['#skPop']};
  }
  return {dim:[]};
}
function guideOk(t){
  const g=guideSel(); if(!g||!t.closest) return true;
  if(t.closest('#spot')) return true;
  /* nothing dimmed right now: the ☰ settings button can be opened */
  if(!g.dim.length&&!coachCur&&t.closest('#menuBtn')) return true;
  return g.dim.some(sel=>[...document.querySelectorAll(sel)].some(el=>el.contains(t)));
}
['pointerdown','click'].forEach(ev=>document.addEventListener(ev,e=>{ if(!guideOk(e.target)){ e.stopImmediatePropagation(); e.preventDefault(); } },true));
let guideKey='', guideSels='';
function drawGuide(){
  const g=guideSel(), el=$('#guide'); document.body.classList.toggle('guiding',guideOn());
  const sk=g?g.dim.join():''; if(sk!==guideSels){ guideSels=sk; const t=g&&g.dim.length===1&&document.querySelector(g.dim[0]); if(t) scrollToSee(t); }
  const rs=g?g.dim.flatMap(sel=>[...document.querySelectorAll(sel)]).map(x=>x.getBoundingClientRect()).filter(r=>r.width&&r.height):[];
  if(!rs.length){ el.hidden=true; guideKey=''; return; }
  const p=5, holes=rs.map(r=>`<rect x="${Math.round(r.left-p)}" y="${Math.round(r.top-p)}" width="${Math.round(r.width+p*2)}" height="${Math.round(r.height+p*2)}" rx="12"/>`).join(''), key=holes+innerWidth+'x'+innerHeight;
  el.hidden=false; if(key===guideKey) return; guideKey=key;
  el.innerHTML=`<svg width="${innerWidth}" height="${innerHeight}"><defs><mask id="guideMask"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${holes}</g></mask></defs><rect width="100%" height="100%" fill="#02040abf" mask="url(#guideMask)"/><g class="gring">${holes}</g></svg>`;
}
setInterval(drawGuide,120);

