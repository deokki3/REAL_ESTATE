import { UpstreamError } from '../../common/errors.js';
import { env } from '../../config/env.js';

/** CLAUDE.md 6절 — HTTP다, HTTPS 아니다. 브라우저 직접 호출 시 mixed content로 막힌다. */
const LH_LIST_URL = 'http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1';
const LH_SUPPLY_URL = 'http://apis.data.go.kr/B552555/lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1';

/**
 * ENCODED 모드의 서비스키는 이미 퍼센트 인코딩돼 있다(%2F 등). URLSearchParams에 넣으면
 * 한 번 더 인코딩돼서 %2F가 %252F로 깨진다 — 그래서 쿼리스트링 뒤에 직접 이어붙인다.
 */
function buildUrl(base: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params).toString();
  const { keyMode, encodedKey, decodedKey } = env.dataGoKr;
  if (keyMode === 'ENCODED') {
    return `${base}?${search}&serviceKey=${encodedKey}`;
  }
  return `${base}?${search}&${new URLSearchParams({ serviceKey: decodedKey }).toString()}`;
}

async function fetchJson(url: string, apiName: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new UpstreamError(`${apiName} HTTP 오류: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface LhListRequest {
  /** YYYYMMDD */
  panStDt: string;
  /** YYYYMMDD */
  panEdDt: string;
  cnpCd: string;
  page: number;
  pageSize: number;
}

export async function fetchLhList(req: LhListRequest): Promise<unknown> {
  const url = buildUrl(LH_LIST_URL, {
    PAN_ST_DT: req.panStDt,
    PAN_ED_DT: req.panEdDt,
    CNP_CD: req.cnpCd,
    PAGE: String(req.page),
    PG_SZ: String(req.pageSize),
  });
  return fetchJson(url, 'LH 목록 API');
}

export interface LhSupply060Request {
  panId: string;
  ccrCnntSysDsCd: string;
  uppAisTpCd: string;
  aisTpCd: string;
}

/** SPL_INF_TP_CD=060(공공임대) 브랜치만 호출한다 — 어댑터가 이 브랜치만 지원한다. */
export async function fetchLhSupply060(req: LhSupply060Request): Promise<unknown> {
  const url = buildUrl(LH_SUPPLY_URL, {
    SPL_INF_TP_CD: '060',
    CCR_CNNT_SYS_DS_CD: req.ccrCnntSysDsCd,
    PAN_ID: req.panId,
    UPP_AIS_TP_CD: req.uppAisTpCd,
    AIS_TP_CD: req.aisTpCd,
  });
  return fetchJson(url, 'LH 공급정보 API');
}

export interface LhSupplyRequest {
  /** 060 전용 별도 함수(fetchLhSupply060)가 있다. 그 외 지원 코드는 adapter.ts 참고. */
  splInfTpCd: string;
  panId: string;
  ccrCnntSysDsCd: string;
  uppAisTpCd: string;
  aisTpCd: string;
}

/**
 * SPL_INF_TP_CD 060을 제외한 나머지 공급정보 브랜치 전부 이 함수 하나로 호출한다 — 요청 파라미터
 * 모양은 SPL_INF_TP_CD 값과 무관하게 똑같고, 응답을 해석하는 방식(unwrap·adapter)만 코드마다 다르다.
 * 지금 실제로 지원하는 코드: 061/062/063(국민임대 등), 130/131/132/141/144(매입임대·전세임대).
 */
export async function fetchLhSupply(req: LhSupplyRequest): Promise<unknown> {
  const url = buildUrl(LH_SUPPLY_URL, {
    SPL_INF_TP_CD: req.splInfTpCd,
    CCR_CNNT_SYS_DS_CD: req.ccrCnntSysDsCd,
    PAN_ID: req.panId,
    UPP_AIS_TP_CD: req.uppAisTpCd,
    AIS_TP_CD: req.aisTpCd,
  });
  return fetchJson(url, 'LH 공급정보 API');
}
