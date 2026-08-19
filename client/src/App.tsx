import { useHealth } from './features/health/useHealth'

/**
 * 스캐폴딩 확인용 화면. 서버 연결이 살아있는지만 본다.
 * 실제 기능 화면이 붙으면 이 컴포넌트는 교체된다.
 */
function App() {
  const { data, isPending, error } = useHealth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold">부동산 공고 통합 + 자금 설계</h1>
        <p className="mt-2 text-sm text-slate-500">스캐폴딩 상태 확인용 화면입니다.</p>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-500">서버 연결</h2>

          {isPending && <p className="mt-3 text-slate-500">확인 중…</p>}

          {error && (
            <div className="mt-3">
              <p className="font-medium text-red-600">연결 실패</p>
              <p className="mt-1 text-sm text-slate-500">
                {error instanceof Error ? error.message : String(error)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                server 폴더에서 <code className="rounded bg-slate-100 px-1">npm run dev</code> 가 떠 있는지 확인하세요.
              </p>
            </div>
          )}

          {data && (
            <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
              <dt className="text-slate-500">상태</dt>
              <dd className="font-medium text-emerald-600">{data.status}</dd>

              <dt className="text-slate-500">환경</dt>
              <dd>{data.env}</dd>

              <dt className="text-slate-500">가동 시간</dt>
              <dd>{data.uptimeSec}초</dd>

              <dt className="text-slate-500">MongoDB</dt>
              <dd className={data.db === 'connected' ? 'text-emerald-600' : 'text-amber-600'}>
                {data.db}
              </dd>
            </dl>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
