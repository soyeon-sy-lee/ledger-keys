# 배포 운영

- 저장소: https://github.com/soyeon-sy-lee/shortcut-to-partner
- 서비스: https://soyeon-sy-lee.github.io/shortcut-to-partner/
- 배포 브랜치: `main`
- 배포 디렉터리: `docs/`
- 워크플로: `.github/workflows/pages.yml`

## 배포 흐름

1. 변경 내용을 로컬에서 확인하고 `npm test`를 실행합니다.
2. 커밋을 `main`에 푸시합니다.
3. Actions의 **Check and deploy Shortcut to Partner**에서 `check`와 `deploy` 성공을 확인합니다.
4. 서비스 주소에서 실제 화면과 수정한 동작을 확인합니다.

PR에서는 검사만 실행하고, 기본 브랜치의 푸시 또는 수동 실행에서 배포합니다. 수동 실행은 Actions의 해당 워크플로에서 **Run workflow → main**을 선택합니다.

저장소의 **Settings → Pages → Source**는 **GitHub Actions**를 사용합니다. 배포 토큰을 별도로 등록할 필요는 없습니다. GitHub Actions의 저장소 토큰과 Pages 권한으로 배포합니다.

## 문제 해결

| 증상 | 확인할 것 |
| --- | --- |
| `check` 실패 | 해당 단계의 로그를 보고 `npm test`로 재현 |
| Configure Pages 실패 | Settings → Pages의 Source가 GitHub Actions인지 확인 |
| 환경 승인 대기 | `github-pages` 환경의 배포 규칙 확인 |
| 사이트 404 | 최신 배포 성공 여부와 Pages가 표시하는 서비스 링크 확인 |
| CSS·JavaScript 누락 | `docs/` 파일과 상대 경로 확인, `npm run check` 실행 |
| 수정 전 화면 표시 | 최신 커밋의 배포 성공을 확인하고 새로고침 |
| 사용자 기록이 보이지 않음 | 브라우저·호스트·사이트 데이터 삭제 여부 확인 |

배포 결과를 확인하기 전에는 완료로 안내하지 않습니다. 실패했으면 마지막 정상 배포와 실패한 단계, 원인을 함께 확인합니다.

## 주소 관리

서비스는 GitHub Pages 프로젝트 경로인 `/shortcut-to-partner/`에서 동작합니다. HTML의 자산 경로는 상대 경로를 사용합니다. 링크·문서·워크플로를 수정할 때 저장소명과 서비스 주소를 함께 확인하세요.

사용자 지정 도메인이 필요한 경우 실제 소유한 도메인을 Pages의 Custom domain과 DNS에 연결합니다. 저장소에는 기본 도메인을 가정한 `CNAME` 파일을 두지 않습니다.
