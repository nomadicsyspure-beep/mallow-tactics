function has(b,m){ return b.muts.includes(m); }
function rng(b){ b.seed=(b.seed+0x6D2B79F5)|0; let t=b.seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }
function cycle(b){ const D=b.def; if(b.boss.p2&&D.p2) return D.p2.slice(); if(D.gk&&has(b,'fickle')) return ['swipe','gaze','br']; return D.cycle.slice(); }
function fill(b){ if(!b.boss.queue.length) b.boss.queue=cycle(b); }
function intent(b){ if(b.boss.hp<=0) return null; fill(b); return b.boss.queue[0]; }
const isBig=m=>m==='wave'||m==='charge'||m==='br';
const isHit=m=>m==='swipe'||m==='wave'||m==='charge';
const CONDS=[
  {id:'always',label:'항상',test:()=>true},
  {id:'first',label:'내 첫 행동',test:(b,i)=>b.heroes[i].acts===0},
  {id:'aimMe',label:'보스 공격이 나에게 옴',test:(b,i)=>{ if(b.boss.stun) return false; const t=intent(b); return t==='wave'||((t==='swipe'||isBig(t))&&aimOf(b).includes(i)); }},
  {id:'bossGaze',label:'보스가 응시 중',test:b=>!b.boss.stun&&intent(b)==='gaze'},
  {id:'bossBig',label:'보스 강공격 예정',test:b=>!b.boss.stun&&isBig(intent(b))},
  {id:'bossWave',label:'보스 광역 공격 예정',test:b=>!b.boss.stun&&intent(b)==='wave'},
  {id:'bossCharge',label:'보스 돌진 예정',test:b=>!b.boss.stun&&intent(b)==='charge'},
  {id:'bossShell',label:'보스 껍질 닫힘',test:b=>b.boss.shell},
  {id:'bossBreak',label:'보스 BREAK 중',test:b=>b.boss.stun>0},
  {id:'bossRaged',label:'보스 공격 강화됨',test:b=>!!b.boss.rage},
  {id:'bossHigh',label:'보스 HP 70% 이상',test:b=>b.boss.hp>=b.boss.max*.7},
  {id:'bossLow',label:'보스 HP 50% 이하',test:b=>b.boss.hp<=b.boss.max/2},
  {id:'bossLow30',label:'보스 HP 30% 이하',test:b=>b.boss.hp<=b.boss.max*.3},
  {id:'lowSelf',label:'내 HP 50% 이하',test:(b,i)=>b.heroes[i].hp<=b.heroes[i].max/2},
  {id:'lowSelf30',label:'내 HP 30% 이하',test:(b,i)=>b.heroes[i].hp<=b.heroes[i].max*.3},
  {id:'lowAlly',label:'아군 HP 50% 이하',test:b=>b.heroes.some(h=>h.hp>0&&h.hp<=h.max/2)},
  {id:'lowAlly30',label:'아군 HP 30% 이하',test:b=>b.heroes.some(h=>h.hp>0&&h.hp<=h.max*.3)},
  {id:'allyDown',label:'쓰러진 아군 있음',test:b=>b.heroes.some(h=>h.hp<=0)},
  {id:'noWard',label:'보호막 없는 아군 있음',test:b=>b.heroes.some(h=>h.hp>0&&!h.ward)},
  {id:'allyLowSp',label:'SP 25 이하 동료 있음',test:(b,i)=>b.heroes.some((h,j)=>j!==i&&h.hp>0&&h.sp<=25)},
  {id:'unmarked',label:'보스에 표식 없음',test:b=>!b.boss.mark},
  {id:'mobAlive',label:'졸개가 남아 있음',test:b=>b.mobs.some(m=>m.hp>0)},
  {id:'mobs2',label:'졸개 2마리 이상',test:b=>b.mobs.filter(m=>m.hp>0).length>=2},
  {id:'noMob',label:'졸개가 없음',test:b=>!b.mobs.some(m=>m.hp>0)},
  {id:'spHigh',label:'내 SP 50 이상',test:(b,i)=>b.heroes[i].sp>=50},
  {id:'spFull',label:'내 SP 80 이상',test:(b,i)=>b.heroes[i].sp>=80},
  {id:'spLow',label:'내 SP 25 이하',test:(b,i)=>b.heroes[i].sp<=25}
];
const RULE_SLOTS=6;
const DEFAULT_RULES={
  wanderer:[['bossGaze','w_stone'],['lowSelf','w_bandage'],['bossBig','w_brace'],['spFull','w_stone'],['always','w_punch'],['always','w_punch']],
  knight:[['bossGaze','k_taunt'],['bossGaze','w_stone'],['bossBig','k_guard'],['lowSelf30','w_bandage'],['spHigh','k_bash'],['always','k_slash']],
  mage:[['bossShell','m_fire'],['mobs2','m_storm'],['spLow','m_focus'],['spHigh','m_fire'],['always','m_bolt'],['always','m_bolt']],
  healer:[['bossBig','h_ward'],['lowAlly30','h_heal'],['lowAlly','h_rain'],['lowAlly','h_heal'],['always','h_smite'],['always','h_smite']],
  archer:[['bossBreak','a_rapid'],['mobs2','a_volley'],['unmarked','a_aim'],['spHigh','a_rapid'],['always','a_shot'],['always','a_shot']]
};
/* cfg: {party:[{uid,job,name,maxhp,dmg,spd,row:'F'|'B',skills:[basic,...equipped]}], rules:[rules per slot], targets:['mob'|'boss'], stage, muts, seed} */
function newBattle(cfg){
  const S=STAGES[cfg.stage-1], hide=cfg.muts.includes('hide')?1.2:1, max=Math.round(S.hp*hide);
  const def={name:S.boss,ic:S.ic,cycle:S.cycle,p2:S.p2||null,pw:S.pw,gk:!!S.gk,hue:S.hue||0,talk:S.talk||null};
  const b={muts:cfg.muts.slice(),stage:cfg.stage,def,seed:cfg.seed|0,rules:cfg.rules.map(r=>r.map(x=>[x[0],x[1]])),targets:(cfg.targets||[]).slice(),override:null,overrideTgt:null,focus:null,round:0,actions:0,over:null,reason:'',
    boss:{max,hp:max,spd:S.spd+(cfg.muts.includes('swift')?12:0),g:0,queue:[],stun:0,shell:false,mark:0,vuln:0,poison:null,p2:false,dmg:S.dmg||1,rage:0,row:'F'},
    mobs:(S.mobs||[]).map(m=>({name:m.name,ic:m.ic,kind:m.kind,pw:m.pw||0,max:m.hp,hp:m.hp,spd:m.spd,g:0})),
    heroes:cfg.party.map(p=>({uid:p.uid,id:p.job,name:p.name,look:p.look,max:p.maxhp,hp:p.maxhp,dmg:p.dmg,spd:p.spd,row:p.row==='B'?'B':'F',g:0,sp:SP_START,ward:0,guard:false,brace:false,taunt:false,insp:false,acts:0,
      sk:p.skills.map(id=>Object.assign({id},SKILLS[id])),cd:p.skills.map(()=>0)})),
    stats:{dmg:0,breaks:0,resist:0,gazes:0,bigs:0,blocked:0,down:0,manual:0,dmgBy:cfg.party.map(()=>0),fired:cfg.party.map(()=>Array(RULE_SLOTS+2).fill(0))}};
  /* gauges start partly filled in proportion to speed, so turn order is visible from the first moment */
  actors(b).forEach(x=>{ x.u.g=x.u.spd*.3; });
  rollRow(b); fill(b); return b;
}
/* the row the boss's next single attack goes for, decided in advance so it can be shown */
function rollRow(b){ b.boss.row=rng(b)<FRONT_AIM?'F':'B'; }
/* heroes the boss's next swipe/charge will hit: a guarding or taunting hero covers alone, else the whole aimed row (the other row if that one is empty) */
function aimOf(b){
  const c=b.heroes.findIndex(h=>h.hp>0&&(h.guard||h.taunt)); if(c>=0) return [c];
  const row=r=>b.heroes.map((h,j)=>h.hp>0&&h.row===r?j:-1).filter(j=>j>=0);
  const a=row(b.boss.row); return a.length?a:row(b.boss.row==='F'?'B':'F');
}
/* actor keys: hero slot number, 'B' for the boss, 'M0'/'M1' for minions */
function actors(b){
  const us=[]; b.heroes.forEach((h,i)=>{ if(h.hp>0) us.push({k:i,u:h}); }); if(b.boss.hp>0) us.push({k:'B',u:b.boss});
  (b.mobs||[]).forEach((m,j)=>{ if(m.hp>0) us.push({k:'M'+j,u:m}); });
  return us;
}
function nextActor(b,dry){
  const us=actors(b);
  let best=null, bt=Infinity;
  us.forEach(x=>{ const t=(100-x.u.g)/x.u.spd; if(t<bt-1e-9){ bt=t; best=x; } });
  if(!dry){ us.forEach(x=>{ x.u.g+=x.u.spd*bt; }); best.u.g-=100; }
  return best.k;
}
function orderPreview(b,n){
  const c={heroes:b.heroes.map(h=>({hp:h.hp,g:h.g,spd:h.spd})),boss:{g:b.boss.g,spd:b.boss.spd,hp:b.boss.hp},mobs:(b.mobs||[]).map(m=>({hp:m.hp,g:m.g,spd:m.spd}))}, out=[];
  for(let i=0;i<n;i++) out.push(nextActor(c));
  return out;
}
function preview(b,n){ const q=b.boss.queue.slice(), cyc=cycle(b); while(q.length<n) q.push(...cyc); return q.slice(0,n); }
function lowest(b,skipWard){
  let j=-1;
  b.heroes.forEach((x,n)=>{ if(x.hp<=0||(skipWard&&x.ward)) return; if(j<0||x.hp/x.max<b.heroes[j].hp/b.heroes[j].max) j=n; });
  return j;
}
/* minions poke the weakest hero in the front row (a guard covers) */
function mobTarget(b){
  const c=b.heroes.findIndex(h=>h.hp>0&&(h.guard||h.taunt)); if(c>=0) return c;
  let j=-1;
  b.heroes.forEach((h,n)=>{ if(h.hp<=0) return; const x=j<0?null:b.heroes[j]; if(!x||(h.row==='F'&&x.row!=='F')||(h.row===x.row&&h.hp/h.max<x.hp/x.max)) j=n; });
  return j;
}
function snap(b){
  const o=b.boss;
  return {round:b.round,bhp:o.hp,bmax:o.max,bg:o.g,bspd:o.spd,stun:o.stun,shell:o.shell,mark:o.mark,vuln:o.vuln,poison:o.poison?o.poison.left:0,p2:o.p2,q:o.hp>0?preview(b,3):[],aim:o.hp>0?aimOf(b):[],order:orderPreview(b,8),
    h:b.heroes.map(h=>({hp:h.hp,max:h.max,sp:h.sp,cd:h.cd.slice(),g:h.g,spd:h.spd,ward:h.ward,guard:h.guard,brace:h.brace,taunt:h.taunt,insp:h.insp})),
    mobs:b.mobs.map(m=>({hp:m.hp,max:m.max,g:m.g,spd:m.spd})),rage:o.rage};
}
/* who a hero's attack lands on: manual pick → the enemy the player tapped to focus → 'mob' preference hits the weakest living minion first, otherwise the boss */
/* a fallen boss is never a target: the remaining minions are */
function pickTarget(b,i){
  const up=b.boss.hp>0, live=t=>t!=='B'&&b.mobs[t]&&b.mobs[t].hp>0;
  const o=b.overrideTgt; if(o==='B'&&up) return 'B'; if(o!=null&&live(o)) return o;
  const f=b.focus; if(f==='B'&&up) return 'B'; if(f!=null&&live(f)) return f;
  if(b.targets[i]!=='boss'||!up){ let j=-1; b.mobs.forEach((m,n)=>{ if(m.hp>0&&(j<0||m.hp<b.mobs[j].hp)) j=n; }); if(j>=0) return j; }
  return 'B';
}
function tgtName(b,t){ return t==='B'?b.def.name:b.mobs[t].name; }
/* patterns skip skills that would do nothing right now; a manual pick only needs the SP and no cooldown */
function valid(b,i,k){
  const h=b.heroes[i], ef=h.sk[k].ef, o=b.boss, others=b.heroes.filter((x,j)=>j!==i&&x.hp>0);
  if(ef.heal&&!ef.ward&&!b.heroes.some(x=>x.hp>0&&x.hp<x.max)) return false;
  if(ef.healAll&&!b.heroes.some(x=>x.hp>0&&x.hp<x.max)) return false;
  if(ef.healSelf&&h.hp>=h.max) return false;
  if(ef.ward&&!b.heroes.some(x=>x.hp>0&&!x.ward)) return false;
  if(ef.brace&&!ef.healAll&&h.brace) return false;
  if(ef.brace&&!ef.healAll&&intent(b)==='charge'&&!aimOf(b).includes(i)) return false;
  if(ef.guard&&h.guard) return false;
  if(ef.taunt&&h.taunt&&intent(b)!=='gaze') return false;
  if(ef.mark&&o.mark) return false;
  if(ef.vuln&&o.vuln&&!ef.dmg) return false;
  if(ef.poison&&o.poison) return false;
  if(ef.inspire&&!others.some(x=>!x.insp)) return false;
  if((ef.haste||ef.spAll)&&!others.length) return false;
  if(ef.spGive&&!others.some(x=>x.sp<SP_MAX)) return false;
  if(ef.sp&&!ef.brace&&h.sp>70) return false;
  return true;
}
function ready(b,i,k){ const h=b.heroes[i], s=h.sk[k]; return !!s&&s.cost<=h.sp&&!h.cd[k]; }
function usable(b,i,k){ return ready(b,i,k)&&valid(b,i,k); }
/* order: manual pick (-3) → pattern rules (0..5, skill must be equipped) → basic attack (-1) */
function pickSkill(b,i){
  const h=b.heroes[i], list=b.rules[i]||[], skips=[];
  if(b.override!=null&&ready(b,i,b.override)) return {k:b.override,rule:-3,cond:'직접 선택',skips};
  for(let r=0;r<list.length;r++){
    const c=CONDS.find(x=>x.id===list[r][0]), k=h.sk.findIndex(s=>s.id===list[r][1]);
    if(!c||k<0||!c.test(b,i)) continue;
    if(!usable(b,i,k)){ skips.push({r,why:h.cd[k]?'cd':h.sk[k].cost>h.sp?'sp':'na'}); continue; }
    return {k,rule:r,cond:c.label,skips};
  }
  return {k:0,rule:-1,cond:'',skips};
}
function firedIdx(rule){ return rule>=0?rule:rule===-1?RULE_SLOTS:RULE_SLOTS+1; }
function phaseCheck(b,e){
  const o=b.boss, thr=has(b,'rage')?.65:.5;
  if(b.def.p2&&!o.p2&&o.hp>0&&o.hp<=o.max*thr){ o.p2=true; e.phase=true; }
}
function hitBoss(b,base,e,ignoreShell){
  const o=b.boss; let m=1;
  if(o.shell&&!ignoreShell) m*=.5;
  if(o.mark>0) m*=1.25;
  if(o.vuln>0) m*=1.2;
  if(o.stun>0) m*=has(b,'daze')?1.15:1.3;
  const d=Math.round(base*m);
  o.hp=Math.max(0,o.hp-d); b.stats.dmg+=d; b.stats.dmgBy[e.i]+=d;
  e.hits.push(d); e.tgts.push('B'); phaseCheck(b,e);
  return d;
}
function hitMob(b,j,base,e){
  const m=b.mobs[j], d=Math.round(base);
  m.hp=Math.max(0,m.hp-d); b.stats.dmg+=d; b.stats.dmgBy[e.i]+=d;
  e.hits.push(d); e.tgts.push(j);
  if(m.hp===0){ m.g=0; (e.kills=e.kills||[]).push(j); if(b.focus===j) b.focus=null; }
  return d;
}
function hurtHero(b,j,base){
  const h=b.heroes[j]; let m=h.row==='B'?BACK_TAKEN:1, red='';
  if(h.guard){ m*=.3; red='가드'; }
  else if(h.brace){ m*=.5; red='버티기'; }
  if(h.ward>0){ m*=.5; h.ward=0; red=red?red+'+보호막':'보호막'; }
  const d=Math.max(1,Math.round(base*b.boss.dmg*(b.boss.p2?1.2:1)*m));
  h.hp=Math.max(0,h.hp-d);
  if(h.hp===0){ b.stats.down++; h.guard=false; h.brace=false; h.taunt=false; h.ward=0; }
  return {j,v:d,red,down:h.hp===0};
}
function doHero(b,i){
  const h=b.heroes[i], o=b.boss;
  const {k,rule,cond,skips}=pickSkill(b,i), s=h.sk[k], ef=s.ef;
  h.sp-=s.cost; b.stats.fired[i][firedIdx(rule)]++; if(rule===-3) b.stats.manual++;
  const e={t:'act',i,id:h.id,nm:h.name,k,sid:s.id,rule,cond,skips,hits:[],tgts:[],txt:''}, parts=[];
  const heal=v=>Math.round(v*h.dmg*(has(b,'blight')?.5:1));
  if(ef.dmg){
    let base=ef.dmg*h.dmg*(h.row==='F'?FRONT_DMG:1);
    if(h.insp){ base*=1.3; h.insp=false; e.insp=true; }
    const bossHit=()=>{ let bb=base; if(ef.stunBonus&&o.stun>0){ bb*=ef.stunBonus; e.combo=true; } if(ef.execute&&o.hp<=o.max*.3){ bb*=2; e.exec=true; } hitBoss(b,bb,e,ef.ignoreShell); };
    if(ef.aoe){ if(o.hp>0) bossHit(); b.mobs.forEach((m,j)=>{ if(m.hp>0) hitMob(b,j,base,e); }); }
    else{ const brk=ef.breakGaze&&!o.stun&&b.overrideTgt==null&&intent(b)==='gaze'; for(let n=0;n<(ef.hits||1)&&(o.hp>0||b.mobs.some(m=>m.hp>0));n++){ const t=brk?'B':pickTarget(b,i); if(t==='B') bossHit(); else hitMob(b,t,base,e); } }
    if(ef.fire) e.fire=true;
    const names=[...new Set(e.tgts.map(t=>tgtName(b,t)))].join(', ');
    parts.push(`${ef.aoe?'모든 적':names}에게 <strong>${e.hits.reduce((a,c)=>a+c,0)}</strong> 피해${e.combo?' (BREAK 추격)':''}${e.exec?' (처형)':''}${e.kills?` · ${e.kills.map(j=>b.mobs[j].name).join(', ')} 처치!`:''}`);
    if(ef.delay&&e.tgts.length){
      const t=e.tgts[0], u=t==='B'?o:b.mobs[t];
      if(u.hp>0){ u.g=Math.max(-60,u.g-ef.delay); e.delay={t,v:ef.delay}; parts.push(`${tgtName(b,t)} 행동 게이지 -${ef.delay}%`); }
    }
  }
  /* breaking needs the hit to land on the boss (a stone thrown at a minion doesn't count) */
  if(ef.breakGaze&&!o.stun&&o.hp>0&&intent(b)==='gaze'&&(!ef.dmg||e.tgts.includes('B'))){
    if(!o.p2||o.mark>0){ o.stun=1; o.queue.shift(); if(isBig(o.queue[0])) o.queue.shift(); o.shell=false; b.stats.breaks++; b.stats.gazes++; e.brk=true; parts.push('응시를 끊었다! <strong>BREAK</strong>'); }
    else{ e.resist=true; b.stats.resist++; parts.push('각성한 수문장이 무시했다 · 표식 필요'); }
  }
  if(ef.taunt&&!e.brk){ h.taunt=true; e.taunt=true; if(!e.resist) parts.push('시선을 끈다'); }
  if(ef.guard){ h.guard=true; e.guard=true; parts.push('받는 피해 70% 감소'); }
  if(ef.brace){ h.brace=true; e.brace=true; parts.push('버티기 (보스 공격까지 받는 피해 50% 감소)'); }
  if(ef.ward==='team'){ b.heroes.forEach(x=>{ if(x.hp>0) x.ward=1; }); e.ward='team'; parts.push('아군 전원 보호막'); }
  if(ef.ward==='low'){ const j=lowest(b,true)>=0?lowest(b,true):lowest(b); b.heroes[j].ward=1; e.ward=j; parts.push(`${b.heroes[j].name} 보호막`); }
  if(ef.heal){
    const j=ef.ward==='low'?e.ward:lowest(b), t=b.heroes[j];
    const g=Math.min(heal(ef.heal),t.max-t.hp); t.hp+=g;
    e.heal={j,v:g}; parts.push(`${t.name} HP <strong>+${g}</strong>`);
  }
  if(ef.healSelf){ const g=Math.min(heal(ef.healSelf),h.max-h.hp); h.hp+=g; e.heal={j:i,v:g}; parts.push(`HP <strong>+${g}</strong>`); }
  if(ef.healAll){ e.healAll=[]; b.heroes.forEach((x,j)=>{ if(x.hp>0){ const g=Math.min(heal(ef.healAll),x.max-x.hp); x.hp+=g; e.healAll.push({j,v:g}); } }); parts.push(`아군 전원 HP +${heal(ef.healAll)}`); }
  if(ef.sp){ const g=Math.min(ef.sp,SP_MAX-h.sp); h.sp+=g; e.sp=g; parts.push(`SP +${g}`); }
  if(ef.spGive){ let j=-1; b.heroes.forEach((x,n)=>{ if(n!==i&&x.hp>0&&(j<0||x.sp<b.heroes[j].sp)) j=n; }); if(j>=0){ const t=b.heroes[j]; t.sp=Math.min(SP_MAX,t.sp+ef.spGive); e.spGive={j,v:ef.spGive}; parts.push(`${t.name} SP +${ef.spGive}`); } }
  if(ef.spAll){ b.heroes.forEach((x,j)=>{ if(j!==i&&x.hp>0) x.sp=Math.min(SP_MAX,x.sp+ef.spAll); }); e.spAll=ef.spAll; parts.push(`동료 전원 SP +${ef.spAll}`); }
  if(ef.mark){ o.mark=2; e.mark=true; parts.push('약점 표식 (받는 피해 +25%)'); }
  if(ef.vuln){ o.vuln=2; e.vuln=true; parts.push('방어 약화 (받는 피해 +20%)'); }
  if(ef.poison){ o.poison={v:Math.round(ef.poison*h.dmg),left:3,by:i}; e.poison=true; parts.push('독 3턴'); }
  if(ef.inspire){ b.heroes.forEach((x,j)=>{ if(j!==i&&x.hp>0) x.insp=true; }); e.inspire=true; parts.push('아군 다음 공격 +30%'); }
  if(ef.haste){ b.heroes.forEach((x,j)=>{ if(j!==i&&x.hp>0) x.g+=35; }); e.haste=true; parts.push('아군 행동 게이지 +35%'); }
  h.cd.forEach((v,j)=>{ if(v>0) h.cd[j]--; }); h.cd[k]=s.cd||0;
  h.acts++; h.sp=Math.min(SP_MAX,h.sp+SP_REGEN);
  e.txt=parts.join(' · '); e.bst=o.stun>0;
  return e;
}
function bossTurn(b){
  const o=b.boss, ev=[];
  b.round++;
  if(o.poison){
    const d=o.poison.v, t={t:'tick',v:d,hits:[]};
    o.hp=Math.max(0,o.hp-d); b.stats.dmg+=d; b.stats.dmgBy[o.poison.by]+=d;
    phaseCheck(b,t); o.poison.left--; if(!o.poison.left) o.poison=null;
    t.snap=snap(b); ev.push(t);
    if(t.phase&&o.hp>0) ev.push({t:'phase',snap:snap(b)});
    if(o.hp<=0) return ev;
  }
  const e={t:'boss',m:null,hits:[]};
  o.shell=false;
  if(o.stun>0){ e.skip=true; e.m='stun'; o.stun--; }
  else{
    fill(b); const m=o.queue.shift(); e.m=m;
    const r=isHit(m)&&o.rage?1.3:1; if(r>1){ o.rage=0; e.raged=true; }
    if(m==='swipe'||m==='charge'){
      const tg=aimOf(b), pw=b.def.pw[m];
      e.row=b.heroes[tg[0]]?b.heroes[tg[0]].row:o.row; e.cover=tg.length===1&&!!(b.heroes[tg[0]].guard||b.heroes[tg[0]].taunt);
      if(m==='charge') b.stats.bigs++;
      tg.forEach(j=>{ if(m==='swipe'&&has(b,'lash')){ e.hits.push(hurtHero(b,j,pw*.6*r)); if(b.heroes[j].hp>0) e.hits.push(hurtHero(b,j,pw*.6*r)); } else e.hits.push(hurtHero(b,j,pw*r)); });
      if(m==='charge'&&e.hits.length&&e.hits.every(h=>h.red&&!h.down)){ e.perfect=true; b.stats.blocked++; }
      rollRow(b);
    }else if(m==='wave'){
      b.stats.bigs++;
      const alive=b.heroes.map((h,j)=>h.hp>0?j:-1).filter(j=>j>=0);
      const covered=alive.every(j=>b.heroes[j].guard||b.heroes[j].brace||b.heroes[j].ward>0);
      alive.forEach(j=>e.hits.push(hurtHero(b,j,b.def.pw.wave*(has(b,'tide')?1.4:1)*r)));
      if(covered&&!e.hits.some(x=>x.down)){ e.perfect=true; b.stats.blocked++; }
    }else if(m==='gaze'){
      b.stats.gazes++; fill(b);
      if(o.queue[0]==='br') o.queue[0]=rng(b)<.5?'wave':'charge';
      e.next=o.queue[0];
    }else if(m==='shell'){ o.shell=true; }
    /* guard, brace and taunt hold until the boss actually attacks, however many turns the hero gets before that */
    if(isHit(m)) b.heroes.forEach(h=>{ h.guard=false; h.brace=false; h.taunt=false; });
  }
  if(o.mark>0) o.mark--;
  if(o.vuln>0) o.vuln--;
  e.snap=snap(b); ev.push(e);
  return ev;
}
/* minions: poke = small single hit, heal = restore boss HP, buff = boss's next attack +30% */
function mobTurn(b,j){
  const m=b.mobs[j], o=b.boss, e={t:'mob',j,kind:m.kind,hits:[]};
  /* with the boss down, healers and buffers just poke */
  if(o.hp<=0&&m.kind!=='poke'){ e.kind='poke'; const t=mobTarget(b); if(t>=0) e.hits.push(hurtHero(b,t,Math.round((m.pw||30)*.3))); return e; }
  if(m.kind==='heal'){ const v=Math.min(m.pw,o.max-o.hp); o.hp+=v; e.heal=v; }
  else if(m.kind==='buff'){ o.rage=1; e.buff=true; }
  else{ const t=mobTarget(b); if(t>=0) e.hits.push(hurtHero(b,t,m.pw)); }
  return e;
}
function step(b,ov,tg){
  const ev=[]; if(b.over) return ev;
  b.override=ov==null?null:ov; b.overrideTgt=tg==null?null:tg;
  const a=nextActor(b); b.actions++;
  if(a==='B') ev.push(...bossTurn(b));
  else if(typeof a==='string'){ const e=mobTurn(b,+a.slice(1)); e.snap=snap(b); ev.push(e); }
  else{ const e=doHero(b,a); e.snap=snap(b); ev.push(e); if(e.phase&&b.boss.hp>0) ev.push({t:'phase',snap:snap(b)}); }
  b.override=null; b.overrideTgt=null;
  const mobsUp=b.mobs.some(m=>m.hp>0);
  if(b.boss.hp<=0&&!b.bossDown&&mobsUp){ b.bossDown=true; ev.push({t:'bossDown',snap:snap(b)}); }
  if(b.boss.hp<=0&&!mobsUp){ b.over='win'; ev.push({t:'win',snap:snap(b)}); }
  else if(!b.heroes.some(h=>h.hp>0)){ b.over='lose'; b.reason='wipe'; }
  return ev;
}
/* no time limit in play; the cap only stops a simulated stalemate (a healer out-healing the party) from looping forever */
function simulate(cfg){ const b=newBattle(cfg); while(!b.over&&b.round<200&&b.actions<4000) step(b); if(!b.over){ b.over='lose'; b.reason='stall'; } return b; }
/*END ENGINE*/
