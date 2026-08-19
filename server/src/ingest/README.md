# ingest — 외부 API 경계

CLAUDE.md **D2** 의 경계다. 이 폴더 안과 밖의 규칙이 다르다.

## 여기 있는 것
- 외부 기관 API(LH, 청약홈, 국토교통부 …) HTTP 호출
- 기관별 비표준 응답 → 우리 공통 타입 변환 (**소스 어댑터**, D4)
- 페이지네이션·재시도·레이트리밋

## 여기 없는 것
- HTTP 요청 객체 / 사용자 세션 / 로그인 상태
- 화면용 포맷팅

## 지켜야 할 것
수집 진입점은 **순수 함수 하나**다. 호출자가 온디맨드든 배치든 스케줄러든 상관하지 않는다.

```ts
// OK
ingestLhAnnouncements({ from: '20250101', to: '20250228' }): Promise<IngestResult>

// 금지
ingestLhAnnouncements(req, res)
```

`modules/` 쪽 코드는 이 폴더를 import 하지 않는다. 조회 계층은 데이터 출처를 몰라야 한다.
연결 고리는 DB 에 저장된 `Announcement.source` 필드뿐이다.
