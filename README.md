# Ledger Keys · 회계사 엑셀 훈련

Windows Excel 단축키를 실제 키 입력으로 익히는 정적 웹앱입니다. 로그인, 서버, 데이터베이스, API 키 없이 동작합니다. HTML·CSS·JavaScript 전체 소스와 GitHub Pages 배포 설정을 포함합니다.

## GitHub 계정을 ChatGPT에 연결하지 않고 배포하기

이 저장소를 본인 GitHub 계정에 직접 올리면 됩니다. ChatGPT와 GitHub를 연결하거나 개인 액세스 토큰을 입력할 필요가 없습니다. 이후 배포는 GitHub가 처리합니다.

**최초 한 번은 GitHub Pages 설정이 필요합니다. ZIP 업로드 자체가 Pages를 활성화하지는 않습니다.**

1. ZIP을 압축 해제합니다. ZIP 파일 자체를 GitHub에 올리면 배포되지 않습니다.
2. GitHub에서 새 저장소를 만듭니다. 저장소명은 `ledger-keys`를 권장하며 다른 이름도 가능합니다. GitHub Free 계정이면 Public 저장소를 사용합니다.
3. 압축 해제한 폴더의 **내용물**을 저장소 루트에 업로드하고 `main` 브랜치에 커밋합니다. 저장소 첫 화면에 `README.md`, `package.json`, `docs`, `tests`, `scripts`, `.github`가 보여야 합니다. `ledger-keys-github-pages` 폴더 자체를 한 겹 더 올리지 마세요.
4. **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
5. **Actions → Check and deploy Ledger Keys → Run workflow → main → Run workflow**를 누릅니다. 처음 업로드로 이미 배포가 성공했다면 다시 실행하지 않아도 됩니다. Pages 설정 전에 실패했다면 이 단계로 재실행합니다.
6. 배포가 성공하면 **Settings → Pages → Visit site** 또는 Actions의 `github-pages` 링크로 접속합니다.

파일 업로드 시 `.github/workflows/pages.yml`도 꼭 포함하세요. 일부 파일 탐색기는 점으로 시작하는 폴더를 숨깁니다. 이 폴더가 빠졌다면 GitHub의 **Add file → Create new file**에서 `.github/workflows/pages.yml`을 만들고 패키지의 같은 파일 내용을 붙여넣어도 됩니다.

일반 프로젝트 사이트 주소는 `https://GITHUB_ID.github.io/REPOSITORY_NAME/` 형식입니다. `GITHUB_ID.github.io`라는 저장소를 만들면 계정 루트 사이트로 사용할 수 있습니다. 정확한 배포 주소는 GitHub Pages가 표시하는 링크를 사용하세요.

이후 `main` 또는 `master`의 기본 브랜치에 변경 사항을 올리면 테스트 후 자동 배포합니다. 다른 이름의 기본 브랜치를 사용한다면 `.github/workflows/pages.yml`의 `on.push.branches`도 수정하세요. PR에서는 테스트만 실행합니다. 추가 배포 토큰이나 별도 Secrets는 필요하지 않습니다.

## 브라우저 업로드만으로 배포하는 대안

`.github` 폴더를 올리지 않고 간단하게 시작하려면 `docs` 폴더와 그 안의 모든 파일을 업로드한 뒤 **Settings → Pages → Source: Deploy from a branch → main → /docs → Save**를 선택해도 됩니다. 이 방식은 기능 테스트를 거치지 않고 `docs`의 정적 파일을 게시합니다.

이 대안과 위 Actions 배포 방식 중 하나만 사용하세요. 이미 `pages.yml`을 올렸다면 먼저 **Actions → Check and deploy Ledger Keys → … → Disable workflow**에서 끈 뒤 branch 방식으로 전환하세요.

## 포함된 기능

- Windows Excel 단축키 96개, 기본 경로와 사용자 지정 빠른 실행 도구(Alt → 숫자) 훈련
- 회계 실무 집중 학습, 배우기·기억하기·실무 미션·60초 도전
- A1:H12 미니 엑셀, 값·수식 입력, 클릭 셀 참조·범위·다른 시트 참조와 재계산
- 원본·참조 수식 추적 화살표, 선택하여 붙여넣기 창, 행·열 크기와 숨김, 여러 시트
- 스크롤 중 고정되는 미션, 입력 키의 초록색 진행 표시
- ThinkPad X1·Logitech K580·MX Keys Mini·Apple 등 키보드 선택과 Fn 안내
- 학습자 이름·소속, XP·영문 직급, 승진 팝업과 색종이 효과
- 소속에 `EY` 또는 `한영`이 들어가면 연하고 반투명한 노란색 학습자 카드
- 문의 연락처: 이소연 · [soyeon.lee1@kr.ey.com](mailto:soyeon.lee1@kr.ey.com)

## 저장소 구성

| 경로 | 역할 |
| --- | --- |
| `docs/` | 배포할 웹앱 전체. 빌드 없이 이 폴더 그대로 게시 |
| `.github/workflows/pages.yml` | 검사 → GitHub Pages 배포 |
| `tests/` | 기존 게임·수식·QAT·학습자·회계 학습 회귀 검사 |
| `scripts/check-site.cjs` | 상대 경로·파일 누락·JS 문법 검사 |
| `scripts/run-tests.cjs` | 검사 전체 실행 |
| `scripts/serve.cjs` | 로컬 미리보기 서버 |
| `guides/DEVELOPMENT.md` | 수정할 파일, 저장 방식, 지원 범위 |
| `guides/DEPLOYMENT.md` | 배포 오류와 도메인 변경 안내 |
| `RELEASE.json` | 패키지에 포함된 앱 파일의 SHA-256 |

## 로컬에서 실행·검사하기

Node.js 24 권장, 최소 22. 외부 npm 의존성이 없어 `npm install` 과정은 필요하지 않습니다.

```sh
npm run dev
```

출력된 `http://127.0.0.1:8000/`을 열면 됩니다. 종료는 Ctrl+C입니다. 다른 포트가 필요하면 `PORT` 환경 변수를 지정합니다. 웹앱을 보기만 할 때는 `docs/index.html`을 직접 열 수도 있지만, 기록 저장과 브라우저 동작 확인에는 로컬 서버를 권장합니다.

```sh
npm run check
npm test
```

테스트 산출물은 `test-results/`에 저장되며 Git에서는 제외됩니다. GitHub 배포는 `docs/`만 게시하므로 테스트와 개발 스크립트는 사이트 배포 파일에 들어가지 않습니다.

## 기존 사이트에서 옮길 때

이름·소속·XP·도구 모음·키보드 설정은 **사용자 브라우저의 localStorage**에 저장됩니다. 도메인이 바뀌면 기존 사이트의 기록은 새 주소에 자동으로 옮겨지지 않습니다. 서버 동기화나 계정 시스템은 포함되어 있지 않습니다.

이 패키지는 기존 Sites 배포와 별개입니다. GitHub에서 수정해도 기존 Sites 사이트가 자동으로 바뀌지는 않습니다. 기존 사이트의 Git 기록, 호스팅 식별자, 배포 토큰, 개인 브라우저 기록은 패키지에 포함하지 않았습니다.

## 공식 배포 문서

- [GitHub Pages 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Actions로 웹사이트 자동 배포](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)

저장소의 라이선스는 소유자가 별도로 정할 수 있습니다. 이 패키지는 임의의 오픈소스 라이선스를 부여하지 않습니다.
