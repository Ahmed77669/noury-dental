import sqlite3
import os
import uuid
import datetime
import random
from dotenv import load_dotenv

# Add scraper directory to import path
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mock_scraper import RAW_POSTS_DATA
from extractor import extract_opportunity

# Load env variables
load_dotenv()

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dental_opportunities.db")

def init_db(conn):
    cursor = conn.cursor()
    
    # Create opportunities table matching our schema
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        job_type TEXT NOT NULL,
        specialty TEXT,
        experience_level TEXT,
        governorate TEXT,
        area TEXT,
        location_raw TEXT,
        clinic_name TEXT,
        summary_en TEXT,
        summary_ar TEXT,
        full_text TEXT,
        salary_text TEXT,
        contact_phone TEXT,
        contact_whatsapp TEXT,
        contact_email TEXT,
        source_type TEXT,
        source_url TEXT,
        source_reliability REAL DEFAULT 0.5,
        posted_at TEXT,
        scraped_at TEXT,
        last_seen_at TEXT,
        is_expired INTEGER DEFAULT 0,
        ranking_score REAL DEFAULT 0.0,
        view_count INTEGER DEFAULT 0,
        content_hash TEXT UNIQUE
    )
    """)
    conn.commit()

# Ranking formula helper
def calculate_freshness(posted_date_str):
    posted_at = datetime.datetime.fromisoformat(posted_date_str.replace("Z", "+00:00"))
    age_days = (datetime.datetime.now(datetime.timezone.utc) - posted_at).days
    
    if age_days <= 1:   return 1.0
    if age_days <= 3:   return 0.90
    if age_days <= 7:   return 0.75
    if age_days <= 14:  return 0.55
    if age_days <= 30:  return 0.30
    if age_days <= 45:  return 0.10
    return 0.0

def calculate_completeness(opp):
    weights = {
        "title": 0.25,
        "governorate": 0.20,
        "summary_en": 0.15,
        "contact_phone": 0.15,
        "clinic_name": 0.10,
        "specialty": 0.10,
        "experience_level": 0.05
    }
    score = 0.0
    for field, weight in weights.items():
        if opp.get(field) and opp.get(field) not in ["Dental Clinic", "Dental Opportunity", "general", "any", "Egypt"]:
            score += weight
    return score

def calculate_reliability(source_type):
    reliability_scores = {
        "website": 1.0,
        "linkedin": 0.90,
        "facebook_page": 0.75,
        "facebook": 0.60,
        "telegram": 0.55,
        "unknown": 0.40
    }
    return reliability_scores.get(source_type, 0.5)

def calculate_ranking_score(opp):
    # Base location score (0.65 to 1.0)
    location_scores = {
        "Alexandria": 1.0,
        "Cairo": 1.0,
        "Giza": 0.95,
        "Mansoura": 0.85,
        "Tanta": 0.85,
        "Assiut": 0.80,
        "Zagazig": 0.80
    }
    loc_score = location_scores.get(opp.get("governorate"), 0.65)
    
    fresh_score = calculate_freshness(opp["posted_at"])
    complete_score = calculate_completeness(opp)
    rel_score = calculate_reliability(opp["source_type"])
    
    # Specialty score (default to neutral 0.7 since no query)
    spec_score = 0.7 if opp.get("specialty") else 0.4
    
    score = (
        fresh_score * 0.35 +
        loc_score * 0.20 +
        spec_score * 0.20 +
        complete_score * 0.15 +
        rel_score * 0.10
    )
    return round(score, 4)

def run_ingestion():
    print(f"Initializing database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cursor = conn.cursor()
    
    sources = ["facebook", "telegram", "linkedin", "website"]
    now = datetime.datetime.now(datetime.timezone.utc)
    
    success_count = 0
    duplicate_count = 0
    
    print(f"Starting ingestion of {len(RAW_POSTS_DATA)} raw dental opportunities...")
    
    for idx, raw_text in enumerate(RAW_POSTS_DATA):
        # 1. Extract info
        opp = extract_opportunity(raw_text)
        
        # 2. Add source metadata
        opp["source_type"] = random.choice(sources)
        opp["source_url"] = f"https://{opp['source_type']}.com/posts/{random.randint(100000, 999999)}"
        opp["source_reliability"] = calculate_reliability(opp["source_type"])
        
        # 3. Create realistic posted date (spread over last 40 days)
        days_ago = random.randint(0, 40)
        posted_time = now - datetime.timedelta(days=days_ago, hours=random.randint(0, 23))
        opp["posted_at"] = posted_time.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
        
        # 4. Generate hash for deduplication (title + contact_phone + area)
        phone = opp["contact_phone"] or ""
        content_str = f"{opp['title'].lower()}_{phone}_{opp['area'].lower()}"
        content_hash = uuid.uuid5(uuid.NAMESPACE_DNS, content_str).hex
        opp["content_hash"] = content_hash
        
        # 5. Ranking score
        opp["ranking_score"] = calculate_ranking_score(opp)
        opp["view_count"] = random.randint(0, 150)
        opp["is_expired"] = 1 if days_ago > 45 else 0
        
        # 6. Database save
        try:
            cursor.execute("""
            INSERT INTO opportunities (
                id, title, job_type, specialty, experience_level,
                governorate, area, location_raw, clinic_name,
                summary_en, summary_ar, full_text, salary_text,
                contact_phone, contact_whatsapp, contact_email,
                source_type, source_url, source_reliability,
                posted_at, scraped_at, last_seen_at, is_expired,
                ranking_score, view_count, content_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()),
                opp["title"],
                opp["job_type"],
                opp["specialty"],
                opp["experience_level"],
                opp["governorate"],
                opp["area"],
                opp["location_raw"],
                opp["clinic_name"],
                opp["summary_en"],
                opp["summary_ar"],
                opp["full_text"],
                opp["salary_text"],
                opp["contact_phone"],
                opp["contact_whatsapp"],
                opp["contact_email"],
                opp["source_type"],
                opp["source_url"],
                opp["source_reliability"],
                opp["posted_at"],
                now.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
                now.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
                opp["is_expired"],
                opp["ranking_score"],
                opp["view_count"],
                opp["content_hash"]
            ))
            success_count += 1
        except sqlite3.IntegrityError:
            # Duplicate detection based on unique content_hash
            duplicate_count += 1
            cursor.execute("""
            UPDATE opportunities 
            SET last_seen_at = ?
            WHERE content_hash = ?
            """, (now.strftime("%Y-%m-%dT%H:%M:%S") + "Z", opp["content_hash"]))
            
    conn.commit()
    conn.close()
    
    print(f"Ingestion finished successfully!")
    print(f"- Processed: {len(RAW_POSTS_DATA)}")
    print(f"- Ingested New: {success_count}")
    print(f"- Duplicates updated: {duplicate_count}")

if __name__ == "__main__":
    run_ingestion()
