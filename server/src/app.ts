import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import announcementsRouter from './modules/announcements/announcement.controller.js';
import calculatorRouter from './modules/calculator/calculator.controller.js';
import healthRouter from './modules/health/health.controller.js';
import ingestRouter from './ingest/lh/ingest.controller.js';
import { errorHandler, notFoundHandler } from './common/errorHandler.js';
import { isProduction } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** 지인 공유용 배포는 client+server를 한 서비스로 합친다 — server/dist/app.js 기준 두 단계 위가 저장소 루트. */
const CLIENT_DIST_DIR = path.join(__dirname, '../../client/dist');

/**
 * 앱 조립만 담당한다. 여기서 listen 하지 않는다 (테스트에서 앱만 따로 쓰기 위해).
 *
 * CORS 미들웨어가 없는 건 의도된 것이다 — 개발 중에는 Vite 프록시가, 프로덕션에서는
 * 이 서버가 client 빌드 결과물까지 같이 서빙해서(아래 isProduction 분기) 브라우저 입장에서
 * 항상 동일 출처다. 프론트/서버를 다른 도메인에 따로 배포하기로 바뀌면 그때 CORS를 추가한다.
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/calculator', calculatorRouter);
  app.use('/api/ingest', ingestRouter);

  if (isProduction) {
    // /api/* 로 시작하는데 어떤 라우터에도 안 걸리면 JSON 404, 그 외 경로는 정적 파일 시도 →
    // 못 찾으면 index.html 로 떨어뜨려서 React Router가 클라이언트 사이드에서 라우팅하게 한다.
    app.use('/api', notFoundHandler);
    app.use(express.static(CLIENT_DIST_DIR));
    // Express 5(path-to-regexp v8)는 이름 없는 '*'를 더 이상 허용하지 않는다 — 이름 붙은 와일드카드 필요.
    app.get('/*splat', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
    });
  } else {
    app.use(notFoundHandler);
  }

  app.use(errorHandler);

  return app;
}
