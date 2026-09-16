/**
 * 임대(전세자금대출)와 매매·분양(주택담보대출) 계산기가 공통으로 쓰는 상환 스케줄 계산.
 * D7: SalePlan/LeasePlan은 나누되 공통 인터페이스(상환방식)는 맞춘다.
 *
 * bullet(만기일시상환): 매달 이자만, 원금은 만기에 한 번에.
 * equalPayment(원리금균등상환): 원금+이자를 합친 월 상환액이 매달 동일.
 * equalPrincipal(원금균등상환): 원금은 매달 동일, 이자는 남은 원금 기준이라 매달 줄어든다.
 */
export type RepaymentMethod = 'bullet' | 'equalPayment' | 'equalPrincipal';

export interface RepaymentSchedule {
  firstMonthPaymentWon: number;
  lastMonthPaymentWon: number;
  totalInterestWon: number;
}

function calculateBullet(principalWon: number, monthlyRate: number, termMonths: number): RepaymentSchedule {
  const monthlyPayment = Math.round(principalWon * monthlyRate);
  return {
    firstMonthPaymentWon: monthlyPayment,
    lastMonthPaymentWon: monthlyPayment,
    totalInterestWon: monthlyPayment * termMonths,
  };
}

function calculateEqualPayment(principalWon: number, monthlyRate: number, termMonths: number): RepaymentSchedule {
  if (principalWon === 0) return { firstMonthPaymentWon: 0, lastMonthPaymentWon: 0, totalInterestWon: 0 };

  const monthlyPayment =
    monthlyRate === 0
      ? principalWon / termMonths
      : (principalWon * monthlyRate * (1 + monthlyRate) ** termMonths) / ((1 + monthlyRate) ** termMonths - 1);

  const rounded = Math.round(monthlyPayment);
  return {
    firstMonthPaymentWon: rounded,
    lastMonthPaymentWon: rounded,
    totalInterestWon: Math.round(rounded * termMonths - principalWon),
  };
}

function calculateEqualPrincipal(principalWon: number, monthlyRate: number, termMonths: number): RepaymentSchedule {
  if (principalWon === 0) return { firstMonthPaymentWon: 0, lastMonthPaymentWon: 0, totalInterestWon: 0 };

  const monthlyPrincipal = principalWon / termMonths;
  let totalInterest = 0;
  for (let month = 0; month < termMonths; month += 1) {
    const remaining = principalWon - month * monthlyPrincipal;
    totalInterest += remaining * monthlyRate;
  }

  return {
    firstMonthPaymentWon: Math.round(monthlyPrincipal + principalWon * monthlyRate),
    lastMonthPaymentWon: Math.round(monthlyPrincipal + monthlyPrincipal * monthlyRate),
    totalInterestWon: Math.round(totalInterest),
  };
}

export function calculateSchedule(
  method: RepaymentMethod,
  principalWon: number,
  monthlyRate: number,
  termMonths: number,
): RepaymentSchedule {
  switch (method) {
    case 'bullet':
      return calculateBullet(principalWon, monthlyRate, termMonths);
    case 'equalPayment':
      return calculateEqualPayment(principalWon, monthlyRate, termMonths);
    case 'equalPrincipal':
      return calculateEqualPrincipal(principalWon, monthlyRate, termMonths);
  }
}
