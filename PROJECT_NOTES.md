# PROJECT_NOTES — 말랑 작전실 (MALLOW / TACTICS)

새 세션이나 대화 압축 뒤에는 이 파일부터 읽는다. 결정이 바뀌면 해당 문서도 같이 고친다.
설계 원칙(규칙)은 `DESIGN.md`. 새 기능은 그 9장의 검토 질문으로 판단한다.
**작업에 필요한 문서 · 코드 파일만 골라 읽는다** (아래 "어디를 읽을까").

## 핵심 게임 루프 (모든 패치의 기준)
1. 보스 특징 파악 → 2. 4명 행동 규칙(패턴) 설정 → 3. 자동전투 관찰 → 4. 패배 원인 분석 → 5. 전략 수정 후 재도전(예측 성공 → 처치 → 성취감)

## 어디를 읽을까
| 작업 | 규칙 문서 | 코드 |
|---|---|---|
| 전투 규칙 · 스킬 · 자동/수동 · 타겟 | `docs/rules-battle.md` | `src/engine/`, `src/battle/` |
| 튜토리얼 · 안내 모드 · 팁 | `docs/rules-tutorial.md` | `src/tutorial/` + 팁이 뜨는 파일 |
| 캐릭터 · 동료 · 전직 · 장비 · 보상 | `docs/rules-growth.md` | `src/screens/`, `src/game/profile.js` |
| 스테이지 · 보스 · 밸런스(콘텐츠 추가) | `docs/rules-stages.md` | `src/engine/data.js`, `tools/sim.js` |
| 파일 · 함수 위치 | `docs/CODEMAP.md` | |
| 지난 패치 내역 | `docs/HISTORY.md` | |

## 파일 구조
- `src/`: **게임 코드 원본. 수정은 여기서만.** 영역별 조각 파일(지도: `docs/CODEMAP.md`)
  - `src/assets/sprites.js`: 직업 스프라이트 그림(약 44만 자). **절대 읽지 말 것**
- `tools/build.py`: 조각을 합쳐 `mallow-tactics.html`(아티팩트용, doctype/head 없음) + `index.html`(브라우저 실행용)을 만들고 문법 검사. 두 html은 **만들어지는 파일이라 직접 고치지 않는다**
- `tools/sim.js`: 밸런스 시뮬레이션(기본 패턴 자동전투 400판). `ONLY=4 node tools/sim.js`, 수치 실험은 `OV='{"4":{"hp":900}}'`
- `tools/test-guide.js`: 브라우저 테스트, 새 프로필로 1~3스테이지 안내 흐름 전체
- `tools/test-battle.js`: 브라우저 테스트, 3~6스테이지 전투 규칙(수동 시작, 적 정보, 탭 잠금, 보스 격파 후 졸개, 4 돌팔매)
- `README.md`: 구조 · 흐름 설명. `CLAUDE.md`: 작업 원칙(자동으로 읽힘). `DESIGN.md`: 설계 원칙
- 저장: localStorage `-v11` 키(`src/game/profile.js`)

## 작업 방법
1. 필요한 `src/` 파일만 고친다
2. `python3 tools/build.py` (합치기 + 문법 검사)
3. 확인: 수치를 바꿨으면 `node tools/sim.js`, 화면 흐름을 바꿨으면 `node tools/test-battle.js` / `node tools/test-guide.js` (끝에 `errors []`면 오류 없음). 테스트가 새 규칙과 안 맞으면 테스트도 고친다
4. 결정이 바뀌면 `docs/rules-*.md`, 패치 내역은 `docs/HISTORY.md` 맨 위에 추가
- 요청한 부분만 최소 수정, 잘 되던 기능은 건드리지 않기
- 브랜치: `claude/progress-summary-5-lines-zj6g1q`

## UI 원칙
- 모바일 작은 화면, 글은 최소. 작은 글씨 안내 UI 대신 전투 중 스포트라이트 튜토리얼(나머지 어둡게, 터치로 넘김, 프로필당 1회)
- 스크롤바 숨김. 현재 차례: 아군 금색 테두리+「▶ 차례」(수동 대기 중엔 나머지 어둡게), 적은 빨간 테두리
- 결과창: 캐릭터 EXP → 골드 → 획득 아이템(아이콘만, 누르면 상세)
- 지도 화면에서는 하단 스킬바·전투 버튼 숨김. 전투 로그는 시작부터 위→아래
- 비활성 버튼은 `setWhy(btn,이유)`/`whyAttr(이유)`로 만든다: 눌러도 동작 대신 이유 말풍선(`#whyTip`)이 뜸 (예: 닉네임 없이 데려오기 → '닉네임을 설정하세요.')
- 잠긴 탭을 누르면 화면은 그대로, 이유 말풍선만
