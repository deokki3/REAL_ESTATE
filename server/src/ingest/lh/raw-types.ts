/**
 * LH 원본 응답 타입. 실제 호출(2026-08-25)로 확인된 필드만 담는다.
 * 활용가이드에는 있지만 실호출로 확인 안 된 필드(15057999 상세 API 등)는 넣지 않는다 — CLAUDE.md 7절.
 */

export interface LhRawAnnouncement {
  PAN_ID: string;
  CCR_CNNT_SYS_DS_CD: string;
  UPP_AIS_TP_CD: string;
  AIS_TP_CD: string;
  SPL_INF_TP_CD: string;
  PAN_NM: string;
  UPP_AIS_TP_NM: string;
  AIS_TP_CD_NM: string;
  CNP_CD_NM: string;
  /** 공고게시일. 포맷 "2019.07.23" */
  PAN_NT_ST_DT: string;
  /** 공고마감일. 포맷 "2019.08.22" */
  CLSG_DT: string;
  /** 모집공고일. 포맷 "20200508". 토지·상가는 빈 문자열로 온다. */
  PAN_DT: string;
  PAN_SS: string;
  ALL_CNT: string;
  DTL_URL: string;
  DTL_URL_MOB: string;
  RNUM: string;
}

export interface LhResHeader {
  SS_CODE: string;
  RS_DTTM: string;
}

/** 공급정보 API(SPL_INF_TP_CD=060, 공공임대) 응답의 dsList02 항목. */
export interface LhRawHouseTypeLease060 {
  BZDT_NM: string;
  HTY_NM: string;
  RSDN_DDO_AR: string;
  TOT_HSH_CNT: string;
  SIL_HSH_CNT: string;
  /** 임대보증금(원 단위 문자열) */
  LS_GMY: string;
  /** 월임대료(원 단위 문자열) */
  MM_RFE: string;
  SPL_AR: string;
}

/**
 * 공급정보 API(SPL_INF_TP_CD=061 50년공공임대 / 062 국민임대·장기전세·신축다세대·영구임대 / 063 행복주택)
 * 응답의 dsList01 항목. **주의: 060/050 브랜치도 키 이름이 "dsList01"이지만 필드 구성이 완전히 다르다** —
 * 같은 리스트 이름이 여러 의미로 쓰이므로 요청 시점에 어떤 SPL_INF_TP_CD로 불렀는지가 유일한 판단 근거다.
 * 실제 호출(2026-08-27, 행복주택)로 확인함: `LS_GMY`(임대보증금)·`RFE`(월임대료)가 숫자가 아니라
 * "공고문 참조" 텍스트로 오는 경우가 있다 — 국민임대·행복주택 계열은 API가 금액을 안 준다는 뜻으로 보인다.
 */
export interface LhRawHouseTypeApartment {
  SBD_LGO_NM: string;
  HTY_NNA: string;
  DDO_AR: string;
  HSH_CNT: string;
  NOW_HSH_CNT: string;
  /** 원 단위 숫자 문자열이거나 "공고문 참조" 같은 텍스트로 온다. */
  LS_GMY: string;
  /** 원 단위 숫자 문자열이거나 "공고문 참조" 같은 텍스트로 온다. */
  RFE: string;
  SPL_AR: string;
}

/**
 * 매입임대·전세임대(SPL_INF_TP_CD 130~145) 그룹. 060/061~063과 또 다른 세 번째 응답 모양이다.
 * 코드마다 필드가 또 달라서(2026-09-02 실호출로 확인) 코드별로 타입을 따로 둔다 — CLAUDE.md 6절.
 */

/** SPL_INF_TP_CD=132(신혼·신생아매입임대Ⅱ)/141(다자녀매입임대) 공통 모양. 면적 필드가 아예 없다. */
export interface LhRawPurchaseLeaseSupplyBasic {
  SGG_NM: string;
  DNG_HS_ADR: string;
  LTR_SPL_RMNO: string;
  QUP_CNT: string;
}

/** SPL_INF_TP_CD=144(든든전세주택). 132/141과 같은 필드 + 면적 구간 라벨(HTY_DS_NM, 예: "80㎡ 이상") 추가. */
export interface LhRawPurchaseLeaseSupply144 extends LhRawPurchaseLeaseSupplyBasic {
  HTY_DS_NM: string;
}

/** SPL_INF_TP_CD=131(청년 매입임대주택). dsList02로 온다(다른 코드는 dsList01). 필드 이름도 다르다. */
export interface LhRawPurchaseLeaseSupply131 {
  SX_PP_DS_NM: string;
  DNG_HS_ADR: string;
  LTR_SPL_RMNO: string;
  CNP_NM: string;
  QUP_CNT: string;
}

/**
 * SPL_INF_TP_CD=130(청년신혼부부매입임대리츠). 이 그룹에서 유일하게 정확한 면적(`HTY_DS_NM`="전용46㎡")과
 * 당첨자수/예비자수 분리 카운트를 준다.
 */
export interface LhRawPurchaseLeaseSupply130 {
  HTY_DS_NM: string;
  GNR_SPL_RMNO: string;
  LTR_UNT_NM: string;
  SBD_CNP_NM: string;
  PZWR_CNT: string;
  CAL_QUP_CNT: string;
}

/** 에러 시 응답 봉투. 정상 응답과 최상위 형태(배열 vs 객체)부터 다르다 — CLAUDE.md 6절. */
export interface LhErrorResponse {
  OpenAPI_ServiceResponse: {
    cmmMsgHeader: {
      errMsg: string;
      returnAuthMsg: string;
      returnReasonCode: string;
    };
  };
}
