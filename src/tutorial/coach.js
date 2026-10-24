/* tutorial spotlight: each tip shows once per profile. Everything but the named element is dimmed and
   a tap anywhere moves on; the battle waits while a tip is open. A tip only starts while its own screen is showing. */
let coachQ=[], coachCur=null;
/* press=true: the tip points at something to press, and tapping the lit spot presses it right away (taps elsewhere do nothing) */
/* bright=true: nothing is dimmed, the spot is only ringed (the screen itself is the point).
   hold=ms: after the press, wait at least that long and until the info bubble it opened is closed */
function coach(kind,sel,text,screen='battle',press=false,bright=false,hold=0){
  if(prof.tips[kind]||$('#screen-'+screen).hidden) return;
  prof.tips[kind]=true; saveProf();
  coachQ.push({sel,text,press,bright,hold}); if(!coachCur) nextCoach();
}
/* a scripted demo in the tip queue: fn(done) runs with taps blocked, the next tip follows when it calls done */
function coachDo(kind,fn,screen){
  if(prof.tips[kind]||$('#screen-'+screen).hidden) return;
  prof.tips[kind]=true; saveProf();
  coachQ.push({fn}); if(!coachCur) nextCoach();
}
/* a tab button the tip points at sparkles */
let glowEl=null;
function glow(el){ if(glowEl&&glowEl!==el) glowEl.classList.remove('spotGlow'); glowEl=el&&el.matches('[data-screen]')?el:null; if(glowEl) glowEl.classList.add('spotGlow'); }
function nextCoach(){
  glow(null);
  const c=coachCur=coachQ.shift()||null;
  if(c&&c.fn){ $('#spot').hidden=true; c.fn(()=>{ if(coachCur===c) nextCoach(); }); return; }
  $('#spot').hidden=!c; if(c) placeSpot();
}
function placeSpot(){
  if(!coachCur||coachCur.fn) return;
  const ph=$('.phone').getBoundingClientRect(), hole=$('#spotHole'), msg=$('#spotMsg'), el=coachCur.sel&&document.querySelector(coachCur.sel);
  if(el&&el.closest('#mapList')) el.scrollIntoView({block:'nearest'});
  else if(el) scrollToSee(el);
  const r=el&&el.getBoundingClientRect(); glow(el);
  /* tips on a pop-up window sit above it */
  $('#spot').classList.toggle('top',!!(el&&el.closest('.modal'))); $('#spot').classList.toggle('bright',!!coachCur.bright);
  msg.innerHTML=coachCur.text.replace(/\n/g,'<br>'); retrigger(msg,'show');
  $('#spot .spot-tap').textContent=coachCur.press?'빛나는 곳을 눌러요':'화면을 터치하면 넘어가요';
  const on=!!(r&&r.width); hole.hidden=!on; $('#spot').classList.toggle('full',!on);
  if(!on){ msg.style.top='38%'; msg.style.bottom=''; return; }
  $('#spot').classList.toggle('tapTop',r.bottom>ph.bottom-90);
  const pad=6; Object.assign(hole.style,{left:r.left-ph.left-pad+'px',top:r.top-ph.top-pad+'px',width:r.width+pad*2+'px',height:r.height+pad*2+'px'});
  const extra=el.querySelector('.sp-float')?38:0;
  if(r.top-ph.top>ph.bottom-r.bottom){ msg.style.top=''; msg.style.bottom=(ph.bottom-r.top+pad+16+extra)+'px'; }
  else{ msg.style.bottom=''; msg.style.top=(r.bottom-ph.top+pad+16)+'px'; }
}
function coachBlocking(){ return !!coachCur; }
function clearCoach(){ coachQ=[]; coachCur=null; $('#spot').hidden=true; glow(null); }
/* a target below or above the visible part of a screen is scrolled to the middle first */
function scrollToSee(el){ const r=el.getBoundingClientRect(); if(r.width&&(r.bottom>innerHeight-70||r.top<50)&&el.closest('.screen,.modal-inner')) el.scrollIntoView({block:'center'}); }
$('#spot').onclick=e=>{
  const c=coachCur; if(!c||!c.press){ nextCoach(); return; }
  const el=c.sel&&document.querySelector(c.sel), r=el&&el.getBoundingClientRect();
  if(!r||!r.width){ nextCoach(); return; }
  if(e.clientX<r.left-6||e.clientX>r.right+6||e.clientY<r.top-6||e.clientY>r.bottom+6) return;
  if(c.hold){ const w={fn:1}, t0=Date.now(); coachCur=w; $('#spot').hidden=true; glow(null); el.click();
    const wait=()=>{ if(coachCur!==w) return; if(!$('#whyTip').hidden&&Date.now()-t0<60000) setTimeout(wait,150); else nextCoach(); }; setTimeout(wait,c.hold); return; }
  nextCoach(); el.click();
};
addEventListener('resize',placeSpot);
