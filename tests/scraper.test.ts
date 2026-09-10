import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scrapeRealta } from '../src/lib/scraper';

describe('Realta Scraper & Pagination Test', () => {
  test('should fetch all active properties in Karmei Gat with pagination', async () => {
    const { properties, totalReported } = await scrapeRealta('kiryat-gat', 'karmei-gat', 24);

    console.log(`[Test] Total reported: ${totalReported}, Total retrieved: ${properties.length}`);

    // Must be at least 27 results as originally required
    assert.ok(totalReported >= 27, `Expected at least 27 properties, got ${totalReported}`);
    // Must retrieve 100% of the reported properties
    assert.equal(properties.length, totalReported, `Expected all ${totalReported} properties retrieved, got ${properties.length}`);

    // Verify all IDs are unique (no duplicates across pagination batches)
    const ids = properties.map((p) => p.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, properties.length, `Expected ${properties.length} unique IDs, found duplicates!`);

    // Verify fields of each property
    for (const p of properties) {
      assert.ok(p.id, 'Property missing ID');
      assert.equal(p.citySlug, 'kiryat-gat');
      assert.equal(p.districtSlug, 'karmei-gat');
      assert.ok(p.url.startsWith('https://realta.co.il'), `Invalid URL format: ${p.url}`);
      assert.ok(p.price === null || (typeof p.price === 'number' && p.price > 0), `Invalid price: ${p.price}`);
      assert.ok(p.rooms === null || (typeof p.rooms === 'number' && p.rooms > 0), `Invalid rooms: ${p.rooms}`);
    }
  });
});
