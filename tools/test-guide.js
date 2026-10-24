/* browser test: the guided start from a new profile through stage 3 (maker, tips, recruits, formation, first fights).
   node tools/test-guide.js   (prints every tip it passes; "errors []" at the end means no script errors)
   SHOTS=word,word S=<dir> takes screenshots of tips containing those words */
let pw; try{ pw=require("playwright"); }catch(e){ pw=require(require("child_process").execSync("npm root -g").toString().trim()+"/playwright"); }
const { chromium } = pw, PAGE="file://"+require("path").join(__dirname,"../index.html");
(async()=>{
  const br=await chromium.launch(); const pg=await br.newPage({viewport:{width:400,height:820}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await pg.goto(PAGE); await pg.waitForTimeout(500);
  const shot=n=>pg.screenshot({path:(process.env.S||require('os').tmpdir())+'/'+n+'.png'});
  const spot=()=>pg.evaluate(()=>{ if(document.querySelector('#spot').hidden) return null; const c=coachCur, el=c&&c.sel&&document.querySelector(c.sel), r=el&&el.getBoundingClientRect(); return {t:document.querySelector('#spotMsg').innerText.replace(/\n/g,' / '),press:!!(c&&c.press),r:r&&r.width?{x:r.left+r.width/2,y:r.top+r.height/2}:null,sel:c&&c.sel}; });
  const G=()=>pg.evaluate(()=>{ const g=guideSel(); return g&&{dim:g.dim}; });
  const clickSel=async sel=>{ const b=await pg.locator(sel).first().boundingBox(); await pg.mouse.click(b.x+b.width/2,b.y+b.height/2); };
  const want=(process.env.SHOTS||'').split(',');
  await pg.fill('#mkName','하늘'); await clickSel('#mkOk'); await pg.waitForTimeout(400);
  const seen={}; let n=0, missTest=false;
  for(let it=0;it<2500;it++){
    const sp=await spot();
    if(sp){
      if(!seen[sp.t]){ seen[sp.t]=1; console.log((sp.press?'PRESS ':'SPOT  ')+sp.t+'  @'+sp.sel); if(want.some(w=>w&&sp.t.includes(w))) await shot('h-'+(n++)); }
      if(sp.press&&sp.r){
        if(!missTest){ missTest=true; await pg.mouse.click(5,400); await pg.waitForTimeout(100); console.log('  tap outside press spot keeps tip:',!!(await spot())); }
        await pg.mouse.click(sp.r.x,sp.r.y);
      } else await pg.click('#spot',{position:{x:10,y:10}});
      await pg.waitForTimeout(140); continue;
    }
    const g=await G();
    if(!seen.demo&&await pg.evaluate(()=>!!(coachCur&&coachCur.fn))){ seen.demo=1; await pg.waitForTimeout(1000); await shot("d-demo"); console.log("DEMO running, taps blocked:",await pg.evaluate(()=>!guideOk(document.querySelector("#recruitBtn")))); }
    if(!g){ if(await pg.evaluate(()=>!document.querySelector('#whyTip').hidden)){ console.log('  BUBBLE',await pg.evaluate(()=>document.querySelector('#whyTip').textContent.replace(/\n/g,' / '))); await pg.waitForTimeout(2600); console.log('  still open after 2.6s:',await pg.evaluate(()=>!document.querySelector('#whyTip').hidden)); await pg.mouse.click(200,300); await pg.waitForTimeout(150); continue; } if(await pg.evaluate(()=>!!coachCur)){ await pg.waitForTimeout(150); continue; } console.log('guide ended; guideDone',await pg.evaluate(()=>prof.guideDone),'stage',await pg.evaluate(()=>battle&&battle.stage),'preFight',await pg.evaluate(()=>preFight)); break; }
    const st=await pg.evaluate(()=>({mk:!document.querySelector('#makeModal').hidden,stage:battle&&battle.stage}));
    if(st.mk){ await pg.waitForTimeout(600); if(await spot()) continue; await pg.fill('#mkName','동료'+it%100); await clickSel('#mkOk'); await pg.waitForTimeout(300); continue; }
    if(!g.dim.length){ await pg.waitForTimeout(120); continue; }
    const d=g.dim[0];
    if(d==='#retryNew'){ console.log('RESULT',await pg.evaluate(()=>document.querySelector('#resultModal .modal-inner').innerText.replace(/\n+/g,' | ')),'waited ms',await pg.evaluate(()=>Date.now()-resultAt)); }
    if(d==='#mSkills'){
      const info=await pg.evaluate(()=>{ const h=battle.heroes[waitHero]; return {names:h.sk.map(s=>s.n),hp:h.hp/h.max,ok:h.sk.map((s,k)=>ready(battle,waitHero,k))}; });
      const b=info.names.indexOf('응급 붕대'); const k=info.hp<.5&&b>=0&&info.ok[b]?b:0;
      await clickSel(`#mSkills .sk[data-k="${k}"]`); await pg.waitForTimeout(120); continue;
    }
    if(d==='#skPop'){ if(!seen.pop){ seen.pop=1; console.log('lit while popup:',JSON.stringify(g.dim)); await shot('h-pop'); } }
    await clickSel(d); await pg.waitForTimeout(200);
  }
  console.log('party',await pg.evaluate(()=>prof.party.map(u=>charById(u).name+':'+rowOf(u)+':Lv'+charById(u).lvl).join(' ')),'gold',await pg.evaluate(()=>prof.gold));
  console.log('recruit btn',await pg.evaluate(()=>[document.querySelector('#recruitBtn').textContent,document.querySelector('#recruitBtn').dataset.why]));
  console.log('fight btn',await pg.textContent('#fightBtn'),'prep hidden',await pg.evaluate(()=>document.querySelector('#prep').hidden));
  await clickSel('#bossAvatar'); await pg.waitForTimeout(150); console.log('boss info:',await pg.evaluate(()=>document.querySelector('#whyTip').hidden?null:document.querySelector('#whyTip').textContent)); await shot('h-info');
  await clickSel('.unit[data-unit="1"]'); await pg.waitForTimeout(150); console.log('ally info:',await pg.evaluate(()=>document.querySelector('#whyTip').textContent));
  console.log('errors',errs); await br.close();
})();
