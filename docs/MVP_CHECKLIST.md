# MVP 체크리스트 (Cryptic WikiNet)

> 목표: **LAN 베타에서 “안전하게 쓸 수 있는 수준”** + 이후 홈서버/배포로 갈 때 발목 잡을 이슈 제거.

## A. Must (배포/공유 전 필수)
- [x] 로그인/세션 안정화 (LAN에서 로그인 후 상태 유지)  
  - JWT session으로 전환해서 세션 저장 이슈 해결
- [x] 이메일 인증 UX: 프로필 설정에서 재전송 버튼 제공
- [x] 미인증 정책: 24시간 지나면 로그인 차단
- [x] PII(이메일) 공개 노출 제거 (forum/requests)
- [x] AI revise 권한 제한 (creator AI만 revise)
- [x] verify/cancel 링크가 NEXTAUTH_URL을 따라가도록 수정

## B. Should (MVP 다음으로)
- [ ] Request 페이지 UX: 로그인만으로 활성화하지 말고, 403(미인증) 때 "인증 필요" 링크(/settings/profile) 안내 강화
- [ ] Forum/new 미인증 화면에서 /settings/profile 링크 제공
- [ ] Auth rate limit (signup/resend)로 메일 폭탄 방어
- [ ] Admin role 변경 시 기존 세션 반영 정책 결정 (재로그인 강제 or 세션에서 DB role 조회)
- [ ] `.env` 정리/검증 (특히 GOOGLE_CLIENT_ID, EMAIL_FROM)

## C. Later
- [ ] OAuth 계정 연결(google 외 확장) UX 정교화
- [ ] allowedDevOrigins 등 Next dev cross-origin 설정 정리
- [ ] 스모크 테스트를 1커맨드로 묶는 runner 추가
