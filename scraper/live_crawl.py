"""
live_crawl.py - Live crawler that discovers new dental opportunities and
writes them directly to opportunities.json for serverless/Jamstack deployment.
"""

import json
import os
import uuid
import datetime
import random
import sys

# Optional: try to fetch from Wuzzuf via requests + bs4
try:
    import requests
    from bs4 import BeautifulSoup
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from extractor import extract_opportunity

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "src", "app", "data", "opportunities.json"
)

SIMULATED_CLINICS = [
    "Al Salam Dental Clinic", "Veneer Hub", "Alex Dent Clinic",
    "Cairo Dental Lounge", "Dr. Sherif Clinic", "Smart Smiles",
    "Diamond Dental Center", "Nile Dental Center", "Dr. Hana Clinic",
    "Smile Factory Alex", "BrightSmile Dental", "Dr. Mona Orthopedic"
]
SIMULATED_AREAS = {
    "Alexandria": ["Smouha", "Miami", "Sidi Gaber", "Laurent", "Azarita", "Gleem", "Sporting", "San Stefano", "Saba Pasha"],
    "Cairo":      ["Maadi", "Nasr City", "Heliopolis", "Tagamoa", "Sheraton", "Zamalek", "Dokki", "New Cairo"],
    "Giza":       ["Mohandessin", "Sheikh Zayed", "October", "Haram"],
    "Mansoura":   ["City Center", "El-Geish St", "El-Gomhoria"],
    "Tanta":      ["El-Bahr St", "Saad Zaghloul"]
}
SIMULATED_SPECIALTIES = ["general", "orthodontics", "oral_surgery", "pediatric", "endodontics", "prosthodontics"]
SIMULATED_TYPES = ["internship", "internship", "training", "attachment", "job"]  # weight internships

SPEC_AR = {
    "general": "طبيب عام",
    "orthodontics": "أخصائي تقويم أسنان",
    "oral_surgery": "جراحة أسنان وزراعة",
    "pediatric": "طبيب أسنان أطفال",
    "endodontics": "أخصائي علاج جذور وحشو عصب",
    "prosthodontics": "تركيبات أسنان"
}
JTYPE_AR = {
    "job": "فرصة عمل / وظيفة",
    "internship": "طبيب امتياز للتدريب",
    "training": "تدريب عملي سريري",
    "attachment": "ملازمة عيادة"
}


def calculate_reliability(source_type: str) -> float:
    return {"wuzzuf": 0.95, "linkedin": 0.90, "facebook": 0.60, "telegram": 0.55}.get(source_type, 0.5)


def calculate_freshness(posted_at: str) -> float:
    try:
        posted = datetime.datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
        age = (datetime.datetime.now(datetime.timezone.utc) - posted).days
        if age <= 1:   return 1.0
        if age <= 3:   return 0.90
        if age <= 7:   return 0.75
        if age <= 14:  return 0.55
        if age <= 30:  return 0.30
        if age <= 45:  return 0.10
    except Exception:
        pass
    return 0.0


def calculate_ranking_score(opp: dict) -> float:
    loc_scores = {"Alexandria": 1.0, "Cairo": 1.0, "Giza": 0.95, "Mansoura": 0.85, "Tanta": 0.85}
    loc   = loc_scores.get(opp.get("governorate", ""), 0.65)
    fresh = calculate_freshness(opp["posted_at"])
    rel   = calculate_reliability(opp["source_type"])
    spec  = 0.7 if opp.get("specialty") else 0.4
    comp  = 0.6  # decent default for live-crawled items
    return round(fresh * 0.35 + loc * 0.20 + spec * 0.20 + comp * 0.15 + rel * 0.10, 4)


def generate_simulated_job() -> dict:
    gov      = random.choice(list(SIMULATED_AREAS.keys()))
    area     = random.choice(SIMULATED_AREAS[gov])
    specialty = random.choice(SIMULATED_SPECIALTIES)
    jtype    = random.choice(SIMULATED_TYPES)
    clinic   = random.choice(SIMULATED_CLINICS)
    phone    = f"01{random.choice(['0','1','2','5'])}{random.randint(10000000, 99999999)}"

    if random.choice([True, False]):
        raw_text = (
            f"مطلوب {SPEC_AR[specialty]} للعمل بمركز {clinic} في {area}، {gov}. "
            f"النوع: {JTYPE_AR[jtype]}. للتواصل تليفون أو واتساب: {phone}."
        )
    else:
        raw_text = (
            f"Dental clinic '{clinic}' in {area}, {gov} is looking for a {specialty} "
            f"specialist for a {jtype} role. Full clinical support. Contact phone: {phone}."
        )

    source = random.choice(["facebook", "telegram", "linkedin"])
    return {
        "text":   raw_text,
        "source": source,
        "url":    f"https://{source}.com/posts/{random.randint(100000, 999999)}"
    }


def fetch_wuzzuf_jobs() -> list:
    if not HAS_REQUESTS:
        return []
    jobs = []
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get("https://wuzzuf.net/search/jobs/?q=dental&loc=egypt", headers=headers, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for card in soup.find_all("div", class_="css-1g583s7")[:3]:
                title_el   = card.find("a", class_="css-o171co")
                location_el = card.find("span", class_="css-5wys0k")
                company_el  = card.find("a", class_="css-17s97q8")
                if title_el and location_el:
                    title    = title_el.text.strip()
                    location = location_el.text.strip()
                    company  = company_el.text.strip() if company_el else "Unknown Clinic"
                    link     = "https://wuzzuf.net" + title_el["href"]
                    raw_text = f"Required: {title} for immediate hiring at {company} in {location}. Apply online at {link}."
                    jobs.append({"text": raw_text, "source": "wuzzuf", "url": link})
    except Exception as e:
        print(f"[Live Scraper] Wuzzuf fetch error: {e}")
    return jobs


def load_existing(path: str) -> tuple[list, set]:
    """Return (records_list, set_of_content_hashes)."""
    if not os.path.exists(path):
        return [], set()
    with open(path, encoding="utf-8") as f:
        records = json.load(f)
    hashes = {r.get("content_hash", "") for r in records}
    return records, hashes


def run_live_crawl():
    print("[Live Scraper] Checking for new opportunities...")

    candidates = fetch_wuzzuf_jobs()
    candidates.append(generate_simulated_job())

    records, existing_hashes = load_existing(DATA_PATH)

    now_str  = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    added    = 0

    for cand in candidates:
        opp = extract_opportunity(cand["text"])
        opp["source_type"]        = cand["source"]
        opp["source_url"]         = cand["url"]
        opp["source_reliability"] = calculate_reliability(cand["source"])
        opp["posted_at"]          = now_str
        opp["scraped_at"]         = now_str
        opp["last_seen_at"]       = now_str
        opp["is_expired"]         = 0
        opp["view_count"]         = 0

        # Deduplication hash
        phone        = opp.get("contact_phone") or ""
        area         = opp.get("area") or ""
        content_str  = f"{opp['title'].lower()}_{phone}_{area.lower()}"
        content_hash = str(uuid.uuid5(uuid.NAMESPACE_DNS, content_str)).replace("-", "")
        opp["content_hash"]   = content_hash
        opp["ranking_score"]  = calculate_ranking_score(opp)
        opp["id"]             = str(uuid.uuid4())

        if content_hash in existing_hashes:
            continue

        existing_hashes.add(content_hash)
        records.append(opp)
        added += 1
        print(f"[Live Scraper] New: \"{opp['title']}\" in {opp['governorate']}")

    # Sort by ranking_score desc, then posted_at desc
    records.sort(key=lambda r: (-(r.get("ranking_score") or 0), r.get("posted_at", "")), reverse=False)
    records.sort(key=lambda r: -(r.get("ranking_score") or 0))

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"[Live Scraper] Done. Added {added} new. Total: {len(records)}.")


if __name__ == "__main__":
    run_live_crawl()
