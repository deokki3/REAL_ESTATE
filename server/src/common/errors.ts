/**
 * Service 계층은 HTTP를 모른다 (D3). 그래서 res.status(404) 대신 AppError 를 던지고
 * 상태코드 변환은 errorHandler 한 곳에서만 한다.
 */
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = '요청한 리소스를 찾을 수 없습니다.') {
    super('NOT_FOUND', message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_FAILED', message, 400);
  }
}

/** 외부 API(LH·국토부 등) 호출이 실패했을 때. ingest 계층에서 사용. */
export class UpstreamError extends AppError {
  constructor(message: string) {
    super('UPSTREAM_FAILED', message, 502);
  }
}
