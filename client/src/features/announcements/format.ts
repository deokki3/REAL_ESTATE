/** 날짜 표시 포맷. 금액 포맷(formatWon)은 계산기 화면 등 다른 feature도 써서 lib/format.ts로 옮겼다. */

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}
