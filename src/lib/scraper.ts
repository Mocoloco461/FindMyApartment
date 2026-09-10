import { prisma } from './db';
import { logger } from './logger';
import { sendNewPropertyAlert } from './telegram';

export interface RawRealtaProperty {
  id: string;
  city?: string;
  citySlug?: string;
  cityNameHe?: string;
  district?: string;
  districtSlug?: string;
  districtNameHe?: string;
  street?: string | null;
  price?: number | null;
  rooms?: number | null;
  sqm?: number | null;
  floor?: number | null;
  floorsTotal?: number | null;
  propertyType?: string | null;
  source?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  propertyTax?: number | null;
  amenities?: string[] | null;
  images?: string[] | null;
  lat?: number | null;
  lon?: number | null;
  url?: string;
}

export interface ScrapedProperty {
  id: string;
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  street: string | null;
  price: number | null;
  rooms: number | null;
  sqm: number | null;
  floor: number | null;
  floorsTotal: number | null;
  propertyType: string | null;
  source: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  propertyTax: number | null;
  amenities: string[];
  images: string[];
  lat: number | null;
  lon: number | null;
  url: string;
}

export interface SyncResult {
  success: boolean;
  totalFound: number;
  newAdded: number;
  updatedCount: number;
  error?: string;
}

const BASE_URL = 'https://realta.co.il';
const SEARCH_API = `${BASE_URL}/api/v1/search/`;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Scrape all properties for city & district from Realta API handling 'Load More' pagination
 */
export async function scrapeRealta(
  citySlug = 'kiryat-gat',
  districtSlug = 'karmei-gat',
  pageSize = 24
): Promise<{ properties: ScrapedProperty[]; totalReported: number }> {
  logger.info(`Starting Realta scrape for city='${citySlug}', district='${districtSlug}', pageSize=${pageSize}`);

  const allScraped: ScrapedProperty[] = [];
  const seenIds = new Set<string>();
  let currentOffset = 0;
  let totalReported = 0;
  let iteration = 1;

  while (true) {
    const params = new URLSearchParams({
      city: citySlug,
      district: districtSlug,
      limit: String(pageSize),
      offset: String(currentOffset),
    });

    const url = `${SEARCH_API}?${params.toString()}`;
    logger.debug(`Fetching page ${iteration} (offset=${currentOffset}, limit=${pageSize}): ${url}`);

    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) {
      throw new Error(`Realta API HTTP Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    totalReported = data.total || 0;

    const batch: RawRealtaProperty[] = data.properties || [];
    if (batch.length === 0) {
      logger.info('Received empty batch, finishing pagination loop');
      break;
    }

    for (const raw of batch) {
      if (!raw.id || seenIds.has(raw.id)) continue;
      seenIds.add(raw.id);

      const urlPath = raw.url || `/${raw.citySlug || citySlug}/${raw.districtSlug || districtSlug}/${raw.id}/`;
      const fullUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}/he${urlPath}`;

      allScraped.push({
        id: String(raw.id),
        city: raw.cityNameHe || raw.city || 'קרית גת',
        citySlug: raw.citySlug || citySlug,
        district: raw.districtNameHe || raw.district || 'כרמי גת',
        districtSlug: raw.districtSlug || districtSlug,
        street: raw.street ? raw.street.trim() : null,
        price: typeof raw.price === 'number' ? raw.price : null,
        rooms: typeof raw.rooms === 'number' ? raw.rooms : null,
        sqm: typeof raw.sqm === 'number' ? raw.sqm : null,
        floor: typeof raw.floor === 'number' ? raw.floor : null,
        floorsTotal: typeof raw.floorsTotal === 'number' ? raw.floorsTotal : null,
        propertyType: raw.propertyType || null,
        source: raw.source || null,
        publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
        propertyTax: typeof raw.propertyTax === 'number' ? raw.propertyTax : null,
        amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
        images: Array.isArray(raw.images) ? raw.images : [],
        lat: typeof raw.lat === 'number' ? raw.lat : null,
        lon: typeof raw.lon === 'number' ? raw.lon : null,
        url: fullUrl,
      });
    }

    logger.info(`Page ${iteration}: retrieved ${batch.length} items (accumulated: ${allScraped.length}/${totalReported})`);

    // Check if we retrieved everything
    if (allScraped.length >= totalReported || batch.length < pageSize) {
      break;
    }

    // Simulate clicking 'Load More' (Advance offset)
    currentOffset += pageSize;
    iteration += 1;
  }

  logger.info(`Scraping complete. Total retrieved: ${allScraped.length} (reported total: ${totalReported})`);
  return { properties: allScraped, totalReported };
}

/**
 * Scrape Realta and sync findings with PostgreSQL database.
 * Deduplicates by unique ID and triggers Telegram alert for each NEW property!
 */
export async function syncPropertiesWithDatabase(
  options: { sendAlerts?: boolean } = { sendAlerts: true }
): Promise<SyncResult> {
  const citySlug = process.env.TARGET_CITY_SLUG || 'kiryat-gat';
  const districtSlug = process.env.TARGET_DISTRICT_SLUG || 'karmei-gat';
  const startedAt = new Date();

  logger.info(`Starting database sync for ${citySlug}/${districtSlug}...`);

  try {
    const { properties: scrapedProps, totalReported } = await scrapeRealta(citySlug, districtSlug);

    // Fetch existing IDs from DB to detect new vs existing
    const existingProperties = await prisma.property.findMany({
      select: { id: true, price: true, updatedAt: true },
    });
    const existingMap = new Map(existingProperties.map((p) => [p.id, p]));

    let newAdded = 0;
    let updatedCount = 0;
    const newlyDiscovered: ScrapedProperty[] = [];

    for (const prop of scrapedProps) {
      if (!existingMap.has(prop.id)) {
        // NEW Property!
        await prisma.property.create({
          data: {
            id: prop.id,
            city: prop.city,
            citySlug: prop.citySlug,
            district: prop.district,
            districtSlug: prop.districtSlug,
            street: prop.street,
            price: prop.price,
            rooms: prop.rooms,
            sqm: prop.sqm,
            floor: prop.floor,
            floorsTotal: prop.floorsTotal,
            propertyType: prop.propertyType,
            source: prop.source,
            publishedAt: prop.publishedAt,
            updatedAt: prop.updatedAt,
            propertyTax: prop.propertyTax,
            amenities: prop.amenities,
            images: prop.images,
            lat: prop.lat,
            lon: prop.lon,
            url: prop.url,
            status: 'NEW', // Default status for new items
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
            isArchived: false,
          },
        });

        newAdded += 1;
        newlyDiscovered.push(prop);
      } else {
        // Existing Property - update specs and lastSeenAt (preserve status, notes, followUpDate!)
        await prisma.property.update({
          where: { id: prop.id },
          data: {
            price: prop.price,
            rooms: prop.rooms,
            sqm: prop.sqm,
            floor: prop.floor,
            floorsTotal: prop.floorsTotal,
            street: prop.street,
            amenities: prop.amenities,
            images: prop.images,
            updatedAt: prop.updatedAt,
            lastSeenAt: new Date(),
            isArchived: false,
          },
        });

        updatedCount += 1;
      }
    }

    // Send Telegram alerts for newly discovered apartments
    if (options.sendAlerts && newlyDiscovered.length > 0) {
      logger.info(`Sending Telegram alerts for ${newlyDiscovered.length} new properties...`);
      for (const newProp of newlyDiscovered) {
        try {
          await sendNewPropertyAlert({
            id: newProp.id,
            street: newProp.street,
            price: newProp.price,
            rooms: newProp.rooms,
            sqm: newProp.sqm,
            floor: newProp.floor,
            floorsTotal: newProp.floorsTotal,
            amenities: newProp.amenities,
            source: newProp.source,
            url: newProp.url,
          });
        } catch (alertErr) {
          logger.error(`Failed to send alert for property ${newProp.id}`, alertErr);
        }
      }
    }

    // Record Sync Log
    await prisma.syncLog.create({
      data: {
        status: 'SUCCESS',
        totalFound: totalReported,
        newAdded,
        updatedCount,
        startedAt,
        completedAt: new Date(),
      },
    });

    logger.info(`Sync finished successfully: total=${scrapedProps.length}, new=${newAdded}, updated=${updatedCount}`);

    return {
      success: true,
      totalFound: scrapedProps.length,
      newAdded,
      updatedCount,
    };
  } catch (error: any) {
    const errMsg = error.message || 'Unknown sync error';
    logger.error(`Sync failed: ${errMsg}`, error);

    try {
      await prisma.syncLog.create({
        data: {
          status: 'ERROR',
          totalFound: 0,
          newAdded: 0,
          updatedCount: 0,
          errorMessage: errMsg,
          startedAt,
          completedAt: new Date(),
        },
      });
    } catch (logErr) {
      logger.error('Failed to write error sync log', logErr);
    }

    return {
      success: false,
      totalFound: 0,
      newAdded: 0,
      updatedCount: 0,
      error: errMsg,
    };
  }
}
