/* balance check: runs the default-pattern auto battle many times per stage (engine only, no browser)
   node tools/sim.js                 all stages
   ONLY=4,5 node tools/sim.js        some stages
   OV='{"4":{"hp":900,"pw":{"swipe":100}}}' node tools/sim.js   try numbers without editing the game
   reads the built mallow-tactics.html: run tools/build.py first */
const fs=require('fs');
const src=fs.readFileSync(process.argv[2]||require('path').join(__dirname,'../mallow-tactics.html'),'utf8');
const eng=src.slice(src.indexOf('/*ENGINE*/'),src.indexOf('/*END ENGINE*/'));
eval(eng+';global.E={STAGES,DEFAULT_RULES,HERO_DB,simulate};');
const {STAGES,DEFAULT_RULES,HERO_DB}=E; const sim=E.simulate;
const OV=JSON.parse(process.env.OV||'{}'); for(const k in OV){ const st=STAGES[k-1], o=OV[k]; for(const f of ["hp","spd","cycle"]) if(o[f]) st[f]=o[f]; if(o.pw) st.pw=Object.assign({},st.pw,o.pw); if(o.mobhp) st.mobs.forEach((m,i)=>m.hp=o.mobhp[i]??o.mobhp[0]); if(o.mobpw) st.mobs.forEach((m,i)=>m.pw=o.mobpw[i]??o.mobpw[0]); }
function hero([job,lvl,row,equip,rules,gear]){ const hd=HERO_DB[job], lv=1+.06*(lvl-1), g=gear||{}; return {cfg:{uid:'x',job,name:job,maxhp:Math.round(hd.hp*lv*(1+(g.a||0)/100)),dmg:+(lv*(1+(g.w||0)/100)).toFixed(3),spd:hd.spd+(g.s||0),row,skills:[hd.basic,...equip]},rules:rules||DEFAULT_RULES[job]}; }
function run(label,stage,spec,N=400){
  let w=0,rounds=0,down=0,hp=0; const why={};
  for(let n=0;n<N;n++){ const hs=spec.map(hero); const b=sim({party:hs.map(h=>h.cfg),rules:hs.map(h=>h.rules),targets:hs.map(()=>'mob'),stage,muts:[],seed:n*7919+1});
    if(b.over==='win'){ w++; rounds+=b.round; down+=b.stats.down; hp+=b.heroes.reduce((a,h)=>a+h.hp/h.max,0)/b.heroes.length; } else why[b.reason]=(why[b.reason]||0)+1; }
  const k=Math.max(1,w); console.log(`${String(stage).padStart(2)} ${label.padEnd(22)} win ${String(Math.round(w/N*100)).padStart(3)}% r ${(rounds/k).toFixed(1)} down ${(down/k).toFixed(2)} hp ${Math.round(hp/k*100)}%`,JSON.stringify(why));
}
const W=['w_bandage','w_brace','w_stone'];
const only=(process.env.ONLY||'').split(',').filter(Boolean).map(Number), go=st=>!only.length||only.includes(st);
const P=(s,b)=>[['lowSelf','w_bandage'],['bossBig','w_brace'],['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch']];
const NOHEAL=[['bossBig','w_brace'],['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch']];
const NOTHING=[['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch']];
const HEAL1=[['lowSelf30','w_bandage'],['bossBig','w_brace'],['always','w_punch'],['always','w_punch'],['always','w_punch'],['always','w_punch']];
if(go(1)) run('solo L1 punch+bandage',1,[['wanderer',1,'F',['w_bandage']]]);
if(go(2)){ run('solo L2 heal+brace',2,[['wanderer',2,'F',['w_bandage','w_brace'],P()]]); run('solo L2 heal@30+brace',2,[['wanderer',2,'F',['w_bandage','w_brace'],HEAL1]]); run('solo L2 brace, no heal',2,[['wanderer',2,'F',['w_bandage','w_brace'],NOHEAL]]); run('solo L2 punch only',2,[['wanderer',2,'F',['w_bandage','w_brace'],NOTHING]]); run('solo L2 brace>heal',2,[['wanderer',2,'F',['w_bandage','w_brace'],[['bossBig','w_brace'],['lowSelf','w_bandage'],...NOTHING.slice(2)]]]); run('solo L2 heal no brace',2,[['wanderer',2,'F',['w_bandage'],[['lowSelf','w_bandage'],...NOTHING.slice(1)]]]); }
const party=(l,lb)=>[['wanderer',l,'F',W],['wanderer',lb,'B',W],['wanderer',lb,'F',W],['wanderer',lb,'B',W]];
if(go(3)) run('4 wand L3',3,party(3,3));
if(go(4)){ run('4 wand L4/L3',4,party(4,3)); run('4 wand L3',4,party(3,3)); }
if(go(5)){ run('4 wand L4',5,party(4,4)); run('4 wand L4/L3',5,party(4,3)); run('4 wand L3',5,party(3,3)); }
const fresh=l=>[['knight',l,'F',['w_bandage','w_stone','k_guard']],['archer',l,'F',['w_bandage','w_stone','a_rapid']],['mage',l,'B',['w_bandage','w_stone','m_fire']],['healer',l,'B',['w_bandage','w_stone','h_heal']]];
if(go(6)){ run('fresh jobs L5',6,fresh(5)); run('4 wand L5',6,party(5,5)); run('fresh jobs L6',6,fresh(6)); }
const grown=l=>[['knight',l,'F',['k_guard','k_taunt','w_bandage']],['archer',l,'F',['a_rapid','a_aim','w_stone']],['mage',l,'B',['m_fire','m_focus','w_stone']],['healer',l,'B',['h_heal','h_ward','w_stone']]];
if(go(7)){ for(const l of [5,6,7,8]) run('fresh jobs L'+l,7,fresh(l)); for(const l of [6,7,8,9]) run('grown jobs L'+l,7,grown(l)); }
if(go(66)){ for(const l of [5,6,7]) run('grown jobs L'+l,6,grown(l)); }
