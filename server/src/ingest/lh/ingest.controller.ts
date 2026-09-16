import { Router } from 'express';
import { AppError, ValidationError } from '../../common/errors.js';
import { env } from '../../config/env.js';
import { ok } from '../../common/response.js';
import { ingestLhAnnouncements } from './collector.js';
import type { IngestRange } from './collector.js';

/**
 * D2가 원래 의도한 대로: 수집 진입점(ingestLhAnnouncements)은 순수 함수라 스케줄러 말고도
 * HTTP 요청 같은 다른 호출자를 그냥 하나 더 붙이면 된다 — 그래서 이 컨트롤러가 아주 얇다.
 *
 * v1은 회원 인증이 없어서(11절), 배포 후 아무나 이 엔드포인트를 두드려 공공데이터포털
 * 일일 호출량(10,000회)을 소진시키는 걸 막기 위해 공유키 하나만 최소한으로 검사한다.
 */
const router = Router();

function assertAuthorized(providedKey: string | undefined): void {
  if (!env.adminIngestKey) {
    throw new AppError('INGEST_DISABLED', 'ADMIN_INGEST_KEY가 설정되지 않아 온디맨드 수집이 비활성화되어 있습니다.', 503);
  }
  if (providedKey !== env.adminIngestKey) {
    throw new AppError('UNAUTHORIZED', '관리자 키가 필요합니다.', 401);
  }
}

/** YYYYMMDD 형식만 허용 — 잘못된 값을 LH API에 그대로 넘기지 않는다. */
function toRangeDate(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{8}$/.test(value)) {
    throw new ValidationError(`${label}은(는) YYYYMMDD 형식의 문자열이어야 합니다.`);
  }
  return value;
}

router.post('/lh', async (req, res) => {
  assertAuthorized(req.header('x-admin-key'));

  const body = req.body as Record<string, unknown>;
  let range: IngestRange | undefined;
  if (body.from !== undefined || body.to !== undefined) {
    range = {
      from: toRangeDate(body.from, 'from'),
      to: toRangeDate(body.to, 'to'),
    };
  }

  const result = await ingestLhAnnouncements(range);
  res.json(ok(result));
});

export default router;
