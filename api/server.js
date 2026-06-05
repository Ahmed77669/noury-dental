const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
const { startScheduler } = require('./scheduler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, '..', 'dental_opportunities.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper: Normalize Arabic characters for searching
function normalizeArabic(text) {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics
    .replace(/[أإآ]/g, "ا")           // normalize Alifs
    .replace(/ة/g, "ه")               // Taa Marbouta to Haa
    .replace(/ى/g, "ي")               // Ya/Alef Maksoura to Ya
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Specialty Keyword Maps for search query boosting
const SPECIALTY_KEYWORDS = {
  orthodontics: ["تقويم", "ortho", "braces", "orthodontist"],
  oral_surgery: ["جراحه", "surgery", "خلع", "زراعه", "implant", "surgeon"],
  pediatric: ["اطفال", "pediatric", "pedodontist", "pedodontics"],
  endodontics: ["علاج جذور", "حشو عصب", "endo", "endodontics", "endodontist"],
  prosthodontics: ["تركيبات", "fixed prosthodontics", "crowns", "veneers", "prostho"],
  periodontics: ["لثه", "perio", "periodontist", "periodontics"],
  radiology: ["اشعه", "xray", "radiology", "radiologist"],
  general: ["عام", "gp", "general practitioner", "اسنان عام"]
};

// Governorate Keywords for search query boosting
const GOVERNORATE_KEYWORDS = {
  Cairo: ["القاهره", "التجمع", "المعادي", "مصر الجديده", "الرحاب", "مدينتي", "cairo", "heliopolis", "nasr city", "maadi", "tagamoa"],
  Alexandria: ["الاسكندريه", "اسكندرية", "سموحه", "سيدي جابر", "ميامي", "لوران", "alexandria", "alex", "smouha", "sidi gaber"],
  Giza: ["الجيزه", "الدقي", "المهندسين", "اكتوبر", "زايد", "giza", "dokki", "mohandessin", "october", "zayed"],
  Mansoura: ["المنصوره", "mansoura", "توريل"],
  Tanta: ["طنطا", "tanta"],
  Zagazig: ["الزقازيق", "zagazig"],
  Assiut: ["اسيوط", "assiut"]
};

// API Endpoints

// 1. GET /v1/search
app.get('/v1/search', (req, res) => {
  const { q, type, governorate, specialty, experience, sort = 'relevant', page = 1, limit = 20 } = req.query;
  
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  // Build base query
  let sql = `SELECT * FROM opportunities WHERE is_expired = 0`;
  const params = [];

  if (type) {
    sql += ` AND job_type = ?`;
    params.push(type);
  }
  if (governorate) {
    sql += ` AND governorate = ?`;
    params.push(governorate);
  }
  if (specialty) {
    sql += ` AND specialty = ?`;
    params.push(specialty);
  }
  if (experience) {
    sql += ` AND experience_level = ?`;
    params.push(experience);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let results = rows;

    // Apply search query relevance and scoring if query is provided
    if (q && q.trim()) {
      const queryNorm = normalizeArabic(q.trim()).toLowerCase();
      const queryTerms = queryNorm.split(/\s+/).filter(t => t.length > 1);

      results = results.map(row => {
        let matchScore = 0;
        const titleNorm = normalizeArabic(row.title).toLowerCase();
        const summaryEnNorm = normalizeArabic(row.summary_en).toLowerCase();
        const summaryArNorm = normalizeArabic(row.summary_ar).toLowerCase();
        const fullTextNorm = normalizeArabic(row.full_text).toLowerCase();

        // 1. Calculate keyword matching overlap
        queryTerms.forEach(term => {
          if (titleNorm.includes(term)) matchScore += 10;
          if (summaryEnNorm.includes(term)) matchScore += 4;
          if (summaryArNorm.includes(term)) matchScore += 4;
          if (fullTextNorm.includes(term)) matchScore += 1;
        });

        // 2. Query boosts: Specialty alignment
        let querySpecialtyBoost = 0;
        if (row.specialty && SPECIALTY_KEYWORDS[row.specialty]) {
          const matchSpec = SPECIALTY_KEYWORDS[row.specialty].some(kw => 
            queryNorm.includes(normalizeArabic(kw).toLowerCase())
          );
          if (matchSpec) {
            querySpecialtyBoost = 0.30;
          }
        }

        // 3. Query boosts: Location alignment
        let queryLocationBoost = 0;
        if (row.governorate && GOVERNORATE_KEYWORDS[row.governorate]) {
          const matchGov = GOVERNORATE_KEYWORDS[row.governorate].some(kw => 
            queryNorm.includes(normalizeArabic(kw).toLowerCase())
          );
          if (matchGov) {
            queryLocationBoost = 0.25;
          }
        }

        // Final adjusted score for the search query
        const queryRelevanceScore = (matchScore > 0) ? (0.4 + Math.min(matchScore / 20, 0.6)) : 0;
        const adjustedScore = row.ranking_score + queryRelevanceScore + querySpecialtyBoost + queryLocationBoost;

        return {
          ...row,
          _relevance: matchScore,
          final_ranking_score: Number(adjustedScore.toFixed(4))
        };
      });

      // Filter out non-matching results if the user query was specific
      // but if the user searched for something, let's only keep rows with some relevance or category boost
      results = results.filter(row => row._relevance > 0 || row.final_ranking_score > row.ranking_score);
    } else {
      // If no query, final_ranking_score is just the database base score
      results = results.map(row => ({
        ...row,
        final_ranking_score: row.ranking_score
      }));
    }

    // Sort results
    if (sort === 'recent') {
      results.sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
    } else {
      results.sort((a, b) => b.final_ranking_score - a.final_ranking_score);
    }

    // Paginate
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limitNum);

    res.json({
      meta: {
        query: q || "",
        total,
        page: pageNum,
        limit: limitNum,
      },
      filters_applied: {
        type: type || null,
        governorate: governorate || null,
        specialty: specialty || null,
        experience: experience || null
      },
      results: paginatedResults
    });
  });
});

// 2. GET /v1/filters
app.get('/v1/filters', (req, res) => {
  // Query all active opportunities to aggregate counts
  db.all(`SELECT governorate, job_type, specialty, experience_level FROM opportunities WHERE is_expired = 0`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const governoratesMap = {};
    const jobTypesMap = {};
    const specialtiesMap = {};
    const experienceMap = {};

    rows.forEach(row => {
      if (row.governorate) governoratesMap[row.governorate] = (governoratesMap[row.governorate] || 0) + 1;
      if (row.job_type) jobTypesMap[row.job_type] = (jobTypesMap[row.job_type] || 0) + 1;
      if (row.specialty) specialtiesMap[row.specialty] = (specialtiesMap[row.specialty] || 0) + 1;
      if (row.experience_level) experienceMap[row.experience_level] = (experienceMap[row.experience_level] || 0) + 1;
    });

    // Translate/format labels for Arabic/English dropdowns
    const formatFilter = (map, labels) => {
      return Object.keys(map).map(key => ({
        value: key,
        label: labels[key] || key,
        count: map[key]
      })).sort((a, b) => b.count - a.count);
    };

    const govLabels = {
      Cairo: "القاهرة / Cairo",
      Alexandria: "الإسكندرية / Alexandria",
      Giza: "الجيزة / Giza",
      Mansoura: "المنصورة / Mansoura",
      Tanta: "طنطا / Tanta",
      Zagazig: "الزقازيق / Zagazig",
      Assiut: "أسيوط / Assiut",
      Sohag: "سوهاج / Sohag",
      Minya: "المنيا / Minya",
      Damietta: "دمياط / Damietta",
      Ismailia: "الإسماعيلية / Ismailia",
      Suez: "السويس / Suez",
      Port_said: "بورسعيد / Port Said",
      Qena: "قنا / Qena",
      Aswan: "أسوان / Aswan",
      Luxor: "الأقصر / Luxor",
      Fayoum: "الفيوم / Fayoum"
    };

    const typeLabels = {
      job: "وظيفة / Job",
      internship: "امتياز / Internship",
      training: "تدريب / Training",
      course: "كورس / Course",
      residency: "نيابة طبيب مقيم / Residency",
      attachment: "ملازمة / Attachment"
    };

    const specLabels = {
      general: "عام / General",
      orthodontics: "تقويم / Orthodontics",
      oral_surgery: "جراحة الفم والفكين / Oral Surgery",
      pediatric: "طب أسنان الأطفال / Pediatric",
      endodontics: "علاج جذور وحشو عصب / Endodontics",
      prosthodontics: "تركيبات أسنان / Prosthodontics",
      periodontics: "علاج لثة / Periodontics",
      radiology: "أشعة أسنان / Radiology"
    };

    const expLabels = {
      fresh_graduate: "حديث تخرج / Fresh Graduate",
      "1_3_years": "خبرة 1-3 سنوات / 1-3 Years",
      "3_plus_years": "خبرة 3+ سنوات / 3+ Years",
      senior: "أخصائي استشاري / Specialist/Senior",
      any: "أي خبرة / Any Experience"
    };

    res.json({
      governorates: formatFilter(governoratesMap, govLabels),
      job_types: formatFilter(jobTypesMap, typeLabels),
      specialties: formatFilter(specialtiesMap, specLabels),
      experience_levels: formatFilter(experienceMap, expLabels)
    });
  });
});

// 3. GET /v1/suggestions
app.get('/v1/suggestions', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ suggestions: [] });
  }

  const queryNorm = normalizeArabic(q.trim()).toLowerCase();
  
  // Search query words in database title, specialties, governorates
  db.all(`SELECT title, governorate, specialty FROM opportunities WHERE is_expired = 0 LIMIT 100`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const matches = new Set();
    const cleanQ = q.trim().toLowerCase();

    rows.forEach(row => {
      // Exact matches or prefix overlaps
      if (row.title.toLowerCase().includes(cleanQ)) {
        matches.add(row.title);
      }
      if (row.governorate.toLowerCase().startsWith(cleanQ)) {
        matches.add(`${row.title} in ${row.governorate}`);
      }
      if (row.specialty && row.specialty.toLowerCase().startsWith(cleanQ)) {
        matches.add(`${row.specialty.replace('_', ' ')} positions`);
      }
    });

    res.json({
      suggestions: Array.from(matches).slice(0, 5)
    });
  });
});

// 4. GET /v1/opportunity/:id
app.get('/v1/opportunity/:id', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM opportunities WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // Increment view_count asynchronously
    db.run(`UPDATE opportunities SET view_count = view_count + 1 WHERE id = ?`, [id]);

    res.json(row);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API Server running at http://localhost:${PORT}`);
  startScheduler();
});
