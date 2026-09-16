/**
 * 우리 DB의 도메인 타입. 이 파일은 외부 API를 모른다 — D2.
 * 소스별 어댑터(ingest/lh 등)가 이 모양으로 변환해서 넘겨준다.
 */

/** MANUAL: PDF 공고문을 사람(또는 AI)이 읽고 직접 입력하는 네 번째 수집 방식 — D4. */
export type AnnouncementSource = 'LH' | 'MANUAL';

/** 상세·공급정보 API 재조회에 필요한 5개 연결 키 — CLAUDE.md 6절 정정 사항. LH 어댑터가 채우는 모양의 참고용 타입. */
export interface LhSourceKey {
  panId: string;
  ccrCnntSysDsCd: string;
  uppAisTpCd: string;
  aisTpCd: string;
  splInfTpCd: string;
}

/**
 * 소스마다 "원본 API 재조회에 필요한 키"의 개수·이름이 다르다 (LH는 5개, 향후 청약홈은
 * houseManageNo+pblancNo 2개). Announcement 자체를 특정 소스 모양에 묶으면 D4가 깨지므로
 * 여기서는 문자열 맵으로만 받는다 — 실제 의미는 source 필드를 보고 각 소스 어댑터/모듈이 해석한다.
 */
export type SourceKey = Record<string, string>;

export interface Announcement {
  /** D4: 데이터 출처. 조회 계층·화면은 이 값으로만 출처를 구분한다. */
  source: AnnouncementSource;
  sourceKey: SourceKey;
  title: string;
  regionName: string;
  /** UPP_AIS_TP_CD (분양주택/임대주택/주거복지/신혼희망타운) */
  categoryCode: string;
  categoryName: string;
  /** AIS_TP_CD_NM (행복주택, 국민임대 등 세부유형) */
  typeName: string;
  /** 공고게시일 */
  postedAt: Date;
  /** 모집공고일. 자격 산정 기준일 — CLAUDE.md 5절. 토지·상가 등은 null. */
  noticeDate: Date | null;
  /** 공고마감일 */
  closingAt: Date;
  originalUrl: string;
  originalUrlMobile: string;
}

/** 공고 하나에 속한 주택형(임대) 정보. D7: 분양/임대 구조가 달라 임대 전용 필드만 둔다. */
export interface HouseType {
  /** D4: 데이터 출처. */
  source: AnnouncementSource;
  /** 소속 공고의 PAN_ID (LH 기준. 소스마다 이 식별자의 의미가 다를 수 있다). */
  panId: string;
  complexName: string;
  /** 주택형 표기 (예: "74.9500A-1") */
  houseType: string;
  exclusiveAreaM2: number;
  supplyAreaM2: number;
  totalHouseholds: number;
  currentSupplyHouseholds: number;
  /**
   * 원 단위 정수. 만원으로 반올림하지 않는다 — CLAUDE.md 5절.
   * null인 경우는 "0원"이 아니라 "LH API가 금액을 안 줌"이다 (국민임대·행복주택 등은 실제로
   * "공고문 참조"라는 텍스트만 옴 — 2026-08-27 실호출로 확인). 화면에서 0원처럼 표시하면 안 된다.
   */
  depositWon: number | null;
  /** 위와 동일한 이유로 null 가능 — CLAUDE.md 5절. */
  monthlyRentWon: number | null;
}

/**
 * 매입임대·전세임대(LH SPL_INF_TP_CD 130~145) 공고 하나에 속한 단지별 공급 내역 한 줄.
 * `HouseType`과 별개 타입인 이유: 이 유형의 공고 하나는 흔히 여러 시/군/구에 흩어진 여러 단지를
 * 한 번에 모집한다 — "한 단지 안의 여러 주택형"인 HouseType과 성격이 다르다(CLAUDE.md D6과 같은 결).
 * 코드마다 필드가 달라(6절) 면적을 못 주는 코드가 더 많다 — `exclusiveAreaM2`가 null인 게 정상이다.
 */
export interface PurchaseLeaseSupply {
  source: AnnouncementSource;
  panId: string;
  /** 시/도 또는 시/군/구 — 코드마다 제공 단위가 다르다. 원문 그대로 저장. */
  regionName: string;
  /** 단지명+주소를 합친 원문 문자열 (예: "고양시 대화동(계림웨스트벨리)"). 구조가 코드마다 달라 나누지 않는다. */
  complexInfo: string;
  /** 정확한 ㎡ 값을 주는 코드(130)만 채워진다. null은 "0"이 아니라 "이 코드는 면적을 안 줌"이다. */
  exclusiveAreaM2: number | null;
  /** 면적 관련 원문 라벨 그대로 (정확한 값이든 "80㎡ 이상" 같은 구간이든). 화면엔 이걸 보여준다. */
  areaLabel: string | null;
  supplyCount: number;
  recruitCount: number;
}

/**
 * D5: 진행상태는 저장하지 않고 조회 시점에 계산한다.
 * LH 목록 API는 접수시작일을 안 줘서(게시일·마감일만 있음) "공고중/접수중/접수마감" 3단계가 아니라
 * 마감일 기준 2단계만 구분 가능하다 — `open`(마감 전) / `closed`(마감 지남).
 */
export type AnnouncementStatus = 'open' | 'closed';

export interface AnnouncementListItem extends Announcement {
  id: string;
  status: AnnouncementStatus;
}

export interface AnnouncementDetail extends AnnouncementListItem {
  houseTypes: HouseType[];
  /** 매입임대·전세임대 공고일 때만 채워진다. 그 외에는 빈 배열. */
  purchaseLeaseSupplies: PurchaseLeaseSupply[];
}

export interface AnnouncementSearchCriteria {
  regionNames?: string[];
  categoryCodes?: string[];
  statuses?: AnnouncementStatus[];
  /** 공고명 부분 검색 */
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface AnnouncementSearchResult {
  items: AnnouncementListItem[];
  total: number;
  page: number;
  pageSize: number;
}
