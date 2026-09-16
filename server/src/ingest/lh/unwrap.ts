import { UpstreamError } from '../../common/errors.js';
import type {
  LhErrorResponse,
  LhRawAnnouncement,
  LhRawHouseTypeApartment,
  LhRawHouseTypeLease060,
  LhRawPurchaseLeaseSupply130,
  LhRawPurchaseLeaseSupply131,
  LhRawPurchaseLeaseSupply144,
  LhRawPurchaseLeaseSupplyBasic,
  LhResHeader,
} from './raw-types.js';

/**
 * LH API는 정상 응답(배열)과 에러 응답(객체)의 최상위 형태 자체가 다르다 — 표준 REST 봉투가 아니다.
 * 이 파일이 그 분기를 흡수해서 이후 계층(어댑터·수집기)은 배열 형태만 알면 되게 한다.
 */

function isLhErrorResponse(body: unknown): body is LhErrorResponse {
  return typeof body === 'object' && body !== null && 'OpenAPI_ServiceResponse' in body;
}

function unwrapLhArray(body: unknown, apiName: string): Record<string, unknown> {
  if (!Array.isArray(body)) {
    if (isLhErrorResponse(body)) {
      const { errMsg, returnReasonCode } = body.OpenAPI_ServiceResponse.cmmMsgHeader;
      throw new UpstreamError(`${apiName} 오류(${returnReasonCode}): ${errMsg}`);
    }
    throw new UpstreamError(`${apiName} 응답 형태가 예상과 다릅니다 (배열도 에러 봉투도 아님).`);
  }
  const second = body[1] as unknown;
  if (typeof second !== 'object' || second === null) {
    throw new UpstreamError(`${apiName} 응답의 두 번째 배열 항목이 없습니다.`);
  }
  return second as Record<string, unknown>;
}

function firstHeader(resHeader: unknown, apiName: string): LhResHeader {
  if (!Array.isArray(resHeader)) {
    throw new UpstreamError(`${apiName} 응답에 resHeader가 없습니다.`);
  }
  const header = resHeader[0] as LhResHeader | undefined;
  if (!header) {
    throw new UpstreamError(`${apiName} 응답의 resHeader가 비어 있습니다.`);
  }
  return header;
}

export function unwrapLhList(body: unknown): { items: LhRawAnnouncement[]; header: LhResHeader } {
  const second = unwrapLhArray(body, 'LH 목록 API');
  if (!Array.isArray(second.dsList)) {
    throw new UpstreamError('LH 목록 API 응답에 dsList가 없습니다.');
  }
  return {
    items: second.dsList as LhRawAnnouncement[],
    header: firstHeader(second.resHeader, 'LH 목록 API'),
  };
}

/** 공급정보 API 중 SPL_INF_TP_CD=060(공공임대) 브랜치만 다룬다. 다른 브랜치는 아직 미검증 — CLAUDE.md 6.1/7절. */
export function unwrapLhSupply060(
  body: unknown,
): { houseTypes: LhRawHouseTypeLease060[]; header: LhResHeader } {
  const second = unwrapLhArray(body, 'LH 공급정보 API');
  if (!Array.isArray(second.dsList02)) {
    throw new UpstreamError('LH 공급정보 API 응답에 dsList02가 없습니다.');
  }
  return {
    houseTypes: second.dsList02 as LhRawHouseTypeLease060[],
    header: firstHeader(second.resHeader, 'LH 공급정보 API'),
  };
}

/**
 * SPL_INF_TP_CD 061/062/063 브랜치. 이 응답의 "dsList01"은 060/050 브랜치의 dsList01과
 * 이름만 같고 필드 구성이 다르므로, 호출한 SPL_INF_TP_CD를 아는 이 함수 전용으로만 써야 한다.
 */
export function unwrapLhSupplyApartment(
  body: unknown,
): { houseTypes: LhRawHouseTypeApartment[]; header: LhResHeader } {
  const second = unwrapLhArray(body, 'LH 공급정보 API');
  if (!Array.isArray(second.dsList01)) {
    throw new UpstreamError('LH 공급정보 API 응답에 dsList01이 없습니다.');
  }
  return {
    houseTypes: second.dsList01 as LhRawHouseTypeApartment[],
    header: firstHeader(second.resHeader, 'LH 공급정보 API'),
  };
}

/**
 * 매입임대·전세임대(130~145) 그룹 전용. dsList01/dsList02 자체를 뽑는 부분은 코드가 달라도 똑같지만,
 * 항목의 필드 구성은 코드마다 다르므로(raw-types.ts 참고) 여기서는 배열만 뽑고 타입은 호출부가 정한다.
 */
function unwrapDsList01(body: unknown): { items: unknown[]; header: LhResHeader } {
  const second = unwrapLhArray(body, 'LH 공급정보 API');
  if (!Array.isArray(second.dsList01)) {
    throw new UpstreamError('LH 공급정보 API 응답에 dsList01이 없습니다.');
  }
  return { items: second.dsList01, header: firstHeader(second.resHeader, 'LH 공급정보 API') };
}

function unwrapDsList02(body: unknown): { items: unknown[]; header: LhResHeader } {
  const second = unwrapLhArray(body, 'LH 공급정보 API');
  if (!Array.isArray(second.dsList02)) {
    throw new UpstreamError('LH 공급정보 API 응답에 dsList02가 없습니다.');
  }
  return { items: second.dsList02, header: firstHeader(second.resHeader, 'LH 공급정보 API') };
}

/** SPL_INF_TP_CD=130. 실제 확인(2026-09-02): dsList01로 온다. */
export function unwrapLhPurchaseLeaseSupply130(
  body: unknown,
): { items: LhRawPurchaseLeaseSupply130[]; header: LhResHeader } {
  const { items, header } = unwrapDsList01(body);
  return { items: items as LhRawPurchaseLeaseSupply130[], header };
}

/** SPL_INF_TP_CD=131. 실제 확인(2026-09-02): 다른 코드와 달리 dsList02로 온다. */
export function unwrapLhPurchaseLeaseSupply131(
  body: unknown,
): { items: LhRawPurchaseLeaseSupply131[]; header: LhResHeader } {
  const { items, header } = unwrapDsList02(body);
  return { items: items as LhRawPurchaseLeaseSupply131[], header };
}

/** SPL_INF_TP_CD=132/141 공통. 실제 확인(2026-09-02): dsList01로 온다. */
export function unwrapLhPurchaseLeaseSupplyBasic(
  body: unknown,
): { items: LhRawPurchaseLeaseSupplyBasic[]; header: LhResHeader } {
  const { items, header } = unwrapDsList01(body);
  return { items: items as LhRawPurchaseLeaseSupplyBasic[], header };
}

/** SPL_INF_TP_CD=144. 실제 확인(2026-09-02): dsList01로 온다. */
export function unwrapLhPurchaseLeaseSupply144(
  body: unknown,
): { items: LhRawPurchaseLeaseSupply144[]; header: LhResHeader } {
  const { items, header } = unwrapDsList01(body);
  return { items: items as LhRawPurchaseLeaseSupply144[], header };
}
