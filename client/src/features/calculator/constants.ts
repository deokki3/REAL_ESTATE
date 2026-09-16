import type { RepaymentMethod } from './types'

export const REPAYMENT_METHOD_OPTIONS: { value: RepaymentMethod; label: string; description: string }[] = [
  { value: 'bullet', label: '만기일시상환', description: '매달 이자만 내고, 원금은 계약 종료 시 보증금 반환금으로 정산' },
  { value: 'equalPayment', label: '원리금균등상환', description: '원금+이자를 합친 월 상환액이 매달 동일' },
  { value: 'equalPrincipal', label: '원금균등상환', description: '원금은 매달 동일, 이자는 남은 원금 기준이라 점점 줄어듦' },
]
