#!/bin/bash
set -e

# Make sure we are in the script's directory
cd "$(dirname "$0")"

echo "========================================================"
echo " מפעיל שולף מודעות Realta - קרית גת / כרמי גת"
echo "========================================================"

python3 realta_scraper.py --city "קרית גת" --district "כרמי גת" --output-dir "output" --filename "karmei_gat_properties"

echo ""
echo "✅ הסקריפט סיים בהצלחה! הקבצים נשמרו בתיקיית output/:"
ls -lh output/
