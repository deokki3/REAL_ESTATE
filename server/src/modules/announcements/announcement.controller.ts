import { Router } from 'express';
import { ok } from '../../common/response.js';
import { getAnnouncementDetail, searchAnnouncements } from './announcement.service.js';
import type { AnnouncementSearchCriteria, AnnouncementStatus } from './announcement.types.js';

/**
 * 컨트롤러가 하는 일은 세 가지뿐이다: 입력 꺼내기 → 서비스 호출 → 봉투에 담기.
 * 판단(필터 조합, 페이지네이션 계산 등)이 들어가면 Service 로 내린다.
 *
 * Express 5는 async 핸들러가 reject하면 자동으로 에러 미들웨어로 넘긴다 — try/catch로
 * 감쌀 필요 없다 (Spring의 @ControllerAdvice가 컨트롤러 예외를 가로채는 것과 같은 개념).
 */
const router = Router();

function toArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

function toStatuses(value: unknown): AnnouncementStatus[] | undefined {
  const arr = toArray(value);
  if (!arr) return undefined;
  return arr.filter((v): v is AnnouncementStatus => v === 'open' || v === 'closed');
}

function toPositiveInt(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseCriteria(query: Record<string, unknown>): AnnouncementSearchCriteria {
  return {
    regionNames: toArray(query.region),
    categoryCodes: toArray(query.category),
    statuses: toStatuses(query.status),
    query: typeof query.q === 'string' ? query.q : undefined,
    page: toPositiveInt(query.page),
    pageSize: toPositiveInt(query.pageSize),
  };
}

router.get('/', async (req, res) => {
  const criteria = parseCriteria(req.query as Record<string, unknown>);
  const result = await searchAnnouncements(criteria);
  res.json(ok(result.items, { page: result.page, pageSize: result.pageSize, total: result.total }));
});

router.get('/:id', async (req, res) => {
  const detail = await getAnnouncementDetail(req.params.id!);
  res.json(ok(detail));
});

export default router;
