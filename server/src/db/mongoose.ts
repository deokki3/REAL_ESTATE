import mongoose from 'mongoose';
import { env, isProduction } from '../config/env.js';

/**
 * 개발 중에는 Mongo가 안 떠 있어도 서버는 부팅된다 (경고만 남기고 계속).
 * 운영에서는 연결 실패 시 즉시 죽는다 — DB 없는 서버가 200을 돌려주면 안 된다.
 */
export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[mongo] 연결됨 → ${redact(env.mongoUri)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isProduction) {
      throw new Error(`[mongo] 연결 실패: ${message}`);
    }
    console.warn(`[mongo] 연결 실패 (개발 모드라 계속 진행): ${message}`);
  }
}

/** mongoose.connection.readyState 를 사람이 읽을 수 있는 값으로. */
export function mongoState(): 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown' {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.connection.close();
}

/** 로그에 비밀번호가 찍히지 않도록 자격증명 부분을 가린다. */
function redact(uri: string): string {
  return uri.replace(/\/\/[^@]*@/, '//***@');
}
