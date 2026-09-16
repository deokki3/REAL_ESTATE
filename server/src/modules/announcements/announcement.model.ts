import { Schema, model } from 'mongoose';
import type { Announcement, AnnouncementSource } from './announcement.types.js';

const SOURCES: AnnouncementSource[] = ['LH', 'MANUAL'];

/**
 * sourceKey는 소스마다 모양이 달라서(LH 5개 vs 향후 청약홈 2개) Mixed로 받는다.
 * 타입 안전성은 각 어댑터(ingest/lh/adapter.ts 등)가 만드는 시점에만 보장한다 — announcement.types.ts 참고.
 */
const announcementSchema = new Schema<Announcement>(
  {
    source: { type: String, required: true, enum: SOURCES },
    sourceKey: { type: Schema.Types.Mixed, required: true },
    title: { type: String, required: true },
    regionName: { type: String, required: true },
    categoryCode: { type: String, required: true },
    categoryName: { type: String, required: true },
    typeName: { type: String, required: true },
    postedAt: { type: Date, required: true },
    // D5: 토지·상가 등은 모집공고일이 없다. required 아님.
    noticeDate: { type: Date, default: null },
    closingAt: { type: Date, required: true },
    originalUrl: { type: String, required: true },
    originalUrlMobile: { type: String, required: true },
  },
  { timestamps: true },
);

// D4: 소스 내에서 PAN_ID(류)는 유일하다고 실제 데이터로 확인함 — 재수집 시 upsert 키로 쓴다.
announcementSchema.index({ source: 1, 'sourceKey.panId': 1 }, { unique: true });
// D5: "모집중/마감"을 저장하지 않는 대신, 마감일로 걸러서 조회 시점에 상태를 계산한다 (8단계).
announcementSchema.index({ closingAt: 1 });
// 리스트 화면의 지역·유형 필터 조합.
announcementSchema.index({ categoryCode: 1, regionName: 1 });

export const AnnouncementModel = model<Announcement>('Announcement', announcementSchema);
