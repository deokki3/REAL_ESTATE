/**
 * 서버 응답 봉투 { success, data, meta? } 를 푸는 곳은 여기 한 군데다.
 * 화면 코드는 봉투를 모르고 data 만 받는다.
 *
 * 주의: client / server 는 독립 npm 프로젝트라 타입을 공유하지 않는다.
 * 서버의 common/response.ts 를 바꾸면 이 파일도 손으로 맞춰야 한다.
 */

export interface ApiMeta {
  page?: number
  pageSize?: number
  total?: number
  [key: string]: unknown
}

type ApiEnvelope<T> =
  | { success: true; data: T; meta?: ApiMeta }
  | { success: false; error: { code: string; message: string } }

export class ApiError extends Error {
  // 생성자 파라미터 프로퍼티(`constructor(readonly code: string)`)는
  // Vite 템플릿의 erasableSyntaxOnly 설정에서 막혀 있어 필드를 따로 선언한다.
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

type QueryValue = string | number | boolean | undefined | null
type QueryParams = Record<string, QueryValue | QueryValue[]>

function buildUrl(path: string, params?: QueryParams): string {
  // 상대 경로다. 개발에서는 Vite 프록시가, 배포에서는 같은 도메인이 받는다.
  const url = `/api${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue
      // 서버(Express)는 같은 키를 반복하면 배열로 받는다 — region=a&region=b
      search.append(key, String(v))
    }
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

export async function apiGet<T>(
  path: string,
  params?: QueryParams,
): Promise<{ data: T; meta?: ApiMeta }> {
  const response = await fetch(buildUrl(path, params), {
    headers: { Accept: 'application/json' },
  })

  let body: ApiEnvelope<T>
  try {
    body = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError('INVALID_RESPONSE', `서버가 JSON이 아닌 응답을 보냈습니다 (HTTP ${response.status})`)
  }

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message)
  }

  return { data: body.data, meta: body.meta }
}

export async function apiPost<T>(path: string, payload: unknown): Promise<{ data: T; meta?: ApiMeta }> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  let body: ApiEnvelope<T>
  try {
    body = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError('INVALID_RESPONSE', `서버가 JSON이 아닌 응답을 보냈습니다 (HTTP ${response.status})`)
  }

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message)
  }

  return { data: body.data, meta: body.meta }
}
