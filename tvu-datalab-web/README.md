# 지방정부 tvU 데이터랩 — Railway 웹 업로드용

1. GitHub에서 tvu-datalab 비공개 저장소를 만듭니다. Add README를 켜면 업로드 메뉴를 쉽게 찾을 수 있습니다.
2. 이 ZIP을 압축 해제한 뒤 내용 전체를 Add file → Upload files로 올리고 Commit changes를 누릅니다. ZIP 자체를 업로드하지 마세요.
3. 저장소 주소를 공유해 Railway 연결을 진행합니다. Railway GitHub App에는 이 저장소 접근 권한을 허용합니다.

Railway 설정: Dockerfile 자동 빌드, 영구 볼륨 /data, ADMIN_PASSWORD 16자 이상, ADMIN_USER 기본값 admin. Generate Domain 후 Railway 도메인을 자동 인식합니다. 자체 도메인을 쓰면 PUBLIC_ORIGIN에 https://도메인을 설정합니다.

초기 배포는 전체 사이트에 비밀번호가 있는 검토용입니다. /admin에서 편집 가능합니다. 비밀번호는 Railway Variables에 입력하고 채팅에는 보내지 마세요.

2026 데이터 페이지, 애니메이션 막대그래프, 워스트 시연순위, 흰색 그라데이션과 중앙 프리미엄 버튼 포함. 결제 및 정부 API 자동 수집은 구현되지 않았습니다. 기본 시연 데이터로 시작하며 기존 사이트 관리자에서 저장한 데이터는 구성 JSON 내보내기/가져오기로 옮겨야 합니다. 업로드 원본 파일은 별도 이전합니다.

빌드된 dist는 즉시 배포용입니다. UI 소스는 src, 모델은 lib에 포함합니다. 소스 수정 후 npm install, npm run build로 dist를 갱신하고 함께 올립니다. 모델 수정 시 서버용 model.bundle.mjs도 재번들링해야 합니다.
