import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './db/mongoose.js';
import { startLhScheduler, stopLhScheduler } from './ingest/lh/scheduler.js';

async function main(): Promise<void> {
  await connectMongo();
  startLhScheduler();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[server] ${signal} 수신 — 종료합니다.`);
    stopLhScheduler();
    server.close(() => {
      void disconnectMongo().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[server] 부팅 실패', error);
  process.exit(1);
});
