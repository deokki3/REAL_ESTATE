import { env } from '../../config/env.js';
import { mongoState } from '../../db/mongoose.js';

/**
 * D3: Service 는 req/res 를 받지 않는다.
 * 나중에 AI Agent 가 이 함수를 도구로 그대로 호출할 수 있어야 한다.
 */

export interface HealthStatus {
  status: 'ok';
  env: string;
  uptimeSec: number;
  db: ReturnType<typeof mongoState>;
}

export function getHealth(): HealthStatus {
  return {
    status: 'ok',
    env: env.nodeEnv,
    uptimeSec: Math.round(process.uptime()),
    db: mongoState(),
  };
}
