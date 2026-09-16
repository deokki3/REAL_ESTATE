import { ValidationError } from '../../common/errors.js';
import { calculateSchedule } from './repayment-schedule.js';
import type { SaleCalculationInput, SaleCalculationResult, SalePaymentStage } from './calculator.types.js';

/**
 * D3: req/res를 모른다. D7: "빌릴 수 있냐"가 아니라 "각 시점에 현금이 마르지 않냐"에 답한다 —
 * 그래서 단일 숫자가 아니라 계약금→중도금(N회, 매매면 0회)→잔금 단계별 타임라인을 계산한다.
 * D9: 대출 승인·정확한 한도를 단정하지 않는다. LTV·금리는 사용자가 입력하는 가정값이다.
 */
export function calculateSalePlan(input: SaleCalculationInput): SaleCalculationResult {
  if (input.totalPriceWon <= 0) throw new ValidationError('분양가/매매가는 0보다 커야 합니다.');
  if (input.contractRatePercent < 0 || input.contractRatePercent > 100) {
    throw new ValidationError('계약금 비율은 0~100% 사이여야 합니다.');
  }
  if (!Number.isInteger(input.interimInstallmentCount) || input.interimInstallmentCount < 0) {
    throw new ValidationError('중도금 회차는 0 이상의 정수여야 합니다.');
  }
  if (input.interimTotalRatePercent < 0 || input.interimTotalRatePercent > 100) {
    throw new ValidationError('중도금 비율은 0~100% 사이여야 합니다.');
  }
  if (input.interimInstallmentCount === 0 && input.interimTotalRatePercent !== 0) {
    throw new ValidationError('중도금 회차가 0(매매)이면 중도금 비율도 0이어야 합니다.');
  }
  if (input.contractRatePercent + input.interimTotalRatePercent > 100) {
    throw new ValidationError('계약금 비율과 중도금 비율의 합이 100%를 넘을 수 없습니다.');
  }
  if (input.interimLoanCoverageRatePercent < 0 || input.interimLoanCoverageRatePercent > 100) {
    throw new ValidationError('중도금대출 충당 비율은 0~100% 사이여야 합니다.');
  }
  if (input.ownCapitalWon < 0) throw new ValidationError('자기자본은 0 이상이어야 합니다.');
  if (input.ltvPercent < 0 || input.ltvPercent > 100) throw new ValidationError('LTV는 0~100% 사이여야 합니다.');
  if (input.mortgageAnnualRatePercent < 0) throw new ValidationError('주택담보대출 금리는 0 이상이어야 합니다.');
  if (!Number.isInteger(input.mortgageTermMonths) || input.mortgageTermMonths <= 0) {
    throw new ValidationError('주택담보대출 기간은 1개월 이상의 정수여야 합니다.');
  }

  const stages: SalePaymentStage[] = [];
  let remainingCapital = input.ownCapitalWon;

  // 계약금 — D7: 대출이 거의 안 붙는 자기자본 전용 구간.
  const contractDueWon = Math.round(input.totalPriceWon * (input.contractRatePercent / 100));
  {
    const paidFromCapitalWon = Math.min(remainingCapital, contractDueWon);
    const shortfallWon = contractDueWon - paidFromCapitalWon;
    remainingCapital -= paidFromCapitalWon;
    stages.push({
      label: '계약금',
      dueWon: contractDueWon,
      loanCoveredWon: 0,
      paidFromCapitalWon,
      shortfallWon,
      remainingCapitalWon: remainingCapital,
    });
  }

  // 중도금 — 분양(회차 > 0)일 때만. 매매는 이 구간 자체가 없다.
  let totalInterimLoanWon = 0;
  const interimTotalDueWon = Math.round(input.totalPriceWon * (input.interimTotalRatePercent / 100));
  if (input.interimInstallmentCount > 0) {
    const perInstallmentDueWon = Math.round(interimTotalDueWon / input.interimInstallmentCount);
    for (let i = 1; i <= input.interimInstallmentCount; i += 1) {
      const loanCoveredWon = Math.round(perInstallmentDueWon * (input.interimLoanCoverageRatePercent / 100));
      const outOfPocketWon = perInstallmentDueWon - loanCoveredWon;
      const paidFromCapitalWon = Math.min(remainingCapital, outOfPocketWon);
      const shortfallWon = outOfPocketWon - paidFromCapitalWon;
      remainingCapital -= paidFromCapitalWon;
      totalInterimLoanWon += loanCoveredWon;
      stages.push({
        label: `중도금 ${i}회차`,
        dueWon: perInstallmentDueWon,
        loanCoveredWon,
        paidFromCapitalWon,
        shortfallWon,
        remainingCapitalWon: remainingCapital,
      });
    }
  }

  // 잔금 — 잔금 자체 + 중도금대출 원금 정산을 합쳐서 한 번에 본다. 부족분은 주택담보대출(LTV 한도 내)로.
  const balanceDueWon = input.totalPriceWon - contractDueWon - interimTotalDueWon;
  const balanceObligationWon = balanceDueWon + totalInterimLoanWon;
  const ltvLimitWon = Math.round(input.totalPriceWon * (input.ltvPercent / 100));
  const desiredMortgageLoanWon = Math.max(0, balanceObligationWon - remainingCapital);
  const mortgageLoanWon = Math.min(desiredMortgageLoanWon, ltvLimitWon);
  const exceedsLtvLimit = desiredMortgageLoanWon > ltvLimitWon;
  const paidFromCapitalAtBalanceWon = Math.min(remainingCapital, balanceObligationWon - mortgageLoanWon);
  const shortfallAtBalanceWon = balanceObligationWon - mortgageLoanWon - paidFromCapitalAtBalanceWon;
  remainingCapital -= paidFromCapitalAtBalanceWon;

  stages.push({
    label: '잔금',
    dueWon: balanceObligationWon,
    loanCoveredWon: mortgageLoanWon,
    paidFromCapitalWon: paidFromCapitalAtBalanceWon,
    shortfallWon: shortfallAtBalanceWon,
    remainingCapitalWon: remainingCapital,
  });

  const monthlyRate = input.mortgageAnnualRatePercent / 100 / 12;
  const mortgageSchedule = calculateSchedule(
    input.mortgageRepaymentMethod,
    mortgageLoanWon,
    monthlyRate,
    input.mortgageTermMonths,
  );

  return {
    stages,
    totalInterimLoanWon,
    mortgageLoanWon,
    ltvLimitWon,
    exceedsLtvLimit,
    mortgage: {
      repaymentMethod: input.mortgageRepaymentMethod,
      firstMonthPaymentWon: mortgageSchedule.firstMonthPaymentWon,
      lastMonthPaymentWon: mortgageSchedule.lastMonthPaymentWon,
      totalInterestWon: mortgageSchedule.totalInterestWon,
    },
    hasShortfall: stages.some((s) => s.shortfallWon > 0),
    finalRemainingCapitalWon: remainingCapital,
    assumptions: {
      ltvPercent: input.ltvPercent,
      interimLoanCoverageRatePercent: input.interimLoanCoverageRatePercent,
      mortgageAnnualRatePercent: input.mortgageAnnualRatePercent,
      mortgageTermMonths: input.mortgageTermMonths,
    },
  };
}
