#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Suite for Realta Scraper
-----------------------------
בודק את יכולת השליפה הרב-עמודית (Pagination / Load More)
עבור כרמי גת (27 נכסים) וכפר שלם בתל אביב יפו (51 נכסים פעילים).
"""

import os
import json
import csv
import unittest
from realta_scraper import (
    resolve_city_slug,
    get_district_info,
    fetch_all_properties,
    normalize_property,
    export_to_json,
    export_to_csv,
)

class TestRealtaScraper(unittest.TestCase):
    def test_01_slug_resolution(self):
        """Test Hebrew name resolution to valid slugs."""
        city_slug = resolve_city_slug("קרית גת")
        self.assertEqual(city_slug, "kiryat-gat")
        
        district_slug, _ = get_district_info(city_slug, "כרמי גת")
        self.assertEqual(district_slug, "karmei-gat")

        city_tlv = resolve_city_slug("תל אביב יפו")
        self.assertEqual(city_tlv, "tel-aviv-yafo")

        district_tlv, static_count = get_district_info(city_tlv, "כפר שלם")
        self.assertEqual(district_tlv, "kfar-shalem")
        self.assertGreater(static_count, 0)

    def test_02_fetch_karmei_gat_properties(self):
        """Test that all unique properties are fetched for Karmei Gat without duplicates."""
        properties, total_reported, _ = fetch_all_properties(
            city="קרית גת",
            district="כרמי גת",
            page_size=24,
            verbose=False,
        )

        self.assertGreaterEqual(total_reported, 25)
        self.assertEqual(len(properties), total_reported)
        ids = [p["id"] for p in properties]
        self.assertEqual(len(set(ids)), len(properties))

    def test_03_fetch_kfar_shalem_multi_page(self):
        """Test multi-page pagination for Kfar Shalem (Tel Aviv)."""
        properties, total_reported, static_count = fetch_all_properties(
            city="תל אביב יפו",
            district="כפר שלם",
            page_size=24,
            verbose=False,
        )

        self.assertGreater(static_count, 0)
        self.assertGreaterEqual(total_reported, 40)
        self.assertEqual(len(properties), total_reported)
        ids = [p["id"] for p in properties]
        self.assertEqual(len(set(ids)), len(properties))


if __name__ == "__main__":
    unittest.main()
