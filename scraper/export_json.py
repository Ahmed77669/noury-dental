"""
export_json.py — Exports all opportunities from SQLite to opportunities.json
for Jamstack/serverless deployment on Vercel.
"""

import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dental_opportunities.db")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "src", "app", "data", "opportunities.json")

def export_to_json():
    print(f"[Export] Reading from: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, job_type, specialty, experience_level,
               governorate, area, location_raw, clinic_name,
               summary_en, summary_ar, full_text, salary_text,
               contact_phone, contact_whatsapp, contact_email,
               source_type, source_url, source_reliability,
               posted_at, scraped_at, last_seen_at, is_expired,
               ranking_score, view_count, content_hash
        FROM opportunities
        WHERE is_expired = 0
        ORDER BY ranking_score DESC, posted_at DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    print(f"[Export] Done. Exported {len(rows)} opportunities to {OUTPUT_PATH}")

if __name__ == "__main__":
    export_to_json()
