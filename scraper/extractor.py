import re
import json
import os
from normalizer import normalize_arabic, clean_text

# Governorate keywords mapping (Arabic normalized and English values)
GOVERNORATE_KEYWORDS = {
    "cairo": ["القاهره", "التجمع", "المعادي", "مصر الجديده", "الرحاب", "مدينتي", "حلوان", "شبرا", "عين شمس", "الزيتون", "وسط البلد", "cairo", "heliopolis", "nasr city", "maadi", "tagamoa"],
    "alexandria": ["الاسكندريه", "اسكندريه", "سموحه", "سيدي جابر", "ميامي", "لوران", "العجمي", "جليك", "alexandria", "alex", "smouha", "sidi gaber"],
    "giza": ["الجيزه", "الدقي", "المهندسين", "الدقى", "اكتوبر", "الهرم", "فيصل", "الشيخ زايد", "giza", "dokki", "mohandessin", "october", "sheikh zayed"],
    "mansoura": ["المنصوره", "mansoura", "توريل", "جديلة"],
    "tanta": ["طنطا", "tanta"],
    "zagazig": ["الزقازيق", "zagazig"],
    "assiut": ["اسيوط", "assiut"],
    "sohag": ["سوهاج", "sohag"],
    "minya": ["المنيا", "minya"],
    "damietta": ["دمياط", "damietta"],
    "ismailia": ["الاسماعيليه", "ismailia"],
    "suez": ["السويس", "suez"],
    "port_said": ["بور سعيد", "بورسعيد", "port said"],
    "qena": ["قنا", "qena"],
    "aswan": ["اسوان", "aswan"],
    "luxor": ["الاقصر", "luxor"],
    "fayoum": ["الفيوم", "fayoum"]
}

SPECIALTY_KEYWORDS = {
    "orthodontics": ["تقويم", "ortho", "braces", "orthodontist"],
    "oral_surgery": ["جراحه", "surgery", "خلع", "زراعه", "implant", "surgeon"],
    "pediatric": ["اطفال", "pediatric", "pedodontist", "pedodontics"],
    "endodontics": ["علاج جذور", "حشو عصب", "endo", "endodontics", "endodontist"],
    "prosthodontics": ["تركيبات", "fixed prosthodontics", "crowns", "veneers", "prostho"],
    "periodontics": ["لثه", "perio", "periodontist", "periodontics"],
    "radiology": ["اشعه", "xray", "radiology", "radiologist"],
    "general": ["عام", "gp", "general practitioner", "اسنان عام"]
}

JOB_TYPE_KEYWORDS = {
    "internship": ["امتياز", "internship", "intern"],
    "training": ["تدريب", "training", "train"],
    "course": ["كورس", "دورة", "حضور", "course", "workshop"],
    "residency": ["مقيم", "طبيب مقيم", "نيابه", "residency", "resident"],
    "attachment": ["ملازمه", "hospitation", "attachment"],
    "job": ["وظيفه", "مطلوب طبيب", "مطلوب طبيبه", "مطلوب اخصائي", "job", "hiring", "dentist wanted"]
}

EXPERIENCE_KEYWORDS = {
    "fresh_graduate": ["حديث التخرج", "حديثي التخرج", "خريج", "fresh", "graduate", "no experience"],
    "1_3_years": ["خبره سنه", "خبره سنتين", "سنه الى", "سنتين", "1-3", "1 to 3", "experience 1 year", "experience 2 years"],
    "3_plus_years": ["3 سنوات", "5 سنوات", "خبره 3", "3+ years", "3 years experience"],
    "senior": ["اخصائي", "استشاري", "ماجستير", "سنيور", "specialist", "consultant", "senior"],
    "any": ["خبره او بدون", "جميع الخبرات", "اي خبره", "any experience", "experience not required"]
}

def extract_phone(text: str) -> str:
    """Extract Egyptian phone numbers from text."""
    # Matches patterns like 01xxxxxxxxx, +201xxxxxxxxx, 01x-xxx-xxxx
    phone_pattern = r'(?:\+20|0)?1[0-25]\d{8}\b'
    match = re.search(phone_pattern, text)
    return match.group(0) if match else None

def extract_email(text: str) -> str:
    """Extract email addresses from text."""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None

def rule_based_extract(raw_text: str) -> dict:
    """
    Analyzes raw text using regex and dictionary matches.
    Returns structured opportunity dictionary.
    """
    clean_raw = clean_text(raw_text)
    norm_raw = normalize_arabic(clean_raw)
    norm_raw_lower = norm_raw.lower()
    
    # 1. Location extraction
    governorate = None
    area = None
    
    # Check for governorate
    for gov, keywords in GOVERNORATE_KEYWORDS.items():
        matched = False
        for kw in keywords:
            norm_kw = normalize_arabic(kw).lower()
            if norm_kw in norm_raw_lower:
                governorate = gov.capitalize()
                matched = True
                # Look for context around keyword as area name
                start_idx = norm_raw_lower.find(norm_kw)
                # Try to capture the surrounding words as area
                words = norm_raw[max(0, start_idx-20):min(len(norm_raw), start_idx+40)].split()
                if len(words) > 1:
                    area = " ".join([w for w in words if len(w) > 2][:4])
                break
        if matched:
            break
            
    if not governorate:
        governorate = "Cairo" # Default to Cairo if unspecified
        area = "Egypt"
        
    if not area:
        area = "Egypt"
        
    # 2. Specialty extraction
    specialty = "general"
    for spec, keywords in SPECIALTY_KEYWORDS.items():
        matched = False
        for kw in keywords:
            norm_kw = normalize_arabic(kw).lower()
            if norm_kw in norm_raw_lower:
                specialty = spec
                matched = True
                break
        if matched:
            break
            
    # 3. Job Type extraction
    job_type = "job"
    for jtype, keywords in JOB_TYPE_KEYWORDS.items():
        matched = False
        for kw in keywords:
            norm_kw = normalize_arabic(kw).lower()
            if norm_kw in norm_raw_lower:
                job_type = jtype
                matched = True
                break
        if matched:
            break
            
    # 4. Experience Level
    experience_level = "any"
    for exp, keywords in EXPERIENCE_KEYWORDS.items():
        matched = False
        for kw in keywords:
            norm_kw = normalize_arabic(kw).lower()
            if norm_kw in norm_raw_lower:
                experience_level = exp
                matched = True
                break
        if matched:
            break
            
    # 5. Contact info
    phone = extract_phone(clean_raw)
    email = extract_email(clean_raw)
    
    # WhatsApp fallback (if phone exists, check if WhatsApp logo or text is present)
    whatsapp = phone if ("واتس" in norm_raw or "whatsapp" in norm_raw_lower) and phone else None
    
    # 6. Clinic name estimation
    clinic_name = "Dental Clinic"
    clinic_matches = re.findall(r'(?:عيادة|مركز|مستشفى)\s+([أ-ي]+(?:\s+[أ-ي]+){0,2})', clean_raw)
    if clinic_matches:
        clinic_name = clinic_matches[0].strip()
    else:
        # Check english patterns
        en_clinic = re.findall(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:Dental|Clinic|Center)', clean_raw)
        if en_clinic:
            clinic_name = en_clinic[0].strip() + " Dental Center"
            
    # 7. Short summaries
    # Generate simple summaries based on fields if LLM is not available
    title_spec = specialty.replace('_', ' ').capitalize()
    title_type = job_type.capitalize()
    title = f"{title_spec} {title_type} at {clinic_name}"
    
    summary_en = f"Looking for a {experience_level.replace('_', ' ')} dentist for a {job_type} role in {area}, {governorate}. Specialty: {title_spec}."
    summary_ar = f"مطلوب طبيب أسنان ({experience_level}) للعمل بـ {clinic_name} في {area}، {governorate}. التخصص: {title_spec}."
    
    return {
        "title": title,
        "job_type": job_type,
        "specialty": specialty,
        "governorate": governorate,
        "area": area,
        "location_raw": area,
        "experience_level": experience_level,
        "contact_phone": phone,
        "contact_whatsapp": whatsapp,
        "contact_email": email,
        "clinic_name": clinic_name,
        "summary_en": summary_en,
        "summary_ar": summary_ar,
        "full_text": clean_raw,
        "salary_text": "Negotiable" if "راتب" in norm_raw or "مرتب" in norm_raw else "Competitive",
        "posted_at": None # To be filled by scraper script or current time
    }

def extract_opportunity(raw_text: str) -> dict:
    """
    Main entry point. Uses OpenAI API if OPENAI_API_KEY is defined in env,
    otherwise falls back to robust rule_based_extract.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return rule_based_extract(raw_text)
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        prompt = f"""
        You are an expert at extracting structured information from Egyptian dental job/internship/training posts.
        Extract the following fields from the post below:
        - title (English title, e.g. "General Dentist", "Orthodontist", "Dental Intern")
        - job_type: one of [job, internship, training, course, residency, attachment]
        - specialty: one of [general, orthodontics, oral_surgery, pediatric, prosthodontics, endodontics, periodontics, radiology, other]
        - location: {{governorate, area}} (governorate must be one of [Cairo, Alexandria, Giza, Mansoura, Tanta, Zagazig, Assiut, Sohag, Minya, Damietta, Ismailia, Suez, Port_said, Qena, Aswan, Luxor, Fayoum], area as English text of the district e.g. "Maadi", "Sidi Gaber")
        - experience_level: one of [fresh_graduate, 1_3_years, 3_plus_years, senior, any]
        - contact: {{phone, email, whatsapp}} (extract numbers starting with 01)
        - clinic_name
        - summary_en (2 sentence summary in English)
        - summary_ar (2 sentence summary in Arabic)
        - salary_text (extract if salary is mentioned, e.g. "5000 EGP", "Negotiable")

        Return ONLY a raw valid JSON object. No markdown, no triple backticks.

        Post text:
        {raw_text}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        
        data = json.loads(response.choices[0].message.content.strip())
        
        return {
            "title": data.get("title") or "Dental Opportunity",
            "job_type": data.get("job_type") or "job",
            "specialty": data.get("specialty") or "general",
            "governorate": data.get("location", {}).get("governorate") or "Cairo",
            "area": data.get("location", {}).get("area") or "Egypt",
            "location_raw": data.get("location", {}).get("area") or "Egypt",
            "experience_level": data.get("experience_level") or "any",
            "contact_phone": data.get("contact", {}).get("phone"),
            "contact_whatsapp": data.get("contact", {}).get("whatsapp"),
            "contact_email": data.get("contact", {}).get("email"),
            "clinic_name": data.get("clinic_name") or "Dental Clinic",
            "summary_en": data.get("summary_en"),
            "summary_ar": data.get("summary_ar"),
            "full_text": clean_text(raw_text),
            "salary_text": data.get("salary_text") or "Competitive",
            "posted_at": None
        }
    except Exception as e:
        print(f"Error calling OpenAI API, falling back to rule-based parser: {e}")
        return rule_based_extract(raw_text)
