/* ---------- profile & persistence ---------- */
const $=s=>document.querySelector(s);
const PROF_KEY='mallow-profile-v11', RULE_KEY='mallow-rules-v11', SET_KEY='mallow-settings-v9', LOG_KEY='mallow-lastlog-v11', TGT_KEY='mallow-target-v11';
/* stages 1-2 are hand-played tutorials; clearing stage 2 opens auto battle. From BG_STAGE on the fights need
   real planning, and an auto battle keeps running while another tab is open */
/* from MANUAL_FROM on the 🩹 low-HP tip is no longer shown (every battle starts in manual play; the auto button switches it on) */
const MANUAL_FROM=7;
const MAX_LVL=20, JOB_LVL=5, TUTORIAL_STAGES=2, EQUIP_SLOTS=8, BG_STAGE=6, MAX_CHARS=8;
/* the game starts with one hero; companions are free until there are FREE_RECRUITS characters, later ones cost gold */
const FREE_RECRUITS=4, RECRUIT_GOLD=200;
function recruitCost(){ return prof.chars.length<FREE_RECRUITS?0:RECRUIT_GOLD; }
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function load(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function makeChar(uid,name,look){ return {uid,name,look,job:'wanderer',lvl:1,exp:0,learned:['w_bandage','w_brace','w_stone'],equip:['w_bandage','w_brace','w_stone'],gear:{wpn:null,arm:null,acc:null}}; }
function defaultProfile(){ return {gold:0,items:[],nextItem:1,nextUid:1,chars:[],party:[],rows:{},stage:1,cleared:{},tips:{},autoOpen:false,jobNotified:{},guideDone:false,braceOpen:false}; }
function cloneRules(r){ return r.map(x=>[x[0],x[1]]); }
function validRuleSet(r){ return Array.isArray(r)&&r.length===RULE_SLOTS&&r.every(x=>Array.isArray(x)&&CONDS.some(c=>c.id===x[0])&&SKILLS[x[1]]); }
const savedProf=load(PROF_KEY)||{};
let prof=Object.assign(defaultProfile(),savedProf);
if(!Array.isArray(prof.chars)) prof=defaultProfile();
/* saves from before the guided start: players past the recruit step skip it */
if(savedProf.guideDone==null) prof.guideDone=prof.chars.length>0&&(!!prof.cleared[3]||prof.party.length>=4);
if(savedProf.braceOpen==null) prof.braceOpen=!!prof.cleared[2];
prof.party=prof.party.filter(u=>prof.chars.some(c=>c.uid===u)); if(!prof.party.length&&prof.chars.length) prof.party=[prof.chars[0].uid];
/* front row (next to the boss) or back row; at most two of the party in each */
function rowOf(uid){ return prof.rows[uid]==='B'?'B':'F'; }
function fixRows(){ const n={F:0,B:0}; prof.party.forEach(u=>{ let r=rowOf(u); if(n[r]>=2) r=r==='F'?'B':'F'; prof.rows[u]=r; n[r]++; }); }
fixRows();
const rules=load(RULE_KEY)||{}, targets=load(TGT_KEY)||{};
function ensureChar(c){ c.learned=c.learned.filter(id=>SKILLS[id]); c.equip=c.equip.filter(id=>SKILLS[id]); ['w_brace','w_stone'].forEach(id=>{ if(!c.learned.includes(id)){ c.learned.push(id); if(c.equip.length<EQUIP_SLOTS) c.equip.push(id); } }); if(!validRuleSet(rules[c.uid])) rules[c.uid]=cloneRules(DEFAULT_RULES[c.job]); if(targets[c.uid]!=='boss') targets[c.uid]='mob'; }
prof.chars.forEach(ensureChar);
const settings=Object.assign({cutin:true},load(SET_KEY)||{});
function saveProf(){ save(PROF_KEY,prof); renderWallet(); }
function saveRules(){ save(RULE_KEY,rules); save(TGT_KEY,targets); }
const SLOT={wpn:{n:'무기',ic:'🗡️',stat:'피해'},arm:{n:'갑옷',ic:'🛡️',stat:'체력'},acc:{n:'장신구',ic:'💍',stat:'속도'}};
const TIER=['','낡은','단단한','빛나는'];
const GEAR_VAL={wpn:[0,8,14,22],arm:[0,10,18,28],acc:[0,4,7,11]};
function itemById(id){ return prof.items.find(x=>x.id===id); }
function itemName(it){ return `${TIER[it.tier]} ${SLOT[it.slot].n}`; }
function itemStat(it){ return it.slot==='acc'?`속도 +${it.val}`:`${SLOT[it.slot].stat} +${it.val}%`; }
function charById(uid){ return prof.chars.find(c=>c.uid===uid); }
function charStats(c){
  const hd=HERO_DB[c.job], lv=1+.06*(c.lvl-1);
  const g=s=>c.gear[s]?itemById(c.gear[s]):null, w=g('wpn'), a=g('arm'), x=g('acc');
  return {uid:c.uid,job:c.job,name:c.name,look:c.look,row:rowOf(c.uid),maxhp:Math.round(hd.hp*lv*(1+(a?a.val:0)/100)),dmg:+(lv*(1+(w?w.val:0)/100)).toFixed(3),spd:hd.spd+(x?x.val:0),lvl:c.lvl,skills:[hd.basic,...sortSkills(c.equip)]};
}
/* the skill bar runs in the same order as the colour guide: attack, heal, defence, special */
const TY_ORDER={atk:0,heal:1,def:2,cc:3};
function sortSkills(ids){ return ids.slice().sort((a,b)=>TY_ORDER[SKILLS[a].ty]-TY_ORDER[SKILLS[b].ty]); }
function expNeed(l){ return 50*l; }
/* skills a character can ever learn: wanderer skills + their current job's skills */
function skillPool(c){ return c.job==='wanderer'?HERO_DB.wanderer.skills.slice():[...HERO_DB[c.job].skills,...HERO_DB.wanderer.skills]; }
function learnCost(id){ const lv=SKILLS[id].lv; return lv<=4?40:lv<=6?80:120; }
function spdWord(v){ return v>=108?'빠름':v<=94?'느림':'보통'; }
/* EXP is tuned so first clears of stages 1-5 bring the whole party (companions join after stage 2) to Lv5,
   the job-change level, right before stage 6 */
function rewardFor(stage,muts,won){
  const mul=1+.15*(muts||STAGES[stage-1].muts||0); /* mutations are off: the abyss stages keep their old reward bonus */
  if(!won) return {gold:Math.round(15+10*stage),exp:Math.round(4+3*stage)};
  return {gold:Math.round((40+35*stage)*mul),exp:Math.round((40+30*stage)*mul)};
}
/* no gear drops before DROP_FROM */
const DROP_FROM=7;
function rollItem(stage,rand){
  if(stage<DROP_FROM||rand()>.6) return null;
  const slot=['wpn','arm','acc'][Math.floor(rand()*3)], t=Math.max(0,stage-5);
  const r=rand(), tier=r<.04+t*.07?3:r<.25+t*.08?2:1;
  return {slot,tier,val:GEAR_VAL[slot][tier]};
}
function addItem(it){ it.id=prof.nextItem++; prof.items.push(it); return it; }
function gainExp(c,v){
  const ups=[]; if(c.lvl>=MAX_LVL) return ups;
  c.exp+=v;
  while(c.lvl<MAX_LVL&&c.exp>=expNeed(c.lvl)){ c.exp-=expNeed(c.lvl); c.lvl++; ups.push(c.lvl); }
  if(c.lvl>=MAX_LVL) c.exp=0;
  return ups;
}

