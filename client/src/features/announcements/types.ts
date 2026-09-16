/**
 * 서버 modules/announcements/announcement.types.ts 와 손으로 맞춘 타입.
 * client / server 는 독립 npm 프로젝트라 타입을 공유하지 않는다 — 서버 응답이 바뀌면 여기도 고쳐야 한다.
 */

export type AnnouncementStatus = 'open' | 'closed'
export type AnnouncementSource = 'LH' | 'MANUAL'

export interface Announcement {
  id: string
  source: AnnouncementSource
  title: string
  regionName: string
  categoryCode: string
  categoryName: string
  typeName: string
  postedAt: string
  noticeDate: string | null
  closingAt: string
  originalUrl: string
  originalUrlMobile: string
  status: AnnouncementStatus
}

export interface HouseType {
  complexName: string
  houseType: string
  exclusiveAreaM2: number
  supplyAreaM2: number
  totalHouseholds: number
  currentSupplyHouseholds: number
  /** null이면 "0원"이 아니라 "LH가 금액을 안 줌" — 원문 공고 확인 필요. */
  depositWon: number | null
  monthlyRentWon: number | null
}

/** 매입임대·전세임대 공고일 때만 채워진다. 단지가 여러 지역에 흩어져 있어 HouseType과 모양이 다르다. */
export interface PurchaseLeaseSupply {
  regionName: string
  complexInfo: string
  /** 정확한 값을 주는 유형만 채워진다. null은 "0"이 아니라 "이 공고 유형은 면적을 안 줌". */
  exclusiveAreaM2: number | null
  /** 정확한 값이든 "80㎡ 이상" 같은 구간이든 원문 라벨 그대로. */
  areaLabel: string | null
  supplyCount: number
  recruitCount: number
}

export interface AnnouncementDetail extends Announcement {
  houseTypes: HouseType[]
  purchaseLeaseSupplies: PurchaseLeaseSupply[]
}

export interface AnnouncementSearchParams {
  region?: string[]
  category?: string[]
  status?: AnnouncementStatus[]
  q?: string
  page?: number
  pageSize?: number
}
