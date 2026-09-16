/**
 * D7: 분양·임대는 자금 구조가 달라 계산기를 분리한다.
 * 이 모듈은 DB도 외부 API도 모른다 — 순수 계산 로직 (CLAUDE.md 10절 "이후" 로드맵 메모).
 */
import type { RepaymentMethod } from './repayment-schedule.js';

export type { RepaymentMethod };

export interface LeaseCalculationInput {
  /** 보증금 */
  depositWon: number;
  /** 월세. 순수 전세면 0. */
  monthlyRentWon: number;
  /** 자기자본 */
  ownCapitalWon: number;
  /** 전세자금대출 연 금리(%). 실제 금리는 은행 심사에 따라 다르다 — D9. 사용자가 조정 가능해야 한다. */
  annualInterestRatePercent: number;
  /** 대출 기간(개월). 원리금균등·원금균등 상환액 계산과 만기일시상환의 총 이자 계산에 쓰인다. */
  loanTermMonths: number;
  repaymentMethod: RepaymentMethod;
}

export interface LeaseCalculationResult {
  /** 자기자본으로 못 채우는 만큼 필요한 대출액. 0이면 대출이 필요 없다는 뜻. */
  loanNeededWon: number;
  /** 자기자본만으로 보증금을 충당할 수 있는지. */
  isCapitalSufficient: boolean;
  repaymentMethod: RepaymentMethod;
  /** 원금균등이면 "첫 달" 상환액, 그 외(만기일시·원리금균등)는 매달 동일한 상환액. */
  firstMonthPaymentWon: number;
  /** 원금균등일 때만 firstMonthPaymentWon과 다르다(대출 기간이 지날수록 줄어드는 마지막 달 상환액). */
  lastMonthPaymentWon: number;
  /** 대출 기간 전체 누적 이자. */
  totalInterestWon: number;
  /** 월세 + 첫 달 기준 상환액을 합친, 계약 초기 기준 월 주거비용. */
  totalMonthlyHousingCostWon: number;
  /** 자기자본이 보증금보다 많을 때 남는 금액. */
  surplusCapitalWon: number;
  assumptions: {
    annualInterestRatePercent: number;
    loanTermMonths: number;
  };
}

/**
 * 매매(기존 주택)와 분양(신규 청약)을 하나로 커버한다 — 매매는 계약금→잔금 2단계(중도금 없음),
 * 분양은 계약금→중도금(N회)→잔금 3단계다. `interimInstallmentCount`가 0이면 매매, 1 이상이면 분양.
 *
 * D7: "계약금(10~20%)에는 대출이 거의 안 붙는다. 시뮬레이터가 답할 질문은 '빌릴 수 있냐'가 아니라
 * '각 시점에 현금이 마르지 않냐'다." — 그래서 결과가 단일 숫자가 아니라 단계별 타임라인(`stages`)이다.
 */
export interface SaleCalculationInput {
  /** 분양가 또는 매매가 */
  totalPriceWon: number;
  /** 계약금 비율(%). 이 몫은 전액 자기자본으로 가정한다 — D7. */
  contractRatePercent: number;
  /** 중도금 회차 수. 0이면 매매(중도금 없음). */
  interimInstallmentCount: number;
  /** 중도금 총 비율(%). 회차 수만큼 균등 분할한다. 회차가 0이면 반드시 0이어야 한다. */
  interimTotalRatePercent: number;
  /** 각 중도금 중 중도금대출로 충당하는 비율(%). 나머지는 그때그때 자기자본에서 낸다고 가정. */
  interimLoanCoverageRatePercent: number;
  ownCapitalWon: number;
  /** 잔금 단계 주택담보대출의 LTV 한도 가정(%). 실제 한도는 은행 심사에 따라 다르다 — D9. */
  ltvPercent: number;
  mortgageAnnualRatePercent: number;
  mortgageTermMonths: number;
  mortgageRepaymentMethod: RepaymentMethod;
}

export interface SalePaymentStage {
  /** "계약금" | "중도금 N회차" | "잔금" */
  label: string;
  /** 이 단계에서 필요한 총 금액. 잔금 단계는 잔금 자체 + 중도금대출 원금 상환분을 합친 값이다. */
  dueWon: number;
  /** 이 단계에서 대출로 충당되는 금액(중도금대출 또는 잔금의 주택담보대출). */
  loanCoveredWon: number;
  /** 이 단계에서 실제로 자기자본에서 나간 금액. */
  paidFromCapitalWon: number;
  /** 자기자본과 대출을 합쳐도 못 메꾼 부족분. 0이 아니면 "이 시점에 현금이 마른다"는 뜻 — D7. */
  shortfallWon: number;
  /** 이 단계가 끝난 뒤 남은 자기자본. */
  remainingCapitalWon: number;
}

export interface SaleCalculationResult {
  stages: SalePaymentStage[];
  /** 중도금대출 누적 원금 — 잔금 시점에 상환/정산된다고 가정. */
  totalInterimLoanWon: number;
  /** 잔금 단계에서 실제로 필요한 주택담보대출액(LTV 한도로 제한됨). */
  mortgageLoanWon: number;
  /** LTV 가정 기준 대출 한도. */
  ltvLimitWon: number;
  /** 필요 대출액이 LTV 한도를 넘는지 — 넘으면 그만큼은 대출로 못 메꾼다. */
  exceedsLtvLimit: boolean;
  mortgage: {
    repaymentMethod: RepaymentMethod;
    firstMonthPaymentWon: number;
    lastMonthPaymentWon: number;
    totalInterestWon: number;
  };
  /** 어느 한 단계라도 자금이 부족했는지 — 이 계산기가 답해야 하는 핵심 질문(D7). */
  hasShortfall: boolean;
  /** 모든 단계가 끝난 뒤 남은 자기자본. */
  finalRemainingCapitalWon: number;
  assumptions: {
    ltvPercent: number;
    interimLoanCoverageRatePercent: number;
    mortgageAnnualRatePercent: number;
    mortgageTermMonths: number;
  };
}
