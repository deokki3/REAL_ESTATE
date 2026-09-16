import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAnnouncementDetail } from './api'
import { SOURCE_LABELS, STATUS_OPTIONS } from './constants'
import { formatDate } from './format'
import { formatWon } from '../../lib/format'

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isPending, error } = useAnnouncementDetail(id)
  const [selectedHouseType, setSelectedHouseType] = useState<string | null>(null)

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[900px] flex-col gap-5 px-8 py-9 pb-14">
        <div className="text-xs text-[var(--muted-2)]">
          <Link to="/">공고 목록</Link> &nbsp;›&nbsp; 공고 상세
        </div>

        {isPending && <div className="text-sm text-[var(--muted)]">불러오는 중…</div>}

        {error && (
          <div className="rounded-[18px] bg-[var(--surface)] p-6 text-sm text-red-600">
            공고를 불러오지 못했습니다: {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        {data && (
          <>
            <div>
              <div className="mb-3.5 flex gap-2">
                <span
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                  style={
                    data.status === 'open'
                      ? { background: 'color-mix(in oklch, var(--accent) 16%, white)', color: 'color-mix(in oklch, var(--accent) 70%, black 10%)' }
                      : { background: 'var(--closed-bg)', color: 'var(--muted-2)' }
                  }
                >
                  {STATUS_OPTIONS.find((o) => o.value === data.status)?.label ?? data.status}
                </span>
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--tint)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--muted)]">
                  {data.categoryName} · {data.typeName}
                </span>
              </div>
              <h1 className="heading mb-2 text-[25px] font-normal leading-normal" style={{ color: 'oklch(30% 0.03 55)' }}>
                {data.title}
              </h1>
              <div className="text-[13px] text-[var(--muted)]">
                {data.regionName} · 출처 {SOURCE_LABELS[data.source] ?? data.source}
              </div>
            </div>

            <div className="rounded-[18px] bg-[var(--surface)] p-7 px-8 shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]">
              <div className="mb-5 text-[13px] font-bold">공고 일정</div>
              <div className="flex items-center px-1">
                <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]" />
                <div className="h-0.5 flex-1 bg-[var(--accent)]" />
                {data.noticeDate ? (
                  <>
                    <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]" />
                    <div className="h-0.5 flex-1 bg-[var(--border)]" />
                  </>
                ) : null}
                <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-[var(--accent)] bg-white" />
              </div>
              <div className="mt-2.5 flex px-1 text-xs text-[var(--muted)]">
                <div className="w-[90px] flex-shrink-0">
                  공고게시일
                  <br />
                  {formatDate(data.postedAt)}
                </div>
                <div className="flex-1" />
                {data.noticeDate ? (
                  <>
                    <div className="w-[90px] flex-shrink-0">
                      모집공고일
                      <br />
                      {formatDate(data.noticeDate)}
                    </div>
                    <div className="flex-1" />
                  </>
                ) : null}
                <div className="w-[90px] flex-shrink-0 text-right">
                  접수마감
                  <br />
                  {formatDate(data.closingAt)}
                </div>
              </div>
              <div className="mt-11 text-xs text-[var(--muted-2)]">
                {data.status === 'open' ? '오늘 기준 접수 진행 중입니다.' : '접수가 마감된 공고입니다.'}
              </div>
            </div>

            <div className="rounded-[18px] bg-[var(--surface)] p-7 px-8 shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]">
              {data.houseTypes.length > 0 ? (
                <>
                  <div className="mb-5 text-[13px] font-bold">주택형별 공급 정보</div>
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-left font-semibold text-[var(--muted)]">주택형</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">전용면적(㎡)</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">공급면적(㎡)</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">보증금</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">월세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.houseTypes.map((h) => {
                        const key = `${h.complexName}-${h.houseType}`
                        return (
                          <tr
                            key={key}
                            onClick={() => setSelectedHouseType(key)}
                            className={`cursor-pointer ${selectedHouseType === key ? 'bg-[color-mix(in_oklch,var(--accent)_10%,white)]' : ''}`}
                          >
                            <td className="border-b border-[var(--border)] px-2 py-3 text-left font-semibold">{h.houseType}</td>
                            <td className="border-b border-[var(--border)] px-2 py-3 text-right">{h.exclusiveAreaM2}</td>
                            <td className="border-b border-[var(--border)] px-2 py-3 text-right">{h.supplyAreaM2}</td>
                            <td className="border-b border-[var(--border)] px-2 py-3 text-right">{formatWon(h.depositWon)}</td>
                            <td className="border-b border-[var(--border)] px-2 py-3 text-right">{formatWon(h.monthlyRentWon)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              ) : data.purchaseLeaseSupplies.length > 0 ? (
                <>
                  <div className="mb-5 text-[13px] font-bold">모집세대</div>
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-left font-semibold text-[var(--muted)]">지역명</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-left font-semibold text-[var(--muted)]">주택정보</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">면적</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">공급호수</th>
                        <th className="border-b border-[var(--border)] px-2 py-2.5 text-right font-semibold text-[var(--muted)]">모집인원</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.purchaseLeaseSupplies.map((p, i) => (
                        <tr key={`${p.complexInfo}-${i}`}>
                          <td className="border-b border-[var(--border)] px-2 py-3 text-left">{p.regionName}</td>
                          <td className="border-b border-[var(--border)] px-2 py-3 text-left font-semibold">{p.complexInfo}</td>
                          <td className="border-b border-[var(--border)] px-2 py-3 text-right">
                            {p.exclusiveAreaM2 !== null ? `${p.exclusiveAreaM2}㎡` : (p.areaLabel ?? '정보없음')}
                          </td>
                          <td className="border-b border-[var(--border)] px-2 py-3 text-right">{p.supplyCount}</td>
                          <td className="border-b border-[var(--border)] px-2 py-3 text-right">{p.recruitCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  <div className="mb-5 text-[13px] font-bold">주택형별 공급 정보</div>
                  <div className="py-6 text-center text-sm text-[var(--muted-2)]">주택형 정보가 아직 없습니다.</div>
                </>
              )}
            </div>

            {data.originalUrl && (
              <div>
                <a
                  href={data.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-none bg-[var(--accent)] px-[22px] py-3 text-sm font-semibold text-white hover:brightness-105"
                >
                  원문 공고 보기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            )}

            <div className="flex gap-2.5 rounded-2xl bg-[var(--tint)] px-[22px] py-4 text-[13px] leading-relaxed text-[var(--muted)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="9" stroke="var(--muted-2)" strokeWidth="2" />
                <path d="M12 8v0.01M12 11v5" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                이 페이지는 {SOURCE_LABELS[data.source] ?? data.source} 공고 원문을 정리한 참고 정보입니다. 신청 자격 · 제출 서류 등 정확한 내용은 반드시 원문 공고를 확인하세요.
                {data.houseTypes.some((h) => h.depositWon === null || h.monthlyRentWon === null) &&
                  ' 일부 주택형은 보증금·월세가 "원문 공고 참조"로 표시되며, 이는 해당 기관이 정확한 금액을 API로 제공하지 않기 때문입니다.'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
