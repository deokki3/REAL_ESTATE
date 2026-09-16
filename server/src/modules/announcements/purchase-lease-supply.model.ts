import { Schema, model } from 'mongoose';
import type { AnnouncementSource, PurchaseLeaseSupply } from './announcement.types.js';

const SOURCES: AnnouncementSource[] = ['LH', 'MANUAL'];

const purchaseLeaseSupplySchema = new Schema<PurchaseLeaseSupply>(
  {
    source: { type: String, required: true, enum: SOURCES },
    panId: { type: String, required: true },
    regionName: { type: String, required: true },
    complexInfo: { type: String, required: true },
    // null 허용: 코드별로 면적 필드 자체가 없는 경우가 더 많다 — CLAUDE.md 6절.
    exclusiveAreaM2: { type: Number, default: null },
    areaLabel: { type: String, default: null },
    supplyCount: { type: Number, required: true },
    recruitCount: { type: Number, required: true },
  },
  { timestamps: true },
);

// 안정적인 자연키가 없다(같은 단지가 같은 공고 안에 중복 등장할 수 있음) — 9절 실거래가 정책과 같은 이유로
// upsert가 아니라 매 수집마다 panId 단위로 통째로 지우고 다시 넣는다(collector.ts 참고). 조회용 인덱스만 둔다.
purchaseLeaseSupplySchema.index({ source: 1, panId: 1 });

export const PurchaseLeaseSupplyModel = model<PurchaseLeaseSupply>(
  'PurchaseLeaseSupply',
  purchaseLeaseSupplySchema,
);
