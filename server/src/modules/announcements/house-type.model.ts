import { Schema, model } from 'mongoose';
import type { AnnouncementSource, HouseType } from './announcement.types.js';

const SOURCES: AnnouncementSource[] = ['LH', 'MANUAL'];

const houseTypeSchema = new Schema<HouseType>(
  {
    source: { type: String, required: true, enum: SOURCES },
    panId: { type: String, required: true },
    complexName: { type: String, required: true },
    houseType: { type: String, required: true },
    exclusiveAreaM2: { type: Number, required: true },
    supplyAreaM2: { type: Number, required: true },
    totalHouseholds: { type: Number, required: true },
    currentSupplyHouseholds: { type: Number, required: true },
    // 원 단위 정수 그대로 저장 — CLAUDE.md 5절 (만원으로 반올림하지 않는다).
    // null 허용: 국민임대·행복주택 등은 LH API가 금액 대신 "공고문 참조" 텍스트를 주기도 한다.
    depositWon: { type: Number, default: null },
    monthlyRentWon: { type: Number, default: null },
  },
  { timestamps: true },
);

// 한 공고 안에서 같은 단지·주택형이 중복 저장되지 않게.
houseTypeSchema.index({ source: 1, panId: 1, complexName: 1, houseType: 1 }, { unique: true });
// 상세 화면에서 "이 공고의 주택형 목록"을 조회할 때 쓴다.
houseTypeSchema.index({ source: 1, panId: 1 });

export const HouseTypeModel = model<HouseType>('HouseType', houseTypeSchema);
