import type { HouseType, PurchaseLeaseSupply } from '../../modules/announcements/announcement.types.js';

/**
 * PDF 공고문을 사람(또는 이 세션의 AI)이 직접 읽고 채운 값. 재조회할 API가 없으므로
 * `sourceKey.panId`는 이 소스 전용으로 만드는 합성 키다(manual.service.ts 참고) — D4.
 */
export interface ManualAnnouncementInput {
  title: string;
  /** 기존 필터와 맞물리게 하려면 REGION_OPTIONS에 있는 값(서울특별시/인천광역시/경기도 등)을 쓴다. */
  regionName: string;
  /** 기존 필터와 맞물리게 하려면 CATEGORY_OPTIONS 코드(05/06/13/39)를 쓴다. 안 맞아도 저장은 되지만 체크박스로는 안 걸린다. */
  categoryCode: string;
  categoryName: string;
  typeName: string;
  postedAt: Date;
  noticeDate: Date | null;
  closingAt: Date;
  /** PDF에만 있고 원문 링크가 없으면 비워둔다 — 화면에서 "원문 보기" 버튼이 자동으로 숨는다. */
  originalUrl?: string;
  originalUrlMobile?: string;
  houseTypes?: Omit<HouseType, 'source' | 'panId'>[];
  purchaseLeaseSupplies?: Omit<PurchaseLeaseSupply, 'source' | 'panId'>[];
}

export interface ManualAnnouncementResult {
  id: string;
  panId: string;
}
