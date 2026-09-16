import type {
  Announcement,
  HouseType,
  PurchaseLeaseSupply,
} from '../../modules/announcements/announcement.types.js';
import { parseLhDate } from './dates.js';
import type {
  LhRawAnnouncement,
  LhRawHouseTypeApartment,
  LhRawHouseTypeLease060,
  LhRawPurchaseLeaseSupply130,
  LhRawPurchaseLeaseSupply131,
  LhRawPurchaseLeaseSupply144,
  LhRawPurchaseLeaseSupplyBasic,
} from './raw-types.js';

export function toAnnouncement(raw: LhRawAnnouncement): Announcement {
  const postedAt = parseLhDate(raw.PAN_NT_ST_DT);
  const closingAt = parseLhDate(raw.CLSG_DT);
  if (!postedAt) throw new Error(`PAN_NT_ST_DT 파싱 실패 (공고 ${raw.PAN_ID})`);
  if (!closingAt) throw new Error(`CLSG_DT 파싱 실패 (공고 ${raw.PAN_ID})`);

  return {
    source: 'LH',
    sourceKey: {
      panId: raw.PAN_ID,
      ccrCnntSysDsCd: raw.CCR_CNNT_SYS_DS_CD,
      uppAisTpCd: raw.UPP_AIS_TP_CD,
      aisTpCd: raw.AIS_TP_CD,
      splInfTpCd: raw.SPL_INF_TP_CD,
    },
    title: raw.PAN_NM,
    regionName: raw.CNP_CD_NM,
    categoryCode: raw.UPP_AIS_TP_CD,
    categoryName: raw.UPP_AIS_TP_NM,
    typeName: raw.AIS_TP_CD_NM,
    postedAt,
    noticeDate: parseLhDate(raw.PAN_DT),
    closingAt,
    originalUrl: raw.DTL_URL,
    originalUrlMobile: raw.DTL_URL_MOB,
  };
}

/**
 * LH는 원 단위 정수 문자열을 주는 게 보통이지만, 국민임대·행복주택 계열은 "공고문 참조" 같은
 * 텍스트를 주기도 한다(2026-08-27 실호출로 확인). 숫자가 아니면 null — "0원"이 아니라
 * "이 API는 금액을 안 준다"는 뜻이다. 에러로 취급해서 수집을 막지 않는다.
 */
function parseWonOrNull(raw: string): number | null {
  const won = Number(raw);
  return Number.isNaN(won) ? null : won;
}

/** SPL_INF_TP_CD=060(공공임대 5·10년/분납임대) 브랜치 전용. */
export function toHouseType060(raw: LhRawHouseTypeLease060, panId: string): HouseType {
  return {
    source: 'LH',
    panId,
    complexName: raw.BZDT_NM,
    houseType: raw.HTY_NM,
    exclusiveAreaM2: Number(raw.RSDN_DDO_AR),
    supplyAreaM2: Number(raw.SPL_AR),
    totalHouseholds: Number(raw.TOT_HSH_CNT),
    currentSupplyHouseholds: Number(raw.SIL_HSH_CNT),
    depositWon: parseWonOrNull(raw.LS_GMY),
    monthlyRentWon: parseWonOrNull(raw.MM_RFE),
  };
}

/**
 * SPL_INF_TP_CD=061(50년공공임대)/062(국민임대·장기전세·신축다세대·영구임대)/063(행복주택) 브랜치 전용.
 * 064(가정어린이집)는 CCR_CNNT_SYS_DS_CD에 따라 응답 모양 자체가 갈리는 게 문서상 확인돼서
 * 아직 다루지 않는다 — CLAUDE.md 7절.
 */
export function toHouseTypeApartment(raw: LhRawHouseTypeApartment, panId: string): HouseType {
  return {
    source: 'LH',
    panId,
    complexName: raw.SBD_LGO_NM,
    houseType: raw.HTY_NNA,
    exclusiveAreaM2: Number(raw.DDO_AR),
    supplyAreaM2: Number(raw.SPL_AR),
    totalHouseholds: Number(raw.HSH_CNT),
    currentSupplyHouseholds: Number(raw.NOW_HSH_CNT),
    depositWon: parseWonOrNull(raw.LS_GMY),
    monthlyRentWon: parseWonOrNull(raw.RFE),
  };
}

function parseCount(raw: string): number {
  return Number(raw);
}

/**
 * "전용46㎡" 형식일 때만 숫자를 뽑는다. "80㎡ 이상" 같은 구간 라벨(144)엔 절대 쓰지 않는다 —
 * 구간을 정확한 값처럼 저장하면 안 된다(CLAUDE.md 절대 규칙). 형식이 안 맞으면 null.
 */
function parseExactAreaLabel(label: string): number | null {
  const match = /^전용(\d+(?:\.\d+)?)㎡$/.exec(label);
  return match ? Number(match[1]) : null;
}

/** SPL_INF_TP_CD=132(신혼·신생아매입임대Ⅱ)/141(다자녀매입임대) 공통. 면적 필드가 없다 — CLAUDE.md 6절. */
export function toPurchaseLeaseSupplyBasic(
  raw: LhRawPurchaseLeaseSupplyBasic,
  panId: string,
): PurchaseLeaseSupply {
  return {
    source: 'LH',
    panId,
    regionName: raw.SGG_NM,
    complexInfo: raw.DNG_HS_ADR,
    exclusiveAreaM2: null,
    areaLabel: null,
    supplyCount: parseCount(raw.LTR_SPL_RMNO),
    recruitCount: parseCount(raw.QUP_CNT),
  };
}

/** SPL_INF_TP_CD=144(든든전세주택). 면적은 정확한 값이 아니라 구간 라벨만 온다. */
export function toPurchaseLeaseSupply144(raw: LhRawPurchaseLeaseSupply144, panId: string): PurchaseLeaseSupply {
  return {
    source: 'LH',
    panId,
    regionName: raw.SGG_NM,
    complexInfo: raw.DNG_HS_ADR,
    exclusiveAreaM2: null,
    areaLabel: raw.HTY_DS_NM,
    supplyCount: parseCount(raw.LTR_SPL_RMNO),
    recruitCount: parseCount(raw.QUP_CNT),
  };
}

/** SPL_INF_TP_CD=131(청년 매입임대주택). 다른 코드와 필드 이름이 다르다(CNP_NM 등) — raw-types.ts 참고. */
export function toPurchaseLeaseSupply131(raw: LhRawPurchaseLeaseSupply131, panId: string): PurchaseLeaseSupply {
  return {
    source: 'LH',
    panId,
    regionName: raw.CNP_NM,
    complexInfo: raw.DNG_HS_ADR,
    exclusiveAreaM2: null,
    areaLabel: null,
    supplyCount: parseCount(raw.LTR_SPL_RMNO),
    recruitCount: parseCount(raw.QUP_CNT),
  };
}

/**
 * SPL_INF_TP_CD=130(청년신혼부부매입임대리츠). 이 그룹에서 유일하게 정확한 면적을 준다.
 * 원본은 "공급호수"(GNR_SPL_RMNO) 외에 "당첨자수"(PZWR_CNT)·"예비자수"(CAL_QUP_CNT)를 따로 준다 —
 * 다른 코드들의 "모집인원" 한 필드에 맞추기 위해 둘을 더해서 recruitCount로 합친다.
 */
export function toPurchaseLeaseSupply130(raw: LhRawPurchaseLeaseSupply130, panId: string): PurchaseLeaseSupply {
  return {
    source: 'LH',
    panId,
    regionName: raw.SBD_CNP_NM,
    complexInfo: raw.LTR_UNT_NM,
    exclusiveAreaM2: parseExactAreaLabel(raw.HTY_DS_NM),
    areaLabel: raw.HTY_DS_NM,
    supplyCount: parseCount(raw.GNR_SPL_RMNO),
    recruitCount: parseCount(raw.PZWR_CNT) + parseCount(raw.CAL_QUP_CNT),
  };
}
