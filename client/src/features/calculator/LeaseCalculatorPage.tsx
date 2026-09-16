import { useState } from 'react'
import { formatWon } from '../../lib/format'
import { useCalculateLeasePlan } from './api'
import { REPAYMENT_METHOD_OPTIONS } from './constants'
import type { RepaymentMethod } from './types'

function FieldInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-[var(--text)]">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 pr-14 text-[14px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--muted-2)]">
          {suffix}
        </span>
      </div>
    </label>
  )
}

export function LeaseCalculatorPage() {
  const [depositManwon, setDepositManwon] = useState('20000')
  const [monthlyRentManwon, setMonthlyRentManwon] = useState('0')
  const [ownCapitalManwon, setOwnCapitalManwon] = useState('10000')
  const [ratePercent, setRatePercent] = useState('3.5')
  const [loanTermYears, setLoanTermYears] = useState('2')
  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethod>('bullet')

  const { mutate, data: result, isPending, error } = useCalculateLeasePlan()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate({
      depositWon: Number(depositManwon || 0) * 10000,
      monthlyRentWon: Number(monthlyRentManwon || 0) * 10000,
      ownCapitalWon: Number(ownCapitalManwon || 0) * 10000,
      annualInterestRatePercent: Number(ratePercent || 0),
      loanTermMonths: Math.round(Number(loanTermYears || 0) * 12),
      repaymentMethod,
    })
  }

  const showsLastMonth = result && result.repaymentMethod === 'equalPrincipal'

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-8 py-9 pb-14">
        <div>
          <h1 className="heading mb-1.5 text-2xl font-normal" style={{ color: 'oklch(30% 0.03 55)' }}>
            임대 자금 계산기
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            보증금·월세와 내 자본을 입력하면, 부족한 만큼 전세자금대출을 받는다고 가정했을 때의 월 부담을 계산합니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[18px] bg-[var(--surface)] p-7 px-8 shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]"
        >
          <FieldInput label="보증금" value={depositManwon} onChange={setDepositManwon} suffix="만원" />
          <FieldInput label="월세 (전세면 0)" value={monthlyRentManwon} onChange={setMonthlyRentManwon} suffix="만원" />
          <FieldInput label="자기자본" value={ownCapitalManwon} onChange={setOwnCapitalManwon} suffix="만원" />

          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="전세자금대출 금리 (가정)" value={ratePercent} onChange={setRatePercent} suffix="%/년" />
            <FieldInput label="대출 기간" value={loanTermYears} onChange={setLoanTermYears} suffix="년" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[var(--text)]">상환 방식</span>
            <div className="flex flex-col gap-2">
              {REPAYMENT_METHOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    repaymentMethod === opt.value
                      ? 'border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_8%,white)]'
                      : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="repaymentMethod"
                    value={opt.value}
                    checked={repaymentMethod === opt.value}
                    onChange={() => setRepaymentMethod(opt.value)}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13.5px] font-semibold">{opt.label}</span>
                    <span className="text-[12px] text-[var(--muted)]">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {isPending ? '계산 중…' : '계산하기'}
          </button>
        </form>

        {error && (
          <div className="rounded-[18px] bg-[var(--surface)] p-6 text-sm text-red-600">
            계산에 실패했습니다: {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        {result && (
          <div className="rounded-[18px] bg-[var(--surface)] p-7 px-8 shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]">
            <div className="mb-5 text-[13px] font-bold">
              계산 결과 · {REPAYMENT_METHOD_OPTIONS.find((o) => o.value === result.repaymentMethod)?.label}
            </div>
            <dl className="grid grid-cols-[1fr_auto] gap-y-3 text-[14px]">
              <dt className="text-[var(--muted)]">필요 대출액</dt>
              <dd className="text-right font-semibold">{formatWon(result.loanNeededWon)}</dd>

              <dt className="text-[var(--muted)]">{showsLastMonth ? '첫 달 상환액' : '월 상환액'}</dt>
              <dd className="text-right font-semibold">{formatWon(result.firstMonthPaymentWon)}</dd>

              {showsLastMonth && (
                <>
                  <dt className="text-[var(--muted)]">마지막 달 상환액</dt>
                  <dd className="text-right font-semibold">{formatWon(result.lastMonthPaymentWon)}</dd>
                </>
              )}

              <dt className="text-[var(--muted)]">대출 기간 전체 이자</dt>
              <dd className="text-right font-semibold">{formatWon(result.totalInterestWon)}</dd>

              <dt className="text-[var(--muted)]">월세 포함 총 월 주거비용{showsLastMonth ? ' (초기 기준)' : ''}</dt>
              <dd className="text-right font-semibold" style={{ color: 'var(--accent)' }}>
                {formatWon(result.totalMonthlyHousingCostWon)}
              </dd>

              {result.isCapitalSufficient && result.surplusCapitalWon > 0 && (
                <>
                  <dt className="text-[var(--muted)]">대출 없이 충당하고 남는 자본</dt>
                  <dd className="text-right font-semibold">{formatWon(result.surplusCapitalWon)}</dd>
                </>
              )}
            </dl>
            <div className="mt-4 text-xs text-[var(--muted-2)]">
              {result.isCapitalSufficient
                ? '입력한 자기자본만으로 보증금을 충당할 수 있습니다.'
                : `자기자본으로 부족한 ${formatWon(result.loanNeededWon)}을 전세자금대출로 조달한다고 가정한 결과입니다.`}
            </div>
          </div>
        )}

        <div className="flex gap-2.5 rounded-2xl bg-[var(--tint)] px-[22px] py-4 text-[13px] leading-relaxed text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="9" stroke="var(--muted-2)" strokeWidth="2" />
            <path d="M12 8v0.01M12 11v5" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            이 계산은 입력한 가정값(금리·기간·상환방식 등) 기준의 참고치입니다. 실제 대출 한도·금리·상환방식·승인
            여부는 개인 신용과 은행 심사에 따라 달라지므로, 정확한 조건은 반드시 금융기관에 확인하세요.
          </div>
        </div>
      </div>
    </div>
  )
}
