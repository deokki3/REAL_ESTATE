import { Router } from 'express';
import { getHealth } from './health.service.js';
import { ok } from '../../common/response.js';

/**
 * 컨트롤러가 하는 일은 세 가지뿐이다: 입력 꺼내기 → 서비스 호출 → 봉투에 담기.
 * 판단이 들어가면 Service 로 내린다.
 */
const router = Router();

router.get('/', (_req, res) => {
  res.json(ok(getHealth()));
});

export default router;
