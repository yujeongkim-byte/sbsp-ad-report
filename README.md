# SB/SP 광고 확장 리포트 — 실시간 공유 버전 (Netlify)

## 구성
- `public/index.html` : 기존 리포트와 화면/기능이 동일한 프론트엔드. 데이터는 브라우저가 아니라 서버(Netlify Blobs)에서 읽고 씁니다.
- `netlify/functions/get-data.js` : 저장된 전체 데이터를 조회합니다. (누구나 호출 가능)
- `netlify/functions/upload-data.js` : 새로 업로드된 데이터를 기존 누적 데이터와 병합해 저장합니다. (업로드 비밀번호 필요)
- `netlify/functions/reset-data.js` : 전체 데이터를 초기화합니다. (업로드 비밀번호 필요)

## 배포 전 꼭 할 일
Netlify 사이트의 환경변수(Site settings → Environment variables)에 `UPLOAD_SECRET` 값을 설정해야 업로드/초기화가 동작합니다. 이 값이 곧 "업로드 비밀번호"입니다.

## 배포 방법
채팅으로 안내드린 단계별 가이드를 참고하세요 (Netlify CLI 설치 → 로그인 → `netlify deploy --prod` → 환경변수 설정).
