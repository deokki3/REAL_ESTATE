/** 서버 ingest/lh/codes.ts 의 코드값과 손으로 맞춤. 실제 저장된 값 기준(2026-08-27 확인). */

export const REGION_OPTIONS = [
  { value: '서울특별시', label: '서울' },
  { value: '인천광역시', label: '인천' },
  { value: '경기도', label: '경기' },
] as const

export const CATEGORY_OPTIONS = [
  { value: '05', label: '분양주택' },
  { value: '06', label: '임대주택' },
  { value: '13', label: '주거복지' },
  { value: '39', label: '신혼희망타운' },
] as const

/**
 * D5: LH 목록 API에 접수시작일이 없어서 "공고중/접수중/접수마감" 3단계가 아니라
 * 마감일 기준 2단계만 계산 가능하다 — CLAUDE.md D5 참고.
 */
export const STATUS_OPTIONS = [
  { value: 'open', label: '접수중' },
  { value: 'closed', label: '접수마감' },
] as const

/** "사용자에게 보이는 모든 텍스트는 한글" 규정 때문에 source 값을 그대로 안 보여주고 이 라벨을 쓴다. */
export const SOURCE_LABELS: Record<string, string> = {
  LH: 'LH',
  MANUAL: '직접등록',
}
