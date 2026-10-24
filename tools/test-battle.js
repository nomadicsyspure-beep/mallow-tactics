/* browser test: battle rules on prepared profiles (stages 3-6): manual start + auto tip, enemy tap info in manual,
   tab lock during a fight before stage 6, boss down -> clear only after every minion, stage 4 forced 🪨.
   node tools/test-battle.js   ("errors: []" at the end means no script errors) */
let pw; try{ pw=require("playwright"); }catch(e){ pw=require(require("child_process").execSync("npm root -g").toString().trim()+"/playwright"); }
const { chromium } = pw, PAGE="file://"+require("path").join(__dirname,"../index.html");
(async()=>{
  const br=await chromium.launch(); const pg=await br.newPage({viewport:{width:390,height:820}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await pg.goto(PAGE); await pg.waitForTimeout(300);
  const setProf=(stage,lvl,job,n,tips)=>pg.evaluate(([stage,lvl,job,n,tips])=>{ const mk=(uid,name,j)=>({uid,name,look:{sex:'f',hair:1,skin:1},job:j,lvl,exp:0,learned:j==='knight'?['w_bandage','w_brace','w_stone','k_guard','k_taunt','k_bash']:['w_bandage','w_brace','w_stone'],equip:j==='knight'?['w_bandage','w_brace','w_stone','k_guard','k_taunt','k_bash']:['w_bandage','w_brace','w_stone'],gear:{wpn:null,arm:null,acc:null}});
    const cleared={}; for(let i=1;i<stage;i++) cleared[i]=true; const names=['하늘','둘','셋','넷','다섯','여섯'];
    const chars=names.slice(0,n).map((x,i)=>mk('c'+(i+1),x,i===0?job:'wanderer'));
    localStorage.setItem('mallow-profile-v11',JSON.stringify({gold:400,items:[],nextItem:1,nextUid:9,chars,party:['c1','c2','c3','c4'],rows:{c1:'F',c2:'B',c3:'F',c4:'B'},stage,cleared,tips,autoOpen:true,jobNotified:{c1:1,c2:1,c3:1,c4:1,c5:1,c6:1},guideDone:true,braceOpen:true,jobTutDone:true,jobRound:2})); },[stage,lvl,job,n,tips]);
  const allTips={start:1,wait:1,cats:1,desc:1,tgt:1,tgt2:1,tgtMob:1,use:1,fight:1,fight3:1,fight4:1,fight5:1,inspect:1,inspectMob:1,inspectAlly:1,auto:1,tabs:1,hard:1,go4:1,go5:1,dropMap:1,map2:1,formDrag:1,formDemo:1,formF:1,formB:1,gaze:1,gaze2:1,break:1,break2:1,shell:1,big:1};
  const spot=()=>pg.evaluate(()=>document.querySelector('#spot').hidden?null:document.querySelector('#spotMsg').innerText.replace(/\n/g,' / '));
  const tapEl=async sel=>{ const r=await pg.evaluate(s=>{ const b=document.querySelector(s).getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2]; },sel); await pg.mouse.click(r[0],r[1]); };
  const waitSpot=async(n=100)=>{ for(let i=0;i<n;i++){ await pg.waitForTimeout(150); const t=await spot(); if(t) return t; } return null; };
  // A. stage 3: opens manual, first manual turn points at auto button; pressing turns auto on
  await setProf(3,3,'wanderer',4,Object.assign({},allTips,{focus:0,auto2:0})); await pg.reload(); await pg.waitForTimeout(400);
  await pg.evaluate(()=>document.querySelector('#startBtn').click()); await pg.waitForTimeout(300);
  console.log('A btn pre:',await pg.textContent('#fightBtn'));
  await tapEl('#fightBtn');
  let t=await waitSpot(); console.log('A tip:',t,'manual',await pg.evaluate(()=>[isManual(),waitChoice]));
  await tapEl('#fightBtn'); await pg.waitForTimeout(400);
  console.log('A after press: auto',await pg.evaluate(()=>!isManual()),'btn',await pg.textContent('#fightBtn'));
  t=await waitSpot(150); console.log('A next tip:',t,'round',await pg.evaluate(()=>battle.round));
  // B. manual: tapping a mob shows info, no focus
  await setProf(3,3,'wanderer',4,Object.assign({},allTips,{focus:1,auto2:1})); await pg.reload(); await pg.waitForTimeout(400);
  await pg.evaluate(()=>document.querySelector('#startBtn').click()); await pg.waitForTimeout(300); await tapEl('#fightBtn'); await pg.waitForTimeout(1500);
  await tapEl('#mobs .mob'); await pg.waitForTimeout(300);
  console.log('B mob tap: focus',await pg.evaluate(()=>battle.focus),'tip shown',await pg.evaluate(()=>{ const w=document.querySelector('#whyTip'); return w&&!w.hidden?w.innerText.slice(0,40):null; }));
  // C. stage 3 nav lock during battle
  await tapEl('[data-screen="characters"]'); await pg.waitForTimeout(300);
  console.log('C nav: battle visible',await pg.evaluate(()=>!document.querySelector('#screen-battle').hidden),'why',await pg.evaluate(()=>{ const w=document.querySelector('#whyTip'); return w&&!w.hidden?w.innerText:null; }));
  // D. kill the boss first in auto: bossDown banner, status, win only after mobs
  await pg.evaluate(()=>{ battle.boss.hp=1; }); await tapEl('#fightBtn'); await pg.waitForTimeout(200);
  await pg.evaluate(()=>{ speed=4; setFocus('B'); });
  let seen={};
  for(let i=0;i<300;i++){ await pg.waitForTimeout(100); const st=await pg.evaluate(()=>({st:document.querySelector('#bossStatus').textContent,bn:(document.querySelector('.banner')||{}).innerText||'',over:battle.over,bhp:battle.boss.hp,mobs:battle.mobs.map(m=>m.hp),res:!document.querySelector('#resultModal').hidden}));
    const k=st.st+'|'+st.bn; if(!seen[k]){ seen[k]=1; console.log('D',JSON.stringify(st)); } if(st.res) break; }
  console.log('D nav after:',await pg.evaluate(()=>document.querySelector('[data-screen="characters"]').classList.contains('locked')));
  const T=Object.assign({},allTips,{auto2:1,focus:1,'tab-characters':1,'tab-strategy':1,stoneUse:1,stoneTap:1,low:1,cd:1,sp:1,wait:1});
  for(const st of [5,6]){
    await setProf(st,5,'wanderer',4,T); await pg.reload(); await pg.waitForTimeout(400);
    await pg.evaluate(()=>document.querySelector('#startBtn').click()); await pg.waitForTimeout(300);
    while(await spot()){ await pg.mouse.click(5,5); await pg.waitForTimeout(250); }
    await tapEl('#fightBtn'); await pg.waitForTimeout(800); while(await spot()){ await pg.mouse.click(5,5); await pg.waitForTimeout(250); }
    console.log(st,'start manual',await pg.evaluate(()=>[isManual(),document.querySelector('#fightBtn').textContent]));
    await tapEl('#fightBtn'); await pg.waitForTimeout(300); while(await spot()){ await pg.mouse.click(5,5); await pg.waitForTimeout(250); }
    const a0=await pg.evaluate(()=>battle.actions);
    await tapEl('[data-screen="characters"]'); await pg.waitForTimeout(2500);
    console.log(st,'auto',await pg.evaluate(()=>!isManual()),'chars screen shown',await pg.evaluate(()=>!document.querySelector('#screen-characters').hidden),'actions',a0,'->',await pg.evaluate(()=>battle.actions),'why',await pg.evaluate(()=>{ const w=document.querySelector('#whyTip'); return w&&!w.hidden?w.innerText:null; }));
  }
  // stage 4: manual start, forced stone still asked at the gaze
  await setProf(4,4,'wanderer',4,Object.assign({},T,{stoneUse:0,stoneTap:0})); await pg.reload(); await pg.waitForTimeout(400);
  await pg.evaluate(()=>document.querySelector('#startBtn').click()); await pg.waitForTimeout(300);
  while(await spot()){ await pg.mouse.click(5,5); await pg.waitForTimeout(250); }
  await tapEl('#fightBtn'); await pg.waitForTimeout(300);
  for(let i=0;i<200;i++){ await pg.waitForTimeout(150); const s=await spot(); if(s&&/돌팔매/.test(s)){ console.log('4 stone tip:',s,'force',await pg.evaluate(()=>forceSk&&forceSk.tip)); break; }
    if(s){ await pg.mouse.click(5,5); continue; }
    if(await pg.evaluate(()=>waitChoice&&!forceSk)) await pg.evaluate(()=>{ skPick=0; useSkill(); }); }
  console.log('errors:',errs);
  await br.close();
})();
