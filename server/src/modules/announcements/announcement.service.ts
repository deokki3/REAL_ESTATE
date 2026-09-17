import { isValidObjectId } from 'mongoose';
import { NotFoundError } from '../../common/errors.js';
import { AnnouncementModel } from './announcement.model.js';
import { HouseTypeModel } from './house-type.model.js';
import { PurchaseLeaseSupplyModel } from './purchase-lease-supply.model.js';
import type {
  Announcement,
  AnnouncementDetail,
  AnnouncementListItem,
  AnnouncementSearchCriteria,
  AnnouncementSearchResult,
  AnnouncementStatus,
} from './announcement.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function computeStatus(closingAt: Date, now: Date): AnnouncementStatus {
  return closingAt.getTime() >= now.getTime() ? 'open' : 'closed';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toListItem(doc: Announcement & { _id: unknown }, now: Date): AnnouncementListItem {
  return {
    id: String(doc._id),
    source: doc.source,
    sourceKey: doc.sourceKey,
    title: doc.title,
    regionName: doc.regionName,
    categoryCode: doc.categoryCode,
    categoryName: doc.categoryName,
    typeName: doc.typeName,
    postedAt: doc.postedAt,
    noticeDate: doc.noticeDate,
    closingAt: doc.closingAt,
    originalUrl: doc.originalUrl,
    originalUrlMobile: doc.originalUrlMobile,
    status: computeStatus(doc.closingAt, now),
  };
}

/**
 * D3: Service 계층은 req/res를 모른다. 나중에 AI Agent가 같은 함수를 도구로 호출할 수 있어야 한다.
 */
export async function searchAnnouncements(
  criteria: AnnouncementSearchCriteria = {},
): Promise<AnnouncementSearchResult> {
  const page = Math.max(1, criteria.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, criteria.pageSize ?? DEFAULT_PAGE_SIZE));
  const now = new Date();

  const filter: Record<string, unknown> = {};
  if (criteria.regionNames?.length) {
    filter.regionName = { $in: criteria.regionNames };
  }
  if (criteria.categoryCodes?.length) {
    filter.categoryCode = { $in: criteria.categoryCodes };
  }
  if (criteria.query?.trim()) {
    filter.title = { $regex: escapeRegExp(criteria.query.trim()), $options: 'i' };
  }
  // status는 open/closed 둘 다 고르면 "전체"와 같으므로 그때는 굳이 DB에 필터를 안 건다.
  if (criteria.statuses?.length === 1) {
    filter.closingAt = criteria.statuses[0] === 'open' ? { $gte: now } : { $lt: now };
  }

  // 최신순(게시일 내림차순) 고정 — 같은 게시일이면 _id로 순서를 고정해 페이지네이션이 흔들리지 않게 한다.
  const [docs, total] = await Promise.all([
    AnnouncementModel.find(filter)
      .sort({ postedAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AnnouncementModel.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toListItem(doc, now)),
    total,
    page,
    pageSize,
  };
}

export async function getAnnouncementDetail(id: string): Promise<AnnouncementDetail> {
  // 형식이 틀린 id를 그대로 findById에 넘기면 Mongoose CastError(500)로 샌다 — 미리 404로 처리한다.
  if (!isValidObjectId(id)) {
    throw new NotFoundError('공고를 찾을 수 없습니다.');
  }

  const doc = await AnnouncementModel.findById(id).lean();
  if (!doc) {
    throw new NotFoundError('공고를 찾을 수 없습니다.');
  }

  const panId = doc.sourceKey.panId;
  const [houseTypeDocs, purchaseLeaseSupplyDocs] = panId
    ? await Promise.all([
        HouseTypeModel.find({ source: doc.source, panId }).lean(),
        PurchaseLeaseSupplyModel.find({ source: doc.source, panId }).lean(),
      ])
    : [[], []];

  return {
    ...toListItem(doc, new Date()),
    houseTypes: houseTypeDocs.map((h) => ({
      source: h.source,
      panId: h.panId,
      complexName: h.complexName,
      houseType: h.houseType,
      exclusiveAreaM2: h.exclusiveAreaM2,
      supplyAreaM2: h.supplyAreaM2,
      totalHouseholds: h.totalHouseholds,
      currentSupplyHouseholds: h.currentSupplyHouseholds,
      depositWon: h.depositWon,
      monthlyRentWon: h.monthlyRentWon,
    })),
    purchaseLeaseSupplies: purchaseLeaseSupplyDocs.map((p) => ({
      source: p.source,
      panId: p.panId,
      regionName: p.regionName,
      complexInfo: p.complexInfo,
      exclusiveAreaM2: p.exclusiveAreaM2,
      areaLabel: p.areaLabel,
      supplyCount: p.supplyCount,
      recruitCount: p.recruitCount,
    })),
  };
}
