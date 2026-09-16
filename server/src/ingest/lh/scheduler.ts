import { ingestLhAnnouncements } from './collector.js';

/**
 * 항상 한국 표준시(KST, UTC+9, 서머타임 없음) 오전 9시 기준이다 — 서버가 실제로 어느
 * 지역(리전)에 떠 있든 상관없다. 서버 로컬 타임존에 의존하면 서버를 해외 리전에 올렸을 때
 * "오전 9시"의 의미가 달라지므로, 여기서는 UTC 절대시각을 직접 계산해서 그 문제를 피한다.
 *
 * 그 시각에 서버가 죽어있었으면 그 날은 그냥 건너뛴다 — 재시도·보정 로직은 없다 (v1 범위 밖).
 */
const TARGET_HOUR_KST = 9;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;

function msUntilNextRun(): number {
  const nowMs = Date.now();
  // now를 KST로 "밀어서" UTC getter로 읽으면 KST 기준 연/월/일이 나온다.
  const kstNow = new Date(nowMs + KST_OFFSET_MS);
  const kstY = kstNow.getUTCFullYear();
  const kstM = kstNow.getUTCMonth();
  const kstD = kstNow.getUTCDate();

  // "KST 오늘 09:00"을 다시 절대시각(UTC ms)으로 환산.
  let targetMs = Date.UTC(kstY, kstM, kstD, TARGET_HOUR_KST, 0, 0, 0) - KST_OFFSET_MS;
  if (targetMs <= nowMs) {
    targetMs += ONE_DAY_MS;
  }
  return targetMs - nowMs;
}

async function runAndReschedule(): Promise<void> {
  console.log('[lh-scheduler] 수집 시작');
  try {
    const result = await ingestLhAnnouncements();
    console.log('[lh-scheduler] 수집 완료', result);
  } catch (err) {
    console.error('[lh-scheduler] 수집 실패', err);
  } finally {
    timer = setTimeout(() => void runAndReschedule(), ONE_DAY_MS);
  }
}

export function startLhScheduler(): void {
  if (timer) return;
  const delay = msUntilNextRun();
  console.log(`[lh-scheduler] 다음 수집까지 ${Math.round(delay / 60000)}분 남음`);
  timer = setTimeout(() => void runAndReschedule(), delay);
}

export function stopLhScheduler(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
