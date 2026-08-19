import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { fail } from './response.js';
import { isProduction } from '../config/env.js';

/** 라우터에 걸리지 않은 경로 → 404 봉투. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail('NOT_FOUND', `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`));
}

/**
 * Express 에러 미들웨어는 인자가 반드시 4개여야 인식된다 (next 를 안 써도 생략 불가).
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json(fail(err.code, err.message));
    return;
  }

  console.error('[unhandled]', err);
  const message = isProduction
    ? '서버 내부 오류가 발생했습니다.'
    : err instanceof Error
      ? err.message
      : String(err);
  res.status(500).json(fail('INTERNAL_ERROR', message));
}
