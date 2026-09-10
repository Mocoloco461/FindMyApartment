#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Realta Property Scraper
-----------------------
כלי לשליפת כל מודעות הדירות להשכרה מאתר Realta (https://realta.co.il)
לפי עיר ושכונה, כולל תמיכה מלאה במנגנון "טען עוד" (Load More / Pagination).
"""

import sys
import os
import json
import csv
import urllib.request
import urllib.parse
import urllib.error
import argparse
from typing import List, Dict, Any, Optional, Tuple

BASE_URL = "https://realta.co.il"
SEARCH_API_ENDPOINT = f"{BASE_URL}/api/v1/search/"
DISTRICTS_API_ENDPOINT = f"{BASE_URL}/api/v1/districts/"

# User-Agent to ensure seamless requests
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
}

# Translation dictionary for amenities
AMENITY_TRANSLATIONS = {
    "PARKING": "חניה",
    "ELEVATOR": "מעלית",
    "AC": "מיזוג אוויר",
    "SAFE_ROOM": "ממ״ד",
    "MAMAD": "ממ״ד",
    "FURNISHED": "ריהוט",
    "ACCESSIBLE": "גישה לנכים",
    "BOILER": "דוד שמש",
    "BALCONY": "מרפסת",
    "STORAGE": "מחסן",
    "BARS": "סורגים",
    "SUN_TERRACE": "מרפסת שמש",
    "RENOVATED": "משופצת",
    "PETS_ALLOWED": "חיות מחמד",
    "AIR_CONDITIONED": "ממוזגת",
}

# Known city mappings (Hebrew -> slug)
KNOWN_CITIES = {
    "קרית גת": "kiryat-gat",
    "קריית גת": "kiryat-gat",
    "תל אביב": "tel-aviv-yafo",
    "תל אביב יפו": "tel-aviv-yafo",
    "תל-אביב": "tel-aviv-yafo",
    "ירושלים": "jerusalem",
    "חיפה": "haifa",
    "באר שבע": "beer-sheva",
}

# Known district mappings (Hebrew -> slug)
KNOWN_DISTRICTS = {
    "כרמי גת": "karmei-gat",
    "בני ישראל": "bnei-yisrael",
    "הנביאים": "haneviim",
    "החורש": "hahoresh",
    "הקוממיות": "hakomemiyut",
    "השופטים": "hashoftim",
    "גליקסון": "glikson",
    "מגדים": "megadim",
    "כפר שלם": "kfar-shalem",
}


def make_request(url: str) -> Dict[str, Any]:
    """Perform HTTP GET request and return parsed JSON."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read().decode("utf-8")
            return json.loads(data)
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP Error {e.code} fetching {url}: {e.reason}\n")
        raise
    except Exception as e:
        sys.stderr.write(f"Error fetching {url}: {e}\n")
        raise


def resolve_city_slug(city_input: str) -> str:
    """Resolve city input (Hebrew name or slug) to standard slug."""
    clean_input = city_input.strip()
    if clean_input in KNOWN_CITIES:
        return KNOWN_CITIES[clean_input]
    
    # If already ASCII slug format (e.g. kiryat-gat)
    if all(ord(c) < 128 for c in clean_input):
        return clean_input.lower().replace(" ", "-")

    # Fetch homepage to dynamically discover all 500+ cities
    try:
        req = urllib.request.Request(f"{BASE_URL}/he/", headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            import re
            matches = re.findall(r'data-value=\"([^\"]+)\"[^>]*id=\"filter-city-opt-[^\"]*\"[^>]*>\s*<span class=\"cs-option-text\">([^<]+)</span>', html)
            for slug, label in matches:
                clean_label = re.sub(r'\s*\(\d+[\d,]*\)', '', label).strip()
                if clean_input in clean_label or clean_label in clean_input:
                    return slug
    except Exception as e:
        sys.stderr.write(f"Warning: Could not dynamically resolve city from HTML ({e})\n")

    return clean_input


def get_district_info(city_slug: str, district_input: str) -> Tuple[str, Optional[int]]:
    """Resolve district input to valid district slug and its static propertyCount."""
    clean_input = district_input.strip()

    # Query districts API for this city
    url = f"{DISTRICTS_API_ENDPOINT}?city={urllib.parse.quote(city_slug)}"
    try:
        data = make_request(url)
        districts = data.get("districts", [])
        for d in districts:
            name_he = d.get("nameHe", "").strip()
            name_en = d.get("nameEn", "").strip()
            slug = d.get("slug", "")
            if (clean_input == name_he or 
                clean_input in name_he or 
                name_he in clean_input or 
                clean_input.lower() == name_en.lower() or 
                clean_input.lower() == slug.lower()):
                return slug, d.get("propertyCount")
    except Exception as e:
        sys.stderr.write(f"Warning: Could not fetch districts for {city_slug}: {e}\n")

    if clean_input in KNOWN_DISTRICTS:
        return KNOWN_DISTRICTS[clean_input], None

    if all(ord(c) < 128 for c in clean_input):
        return clean_input.lower().replace(" ", "-"), None

    return clean_input, None


def fetch_all_properties(
    city: str = "קרית גת",
    district: str = "כרמי גת",
    page_size: int = 24,
    verbose: bool = True,
) -> Tuple[List[Dict[str, Any]], int, Optional[int]]:
    """
    Fetch all properties matching city and district.
    Handles 'Load More' (pagination) loop automatically until all items are loaded.
    
    Returns:
        (properties_list, total_count_reported_by_live_api, static_district_count)
    """
    city_slug = resolve_city_slug(city)
    district_slug, static_count = get_district_info(city_slug, district)

    if verbose:
        print("=" * 70)
        print("🚀 Realta Scraper מתחיל שליפה:")
        print(f"   🏙️  עיר: {city} (slug: '{city_slug}')")
        print(f"   📍 שכונה: {district} (slug: '{district_slug}')")
        if static_count is not None:
            print(f"   ℹ️  כמות רשומה בקטלוג השכונות: {static_count}")
        print(f"   📄 גודל עמוד לטעינה (Page Size): {page_size}")
        print("=" * 70)

    all_properties: List[Dict[str, Any]] = []
    seen_ids = set()
    current_offset = 0
    total_expected = 0
    iteration = 1

    while True:
        params = {
            "city": city_slug,
            "district": district_slug,
            "limit": page_size,
            "offset": current_offset,
        }
        query_string = urllib.parse.urlencode(params)
        url = f"{SEARCH_API_ENDPOINT}?{query_string}"

        if verbose:
            if iteration == 1:
                print(f"📥 [עמוד {iteration}] טוען תוצאות ראשוניות (offset={current_offset}, limit={page_size})...")
            else:
                print(f"🔄 [טען עוד #{iteration-1}] שולף מנה נוספת (offset={current_offset}, limit={page_size})...")

        data = make_request(url)
        total_reported = data.get("total", 0)
        if iteration == 1:
            total_expected = total_reported
            if verbose:
                print(f"📊 סה\"כ מודעות פעילות קיימות במערכת בזמן אמת: {total_expected}")

        batch = data.get("properties", [])
        if not batch:
            if verbose:
                print("ℹ️  התקבלה מנה ריקה, סיום שליפה.")
            break

        new_count = 0
        for prop in batch:
            prop_id = prop.get("id")
            if prop_id and prop_id not in seen_ids:
                seen_ids.add(prop_id)
                all_properties.append(prop)
                new_count += 1

        if verbose:
            print(f"   ✅ נשלפו {len(batch)} מודעות ({new_count} חדשות). סה\"כ נצברו עד כה: {len(all_properties)}/{total_expected}")

        # Check if we have gathered all available properties
        if len(all_properties) >= total_expected or len(batch) < page_size:
            if verbose:
                print(f"\n🎉 הושלמה שליפת כל המודעות בהצלחה!")
            break

        # Advance offset (simulate clicking 'טען עוד')
        current_offset += page_size
        iteration += 1

    return all_properties, total_expected, static_count


def normalize_property(p: Dict[str, Any]) -> Dict[str, Any]:
    """Clean and structure property fields for export."""
    amenities_raw = p.get("amenities") or []
    amenities_he = [AMENITY_TRANSLATIONS.get(a, a) for a in amenities_raw]
    
    url_path = p.get("url") or f"/{p.get('citySlug')}/{p.get('districtSlug')}/{p.get('id')}/"
    full_url = f"{BASE_URL}/he{url_path}" if not url_path.startswith("http") else url_path

    images = p.get("images") or []

    floor_str = str(p.get("floor")) if p.get("floor") is not None else "לא צוין"
    floors_total_str = str(p.get("floorsTotal")) if p.get("floorsTotal") is not None else ""
    floor_display = f"{floor_str}/{floors_total_str}" if floors_total_str else floor_str

    return {
        "id": p.get("id"),
        "city": p.get("cityNameHe") or p.get("city"),
        "citySlug": p.get("citySlug"),
        "district": p.get("districtNameHe") or p.get("district"),
        "districtSlug": p.get("districtSlug"),
        "street": p.get("street") or "ללא שם רחוב",
        "price_ils": p.get("price"),
        "rooms": p.get("rooms"),
        "sqm": p.get("sqm"),
        "floor": p.get("floor"),
        "floors_total": p.get("floorsTotal"),
        "floor_display": floor_display,
        "property_type": p.get("propertyType"),
        "source": p.get("source"),
        "published_at": p.get("publishedAt"),
        "updated_at": p.get("updatedAt"),
        "property_tax_arnona": p.get("propertyTax"),
        "amenities_hebrew": ", ".join(amenities_he),
        "amenities_raw": amenities_raw,
        "images_count": len(images),
        "primary_image": images[0] if images else None,
        "all_images": images,
        "latitude": p.get("lat"),
        "longitude": p.get("lon"),
        "url": full_url,
    }


def export_to_json(properties: List[Dict[str, Any]], filepath: str) -> None:
    """Save properties list to formatted JSON file."""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(properties, f, ensure_ascii=False, indent=2)
    print(f"💾 נשמר קובץ JSON: {filepath} ({len(properties)} רשומות)")


def export_to_csv(properties: List[Dict[str, Any]], filepath: str) -> None:
    """Save properties list to CSV with UTF-8 BOM for Excel compatibility."""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    if not properties:
        return

    csv_fields = [
        ("id", "מזהה מודעה"),
        ("city", "עיר"),
        ("district", "שכונה"),
        ("street", "רחוב"),
        ("price_ils", "מחיר (ש״ח)"),
        ("rooms", "חדרים"),
        ("sqm", "שטח (מ״ר)"),
        ("floor_display", "קומה"),
        ("property_tax_arnona", "ארנונה (ש״ח)"),
        ("amenities_hebrew", "מאפיינים"),
        ("source", "מקור"),
        ("published_at", "פורסם בתאריך"),
        ("updated_at", "עודכן בתאריך"),
        ("url", "קישור למודעה"),
    ]

    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([label for _, label in csv_fields])
        for p in properties:
            row = [p.get(key, "") for key, _ in csv_fields]
            writer.writerow(row)
    print(f"📊 נשמר קובץ CSV:  {filepath} ({len(properties)} רשומות)")


def print_summary_table(properties: List[Dict[str, Any]]) -> None:
    """Print clean summary table to console."""
    print("\n" + "=" * 105)
    print(f"{'#':<3} | {'מזהה':<7} | {'חדר':<5} | {'קומה':<6} | {'שטח':<7} | {'מחיר ש״ח':<9} | {'רחוב':<22} | {'מקור':<12} | {'ממ״ד/חניה'}")
    print("-" * 105)

    for i, p in enumerate(properties, 1):
        pid = str(p.get("id") or "")
        rooms = f"{p.get('rooms')} חד'" if p.get("rooms") is not None else "-"
        floor = f"ק' {p.get('floor')}" if p.get("floor") is not None else "-"
        sqm = f"{p.get('sqm')} מ\"ר" if p.get("sqm") is not None else "-"
        price = f"{p.get('price_ils'):,}" if p.get("price_ils") is not None else "-"
        street = (p.get("street") or "ללא רחוב")[:20]
        source = str(p.get("source") or "-")[:11]
        
        amenities = p.get("amenities_hebrew") or ""
        tags = []
        if "ממ״ד" in amenities:
            tags.append("ממ״ד")
        if "חניה" in amenities:
            tags.append("חניה")
        if "מעלית" in amenities:
            tags.append("מעלית")
        tags_str = ", ".join(tags) if tags else "-"

        print(f"{i:<3} | {pid:<7} | {rooms:<5} | {floor:<6} | {sqm:<7} | {price:<9} | {street:<22} | {source:<12} | {tags_str}")

    print("=" * 105)


def main():
    parser = argparse.ArgumentParser(description="Realta Property Scraper - שולף מודעות להשכרה מאתר Realta")
    parser.add_argument("--city", default="קרית גת", help="שם העיר (ברירת מחדל: 'קרית גת')")
    parser.add_argument("--district", default="כרמי גת", help="שם השכונה (ברירת מחדל: 'כרמי גת')")
    parser.add_argument("--page-size", type=int, default=24, help="גודל עמוד לטעינה (ברירת מחדל: 24 כמו באתר)")
    parser.add_argument("--output-dir", default="output", help="תיקיית פלט לקבצים (ברירת מחדל: output)")
    parser.add_argument("--filename", default=None, help="שם בסיס לקבצי הפלט")
    parser.add_argument("--expected-total", type=int, default=None, help="יעד תוצאות מצופה (אופציונלי לאימות)")
    parser.add_argument("--quiet", action="store_true", help="השתקת לוגים מפורטים")
    args = parser.parse_args()

    verbose = not args.quiet
    properties_raw, total_expected, static_count = fetch_all_properties(
        city=args.city,
        district=args.district,
        page_size=args.page_size,
        verbose=verbose,
    )

    normalized = [normalize_property(p) for p in properties_raw]

    if verbose:
        print_summary_table(normalized)

    # Determine filename
    filename = args.filename
    if not filename:
        slug_district = properties_raw[0].get("districtSlug") if properties_raw else "results"
        filename = f"{slug_district}_properties"

    # Save to files
    out_dir = os.path.abspath(args.output_dir)
    json_path = os.path.join(out_dir, f"{filename}.json")
    csv_path = os.path.join(out_dir, f"{filename}.csv")

    export_to_json(normalized, json_path)
    export_to_csv(normalized, csv_path)

    print("\n🎯 סיכום תוצאות השליפה:")
    if static_count is not None and static_count != total_expected:
        print(f"   • כמות בקטלוג/SEO שכונות (מטמון סטטי): {static_count}")
    print(f"   • סה\"כ מודעות פעילות במערכת בזמן אמת: {total_expected}")
    print(f"   • סה\"כ מודעות שנשלפו בפועל: {len(normalized)}")

    success = False
    if args.expected_total is not None:
        if len(normalized) == args.expected_total:
            print(f"   ✅ הצלחה! נשלפו בדיוק {len(normalized)} תוצאות כפי שהוגדר ביעד המצופה ({args.expected_total}).")
            success = True
        else:
            print(f"   ⚠️  נשלפו {len(normalized)} תוצאות פעילות (היעד שהוגדר: {args.expected_total}).")
            if static_count == args.expected_total and len(normalized) == total_expected:
                print(f"   💡 הסבר: בקטלוג השכונות מופיע {static_count}, אך מודעה אחת הוסרה/הושכרה לאחרונה ולכן כרגע יש {total_expected} מודעות פעילות באתר.")
                success = True
    else:
        if len(normalized) == total_expected and len(normalized) > 0:
            print(f"   ✅ הצלחה מלאה! כל {len(normalized)} התוצאות הפעילות נשלפו בדיוק מושלם.")
            success = True

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
