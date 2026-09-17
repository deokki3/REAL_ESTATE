import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

type SortDirection = 'asc' | 'desc'
interface SortState {
  columnIndex: number
  direction: SortDirection
}

const HEADER_SCAN_ROWS = 15

/** 제목·공고명 같은 안내 행은 셀 하나만 채워져 있는 경우가 많다 — 채워진 셀이 가장 많은 행을 헤더로 추정한다. */
function guessHeaderRowIndex(rows: string[][]): number {
  let bestIndex = 0
  let bestCount = -1
  const scanCount = Math.min(HEADER_SCAN_ROWS, rows.length)
  for (let i = 0; i < scanCount; i += 1) {
    const filled = rows[i]?.filter((cell) => cell.trim() !== '').length ?? 0
    if (filled > bestCount) {
      bestCount = filled
      bestIndex = i
    }
  }
  return bestIndex
}

function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[,₩%\s]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** 컬럼 값 대부분이 숫자로 파싱되면 숫자 정렬, 아니면 문자열 정렬을 쓴다. */
function isNumericColumn(rows: string[][], columnIndex: number): boolean {
  const values = rows.map((r) => r[columnIndex] ?? '').filter((v) => v.trim() !== '')
  if (values.length === 0) return false
  const numericCount = values.filter((v) => parseNumeric(v) !== null).length
  return numericCount / values.length >= 0.8
}

export function ExcelViewerPage() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [rawRows, setRawRows] = useState<string[][] | null>(null)
  const [headerRowNumber, setHeaderRowNumber] = useState(1)
  const [sort, setSort] = useState<SortState | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setFileName(file.name)
    setSort(null)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) throw new Error('시트를 찾을 수 없습니다.')
      const sheet = workbook.Sheets[firstSheetName]
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
      const stringRows = rows.map((row) => row.map((cell) => String(cell ?? '').trim()))
      setRawRows(stringRows)
      setHeaderRowNumber(guessHeaderRowIndex(stringRows) + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setRawRows(null)
    }
  }

  const { columns, dataRows } = useMemo(() => {
    if (!rawRows) return { columns: [] as string[], dataRows: [] as string[][] }
    const headerIndex = Math.min(Math.max(headerRowNumber - 1, 0), rawRows.length - 1)
    const headerRow = rawRows[headerIndex] ?? []
    const cols = headerRow.map((label, i) => (label.trim() !== '' ? label : `열${i + 1}`))
    const body = rawRows.slice(headerIndex + 1).filter((row) => row.some((cell) => cell.trim() !== ''))
    return { columns: cols, dataRows: body }
  }, [rawRows, headerRowNumber])

  const sortedRows = useMemo(() => {
    if (!sort) return dataRows
    const { columnIndex, direction } = sort
    const numeric = isNumericColumn(dataRows, columnIndex)
    const copy = [...dataRows]
    copy.sort((a, b) => {
      const av = a[columnIndex] ?? ''
      const bv = b[columnIndex] ?? ''
      let cmp: number
      if (numeric) {
        const an = parseNumeric(av)
        const bn = parseNumeric(bv)
        cmp = (an ?? -Infinity) - (bn ?? -Infinity)
      } else {
        cmp = av.localeCompare(bv, 'ko')
      }
      return direction === 'asc' ? cmp : -cmp
    })
    return copy
  }, [dataRows, sort])

  function toggleSort(columnIndex: number) {
    setSort((prev) => {
      if (!prev || prev.columnIndex !== columnIndex) return { columnIndex, direction: 'asc' }
      return { columnIndex, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-8 py-9 pb-14">
        <div>
          <h1 className="heading mb-1.5 text-2xl font-normal" style={{ color: 'oklch(30% 0.03 55)' }}>
            엑셀 뷰어
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            공고에 첨부된 엑셀(공급가능주택 목록 등)을 올리면 표로 보여줍니다. 열 제목을 클릭하면 그 기준으로
            정렬됩니다. 이 페이지는 아무것도 저장하지 않습니다 — 새로고침하면 사라집니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-[18px] bg-[var(--surface)] p-7 px-8 shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--text)]">엑셀 파일 (.xlsx, .xls, .csv)</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[13.5px] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-4 file:py-1.5 file:text-[13px] file:font-semibold file:text-white"
            />
          </label>

          {fileName && <div className="text-xs text-[var(--muted)]">불러온 파일: {fileName}</div>}

          {rawRows && (
            <label className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[var(--text)]">헤더 행 번호</span>
              <input
                type="number"
                min={1}
                max={rawRows.length}
                value={headerRowNumber}
                onChange={(e) => setHeaderRowNumber(Number(e.target.value) || 1)}
                className="w-20 rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-[13px] focus:border-[var(--accent)] focus:outline-none"
              />
              <span className="text-xs text-[var(--muted-2)]">
                열 제목이 이상하면 실제 제목이 있는 행 번호로 바꿔보세요 (자동으로 추정한 값입니다).
              </span>
            </label>
          )}

          {error && <div className="text-sm text-red-600">파일을 읽지 못했습니다: {error}</div>}
        </div>

        {rawRows && columns.length > 0 && (
          <div className="overflow-x-auto rounded-[18px] bg-[var(--surface)] shadow-[0_6px_18px_-10px_oklch(55%_0.08_50/0.3)]">
            <table className="w-full min-w-max border-collapse text-[13px]">
              <thead>
                <tr>
                  {columns.map((col, i) => {
                    const isSorted = sort?.columnIndex === i
                    return (
                      <th
                        key={`${col}-${i}`}
                        onClick={() => toggleSort(i)}
                        className="cursor-pointer whitespace-nowrap border-b border-[var(--border)] bg-[var(--tint)] px-3 py-2.5 text-left font-semibold text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        {col}
                        {isSorted ? (sort?.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className="whitespace-nowrap border-b border-[var(--border)] px-3 py-2 text-right first:text-left"
                      >
                        {row[colIndex] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rawRows && dataRows.length === 0 && (
          <div className="rounded-[18px] bg-[var(--surface)] py-14 text-center text-sm text-[var(--muted-2)]">
            헤더 행 아래에 데이터가 없습니다. 헤더 행 번호를 확인해보세요.
          </div>
        )}
      </div>
    </div>
  )
}
