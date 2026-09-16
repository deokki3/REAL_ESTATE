import 'dotenv/config';

/**
 * 환경변수는 이 파일에서 한 번만 읽는다.
 * 다른 파일에서 process.env 를 직접 참조하지 않는다 — 어디서 무엇을 요구하는지 흩어지면 추적이 안 된다.
 */

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`환경변수 ${name} 가 숫자가 아닙니다: ${raw}`);
  }
  return parsed;
}

export type KeyMode = 'ENCODED' | 'DECODED';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num('PORT', 4000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/realestate',

  dataGoKr: {
    encodedKey: process.env.DATA_GO_KR_KEY_ENCODED ?? '',
    decodedKey: process.env.DATA_GO_KR_KEY_DECODED ?? '',
    keyMode: (process.env.DATA_GO_KR_KEY_MODE ?? 'DECODED') as KeyMode,
  },

  /**
   * 온디맨드 수집 API(/api/ingest/lh) 호출을 막는 공유키. v1은 회원 인증이 없어서(11절)
   * 배포 시 아무나 이 엔드포인트를 두드려 공공데이터포털 일일 호출량을 소진시키지 못하게
   * 최소한의 방어로 둔다. 비어 있으면 그 엔드포인트 자체를 막는다 — ingest.controller.ts 참고.
   */
  adminIngestKey: process.env.ADMIN_INGEST_KEY ?? '',
} as const;

export const isProduction = env.nodeEnv === 'production';
