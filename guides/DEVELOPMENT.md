# 개발 및 운영

## 실행 구조

`docs/index.html`이 CSS와 JavaScript를 상대 경로로 로드합니다. 모듈 번들러나 서버 API가 없으므로 GitHub Pages 프로젝트 경로에서도 실행됩니다. 새 파일을 추가할 때 `/app.js` 같은 루트 절대 경로 대신 `app.js` 같은 상대 경로를 사용하세요.

JavaScript는 공유 전역 함수를 사용하므로 `index.html`의 스크립트 로드 순서를 유지하세요.

| 수정할 부분 | 파일 |
| --- | --- |
| 화면 흐름·점수·직급·미션 | `docs/app.js` |
| 추가 단축키 등록 | `docs/extra.js` |
| 회계 학습 범위·선정 출처 | `docs/accounting.js` |
| 미니 엑셀·선택·키 입력 | `docs/sim.js` |
| 수식 계산·클릭 셀 참조·함수 | `docs/formulas.js` |
| 추적 화살표·의존 관계 | `docs/trace.js` |
| 셀 렌더링 | `docs/grid.js` |
| 붙여넣기·행열·시트·기타 동작 | `docs/paste.js`, `dimensions.js`, `worksheets.js`, `actions.js`, `dialogs.js`, `exercises.js` |
| 키보드 기종·Fn·Ctrl 보조 입력 | `docs/keyboard.js` |
| 학습자 프로필·EY 색상 조건·승진 팝업 | `docs/learner.js` |
| 화면 스타일·EY 색상·색종이 효과 | `docs/style.css`, `accounting.css`, `formulas.css` |
| 문의 연락처 | `docs/index.html`의 `.support-contact` |

## 실제 Excel과 다른 범위

- 학습판 범위는 각 시트 A1:H12입니다. 전체 Excel 엔진을 포함하지 않습니다.
- 지원 함수: SUM, AVERAGE, MIN, MAX, COUNT, ROUND, ABS, IF.
- 셀 참조·절대참조·범위·현재 통합문서의 다른 시트, 산술·비교·문자열 연결을 지원합니다. 외부 파일 참조는 지원하지 않습니다.
- 저장/다른 이름 저장은 브라우저에 실습 통합문서를 보관합니다. 실제 XLSX 파일 저장은 아닙니다.
- OS가 선점하는 키나 키보드가 음량 키로 보내는 입력은 웹사이트가 바꿀 수 없습니다. Fn 설정과 Ctrl 보조 입력을 사용합니다.
- Fn은 보통 하드웨어에서 처리되므로 웹앱은 Fn의 눌림 자체 대신 브라우저에 전달된 F2 등의 키로 판정합니다.

## 저장 위치

| localStorage 키 | 저장하는 것 |
| --- | --- |
| `ledgerkeys-v1` | 학습자·QAT 구성·XP·기록·학습 범위 |
| `ledgerkeys-keyboard` | 선택한 키보드·OS·기능 키 입력 방식 |
| `ledgerkeys-ctrl-assist` | Ctrl 나눠 누르기 설정 |
| `ledgerkeys-workbook` | 사용자가 저장한 미니 엑셀 통합문서 |

서버 업로드나 사용자 간 공유는 없습니다. 문의 주소는 `mailto:` 링크이며 사이트가 메일을 직접 보내지는 않습니다.

## 변경 검증

수정 후 `npm test`를 실행합니다. 이 검사는 게임의 모델과 키 이벤트를 검증하며, 운영체제별 실제 키 가로채기나 시각적 배치를 모두 검증하는 것은 아닙니다. 기능 키·스크롤·팝업 등 UI 수정은 실제 브라우저에서도 확인하세요.

새 `docs` 파일을 추가하거나 기존 파일을 수정하면 `RELEASE.json`은 최초 패키지 스냅샷 기록으로 남습니다. 배포 시 이 해시를 강제하지 않으므로 유지보수를 막지 않습니다.
