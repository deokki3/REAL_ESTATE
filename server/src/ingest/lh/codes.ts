/** LH 코드값. CLAUDE.md 6절 — 활용가이드로 확인된 값만 담는다. */

export const LH_UPP_AIS_TP_CD = {
  '01': '토지',
  '05': '분양주택',
  '06': '임대주택',
  '13': '주거복지',
  '22': '상가',
  '39': '신혼희망타운',
} as const;

/** 우리가 실제로 다루는 공고유형. 토지(01)·상가(22)는 제외. */
export const SUPPORTED_UPP_AIS_TP_CD = ['05', '06', '13', '39'] as const;

/** 수도권만. 그 외 지역 코드는 활용가이드 참고 (CLAUDE.md에 전체 표 없음). */
export const LH_CNP_CD = {
  '11': '서울',
  '28': '인천',
  '41': '경기',
} as const;

/**
 * 활용가이드 문서상의 값. 실제 응답에서는 지금까지 "공고중"만 관측됨 — CLAUDE.md 7절.
 * 이 목록이 전체를 다 담고 있다고 단정하지 않는다.
 */
export const LH_PAN_SS_VALUES = ['공고중', '접수중', '접수마감', '안내신청', '선정공고중'] as const;

export type LhPanSs = (typeof LH_PAN_SS_VALUES)[number];
