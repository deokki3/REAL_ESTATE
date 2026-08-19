# Real_estate

흩어진 공공주택 공고를 한곳에서 보고, 내 자본으로 실제로 가능한지
필요 자금과 월 상환액까지 계산해주는 서비스.

설계 결정과 도메인 규칙은 [CLAUDE.md](CLAUDE.md) 에 있다. 코드를 고치기 전에 그쪽을 먼저 본다.

---

## 구조

```
Real_estate/
├─ client/    React 19 + TypeScript + Vite + TanStack Query + Tailwind v4
└─ server/    Node 22 + Express 5 + TypeScript + Mongoose
```

client 와 server 는 **독립 npm 프로젝트**다. 루트에 package.json 이 없고 모노레포도 아니다.
타입은 양쪽에 따로 존재하므로 서버 응답 형태를 바꾸면 클라이언트도 손으로 맞춰야 한다.

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
