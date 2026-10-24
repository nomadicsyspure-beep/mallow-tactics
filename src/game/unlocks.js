/* the strategy, bag and boss tabs open once stage TABS_STAGE is cleared, just before gear starts to drop */
const TUTORIAL_END=5, JOB_TUT_STAGE=7, TABS_STAGE=7;
function tabsOpen(){ return !!prof.cleared[TABS_STAGE]; }
/* the characters tab opens one stage early (after RECRUIT_STAGE) so companions are brought in before stage 4 */
const RECRUIT_STAGE=2;
function tabOpen(id){ return id==='battle'||(id==='characters'?!!prof.cleared[RECRUIT_STAGE]:tabsOpen()); }
function tabLockWhy(id){ return `🔒 ${id==='characters'?RECRUIT_STAGE:TABS_STAGE}스테이지를 깨면 열려요`; }
/* the stage after RECRUIT_STAGE is the first party fight: its first try needs a full party of 4 */
function needRecruit(){ return prof.stage===RECRUIT_STAGE+1&&!prof.cleared[RECRUIT_STAGE+1]&&prof.party.length<4; }
/* before BG_STAGE a started battle keeps the player on the battle tab until it ends */
function fightLock(id){ return id!=='battle'&&!!battle&&battle.stage<BG_STAGE&&!preFight&&$('#prep').hidden&&inBattle(); }
function renderNav(){ document.querySelectorAll('[data-screen]').forEach(b=>b.classList.toggle('locked',!tabOpen(b.dataset.screen)||fightLock(b.dataset.screen))); }
/* disabled buttons say why: aria-disabled keeps them tappable, and a tap shows the reason instead of acting */
function setWhy(b,why){ b.disabled=false; if(why){ b.setAttribute('aria-disabled','true'); b.dataset.why=why; } else { b.removeAttribute('aria-disabled'); delete b.dataset.why; } }
const whyAttr=w=>w?` aria-disabled="true" data-why="${w}"`:'';
/* stay=true (enemy/ally info): the bubble stays until the next tap instead of fading after 2 seconds */
function whyTip(b,stay){
  const t=$('#whyTip'), r=b.getBoundingClientRect(); t.textContent=b.dataset.why; t.hidden=false;
  const w=t.offsetWidth, h=t.offsetHeight;
  t.style.left=Math.min(innerWidth-w/2-8,Math.max(w/2+8,r.left+r.width/2))+'px';
  t.style.top=(r.top-6>=h+6?r.top-6:r.bottom+6+h)+'px';
  clearTimeout(whyTip.t); whyTip.stay=!!stay; whyTip.el=b;
  if(!stay) whyTip.t=setTimeout(()=>{ t.hidden=true; },2200);
}
/* any tap closes a staying bubble; tapping the same thing again only closes it */
addEventListener('pointerdown',e=>{ const t=$('#whyTip'); if(!whyTip.stay||t.hidden) return; t.hidden=true; whyTip.stay=false; if(whyTip.el&&whyTip.el.contains(e.target)) whyTip.skip=Date.now(); },true);
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[aria-disabled="true"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault(); if(b.dataset.why) whyTip(b); },true);
