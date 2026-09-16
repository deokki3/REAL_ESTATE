/** 서버 modules/calculator/calculator.types.ts 와 손으로 맞춘 타입. */

export type RepaymentMethod = 'bullet' | 'equalPayment' | 'equalPrincipal'

export interface LeaseCalculationInput {
  depositWon: number
  monthlyRentWon: number
  ownCapitalWon: number
  annualInterestRatePercent: number
  loanTermMonths: number
  repaymentMethod: RepaymentMethod
}

export interface LeaseCalculationResult {
  loanNeededWon: number
  isCapitalSufficient: boolean
  repaymentMethod: RepaymentMethod
  firstMonthPaymentWon: number
  lastMonthPaymentWon: number
  totalInterestWon: number
  totalMonthlyHousingCostWon: number
  surplusCapitalWon: number
  assumptions: {
    annualInterestRatePercent: number
    loanTermMonths: number
  }
}

/** interimInstallmentCount가 0이면 매매(계약금→잔금), 1 이상이면 분양(계약금→중도금N회→잔금). */
export interface SaleCalculationInput {
  totalPriceWon: number
  contractRatePercent: number
  interimInstallmentCount: number
  interimTotalRatePercent: number
  interimLoanCoverageRatePercent: number
  ownCapitalWon: number
  ltvPercent: number
  mortgageAnnualRatePercent: number
  mortgageTermMonths: number
  mortgageRepaymentMethod: RepaymentMethod
}

export interface SalePaymentStage {
  label: string
  dueWon: number
  loanCoveredWon: number
  paidFromCapitalWon: number
  shortfallWon: number
  remainingCapitalWon: number
}

export interface SaleCalculationResult {
  stages: SalePaymentStage[]
  totalInterimLoanWon: number
  mortgageLoanWon: number
  ltvLimitWon: number
  exceedsLtvLimit: boolean
  mortgage: {
    repaymentMethod: RepaymentMethod
    firstMonthPaymentWon: number
    lastMonthPaymentWon: number
    totalInterestWon: number
  }
  hasShortfall: boolean
  finalRemainingCapitalWon: number
  assumptions: {
    ltvPercent: number
    interimLoanCoverageRatePercent: number
    mortgageAnnualRatePercent: number
    mortgageTermMonths: number
  }
}
