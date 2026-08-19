import express from 'express';
import healthRouter from './modules/health/health.controller.js';
import { errorHandler, notFoundHandler } from './common/errorHandler.js';

/**
 * 앱 조립만 담당한다. 여기서 listen 하지 않는다 (테스트에서 앱만 따로 쓰기 위해).
 *
 * CORS 미들웨어가 없는 건 의도된 것이다 — 개발 중에는 Vite 프록시가 /api/* 를
 * 4000 포트로 넘겨주므로 브라우저 입장에서 동일 출처다.
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/api/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
