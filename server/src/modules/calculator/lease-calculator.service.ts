import { ValidationError } from '../../common/errors.js';
import { calculateSchedule } from './repayment-schedule.js';
import type { LeaseCalculationInput, LeaseCalculationResult } from './calculator.types.js';

/**
 * D3: req/res를 모른다 — 나중에 AI Agent가 같은 함수를 도구로 호출할 수 있어야 한다.
 * D9: 실제 한도·금리는 개인 신용과 은행 심사에 좌우된다. 여기서 나온 숫자는 입력한 가정값 기준
 * 참고치일 뿐, 대출 승인이나 확정 상환액을 단정하지 않는다.
 */
export function calculateLeasePlan(input: LeaseCalculationInput): LeaseCalculationResult {
  if (input.depositWon < 0) throw new ValidationError('보증금은 0 이상이어야 합니다.');
  if (input.monthlyRentWon < 0) throw new ValidationError('월세는 0 이상이어야 합니다.');
  if (input.ownCapitalWon < 0) throw new ValidationError('자기자본은 0 이상이어야 합니다.');
  if (input.annualInterestRatePercent < 0) throw new ValidationError('금리는 0 이상이어야 합니다.');
  if (!Number.isInteger(input.loanTermMonths) || input.loanTermMonths <= 0) {
    throw new ValidationError('대출 기간은 1개월 이상의 정수여야 합니다.');
  }

  const loanNeededWon = Math.max(0, input.depositWon - input.ownCapitalWon);
  const isCapitalSufficient = input.ownCapitalWon >= input.depositWon;
  const monthlyRate = input.annualInterestRatePercent / 100 / 12;

  const schedule = calculateSchedule(input.repaymentMethod, loanNeededWon, monthlyRate, input.loanTermMonths);
  const totalMonthlyHousingCostWon = schedule.firstMonthPaymentWon + input.monthlyRentWon;
  const surplusCapitalWon = isCapitalSufficient ? input.ownCapitalWon - input.depositWon : 0;

  return {
    loanNeededWon,
    isCapitalSufficient,
    repaymentMethod: input.repaymentMethod,
    firstMonthPaymentWon: schedule.firstMonthPaymentWon,
    lastMonthPaymentWon: schedule.lastMonthPaymentWon,
    totalInterestWon: schedule.totalInterestWon,
    totalMonthlyHousingCostWon,
    surplusCapitalWon,
    assumptions: {
      annualInterestRatePercent: input.annualInterestRatePercent,
      loanTermMonths: input.loanTermMonths,
    },
  };
}
