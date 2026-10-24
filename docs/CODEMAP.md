# CODEMAP: 무엇을 고치려면 어느 파일을 볼까

게임 코드는 `src/`에 조각으로 나뉘어 있다. `python3 tools/build.py`가 조각을 `src/page.html`의 `@@include` 순서대로 이어 붙여 `mallow-tactics.html`과 `index.html`을 만든다.
- 모든 스크립트는 한 `<script>` 안에서 이어지므로 **전역 이름을 공유**한다. 다른 파일의 함수를 그냥 부를 수 있고, 같은 최상위 이름을 두 번 선언하면 안 된다.
- 파일 순서가 실행 순서다. 최상위에서 바로 실행되는 코드(`$('#x').onclick=…`, `let` 초기값)는 앞 파일의 값만 쓸 수 있다. 함수 안에서는 순서 상관없다.
- 새 파일을 만들면 `src/page.html`에 `@@include` 줄을 넣는다.
- **`src/assets/sprites.js`는 절대 읽지 않는다**(그림 데이터 약 44만 자).

## 자주 하는 작업 → 볼 파일

| 하고 싶은 것 | 파일 |
|---|---|
| 보스·졸개·스테이지 수치, 새 스테이지 | `engine/data.js` (`STAGES`, `GK`), 대사 `talk` 포함 |
| 새 스킬 · 직업, 스킬 수치 | `engine/data.js` (`SKILLS`, `HERO_DB`) → 효과 처리는 `engine/rules.js` `doHero` |
| 보스 행동 · 타겟 · 피해 계산 · BREAK · 승패 | `engine/rules.js` |
| 작전 조건(이럴 때) · 기본 패턴 | `engine/rules.js` (`CONDS`, `DEFAULT_RULES`) |
| 밸런스 확인 | `node tools/sim.js` (엔진만, 화면 없이) |
| 전투 화면 표시(보스 상태 문구, HP, 졸개, 아군) | `battle/view.js` |
| 스킬바 · 설명 창 · 타겟 고르기 · 적/아군 누르기 | `battle/skillbar.js` |
| 행동 연출 · 로그 문구 · 배너 | `battle/playback.js`, 효과 함수는 `battle/fx.js` |
| 전투 진행 · 자동/수동 · 튜토리얼 강제 스킬 | `battle/loop.js` (`pump`, `setButtons`, `tutForce`) |
| 전투 준비 · 전투 전 안내 팁 | `battle/setup.js` (`battleTips`, `setupBattle`) |
| 결과창 · 보상 · 경험치 · 지도 안내 팁 | `battle/result.js` (`finish`, `goTips`) |
| 탭 잠금 · 해금 스테이지 · 비활성 버튼 이유 | `game/unlocks.js` |
| 스포트라이트 팁 동작 | `tutorial/coach.js` (팁 문구는 그 팁이 뜨는 파일에 있다) |
| 안내 모드(누를 곳만 밝힘) · 전직 안내 | `tutorial/guide.js` |
| 캐릭터 탭(배치 · 상세 · 스킬 · 장비 · 교체) | `screens/characters.js` |
| 전직 창 | `screens/jobcard.js` |
| 캐릭터 생성 · 동료 데려오기 | `screens/maker.js`, 외형 재채색은 `game/looks.js` |
| 작전 · 가방 · 보스(도감) 탭 | `screens/strategy.js`, `screens/inventory.js`, `screens/bestiary.js` |
| 탭 이동 · 자동 버튼 · 설정 · 탭 첫 안내 | `screens/nav.js` |
| 지도(스테이지 고르기) · 출발 버튼 | `screens/map.js` |
| 저장 데이터 · 장비 · 레벨 · 보상 공식 | `game/profile.js` |
| 버튼 · 창 배치(HTML) | `src/page.html` |
| 모양(CSS) | `style/*.css` (아래 표) |

## 파일별 내용 (실행 순서)

### 화면 뼈대와 모양
| 파일 | 내용 |
|---|---|
| `page.html` | `<head>` 메타, 화면 HTML(상단바, 전투 무대, 지도, 탭 화면, 창들), `@@include` 목록 |
| `style/base.css` | 색 변수, 기본 레이아웃(한 손 화면 세로 칸) |
| `style/battle.css` | 전투 무대: 보스, 졸개, 아군 2×2, 차례 표시, 컷신, 애니메이션 |
| `style/skillbar.css` | 하단 스킬바, 설명 창, 캐릭터 탭 버튼 |
| `style/screens.css` | 지도 · 캐릭터 · 작전 · 가방 · 도감 화면 |
| `style/modals.css` | 결과 · 설정 · 로그 · 생성 · 전직 창, 스포트라이트, 말풍선 |

### 전투 엔진 (화면과 무관, `/*ENGINE*/ … /*END ENGINE*/`)
| 파일 | 내용 |
|---|---|
| `engine/data.js` | 상수(SP, 전열/후열 배율), `GK`(심연), `STAGES`, `BOSS_MOVES`, `BOSS_ICON`, `MUTS`(꺼 둠), `SKILLS`, `HERO_DB`, `JOB_IDS` |
| `engine/rules.js` | `rng`, 보스 패턴(`cycle`, `intent`, `preview`), `CONDS`, `DEFAULT_RULES`, `newBattle`, 조준(`rollRow`, `aimOf`), 행동 순서(`actors`, `nextActor`, `orderPreview`), `snap`, 타겟(`pickTarget`), 스킬 고르기(`valid`, `ready`, `pickSkill`), 피해(`hitBoss`, `hitMob`, `hurtHero`), `doHero`, `bossTurn`, `mobTurn`, `step`(승패, `bossDown`), `simulate` |

### 게임 기반
| 파일 | 내용 |
|---|---|
| `assets/sprites.js` | `SPRITES` 그림 데이터 — **읽지 말 것** |
| `game/looks.js` | 외형: `HAIRS`, `SKINS`, `spr`, `recolor`(머리 · 피부 재채색) |
| `game/profile.js` | `$`, 저장 키, 상수(`MANUAL_FROM`, `TUTORIAL_STAGES`, `EQUIP_SLOTS`, `BG_STAGE`, `FREE_RECRUITS`, `RECRUIT_GOLD`, `DROP_FROM`), `prof` 불러오기, 장비(`SLOT`, `GEAR_VAL`, `rollItem`), `charStats`, `sortSkills`, `expNeed`, `rewardFor`, `gainExp` |
| `game/state.js` | 전투 화면 상태 변수(`battle`, `evq`, `autoMode` …), `at`, `later`, `retrigger`, `isTutorial`, `canAuto`, `isManual`, `moveName`, `tutSkills`, `makeCfg` |

### 전투 화면
| 파일 | 내용 |
|---|---|
| `battle/view.js` | `buildParty`, `renderHeroes`(HP 낮음 팁 포함), `statusOf`(보스 상태 문구), `renderBoss`(응시 · BREAK · 껍질 팁), 집중 공격(`renderFocus`, `setFocus`), `buildMobs`, `bossSay` |
| `tutorial/coach.js` | 스포트라이트: `coach`, `coachDo`, `glow`, `nextCoach`, `placeSpot`, `scrollToSee`, `#spot` 누르기 |
| `battle/hud.js` | `animateFill`(행동 게이지), `renderSnap`, `renderWallet` |
| `battle/skillbar.js` | `renderSkillPanel`, `renderSkPop`, 스킬 누르기 · 쓰기(`useSkill`, `autoTgt`, `setTgtPick`, `commitChoice`), 보스 · 졸개 · 아군 누르기, `infoTip`, `bossInfo`, `mobInfo`, `heroInfo` |
| `battle/fx.js` | 로그 기록(`addLog`, `addSum`), 효과(`popNum`, `sparks`, `shoot`, `banner`, `toast`, `bossHit`), 컷신 |
| `battle/playback.js` | 이벤트 재생: `delayOf`, `play`, `playInner`(독 · 페이즈 · 보스 격파 · 승리), `playMob`, `playAct`, `playBoss` |
| `battle/loop.js` | `pump`(다음 행동 · 수동 대기 · 차례 팁), `setButtons`, `tutForce`, `unlockBrace`, `pause`, `start` |
| `battle/setup.js` | `preFight`, `battleTips`(스테이지별 전투 전 팁), `enterBattle`, 배속, `setupBattle`, `openPrep` |
| `game/unlocks.js` | `TUTORIAL_END`, `JOB_TUT_STAGE`, `TABS_STAGE`, `RECRUIT_STAGE`, `tabOpen`, `tabLockWhy`, `needRecruit`, `fightLock`, `renderNav`, `setWhy`, `whyAttr`, `whyTip` |
| `screens/map.js` | `renderPrep`(지도 목록), 출발 버튼 |
| `battle/result.js` | `applyExp`, `fillRewards`, `showResult`, `finish`(승패 처리 · 전직 안내 시작), `hintFor`, 다시 버튼, `goTips`(지도 팁), `repeatRun`(꺼 둠) |

### 탭 화면
| 파일 | 내용 |
|---|---|
| `screens/jobcard.js` | 안내 카드(`openIntro`), 전직 창(`openJobPicker`, `changeJob`) |
| `screens/logsheet.js` | 전투 로그 창 |
| `screens/characters.js` | `charTab`(출전/대기), `renderCharacters`, `renderDetail`, 배치(`placeAt`, 드래그, `dragDemo`) |
| `screens/inventory.js` | 가방 |
| `screens/strategy.js` | 작전(패턴 편집) |
| `screens/bestiary.js` | 보스 도감 |
| `screens/nav.js` | `goto`, 탭 버튼, `TAB_TIPS`, 자동/수동 버튼, 설정 창, `firstTips` |
| `tutorial/guide.js` | 안내 모드: `guideOn`, `jobTutOn`, `guideSel`, `guideOk`, `drawGuide`, `SHOW_RESULT_MS` |
| `screens/maker.js` | 캐릭터 생성 창, 데려오기 버튼 |
| `game/boot.js` | 시작 시 첫 화면 |

## 관련 규칙 문서
- 전투: `docs/rules-battle.md`
- 튜토리얼: `docs/rules-tutorial.md`
- 성장 · 캐릭터: `docs/rules-growth.md`
- 스테이지 · 밸런스: `docs/rules-stages.md`
