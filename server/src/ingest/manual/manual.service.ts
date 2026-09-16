import { AnnouncementModel } from '../../modules/announcements/announcement.model.js';
import { HouseTypeModel } from '../../modules/announcements/house-type.model.js';
import { PurchaseLeaseSupplyModel } from '../../modules/announcements/purchase-lease-supply.model.js';
import type { Announcement } from '../../modules/announcements/announcement.types.js';
import type { ManualAnnouncementInput, ManualAnnouncementResult } from './manual.types.js';

/** 같은 제목·게시일로 다시 저장해도 새 문서가 안 생기게 재현 가능한 합성 키를 만든다. */
function makeManualPanId(title: string, postedAt: Date): string {
  const datePart = postedAt.toISOString().slice(0, 10).replace(/-/g, '');
  const titleSlug = title
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `MANUAL-${datePart}-${titleSlug}`;
}

/**
 * D2: 순수 함수, 외부 API 호출 없음 — 이미 읽어서 채운 값을 그대로 저장만 한다.
 * D4: source='MANUAL'인 네 번째 수집 방식. `sourceKey.panId`는 재조회용이 아니라 중복 방지용 합성 키다.
 */
export async function saveManualAnnouncement(input: ManualAnnouncementInput): Promise<ManualAnnouncementResult> {
  const panId = makeManualPanId(input.title, input.postedAt);

  const announcement: Announcement = {
    source: 'MANUAL',
    sourceKey: { panId },
    title: input.title,
    regionName: input.regionName,
    categoryCode: input.categoryCode,
    categoryName: input.categoryName,
    typeName: input.typeName,
    postedAt: input.postedAt,
    noticeDate: input.noticeDate,
    closingAt: input.closingAt,
    originalUrl: input.originalUrl ?? '',
    originalUrlMobile: input.originalUrlMobile ?? '',
  };

  const doc = await AnnouncementModel.findOneAndUpdate(
    { source: 'MANUAL', 'sourceKey.panId': panId },
    announcement,
    { upsert: true, returnDocument: 'after' },
  );
  if (!doc) throw new Error('수동 공고 저장에 실패했습니다.');

  if (input.houseTypes?.length) {
    await HouseTypeModel.deleteMany({ source: 'MANUAL', panId });
    await HouseTypeModel.insertMany(input.houseTypes.map((h) => ({ ...h, source: 'MANUAL' as const, panId })));
  }

  if (input.purchaseLeaseSupplies?.length) {
    await PurchaseLeaseSupplyModel.deleteMany({ source: 'MANUAL', panId });
    await PurchaseLeaseSupplyModel.insertMany(
      input.purchaseLeaseSupplies.map((p) => ({ ...p, source: 'MANUAL' as const, panId })),
    );
  }

  return { id: String(doc._id), panId };
}
