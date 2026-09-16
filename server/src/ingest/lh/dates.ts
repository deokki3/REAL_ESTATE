/**
 * LH 응답은 한 응답 안에서 날짜 포맷이 두 가지로 섞여 온다: "2019.07.23" 과 "20200508" — CLAUDE.md 6절.
 * 정규화 계층에서 전부 Date로 바꾼다. 문자열로 저장하면 기간 검색·정렬이 깨진다.
 */

const DOTTED = /^(\d{4})\.(\d{2})\.(\d{2})$/;
const COMPACT = /^(\d{4})(\d{2})(\d{2})$/;

/** 빈 문자열은 null로 취급한다 (토지·상가의 PAN_DT처럼 값 자체가 없다는 뜻이지 파싱 실패가 아니다). */
export function parseLhDate(raw: string): Date | null {
  const value = raw.trim();
  if (value === '') return null;

  const dotted = DOTTED.exec(value);
  if (dotted) {
    const [, y, m, d] = dotted;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const compact = COMPACT.exec(value);
  if (compact) {
    const [, y, m, d] = compact;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  throw new Error(`LH 날짜 형식을 알 수 없습니다: "${raw}"`);
}
