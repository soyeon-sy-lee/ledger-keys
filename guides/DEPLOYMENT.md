# 배포 확인과 문제 해결

## 첫 배포

권장 방식은 README의 GitHub Actions 배포입니다. 필요한 Pages 설정은 저장소의 Settings에서 한 번 직접 수행합니다. `.github/workflows/pages.yml`이 검사와 배포를 함께 처리하며, 별도 토큰이나 ChatGPT 연동을 사용하지 않습니다.

## 자주 발생하는 문제

| 증상 | 확인할 것 |
| --- | --- |
| Actions에 워크플로가 없음 | `.github/workflows/pages.yml`이 저장소 루트 기준 경로에 있는지 확인 |
| Configure Pages에서 실패 | Settings → Pages → Source를 GitHub Actions로 선택 후 Actions에서 재실행 |
| Pages 메뉴 또는 권한 오류 | 저장소 관리자 권한·요금제의 Pages 지원·조직의 Actions 정책 확인. 무료 개인 계정은 Public 저장소 사용 |
| 사이트 404 | 배포 성공 여부, 저장소명, Visit site 링크 확인. URL을 수동 추측하지 않기 |
| 파일 목록은 있는데 배포 실패 | ZIP 자체나 상위 폴더를 올리지 않았는지, 루트에 `docs/index.html`이 있는지 확인 |
| CSS/JS를 못 읽음 | `docs/` 안 파일 누락 또는 절대 경로 변경 여부. `npm run check` 실행 |
| 설정 전에 시작한 첫 배포 실패 | Pages를 켠 뒤 Actions → Check and deploy Ledger Keys → Run workflow 실행 |
| 배포에 환경 승인 대기 | 조직/저장소의 `github-pages` 환경 배포 규칙 확인 |
| 로컬 미리보기 포트 충돌 | 기존 서버를 종료하거나 `PORT`를 다른 값으로 지정 |
| 소속·점수가 초기화된 것처럼 보임 | 호스트 주소가 바뀌면 localStorage가 분리됨. 브라우저 데이터 삭제 여부 확인 |

## 배포 주소와 도메인

프로젝트 저장소는 통상 `https://GITHUB_ID.github.io/REPOSITORY_NAME/`에 게시됩니다. 이 형식에는 기존 사이트의 `dongkwan-kim.chatgpt.site`가 들어가지 않습니다. 대신 본인의 GitHub ID가 주소에 포함됩니다.

본인 도메인이 있다면 GitHub Pages의 Custom domain 설정과 도메인 DNS를 연결할 수 있습니다. 이 패키지는 도메인을 가정하지 않아 `CNAME`을 미리 넣지 않았습니다. 실제로 소유한 도메인만 설정하세요.

## Git으로 최초 업로드하는 경우

GitHub에서 빈 저장소를 먼저 만든 다음 압축 해제 폴더에서 아래를 실행합니다. `<OWNER>`와 `<REPOSITORY>`는 본인 값으로 바꿉니다.

```sh
git init -b main
git add .
git commit -m "Initial Ledger Keys GitHub Pages release"
git remote add origin https://github.com/<OWNER>/<REPOSITORY>.git
git push -u origin main
```

이 과정의 GitHub 인증은 본인의 Git 클라이언트에서 처리합니다. ChatGPT 계정 연결이나 채팅에 토큰 전달은 필요하지 않습니다. 이후 Settings → Pages → Source → GitHub Actions를 켜고 워크플로를 실행합니다.

## 연동을 끝낸 뒤

GitHub Actions는 GitHub 저장소 안에서 동작합니다. ChatGPT가 계속 켜져 있거나 연결되어 있을 필요가 없습니다. 이 패키지를 만든 대화와 저장소 사이에도 자동 동기화가 설정되지 않습니다.
