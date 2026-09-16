import { Router } from 'express';
import { ValidationError } from '../../common/errors.js';
import { ok } from '../../common/response.js';
import { calculateLeasePlan } from './lease-calculator.service.js';
import { calculateSalePlan } from './sale-calculator.service.js';
import type { RepaymentMethod } from './calculator.types.js';

const router = Router();

const REPAYMENT_METHODS: RepaymentMethod[] = ['bullet', 'equalPayment', 'equalPrincipal'];

function toNonNegativeNumber(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError(`${label}은(는) 0 이상의 숫자여야 합니다.`);
  }
  return n;
}

function toPositiveNumber(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidationError(`${label}은(는) 0보다 커야 합니다.`);
  }
  return n;
}

function toNonNegativeInt(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new ValidationError(`${label}은(는) 0 이상의 정수여야 합니다.`);
  }
  return n;
}

function toPositiveInt(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${label}은(는) 1 이상의 정수여야 합니다.`);
  }
  return n;
}

function toRepaymentMethod(value: unknown): RepaymentMethod {
  if (typeof value === 'string' && (REPAYMENT_METHODS as string[]).includes(value)) {
    return value as RepaymentMethod;
  }
  throw new ValidationError(`상환방식은 ${REPAYMENT_METHODS.join('/')} 중 하나여야 합니다.`);
}

router.post('/lease', async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const result = calculateLeasePlan({
    depositWon: toNonNegativeNumber(body.depositWon, '보증금'),
    monthlyRentWon: toNonNegativeNumber(body.monthlyRentWon ?? 0, '월세'),
    ownCapitalWon: toNonNegativeNumber(body.ownCapitalWon, '자기자본'),
    annualInterestRatePercent: toNonNegativeNumber(body.annualInterestRatePercent, '금리'),
    loanTermMonths: toPositiveInt(body.loanTermMonths, '대출 기간(개월)'),
    repaymentMethod: toRepaymentMethod(body.repaymentMethod),
  });
  res.json(ok(result));
});

router.post('/sale', async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const result = calculateSalePlan({
    totalPriceWon: toPositiveNumber(body.totalPriceWon, '분양가/매매가'),
    contractRatePercent: toNonNegativeNumber(body.contractRatePercent, '계약금 비율'),
    interimInstallmentCount: toNonNegativeInt(body.interimInstallmentCount, '중도금 회차'),
    interimTotalRatePercent: toNonNegativeNumber(body.interimTotalRatePercent ?? 0, '중도금 비율'),
    interimLoanCoverageRatePercent: toNonNegativeNumber(body.interimLoanCoverageRatePercent ?? 0, '중도금대출 충당 비율'),
    ownCapitalWon: toNonNegativeNumber(body.ownCapitalWon, '자기자본'),
    ltvPercent: toNonNegativeNumber(body.ltvPercent, 'LTV'),
    mortgageAnnualRatePercent: toNonNegativeNumber(body.mortgageAnnualRatePercent, '주택담보대출 금리'),
    mortgageTermMonths: toPositiveInt(body.mortgageTermMonths, '주택담보대출 기간(개월)'),
    mortgageRepaymentMethod: toRepaymentMethod(body.mortgageRepaymentMethod),
  });
  res.json(ok(result));
});

export default router;
