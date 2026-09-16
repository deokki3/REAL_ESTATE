import type { HouseType, PurchaseLeaseSupply } from '../../modules/announcements/announcement.types.js';
import { AnnouncementModel } from '../../modules/announcements/announcement.model.js';
import { HouseTypeModel } from '../../modules/announcements/house-type.model.js';
import { PurchaseLeaseSupplyModel } from '../../modules/announcements/purchase-lease-supply.model.js';
import {
  toAnnouncement,
  toHouseType060,
  toHouseTypeApartment,
  toPurchaseLeaseSupply130,
  toPurchaseLeaseSupply131,
  toPurchaseLeaseSupply144,
  toPurchaseLeaseSupplyBasic,
} from './adapter.js';
import { fetchLhList, fetchLhSupply060, fetchLhSupply } from './client.js';
import { LH_CNP_CD, SUPPORTED_UPP_AIS_TP_CD } from './codes.js';
import {
  unwrapLhList,
  unwrapLhSupply060,
  unwrapLhSupplyApartment,
  unwrapLhPurchaseLeaseSupply130,
  unwrapLhPurchaseLeaseSupply131,
  unwrapLhPurchaseLeaseSupply144,
  unwrapLhPurchaseLeaseSupplyBasic,
} from './unwrap.js';

/** SPL_INF_TP_CD=061/062/063 브랜치. adapter.ts의 toHouseTypeApartment가 지원하는 범위와 일치시킨다. */
const APARTMENT_SPL_INF_TP_CD = ['061', '062', '063'];

/**
 * 매입임대·전세임대 그룹 중 실호출로 검증된 코드만 (CLAUDE.md 6절, 2026-09-02).
 * 나머지 코드(133/135/137~140/142/143/145)는 아직 응답 모양을 몰라서 다루지 않는다.
 */
const PURCHASE_LEASE_SUPPLY_SPL_INF_TP_CD = ['130', '131', '132', '141', '144'];

function toPurchaseLeaseSupplies(splInfTpCd: string, raw: unknown, panId: string): PurchaseLeaseSupply[] {
  switch (splInfTpCd) {
    case '130':
      return unwrapLhPurchaseLeaseSupply130(raw).items.map((item) => toPurchaseLeaseSupply130(item, panId));
    case '131':
      return unwrapLhPurchaseLeaseSupply131(raw).items.map((item) => toPurchaseLeaseSupply131(item, panId));
    case '132':
    case '141':
      return unwrapLhPurchaseLeaseSupplyBasic(raw).items.map((item) => toPurchaseLeaseSupplyBasic(item, panId));
    case '144':
      return unwrapLhPurchaseLeaseSupply144(raw).items.map((item) => toPurchaseLeaseSupply144(item, panId));
    default:
      // PURCHASE_LEASE_SUPPLY_SPL_INF_TP_CD에서 걸러지므로 실제로는 도달하지 않는다.
      throw new Error(`지원하지 않는 SPL_INF_TP_CD: ${splInfTpCd}`);
  }
}

export interface IngestRange {
  /** YYYYMMDD */
  from: string;
  /** YYYYMMDD */
  to: string;
}

export interface IngestResult {
  fetched: number;
  savedAnnouncements: number;
  savedHouseTypes: number;
  savedPurchaseLeaseSupplies: number;
  skippedCategory: number;
  skippedHouseTypeUnsupported: number;
  errors: string[];
}

const PAGE_SIZE = 50;
/** 초당 30tps 제한(CLAUDE.md 6절)에 여유를 두기 위한 최소 간격. */
const REQUEST_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatYyyymmdd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** LH 활용가이드의 초기값과 동일: 현재일 - 2개월 ~ 현재일. */
function defaultRange(): IngestRange {
  const today = new Date();
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return { from: formatYyyymmdd(twoMonthsAgo), to: formatYyyymmdd(today) };
}

function isSupportedCategory(uppAisTpCd: string): boolean {
  return (SUPPORTED_UPP_AIS_TP_CD as readonly string[]).includes(uppAisTpCd);
}

/**
 * D2: 수집 진입점은 순수 함수 하나. 호출자가 온디맨드든 스케줄러든 무관하다.
 *
 * 서울·인천·경기(CLAUDE.md 11절 — 수도권 한정) × 기간으로 LH 목록 API를 훑어서
 * 지원 대상 공고유형(05/06/13/39)만 골라 저장한다. `SPL_INF_TP_CD`가 060/061/062/063인 것만
 * 공급정보(주택형)까지 받아온다 — 그 외 브랜치는 어댑터가 아직 없다(CLAUDE.md 6.1/7절).
 *
 * CNP_CD를 다중 지정할 수 있는지는 미확인이라(7절) 지역마다 따로 호출한다.
 */
export async function ingestLhAnnouncements(range: IngestRange = defaultRange()): Promise<IngestResult> {
  const result: IngestResult = {
    fetched: 0,
    savedAnnouncements: 0,
    savedHouseTypes: 0,
    savedPurchaseLeaseSupplies: 0,
    skippedCategory: 0,
    skippedHouseTypeUnsupported: 0,
    errors: [],
  };

  for (const cnpCd of Object.keys(LH_CNP_CD)) {
    let page = 1;
    for (;;) {
      const raw = await fetchLhList({
        panStDt: range.from,
        panEdDt: range.to,
        cnpCd,
        page,
        pageSize: PAGE_SIZE,
      });
      await sleep(REQUEST_DELAY_MS);

      const { items } = unwrapLhList(raw);
      result.fetched += items.length;

      for (const item of items) {
        if (!isSupportedCategory(item.UPP_AIS_TP_CD)) {
          result.skippedCategory += 1;
          continue;
        }

        try {
          const announcement = toAnnouncement(item);
          await AnnouncementModel.findOneAndUpdate(
            { source: announcement.source, 'sourceKey.panId': announcement.sourceKey.panId },
            announcement,
            { upsert: true },
          );
          result.savedAnnouncements += 1;
        } catch (err) {
          result.errors.push(`[공고 ${item.PAN_ID}] ${errorMessage(err)}`);
          continue;
        }

        try {
          await sleep(REQUEST_DELAY_MS);
          let houseTypes: HouseType[];

          if (item.SPL_INF_TP_CD === '060') {
            const supplyRaw = await fetchLhSupply060({
              panId: item.PAN_ID,
              ccrCnntSysDsCd: item.CCR_CNNT_SYS_DS_CD,
              uppAisTpCd: item.UPP_AIS_TP_CD,
              aisTpCd: item.AIS_TP_CD,
            });
            houseTypes = unwrapLhSupply060(supplyRaw).houseTypes.map((raw) =>
              toHouseType060(raw, item.PAN_ID),
            );
          } else if (APARTMENT_SPL_INF_TP_CD.includes(item.SPL_INF_TP_CD)) {
            const supplyRaw = await fetchLhSupply({
              splInfTpCd: item.SPL_INF_TP_CD,
              panId: item.PAN_ID,
              ccrCnntSysDsCd: item.CCR_CNNT_SYS_DS_CD,
              uppAisTpCd: item.UPP_AIS_TP_CD,
              aisTpCd: item.AIS_TP_CD,
            });
            houseTypes = unwrapLhSupplyApartment(supplyRaw).houseTypes.map((raw) =>
              toHouseTypeApartment(raw, item.PAN_ID),
            );
          } else if (PURCHASE_LEASE_SUPPLY_SPL_INF_TP_CD.includes(item.SPL_INF_TP_CD)) {
            const supplyRaw = await fetchLhSupply({
              splInfTpCd: item.SPL_INF_TP_CD,
              panId: item.PAN_ID,
              ccrCnntSysDsCd: item.CCR_CNNT_SYS_DS_CD,
              uppAisTpCd: item.UPP_AIS_TP_CD,
              aisTpCd: item.AIS_TP_CD,
            });
            const supplies = toPurchaseLeaseSupplies(item.SPL_INF_TP_CD, supplyRaw, item.PAN_ID);
            // 안정적인 자연키가 없어서(9절 실거래가 정책과 같은 이유) upsert 대신 통째로 교체한다.
            await PurchaseLeaseSupplyModel.deleteMany({ source: 'LH', panId: item.PAN_ID });
            if (supplies.length > 0) {
              await PurchaseLeaseSupplyModel.insertMany(supplies);
            }
            result.savedPurchaseLeaseSupplies += supplies.length;
            continue;
          } else {
            result.skippedHouseTypeUnsupported += 1;
            continue;
          }

          for (const houseType of houseTypes) {
            await HouseTypeModel.findOneAndUpdate(
              {
                source: houseType.source,
                panId: houseType.panId,
                complexName: houseType.complexName,
                houseType: houseType.houseType,
              },
              houseType,
              { upsert: true },
            );
            result.savedHouseTypes += 1;
          }
        } catch (err) {
          result.errors.push(`[공고 ${item.PAN_ID} 공급정보] ${errorMessage(err)}`);
        }
      }

      if (items.length < PAGE_SIZE) break;
      page += 1;
    }
  }

  return result;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
