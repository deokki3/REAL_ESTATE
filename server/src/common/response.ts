/**
 * 모든 API 응답은 이 봉투를 쓴다. 컨트롤러가 res.json(원본) 을 직접 부르지 않는다.
 * 클라이언트는 success 하나만 보고 분기할 수 있어야 한다.
 */

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, meta?: ApiMeta): ApiSuccess<T> {
  return meta === undefined ? { success: true, data } : { success: true, data, meta };
}

export function fail(code: string, message: string): ApiFailure {
  return { success: false, error: { code, message } };
}
