# 부동산 공고 통합 + 자금 설계 서비스

> 흩어진 공공주택 공고를 한곳에서 보고, 내 자본과 자격으로 실제로 가능한지
> 필요 자금과 월 상환액까지 계산해주는 서비스

핵심 가치는 **공고 통합이 아니라 자금·자격 판정**이다. 공고 데이터는 계산기의 입력값이다.

### 안 만드는 것
- 청약 신청 대행 (실제 신청은 해당 기관에서)
- 법적 효력이 있는 자격 판정 → 어디까지나 참고용 사전 검토
- 시세 예측

---

## 구조

```
Real_estate/
├─ client/    React 19 + TypeScript + Vite + TanStack Query + Tailwind v4
└─ server/    Node 22 + Express 5 + TypeScript + Mongoose
```

client / server 는 **독립 npm 프로젝트**다. 루트에 package.json 이 없고 모노레포도 아니다.
타입은 양쪽에 따로 존재하므로 서버 응답 형태를 바꾸면 클라이언트도 손으로 맞춰야 한다.

```
Frontend → API → Controller → Service → Repository/Model → MongoDB
```
비즈니스 로직은 Service 중심. 응답은 항상 `{ success, data, meta? }` 봉투,
실패는 `{ success: false, error: { code, message } }`.

---

## 핵심 설계 결정

전체 근거와 세부 사항은 [CLAUDE.md](CLAUDE.md) 참고. 요약만 여기 둔다.

| # | 결정 | 이유 |
|---|---|---|
| D1 | 외부 API를 프론트에서 직접 호출하지 않는다 | 인증키 노출·CORS·비표준 응답. 서버는 정규화 계층 |
| D2 | 수집(`ingest/`)과 조회(`modules/`)를 분리한다 | 수집 방식이 바뀌어도 조회 코드가 안 깨지게 |
| D3 | Service 계층은 req/res에 의존하지 않는다 | 나중에 AI Agent가 같은 함수를 도구로 호출해야 함 |
| D4 | 소스 어댑터 패턴 | 기관마다 응답이 다름 → 각자 공통 `Announcement`로 변환 |
| D5 | 저장할 값과 계산할 값을 구분한다 | 모집상태를 저장하면 접수 끝나도 "모집중"으로 남는 유령 데이터가 됨 |
| D6 | `Announcement`(공고) / `Transaction`(실거래) / `Listing`(현재 매물)을 분리한다 | 성격이 다른 걸 한 컬렉션에 합치지 않는다 |
| D7 | 분양과 임대를 하나의 자금 계산기로 만들지 않는다 | 지불·대출·선정 구조 자체가 다름. `분양가 × LTV` 는 틀린 계산 |
| D8 | 자격·대출 기준은 코드가 아니라 데이터다 | 법령 개정으로 바뀜. 적용 시작일을 가진 룰 데이터로 저장 |
| D9 | 대출 결과를 단정하지 않는다 | 실제 한도·금리는 은행 심사 소관. "요건에 해당" 까지만 안내 |
| D10 | 데이터 제공 범위를 명시한다 | SH·HUG는 아직 미확보. 안내 없이 빠지면 사용자가 오해함 |

---

## 도메인 용어 (코드 이름 규정)

부동산은 용어를 확정하지 않으면 코드가 반드시 섞인다.

**면적** — `area` 단독 사용 금지
| 용어 | 코드 이름 |
|---|---|
| 전용면적 (실거래가 API 기준) | `exclusiveAreaM2` |
| 공급면적 (분양정보 기준) | `supplyAreaM2` |
| 계약면적 | `contractAreaM2` |

실거래가 API는 전용, 청약 분양정보는 공급 면적을 준다. 비교·필터는 전부 `exclusiveAreaM2` 기준.

**가격** — `price` 단독 사용 금지
| 용어 | 코드 이름 |
|---|---|
| 분양가 | `supplyPriceManwon` |
| 실거래가 | `dealAmountManwon` |
| 보증금 | `depositManwon` |
| 월세 | `monthlyRentManwon` |

내부 저장 단위는 **만원 단위 정수**로 통일. 표시 단계에서만 "12억 3,000만원" 등으로 포맷.

기타: 자격 산정 기준일은 오늘이 아니라 **모집공고일**. 행복주택엔 청약가점(84점)이 없다 — 그건 민영주택 일반공급 방식.

---

## 데이터 소스 현황

| 기관 | 공고 자동 수집 | 상태 |
|---|---|---|
| LH | 가능 | 3종 세트 API. **1차 대상** |
| 청약홈 (한국부동산원) | 가능 | 분양정보 조회 서비스. 2차 |
| GH | 조건부 | 파일데이터만 (갱신 안 됨) |
| SH | 못 찾음 | 공고 API 미발견 |
| HUG 든든전세 | 못 찾음 | 공고 API 미발견 |

LH 목록/상세/공급정보 API 3종의 엔드포인트, 파라미터, 응답 필드, 코드값 표는 [CLAUDE.md 6절](CLAUDE.md#6-lh-분양임대공고문-조회-api--검증된-사실)에 정리되어 있다.
응답이 배열이고 실제 데이터가 `response[1].dsList` 에 있는 등 비표준이므로, 이 API를 다루기 전에 반드시 그쪽을 먼저 읽는다.

---

## 현재 진행 상태

- 완료: LH 목록 API 명세 분석, 프로젝트 스캐폴딩 (`client`/`server`, `/api/health` 동작 확인)
- 진행 중(API 키 없이 가능한 범위): LH 원본 응답 타입 → 언랩 → 코드 사전 → 날짜 파싱 → `Announcement` 타입 + LH 어댑터
- 이후: Mongoose 스키마, 수집기, 조회 API, 리스트 화면, 자금 시뮬레이터, 자격 판정 엔진

상세 로드맵은 [CLAUDE.md 10절](CLAUDE.md#10-현재-진행-상태).

---

## 실행

### 1. 서버

```bash
cd server
npm install
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
npm run dev               # http://localhost:4000
```

MongoDB 가 안 떠 있어도 개발 모드에서는 서버가 부팅된다 (경고 로그만 남고 헬스체크에 `db: disconnected` 로 표시).

### 2. 클라이언트

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

브라우저에서 5173 을 열면 서버 연결 상태가 보인다.

### 확인

```bash
curl http://localhost:4000/api/health
# {"success":true,"data":{"status":"ok","env":"development","uptimeSec":3,"db":"disconnected"}}
```

---

## CORS 설정이 없는 이유

개발 중에는 Vite 프록시가 `/api/*` 를 4000 포트로 넘긴다. 브라우저 입장에서는 동일 출처라
CORS 미들웨어가 필요 없다. 대신 **클라이언트 코드에 `http://localhost:4000` 을 하드코딩하지 않는다.**
모든 호출은 `client/src/lib/api.ts` 를 거치고, 거기서 상대 경로 `/api/...` 를 쓴다.

---

## 명령어

| 위치 | 명령 | 설명 |
|---|---|---|
| server | `npm run dev` | tsx watch 로 자동 재시작 |
| server | `npm run typecheck` | 타입만 검사 (빌드 산출물 없음) |
| server | `npm run build` → `npm start` | dist/ 로 컴파일 후 실행 |
| client | `npm run dev` | Vite 개발 서버 |
| client | `npm run build` | 타입 검사 + 프로덕션 번들 |
| client | `npm run lint` | oxlint |

---

## 의존성 설치 이력

버전을 임의로 고정하지 않았다. 새로 설치할 때 쓴 명령은 다음과 같다.

```bash
# client
npx create-vite@latest client --template react-ts
cd client
npm install
npm install @tanstack/react-query
npm install -D tailwindcss @tailwindcss/vite

# server
cd server
npm install express mongoose dotenv
npm install -D typescript tsx @types/express @types/node
```

### Tailwind 는 v4 다
`@tailwindcss/vite` 플러그인 + CSS 의 `@import "tailwindcss";` 방식이다.
`tailwind.config.js` / `postcss.config.js` / `npx tailwindcss init` 은 v3 방식이라 쓰지 않는다.

### 서버는 ESM 이다
`package.json` 의 `"type": "module"`, tsconfig 는 `NodeNext`.
그래서 **상대 경로 import 에 `.js` 확장자를 붙인다.** `.ts` 파일을 가리키는데도 `.js` 라고 쓴다.

```ts
import { getHealth } from './health.service.js'   // OK — 실제 파일은 health.service.ts
import { getHealth } from './health.service'      // 런타임에 못 찾음
```

컴파일 후 실행되는 파일이 `.js` 이기 때문이며, TypeScript 가 경로를 고쳐주지 않는다.
클라이언트(Vite 번들러)는 이 규칙이 없어서 확장자를 안 붙인다. 양쪽 규칙이 다르다.

---

## 이 README와 CLAUDE.md의 관계

[CLAUDE.md](CLAUDE.md) 는 Claude Code 세션에서 매번 자동으로 읽히는 설계 결정·도메인 규칙 원본이다.
이 README는 그중 핵심만 사람이 보기 좋게 옮긴 것이다. **내용이 어긋나면 CLAUDE.md 가 우선한다.**
LH API 상세 스펙, 미확인 사항 목록, `requirements.md` 와의 차이점 등 세부 사항은 CLAUDE.md에만 있다.
