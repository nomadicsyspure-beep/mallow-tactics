/*ENGINE*/
const SP_MAX=100, SP_REGEN=10, SP_START=50;
const BOSS_HP=1650, BOSS_SPD=120, SWIPE=170, WAVE=260, CHARGE=340;
const HP_MUL=[1,1.25,1.5,1.8,2.1], DMG_MUL=[1,1.07,1.14,1.22,1.3];
/* rows: the front row (next to the boss) hits harder and is the boss's usual target; the back row takes less damage */
const FRONT_DMG=1.2, BACK_TAKEN=.8, FRONT_AIM=.65;
/* adventure map: one boss per stage. cycle = move order, pw = move power */
const GK={boss:'심연의 수문장',ic:'👹',talk:{start:'진정한 심연에 잘 왔다. 순순히 무기를 내려놓아라.',half:'껍질이 갈라진다… 이것이 심연의 힘이다!',die:'문이… 열린다… 너희라면…',win:'심연은 모든 것을 삼킨다.'},hp:BOSS_HP,spd:BOSS_SPD,cycle:['swipe','gaze','wave'],p2:['swipe','shell','gaze','br'],pw:{swipe:SWIPE,wave:WAVE,charge:CHARGE},gk:1,hue:0};
const STAGES=[
  {name:'숲 입구',boss:'말랑 슬라임',ic:'🟢',talk:{start:'말랑… 말랑…',half:'푸딩처럼 흔들려도 안 무너져!',die:'말랑… 녹는다…',win:'말랑말랑 승리~'},hp:100,spd:80,cycle:['swipe'],pw:{swipe:24},hue:100,
    learn:'스킬을 고르고, 공격할 적을 눌러요.'},
  {name:'버섯 언덕',boss:'독버섯',ic:'🍄',mobs:[{name:'포자 덩어리',ic:'🟣',hp:30,spd:90,kind:'poke',pw:12}],talk:{start:'포자 냄새 좋지? 숨 한번 참아 봐!',half:'포자들아, 전부 터뜨려!',die:'버섯은… 다시 자라…',win:'숲의 거름이 되어라.'},hp:200,spd:85,cycle:['swipe','swipe','wave'],pw:{swipe:28,wave:110},hue:300,
    learn:'🌊 광역 공격 예고엔 🧱 버티기!'},
  {name:'늑대 굴',boss:'회색 늑대',ic:'🐺',mobs:[{name:'새끼 늑대',ic:'🐾',hp:120,spd:118,kind:'poke',pw:14},{name:'새끼 늑대',ic:'🐾',hp:120,spd:112,kind:'poke',pw:14}],talk:{start:'아우우— 사냥 시간이다.',half:'무리여, 둘러싸라!',die:'깨갱…',win:'느린 먹잇감이군.'},hp:200,spd:120,cycle:['swipe'],pw:{swipe:30},hue:200,
    learn:'자동 전투 시작! 적을 누르면 집중 공격.'},
  {name:'바위 계곡',boss:'바위 골렘',ic:'🗿',talk:{start:'…침입자 확인. 배제한다.',half:'외피 강화.',die:'기능… 정지…',win:'임무 완료.'},hp:900,spd:105,cycle:['swipe','gaze','wave','swipe','shell'],pw:{swipe:110,wave:130},hue:30,
    learn:'👁️ 응시는 🪨 돌팔매로 끊어 BREAK! 🐚 껍질엔 피해 절반.'},
  {name:'고블린 야영지',boss:'고블린 대장',ic:'👺',mobs:[{name:'고블린 주술사',ic:'🧪',hp:80,spd:92,kind:'heal',pw:50},{name:'고블린 병사',ic:'🪓',hp:90,spd:96,kind:'poke',pw:22}],talk:{start:'이 야영지는 우리 거다! 꺼져!',half:'주술사! 나 좀 고쳐!',die:'대장은… 도망 안 가… 꽥',win:'끌끌, 전리품 챙겨라!'},hp:650,spd:110,cycle:['swipe','swipe','charge'],pw:{swipe:80,charge:110},hue:60,
    learn:'주술사가 대장을 치료해요. 눌러서 먼저 잡아요.'},
  {name:'마녀의 오두막',boss:'숲의 마녀',ic:'🧙',mobs:[{name:'검은 고양이',ic:'🐈‍⬛',hp:110,spd:108,kind:'buff'}],talk:{start:'어머, 귀여운 손님들이네. 차 한 잔 할래?',half:'이제 장난은 끝이야.',die:'내 오두막이… 엉망이 됐잖아…',win:'다음엔 두꺼비로 만들어 줄게.'},hp:1250,spd:115,cycle:['swipe','gaze','wave'],pw:{swipe:125,wave:200},hue:260,
    learn:'🐈‍⬛ 고양이는 마녀의 다음 공격을 강하게 해요.'},
  {name:'심연의 문',...GK,dmg:DMG_MUL[0],muts:1,learn:'반쯤 깎으면 각성해요.'},
  ...[2,3,4,5].map(n=>({name:`심연 ${n}층`,...GK,hp:Math.round(BOSS_HP*HP_MUL[n-1]),dmg:DMG_MUL[n-1],muts:2,learn:`수문장 강화 ${n}단계.`}))
];
const BOSS_MOVES={swipe:'촉수 휘두르기',gaze:'심연 응시',wave:'심연 파동',charge:'심연 돌진',br:'파동 또는 돌진',shell:'껍질 닫기',stun:'기절'};
const BOSS_ICON={swipe:'🐙',gaze:'👁️',wave:'🌊',charge:'💥',br:'❓',shell:'🐚',stun:'💫'};
/* mutations: switched off for now (no stage rolls them); kept for a later return */
const MUTS=[
  {id:'tide',ic:'🌊',n:'파동 강화',d:'심연 파동 피해 +40%'},
  {id:'swift',ic:'⚡',n:'신속',d:'보스 속도 +12'},
  {id:'hide',ic:'🪨',n:'두꺼운 가죽',d:'보스 HP +20%'},
  {id:'fickle',ic:'🎲',n:'변덕',d:'1페이즈부터 응시 뒤 파동 또는 돌진'},
  {id:'daze',ic:'💫',n:'빠른 회복',d:'BREAK 중 추가 피해 ×1.3 → ×1.15'},
  {id:'blight',ic:'🥀',n:'치유 억제',d:'모든 회복량 -50%'},
  {id:'rage',ic:'😡',n:'조기 각성',d:'HP 65%에서 2페이즈'},
  {id:'lash',ic:'🐙',n:'촉수 연타',d:'촉수 휘두르기가 2번 때림 (60% × 2)'}
];
/* skills: ty = category (atk red, cc yellow, heal green, def blue), cd = own turns before it can be used again, lv = level needed to learn. ef keys: dmg hits aoe ignoreShell fire stunBonus execute delay breakGaze taunt guard brace ward heal healSelf healAll sp spGive spAll mark vuln poison inspire haste */
const SKILLS={
  w_punch:{n:'주먹질',pic:'👊',ty:'atk',cost:0,cd:0,lv:1,ef:{dmg:42},tip:'피해 42'},
  w_bandage:{n:'응급 붕대',pic:'🩹',ty:'heal',cost:15,cd:2,lv:1,ef:{healSelf:80},tip:'내 HP +80'},
  w_stone:{n:'돌팔매',pic:'🪨',ty:'cc',cost:15,cd:2,lv:1,ef:{dmg:48,delay:10,breakGaze:1},tip:'피해 48 · 행동 게이지 -10% · 응시를 끊음'},
  w_brace:{n:'버티기',pic:'🧱',ty:'def',cost:12,cd:2,lv:1,ef:{brace:1,sp:30},tip:'보스가 공격할 때까지 받는 피해 -50% · SP도 30을 채워줘요!'},
  k_slash:{n:'견습 베기',pic:'⚔️',ty:'atk',cost:0,cd:0,lv:5,ef:{dmg:40},tip:'피해 40'},
  k_guard:{n:'가드 올리기',pic:'🛡️',ty:'def',cost:20,cd:2,lv:5,ef:{guard:1},tip:'보스가 공격할 때까지 받는 피해 -70% · 공격을 혼자 대신 맞음'},
  k_taunt:{n:'유인 외침',pic:'📣',ty:'cc',cost:25,cd:3,lv:6,ef:{breakGaze:1,taunt:1},tip:'응시를 끊어 BREAK · 아니면 보스 공격을 대신 맞음'},
  k_bash:{n:'방패 밀치기',pic:'🔰',ty:'cc',cost:25,cd:2,lv:8,ef:{dmg:60,delay:35},tip:'피해 60 · 행동 게이지 -35%'},
  m_bolt:{n:'마력 화살',pic:'✨',ty:'atk',cost:0,cd:0,lv:5,ef:{dmg:72},tip:'피해 72'},
  m_fire:{n:'어둠 화염',pic:'🔥',ty:'atk',cost:35,cd:2,lv:5,ef:{dmg:170,ignoreShell:1,fire:1},tip:'피해 170 · 껍질 무시'},
  m_focus:{n:'마력 집중',pic:'💠',ty:'heal',cost:0,cd:3,lv:6,ef:{sp:45},tip:'내 SP +45'},
  m_storm:{n:'화염 폭풍',pic:'🌋',ty:'atk',cost:40,cd:3,lv:8,ef:{dmg:85,aoe:1,fire:1},tip:'모든 적에게 피해 85'},
  h_smite:{n:'빛 타격',pic:'☀️',ty:'atk',cost:0,cd:0,lv:5,ef:{dmg:30},tip:'피해 30'},
  h_heal:{n:'단일 치유',pic:'💚',ty:'heal',cost:22,cd:1,lv:5,ef:{heal:130},tip:'HP가 가장 낮은 아군 HP +130'},
  h_ward:{n:'견습 보호막',pic:'🌙',ty:'def',cost:30,cd:3,lv:6,ef:{ward:'team'},tip:'아군 전원: 다음에 받는 피해 -50%'},
  h_rain:{n:'치유의 비',pic:'🌧️',ty:'heal',cost:35,cd:3,lv:8,ef:{healAll:60},tip:'아군 전원 HP +60'},
  a_shot:{n:'짧은 사격',pic:'🏹',ty:'atk',cost:0,cd:0,lv:5,ef:{dmg:57},tip:'피해 57'},
  a_rapid:{n:'연속 사격',pic:'🎯',ty:'atk',cost:28,cd:2,lv:5,ef:{dmg:40,hits:3,stunBonus:1.6},tip:'40 × 3연타 · BREAK 중이면 1.6배'},
  a_aim:{n:'집중 조준',pic:'🔍',ty:'cc',cost:18,cd:3,lv:6,ef:{mark:1},tip:'보스 약점 표식: 2턴간 받는 피해 +25%'},
  a_volley:{n:'화살비',pic:'🌠',ty:'atk',cost:28,cd:2,lv:8,ef:{dmg:55,aoe:1},tip:'모든 적에게 피해 55'}
};
/* jobs: everyone starts as a wanderer and picks one of four jobs at Lv5 (advanced jobs come later). basic = free attack, skills = learnable list */
const HERO_DB={
  wanderer:{name:'방랑자',icon:'방',role:'모험가 · 만능',hp:290,spd:100,fx:'slash',color:'#c9b48a',spr:'fighter',basic:'w_punch',skills:['w_bandage','w_brace','w_stone'],
    trait:'무엇이든 될 수 있는 초보 모험가. Lv5에 전직해요.',tip:'방랑자 스킬은 전직 후에도 쓸 수 있어요.'},
  knight:{name:'검사',icon:'검',role:'전열 · 보호',hp:360,spd:90,fx:'slash',color:'#9fc3ec',spr:'knight',basic:'k_slash',skills:['k_guard','k_taunt','k_bash'],
    trait:'단단하고 느려요. 가드로 동료 대신 맞아요.',tip:'보스 강공격 예정 → 가드 올리기'},
  mage:{name:'마법사',icon:'마',role:'후열 · 화력',hp:210,spd:104,fx:'orb',color:'#9a7bff',spr:'mage',basic:'m_bolt',skills:['m_fire','m_focus','m_storm'],
    trait:'팀의 주력 화력. 체력이 낮아요.',tip:'보스 껍질 닫힘 → 어둠 화염'},
  healer:{name:'치유사',icon:'치',role:'후열 · 회복',hp:235,spd:96,fx:'light',color:'#53c79a',spr:'healer',basic:'h_smite',skills:['h_heal','h_ward','h_rain'],
    trait:'다친 아군을 치료하고 보호막을 쳐요.',tip:'보스 강공격 예정 → 견습 보호막'},
  archer:{name:'궁수',icon:'궁',role:'후열 · 화력',hp:255,spd:112,fx:'arrow',color:'#4dc7c4',spr:'archer',basic:'a_shot',skills:['a_rapid','a_aim','a_volley'],
    trait:'빠른 사수. BREAK 중 연속 사격이 강해요.',tip:'보스 BREAK 중 → 연속 사격'}
};
const JOB_IDS=Object.keys(HERO_DB).filter(j=>j!=='wanderer');
