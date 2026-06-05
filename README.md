# 🦷 Dental Opportunities Search Engine — Egypt (MVP)

A modern, full-stack search engine for dental jobs, internships, training courses, and residencies in Egypt. Designed with high-performance search rankings, direct contact actions, and bilingual localization (Arabic default RTL + English LTR toggle).

---

## 📁 Project Structure

```
dental-opportunities-egypt/
├── scraper/          # Python ingestion pipeline and normalizers
│   ├── normalizer.py     # Clean Arabic diacritics and standardize letters
│   ├── extractor.py      # Rule-based heuristics and OpenAI parsing fallback
│   ├── mock_scraper.py   # Seeder dataset with 30 realistic Egyptian ads
│   └── ingest.py         # DB initializer and score generator
│
├── api/              # Node.js + Express.js API backend
│   ├── server.js         # API endpoints (Search, Filters, Autocomplete, Views)
│   └── test_search.js    # Data integration validation suite
│
└── frontend/         # Next.js 14 + Tailwind CSS web app
    ├── src/app/
    │   ├── page.tsx          # Autocomplete search & sidebar filters dashboard
    │   ├── layout.tsx        # Cairo & Outfit fonts loading
    │   └── components/       # SearchBar, FilterPanel, ResultCard, OpportunityDetail
    └── tailwind.config.js    # Curated premium theme colors
```

---

## 🚀 Quick Start (Local Demo Mode)

The MVP is configured to run out-of-the-box using a local SQLite database file, seeded with realistic dental posts matching Egyptian Telegram & Facebook group formats.

### Step 1: Clone and Initialize Workspace
Open a terminal in the root directory `dental-opportunities-egypt` and install the monorepo dependencies:
```bash
npm run install:all
```

### Step 2: Seed the Database
Navigate to the `scraper` folder, install requirements, and run the ingestion pipeline to create `dental_opportunities.db`:
```bash
cd scraper
pip install -r requirements.txt
python ingest.py
cd ..
```

### Step 3: Run the Services
You can run the backend API (port 5000) and Next.js frontend (port 3000) concurrently:
```bash
npm run dev
```

- **Backend API**: [http://localhost:5000/v1/search](http://localhost:5000/v1/search)
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)

---

## 🦷 Key Features & Tech

1. **Bilingual Localization**: Seamless Arabic (RTL) & English (LTR) dashboard toggling using custom translations.
2. **5-Component Scoring Algorithm**:
   - **Freshness (35%)**: Dynamic age decay.
   - **Location (20%)**: Boosts results based on geographic proximity.
   - **Specialty Alignment (20%)**: Higher weight for matching specialty keywords.
   - **Completeness (15%)**: Weighted scoring based on field availability.
   - **Source Reliability (10%)**: Trust score depending on the origin channel.
3. **Fuzzy Search Autocomplete**: Instantly fetches suggestions matching typed inputs on key press.
4. **Direct Contacts**: Interactive links for direct WhatsApp chatting, cellular calling, or emailing.
