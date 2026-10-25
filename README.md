# 회계사 엑셀 훈련소

신입부터 파트너까지, 실제 키 입력으로 익히는 Windows Excel 단축키 훈련 웹앱입니다.

**[훈련 시작하기](https://soyeon-sy-lee.github.io/shortcut-to-partner/)**

## 주요 기능

- **회계 실무 중심 학습:** 핵심 기능을 우선 반복하며 배우기·기억하기·실무 미션·60초 도전을 제공합니다.
- **두 가지 실행 경로:** 기본 단축키와 사용자 지정 빠른 실행 도구 모음(Alt → 숫자)을 함께 연습합니다.
- **미니 엑셀:** 셀 선택·값·수식 입력, 클릭 셀 참조, 범위와 다른 시트 참조, 재계산을 지원합니다.
- **결과가 보이는 실습:** 추적 화살표, 선택하여 붙여넣기, 행·열 선택과 크기 조절, 숨김·숨김 해제, 여러 시트 이동을 직접 확인합니다.
- **키보드별 안내:** ThinkPad X1, Logitech K580, MX Keys Mini, Apple 키보드와 OS·기능 키 설정을 선택합니다.
- **성장 시스템:** 학습자 이름·소속·XP·영문 직급을 표시하고 승진 시 축하 팝업과 색종이 효과를 보여줍니다.
- **집중하기 쉬운 화면:** 현재 미션은 스크롤 중에도 고정되며, 입력한 키는 초록색으로 표시됩니다.

## 시작하기

웹사이트는 로그인 없이 이용할 수 있습니다. 이름·소속·학습 기록·키보드 설정은 사용하는 브라우저에 저장됩니다.

로컬 개발에는 Node.js 24를 권장합니다(최소 22). 외부 npm 의존성이 없어 설치 과정 없이 실행할 수 있습니다.

```sh
git clone https://github.com/soyeon-sy-lee/shortcut-to-partner.git
cd shortcut-to-partner
npm run dev
```

브라우저에서 `http://127.0.0.1:8000/`을 엽니다. 종료하려면 Ctrl+C를 누릅니다.

## 검사

```sh
npm run check
npm test
```

정적 파일 경로·JavaScript 문법과 게임 동작, 기본 단축키·빠른 실행 경로, 수식·학습자·회계 학습 회귀 검사를 실행합니다. 결과 파일은 `test-results/`에 생성됩니다.

## 프로젝트 구조

| 경로 | 역할 |
| --- | --- |
| `docs/` | 빌드 없이 배포하는 HTML·CSS·JavaScript |
| `tests/` | 단축키와 학습 기능 회귀 검사 |
| `scripts/` | 정적 검사, 테스트 실행기, 로컬 서버 |
| `.github/workflows/pages.yml` | 검사와 GitHub Pages 자동 배포 |
| `guides/DEVELOPMENT.md` | 기능별 수정 위치와 지원 범위 |
| `guides/DEPLOYMENT.md` | 운영 주소, 배포 흐름과 문제 해결 |
| `RELEASE.json` | 릴리스 정보와 배포 파일 SHA-256 |

## 배포

`main`에 커밋을 푸시하면 **Check and deploy Shortcut to Partner** 워크플로가 검사 후 `docs/`를 GitHub Pages에 배포합니다. PR에서는 검사만 실행합니다. 배포 결과는 저장소 Actions에서 확인합니다.

## 지원 범위와 저장

실습판은 각 시트 A1:H12를 사용하는 학습용 시뮬레이터입니다. 실제 Excel 전체 기능이나 XLSX 파일 저장을 제공하지 않습니다. 지원 함수와 상세 범위는 [개발 가이드](guides/DEVELOPMENT.md)를 참고하세요.

기록은 브라우저의 localStorage에 저장되므로 다른 브라우저·기기·도메인과 자동으로 동기화되지 않습니다. 사이트 데이터를 지우면 기록이 사라질 수 있습니다. OS와 키보드가 먼저 처리하는 입력은 Fn 설정이나 Ctrl 보조 입력 안내를 확인하세요.

## 버그 신고·문의

이소연 · [soyeon.lee1@kr.ey.com](mailto:soyeon.lee1@kr.ey.com)

사용한 OS·브라우저·키보드 기종, 미션과 재현 순서를 함께 알려주세요.
