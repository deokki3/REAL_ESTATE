/** 원 단위 정수를 화면 표시용 만원 단위 문자열로 바꾼다. 저장은 원 단위, 표시만 여기서 변환 — CLAUDE.md 5절. */
export function formatWon(won: number | null): string {
  if (won === null) return '원문 공고 참조'
  const manwon = Math.floor(won / 10000)
  return `${manwon.toLocaleString('ko-KR')}만원`
}
