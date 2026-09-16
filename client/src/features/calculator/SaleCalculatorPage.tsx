import { useState } from 'react'
import { formatWon } from '../../lib/format'
import { useCalculateSalePlan } from './api'
import { REPAYMENT_METHOD_OPTIONS } from './constants'
import type { RepaymentMethod } from './types'

type TransactionType = 'resale' | 'presale'

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

export function SaleCalculatorPage() {
  const [transactionType, setTransactionType] = useState<TransactionType>('resale')
  const [totalPriceManwon, setTotalPriceManwon] = useState('50000')
  const [contractRatePercent, setContractRatePercent] = useState('10')
  const [interimInstallmentCount, setInterimInstallmentCount] = useState('4')
  const [interimTotalRatePercent, setInterimTotalRatePercent] = useState('60')
  const [interimLoanCoverageRatePercent, setInterimLoanCoverageRatePercent] = useState('100')
  const [ownCapitalManwon, setOwnCapitalManwon] = useState('20000')
  const [ltvPercent, setLtvPercent] = useState('70')
  const [mortgageRatePercent, setMortgageRatePercent] = useState('4.0')
  const [mortgageTermYears, setMortgageTermYears] = useState('30')
  const [mortgageRepaymentMethod, setMortgageRepaymentMethod] = useState<RepaymentMethod>('equalPayment')

  const { mutate, data: result, isPending, error } = useCalculateSalePlan()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const isPresale = transactionType === 'presale'
    mutate({
      totalPriceWon: Number(totalPriceManwon || 0) * 10000,
      contractRatePercent: Number(contractRatePercent || 0),
      interimInstallmentCount: isPresale ? Math.round(Number(interimInstallmentCount || 0)) : 0,
      interimTotalRatePercent: isPresale ? Number(interimTotalRatePercent || 0) : 0,
      interimLoanCoverageRatePercent: isPresale ? Number(interimLoanCoverageRatePercent || 0) : 0,
      ownCapitalWon: Number(ownCapitalManwon || 0) * 10000,
      ltvPercent: Number(ltvPercent || 0),
      mortgageAnnualRatePercent: Number(mortgageRatePercent || 0),
      mortgageTermMonths: Math.round(Number(mortgageTermYears || 0) * 12),
      mortgageRepaymentMethod,
    })
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-8 py-9 pb-14">
        <div>
          <h1 className="heading mb-1.5 text-2xl font-normal" style={{ color: 'oklch(30% 0.03 55)' }}>
            매매·분양 자금 계산기
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            계약금 → (분양이면 중도금) → 잔금 단계별로 자기자본이 부족해지는 시점이 있는지 확인합니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[18px] bg-[var(--surface)] p-7 px-8 shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]"
        >
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[var(--text)]">구분</span>
            <div className="flex gap-2">
              {(
                [
                  { value: 'resale', label: '매매 (기존 주택)', desc: '계약금 → 잔금, 중도금 없음' },
                  { value: 'presale', label: '분양 (신규 청약)', desc: '계약금 → 중도금 N회 → 잔금' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-1 cursor-pointer flex-col gap-0.5 rounded-xl border px-4 py-3 transition-colors ${
                    transactionType === opt.value
                      ? 'border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_8%,white)]'
                      : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="transactionType"
                      value={opt.value}
                      checked={transactionType === opt.value}
                      onChange={() => setTransactionType(opt.value)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-[13.5px] font-semibold">{opt.label}</span>
                  </span>
                  <span className="pl-6 text-[12px] text-[var(--muted)]">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <FieldInput label="분양가 / 매매가" value={totalPriceManwon} onChange={setTotalPriceManwon} suffix="만원" />
          <FieldInput label="계약금 비율" value={contractRatePercent} onChange={setContractRatePercent} suffix="%" />

          {transactionType === 'presale' && (
            <div className="grid grid-cols-3 gap-4 rounded-xl border border-[var(--border)] bg-[var(--tint)] p-4">
              <FieldInput
                label="중도금 회차"
                value={interimInstallmentCount}
                onChange={setInterimInstallmentCount}
                suffix="회"
              />
              <FieldInput
                label="중도금 총 비율"
                value={interimTotalRatePercent}
                onChange={setInterimTotalRatePercent}
                suffix="%"
              />
              <FieldInput
                label="중도금대출 충당 비율"
                value={interimLoanCoverageRatePercent}
                onChange={setInterimLoanCoverageRatePercent}
                suffix="%"
              />
            </div>
          )}

          <FieldInput label="자기자본" value={ownCapitalManwon} onChange={setOwnCapitalManwon} suffix="만원" />

          <div className="grid grid-cols-3 gap-4">
            <FieldInput label="LTV 한도 (가정)" value={ltvPercent} onChange={setLtvPercent} suffix="%" />
            <FieldInput label="주택담보대출 금리" value={mortgageRatePercent} onChange={setMortgageRatePercent} suffix="%/년" />
            <FieldInput label="대출 기간" value={mortgageTermYears} onChange={setMortgageTermYears} suffix="년" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[var(--text)]">주택담보대출 상환 방식</span>
            <div className="flex flex-col gap-2">
              {REPAYMENT_METHOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    mortgageRepaymentMethod === opt.value
                      ? 'border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_8%,white)]'
                      : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="mortgageRepaymentMethod"
                    value={opt.value}
                    checked={mortgageRepaymentMethod === opt.value}
                    onChange={() => setMortgageRepaymentMethod(opt.value)}
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
            <div className="mb-1 text-[13px] font-bold">단계별 자금 흐름</div>
            <div
              className="mb-4 text-xs font-semibold"
              style={{ color: result.hasShortfall ? '#c0392b' : 'color-mix(in oklch, var(--accent) 70%, black 10%)' }}
            >
              {result.hasShortfall
                ? '⚠ 자기자본과 대출을 합쳐도 부족한 시점이 있습니다.'
                : '✓ 모든 단계에서 자금이 충분합니다.'}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="border-b border-[var(--border)] px-2 py-2 text-left font-semibold text-[var(--muted)]">단계</th>
                    <th className="border-b border-[var(--border)] px-2 py-2 text-right font-semibold text-[var(--muted)]">필요금액</th>
                    <th className="border-b border-[var(--border)] px-2 py-2 text-right font-semibold text-[var(--muted)]">대출충당</th>
                    <th className="border-b border-[var(--border)] px-2 py-2 text-right font-semibold text-[var(--muted)]">자기자본지출</th>
                    <th className="border-b border-[var(--border)] px-2 py-2 text-right font-semibold text-[var(--muted)]">부족분</th>
                    <th className="border-b border-[var(--border)] px-2 py-2 text-right font-semibold text-[var(--muted)]">잔여자기자본</th>
                  </tr>
                </thead>
                <tbody>
                  {result.stages.map((stage, i) => (
                    <tr key={`${stage.label}-${i}`} className={stage.shortfallWon > 0 ? 'bg-red-50' : ''}>
                      <td className="border-b border-[var(--border)] px-2 py-2.5 text-left font-semibold">{stage.label}</td>
                      <td className="border-b border-[var(--border)] px-2 py-2.5 text-right">{formatWon(stage.dueWon)}</td>
                      <td className="border-b border-[var(--border)] px-2 py-2.5 text-right">{formatWon(stage.loanCoveredWon)}</td>
                      <td className="border-b border-[var(--border)] px-2 py-2.5 text-right">{formatWon(stage.paidFromCapitalWon)}</td>
                      <td className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold" style={{ color: stage.shortfallWon > 0 ? '#c0392b' : undefined }}>
                        {stage.shortfallWon > 0 ? formatWon(stage.shortfallWon) : '—'}
                      </td>
                      <td className="border-b border-[var(--border)] px-2 py-2.5 text-right">{formatWon(stage.remainingCapitalWon)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-5 grid grid-cols-[1fr_auto] gap-y-3 text-[14px]">
              {result.totalInterimLoanWon > 0 && (
                <>
                  <dt className="text-[var(--muted)]">중도금대출 누적 원금</dt>
                  <dd className="text-right font-semibold">{formatWon(result.totalInterimLoanWon)}</dd>
                </>
              )}

              <dt className="text-[var(--muted)]">잔금 단계 주택담보대출액</dt>
              <dd className="text-right font-semibold">
                {formatWon(result.mortgageLoanWon)}
                {result.exceedsLtvLimit && <span className="ml-1 text-xs font-semibold text-red-600">(LTV 한도 초과분 있음)</span>}
              </dd>

              <dt className="text-[var(--muted)]">LTV 한도 (가정)</dt>
              <dd className="text-right font-semibold">{formatWon(result.ltvLimitWon)}</dd>

              <dt className="text-[var(--muted)]">주담대 월 상환액{result.mortgage.firstMonthPaymentWon !== result.mortgage.lastMonthPaymentWon ? ' (첫 달)' : ''}</dt>
              <dd className="text-right font-semibold" style={{ color: 'var(--accent)' }}>
                {formatWon(result.mortgage.firstMonthPaymentWon)}
              </dd>

              {result.mortgage.firstMonthPaymentWon !== result.mortgage.lastMonthPaymentWon && (
                <>
                  <dt className="text-[var(--muted)]">주담대 월 상환액 (마지막 달)</dt>
                  <dd className="text-right font-semibold">{formatWon(result.mortgage.lastMonthPaymentWon)}</dd>
                </>
              )}

              <dt className="text-[var(--muted)]">주담대 총 이자</dt>
              <dd className="text-right font-semibold">{formatWon(result.mortgage.totalInterestWon)}</dd>

              <dt className="text-[var(--muted)]">모든 단계 종료 후 남은 자기자본</dt>
              <dd className="text-right font-semibold">{formatWon(result.finalRemainingCapitalWon)}</dd>
            </dl>
          </div>
        )}

        <div className="flex gap-2.5 rounded-2xl bg-[var(--tint)] px-[22px] py-4 text-[13px] leading-relaxed text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="9" stroke="var(--muted-2)" strokeWidth="2" />
            <path d="M12 8v0.01M12 11v5" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            이 계산은 입력한 가정값(LTV·금리·중도금대출 충당비율 등) 기준의 참고치입니다. 실제 대출 한도·금리·승인
            여부는 개인 신용과 은행 심사에 따라 달라지므로, 정확한 조건은 반드시 금융기관에 확인하세요. 중도금대출
            이자는 계산에 포함하지 않았습니다(무이자 집단대출 관행 가정) — 실제로는 이자가 발생할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  )
}
