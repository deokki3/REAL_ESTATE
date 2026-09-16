import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnnouncements } from './api'
import { CATEGORY_OPTIONS, REGION_OPTIONS, SOURCE_LABELS, STATUS_OPTIONS } from './constants'
import { formatDate } from './format'
import type { AnnouncementStatus } from './types'

const PAGE_SIZE = 10

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: readonly { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="border-t border-[var(--border)] pt-4 mt-4 first:mt-0 first:border-t-0 first:pt-0">
      <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-[var(--muted)]">{label}</div>
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--text)]">
            <input
              type="checkbox"
              className="h-4 w-4 flex-shrink-0 accent-[var(--accent)]"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AnnouncementStatus }) {
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  const style =
    status === 'open'
      ? { background: 'color-mix(in oklch, var(--accent) 16%, white)', color: 'color-mix(in oklch, var(--accent) 70%, black 10%)' }
      : { background: 'var(--closed-bg)', color: 'var(--muted-2)' }
  return (
    <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold" style={style}>
      {label}
    </span>
  )
}

export function AnnouncementListPage() {
  const [regions, setRegions] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [statuses, setStatuses] = useState<AnnouncementStatus[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, isPending, error } = useAnnouncements({
    region: regions,
    category: categories,
    status: statuses,
    q: query || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const total = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function reset() {
    setRegions([])
    setCategories([])
    setStatuses([])
    setQuery('')
    setPage(1)
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-[22px] px-8 py-9 pb-14">
        <div>
          <h1 className="heading mb-1.5 text-2xl font-normal" style={{ color: 'oklch(30% 0.03 55)' }}>
            공고 리스트
          </h1>
          <p className="text-[13px] text-[var(--muted)]">LH 공고를 한 곳에서, 따뜻하게 확인하세요</p>
        </div>

        <div className="flex items-start gap-6">
          <aside className="w-[252px] flex-shrink-0 rounded-[18px] bg-[var(--surface)] p-[22px] shadow-[0_6px_18px_-10px_oklch(55%_0.08_50_/_0.3)]">
            <div className="mb-[18px] flex items-center justify-between">
              <div className="text-sm font-bold">필터</div>
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer border-none bg-transparent p-0 text-xs text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
              >
                초기화
              </button>
            </div>

            <CheckboxGroup
              label="지역"
              options={REGION_OPTIONS}
              selected={regions}
              onToggle={(v) => {
                setRegions((prev) => toggle(prev, v))
                setPage(1)
              }}
            />
            <CheckboxGroup
              label="거래유형"
              options={CATEGORY_OPTIONS}
              selected={categories}
              onToggle={(v) => {
                setCategories((prev) => toggle(prev, v))
                setPage(1)
              }}
            />
            <CheckboxGroup
              label="상태"
              options={STATUS_OPTIONS}
              selected={statuses}
              onToggle={(v) => {
                setStatuses((prev) => toggle(prev, v as AnnouncementStatus))
                setPage(1)
              }}
            />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="7" stroke="var(--muted-2)" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="공고명 검색"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-full border border-[var(--border)] bg-white py-3 pl-10 pr-[18px] text-[13.5px] text-[var(--text)] shadow-[0_4px_14px_-10px_oklch(55%_0.08_50_/_0.4)] placeholder:text-[var(--muted-2)]"
              />
            </div>

            {error && (
              <div className="rounded-[18px] bg-[var(--surface)] p-6 text-sm text-red-600">
                공고를 불러오지 못했습니다: {error instanceof Error ? error.message : String(error)}
              </div>
            )}

            {!error && (
              <>
                <div className="px-1 text-[13px] text-[var(--muted)]">{isPending ? '불러오는 중…' : `총 ${total}건`}</div>

                <div className="flex flex-col gap-3">
                  {data?.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/announcements/${item.id}`}
                      className="flex items-center gap-4 rounded-[18px] bg-[var(--surface)] px-5 py-[18px] shadow-[0_6px_18px_-10px_oklch(55%_0.08_50_/_0.35)] transition-shadow hover:shadow-[0_10px_26px_-10px_oklch(55%_0.1_50_/_0.45)]"
                    >
                      <div className="flex flex-shrink-0 flex-col gap-1.5">
                        <StatusBadge status={item.status} />
                        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--tint)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--muted)]">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-[var(--text)]">
                          {item.title}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {item.regionName} · {item.typeName} · 출처 {SOURCE_LABELS[item.source] ?? item.source}
                        </div>
                      </div>
                      <div className="w-[170px] flex-shrink-0 text-right text-xs text-[var(--muted)]">
                        {formatDate(item.postedAt)} ~ {formatDate(item.closingAt)}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[var(--muted-2)]">
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  ))}

                  {!isPending && data?.items.length === 0 && (
                    <div className="flex items-center justify-center rounded-[18px] bg-[var(--surface)] py-14 text-sm text-[var(--muted-2)]">
                      조건에 맞는 공고가 없습니다. 필터를 조정해보세요.
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-1 text-[13px] disabled:opacity-35"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n)}
                        className={`inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-full border px-1 text-[13px] ${
                          n === page
                            ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-white'
                            : 'border-[var(--border)] bg-white text-[var(--text)]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-1 text-[13px] disabled:opacity-35"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 rounded-2xl bg-[var(--tint)] px-[22px] py-4 text-[13px] leading-relaxed text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="9" stroke="var(--muted-2)" strokeWidth="2" />
            <path d="M12 8v0.01M12 11v5" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>현재 LH 공고를 제공합니다. 청약홈 · SH · HUG 등 다른 기관 공고는 아직 준비 중이며, 필요하실 경우 해당 기관 홈페이지에서 확인해 주세요.</div>
        </div>
      </div>
    </div>
  )
}
