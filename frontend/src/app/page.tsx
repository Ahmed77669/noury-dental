'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Stethoscope, Globe, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import ResultCard from './components/ResultCard';
import OpportunityDetail from './components/OpportunityDetail';
import IntroEnvelope from './components/IntroEnvelope';
import ALL_OPPS from './data/opportunities.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  title: string;
  job_type: string;
  specialty: string;
  experience_level: string;
  governorate: string;
  area: string;
  location_raw: string;
  clinic_name: string;
  summary_en: string;
  summary_ar: string;
  full_text: string;
  salary_text: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  source_type: string;
  source_url: string;
  source_reliability: number;
  posted_at: string;
  scraped_at: string;
  last_seen_at: string;
  is_expired: number;
  ranking_score: number;
  view_count: number;
  content_hash: string;
  [key: string]: unknown;
}

const OPPS: Opportunity[] = ALL_OPPS as Opportunity[];
const PAGE_SIZE = 12;

// ─── Translations ─────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  ar: {
    title: "نوري لتأهيل الأسنان | Noury Dental",
    subtitle: "محرك البحث الذكي المتكامل للفرص والتدريب المهني لأطباء الأسنان في مصر",
    placeholder: "ابحث بالتخصص، المحافظة، أو اسم العيادة...",
    searchBtn: "ابحث الآن",
    filters: "تصفية النتائج",
    governorate: "المحافظة",
    jobType: "نوع الفرصة",
    specialty: "التخصص",
    experience: "الخبرة المطلوبة",
    sortBy: "ترتيب حسب",
    recent: "الأحدث",
    relevant: "الأكثر صلة",
    salary: "المرتب",
    contact: "بيانات التواصل المباشر",
    whatsapp: "تواصل عبر واتساب",
    phone: "اتصال هاتفي",
    email: "البريد الإلكتروني",
    source: "المصدر الأصلي",
    expired: "منتهي الصلاحية",
    noResults: "لم نجد نتائج تطابق خياراتك، حاول مسح الفلاتر أو كتابة عبارة بحث أخرى.",
    clearFilters: "مسح الفلاتر",
    resultsCount: "فرص عمل معروضة حالياً",
    general: "طبيب أسنان عام / ممارس عام",
    orthodontics: "تقويم الأسنان / Orthodontics",
    oral_surgery: "جراحة الفم والفكين والزراعة",
    pediatric: "طب أسنان الأطفال / Pediatric",
    endodontics: "علاج الجذور وعصب الأسنان",
    prosthodontics: "تركيبات الأسنان والتركيبات الثابتة",
    periodontics: "أمراض اللثة والأنسجة المحيطة",
    radiology: "أشعة الأسنان والتشخيص",
    job: "وظيفة عمل",
    internship: "فترة امتياز",
    training: "تدريب عملي",
    course: "كورس / ورشة عمل",
    residency: "نيابة / طبيب مقيم",
    attachment: "ملازمة عيادة",
    fresh_graduate: "حديث تخرج",
    "1_3_years": "خبرة 1-3 سنوات",
    "3_plus_years": "خبرة 3+ سنوات",
    senior: "أخصائي / استشاري",
    any: "أي مستوى خبرة",
    daysAgo: "أيام مضت",
    today: "اليوم",
    yesterday: "أمس",
    details: "عرض تفاصيل الفرصة",
    close: "إغلاق"
  },
  en: {
    title: "Noury Dental Opportunities",
    subtitle: "The smart aggregate search engine for dental jobs, training, internships & residencies by Noury",
    placeholder: "Search by specialty, location, clinic name...",
    searchBtn: "Search",
    filters: "Filter Results",
    governorate: "Governorate",
    jobType: "Opportunity Type",
    specialty: "Specialty",
    experience: "Experience Required",
    sortBy: "Sort By",
    recent: "Most Recent",
    relevant: "Most Relevant",
    salary: "Salary",
    contact: "Direct Contact Information",
    whatsapp: "WhatsApp Chat",
    phone: "Call directly",
    email: "Email Address",
    source: "Source URL",
    expired: "Expired",
    noResults: "No opportunities found. Try clearing filters or searching for another term.",
    clearFilters: "Clear Filters",
    resultsCount: "active dental opportunities found",
    general: "General Practitioner / GP",
    orthodontics: "Orthodontics",
    oral_surgery: "Oral Surgery & Implantology",
    pediatric: "Pediatric Dentistry",
    endodontics: "Endodontics / Root Canal",
    prosthodontics: "Prosthodontics / Fixed",
    periodontics: "Periodontics",
    radiology: "Radiology & Diagnosis",
    job: "Job vacancy",
    internship: "Dental Internship",
    training: "Practical Training",
    course: "Course / Workshop",
    residency: "Residency position",
    attachment: "Clinic Attachment",
    fresh_graduate: "Fresh Graduate",
    "1_3_years": "1-3 Years Exp",
    "3_plus_years": "3+ Years Exp",
    senior: "Specialist / Consultant",
    any: "Any experience level",
    daysAgo: "days ago",
    today: "Today",
    yesterday: "Yesterday",
    details: "View Opportunity Details",
    close: "Close"
  }
} as const;

type Lang = keyof typeof TRANSLATIONS;

// ─── Client-side search helpers ───────────────────────────────────────────────

function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  orthodontics: ['تقويم', 'ortho', 'braces', 'orthodontist'],
  oral_surgery:  ['جراحه', 'surgery', 'خلع', 'زراعه', 'implant', 'surgeon'],
  pediatric:     ['اطفال', 'pediatric', 'pedodontist'],
  endodontics:   ['جذور', 'حشو عصب', 'endo', 'endodontic', 'root canal'],
  prosthodontics:['تركيبات', 'prostho', 'fixed', 'crown'],
  periodontics:  ['لثه', 'perio', 'gum'],
  radiology:     ['اشعه', 'radiology', 'xray'],
};

function scoreQuery(opp: Opportunity, qNorm: string): number {
  if (!qNorm) return opp.ranking_score;

  const fields = [
    opp.title, opp.clinic_name, opp.governorate, opp.area,
    opp.summary_en, opp.summary_ar, opp.full_text, opp.specialty, opp.job_type
  ].map(f => normalizeArabic(f || ''));

  let boost = 0;
  for (const f of fields) {
    if (f.includes(qNorm)) boost += 0.15;
  }

  // Specialty keyword bonus
  for (const [spec, kws] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (kws.some(kw => qNorm.includes(kw) || kw.includes(qNorm))) {
      if (opp.specialty === spec) boost += 0.25;
    }
  }

  return Math.min(opp.ranking_score + boost, 1.5);
}

function clientSearch(
  q: string,
  filters: { type: string; governorate: string; specialty: string; experience: string },
  sort: string,
  page: number
): { results: Opportunity[]; total: number } {
  const qNorm = normalizeArabic(q);

  let pool = OPPS.filter(o => o.is_expired === 0);

  // Text filter
  if (qNorm) {
    pool = pool.filter(o => {
      const haystack = normalizeArabic([
        o.title, o.clinic_name, o.governorate, o.area,
        o.summary_en, o.summary_ar, o.full_text, o.specialty, o.job_type
      ].join(' '));
      return haystack.includes(qNorm);
    });
  }

  // Facet filters
  if (filters.type)        pool = pool.filter(o => o.job_type === filters.type);
  if (filters.governorate) pool = pool.filter(o => o.governorate === filters.governorate);
  if (filters.specialty)   pool = pool.filter(o => o.specialty === filters.specialty);
  if (filters.experience)  pool = pool.filter(o => o.experience_level === filters.experience);

  // Scoring + sorting
  const scored = pool.map(o => ({ opp: o, score: scoreQuery(o, qNorm) }));

  if (sort === 'recent') {
    scored.sort((a, b) => b.opp.posted_at.localeCompare(a.opp.posted_at));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  const total = scored.length;
  const start = (page - 1) * PAGE_SIZE;
  const results = scored.slice(start, start + PAGE_SIZE).map(s => s.opp);

  return { results, total };
}

function buildFiltersData() {
  const govCount:  Record<string, number> = {};
  const typeCount: Record<string, number> = {};
  const specCount: Record<string, number> = {};
  const expCount:  Record<string, number> = {};

  for (const o of OPPS) {
    if (o.is_expired) continue;
    if (o.governorate) govCount[o.governorate]         = (govCount[o.governorate]  || 0) + 1;
    if (o.job_type)    typeCount[o.job_type]            = (typeCount[o.job_type]    || 0) + 1;
    if (o.specialty)   specCount[o.specialty]           = (specCount[o.specialty]   || 0) + 1;
    if (o.experience_level) expCount[o.experience_level] = (expCount[o.experience_level] || 0) + 1;
  }

  const toList = (rec: Record<string, number>) =>
    Object.entries(rec).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));

  return {
    governorates:      toList(govCount),
    job_types:         toList(typeCount),
    specialties:       toList(specCount),
    experience_levels: toList(expCount),
  };
}

const FILTERS_DATA = buildFiltersData();

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang]                       = useState<Lang>('ar');
  const [showIntro, setShowIntro]             = useState(false);
  const [q, setQ]                             = useState('');
  const [activeQ, setActiveQ]                 = useState('');
  const [selectedFilters, setSelectedFilters] = useState({ type: '', governorate: '', specialty: '', experience: '' });
  const [sort, setSort]                       = useState('relevant');
  const [page, setPage]                       = useState(1);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showMobileFilters, setShowMobileFilters]     = useState(false);

  // Show intro on first visit
  useEffect(() => {
    if (!localStorage.getItem('noury_intro_seen')) setShowIntro(true);
  }, []);

  const t     = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Client-side search (instant — no network request)
  const { results, total } = useMemo(
    () => clientSearch(activeQ, selectedFilters, sort, page),
    [activeQ, selectedFilters, sort, page]
  );

  const handleFilterChange = useCallback((category: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [category]: value }));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedFilters({ type: '', governorate: '', specialty: '', experience: '' });
    setPage(1);
  }, []);

  const handleSearchSubmit = useCallback((val: string) => {
    setActiveQ(val);
    setPage(1);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={`min-h-screen pb-16 bg-grid-pattern relative`} dir={isRtl ? 'rtl' : 'ltr'}>
      {showIntro && <IntroEnvelope onComplete={() => setShowIntro(false)} />}

      {/* Decorative glow orbs */}
      <div className="absolute top-[-100px] left-[10%] w-[350px] h-[350px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[200px] right-[10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800/80 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-brand-600 to-teal-400 p-2.5 rounded-2xl shadow-lg shadow-teal-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-1.5 font-arabic">
                نوري للأسنان | Noury
                <span className="text-xs bg-brand-500/20 text-brand-400 font-semibold px-2 py-0.5 rounded-md font-sans">
                  LIVE
                </span>
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">
                Dental Search Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
              className="bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700/80 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all text-slate-300 hover:text-white"
            >
              <Globe className="w-4 h-4 text-brand-400" />
              <span>{lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative text-center py-16 px-4 max-w-5xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-300 mb-6 tracking-wide animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'البحث بالذكاء الاصطناعي متاح الآن' : 'AI-Powered Extraction Active'}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight leading-tight md:leading-snug mb-4">
          {t.title}
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
          {t.subtitle}
        </p>
        <SearchBar q={q} setQ={setQ} onSearch={handleSearchSubmit} t={t} />
      </section>

      {/* ── Search Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <FilterPanel
              filters={FILTERS_DATA}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              t={t}
            />
          </aside>

          {/* Results */}
          <section className="lg:col-span-3 space-y-6">
            {/* Sort bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/20 border border-slate-800/60 rounded-2xl p-4">
              <div className="text-slate-400 text-sm">
                <span className="text-brand-300 font-bold text-lg">{total}</span> {t.resultsCount}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300"
                >
                  <SlidersHorizontal className="w-4 h-4 text-brand-400" />
                  <span>{t.filters}</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
                  <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="bg-transparent border-0 outline-none text-sm text-slate-300 py-1.5 pr-8 pl-2 cursor-pointer font-medium"
                  >
                    <option value="relevant" className="bg-[#0b0f19] text-slate-300">{t.relevant}</option>
                    <option value="recent"   className="bg-[#0b0f19] text-slate-300">{t.recent}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cards */}
            {results.length === 0 ? (
              <div className="bg-slate-900/10 border border-slate-800/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 mt-8">
                <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-200">No results found</h3>
                <p className="text-slate-400 text-sm">{t.noResults}</p>
                <button
                  onClick={handleClearFilters}
                  className="bg-brand-500 hover:bg-brand-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
                >
                  {t.clearFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((opp) => (
                  <ResultCard
                    key={opp.id}
                    item={opp}
                    onSelect={setSelectedOpportunity}
                    t={t}
                    lang={lang}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2.5 bg-slate-900/60 hover:bg-slate-800/60 disabled:bg-slate-950/40 border border-slate-800 disabled:border-slate-900 rounded-xl text-slate-300 disabled:text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
                <span className="text-sm font-semibold text-slate-400">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-2.5 bg-slate-900/60 hover:bg-slate-800/60 disabled:bg-slate-950/40 border border-slate-800 disabled:border-slate-900 rounded-xl text-slate-300 disabled:text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Opportunity Detail Modal ── */}
      {selectedOpportunity && (
        <OpportunityDetail
          item={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          t={t}
          lang={lang}
        />
      )}

      {/* ── Mobile Filter Drawer ── */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center lg:hidden">
          <div className="w-full max-h-[85vh] overflow-hidden rounded-t-[32px] animate-fade-in-up">
            <FilterPanel
              filters={FILTERS_DATA}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              t={t}
              isMobile={true}
              onCloseMobile={() => setShowMobileFilters(false)}
            />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 border-t border-slate-800/60 text-center text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <p dir="ltr">© {new Date().getFullYear()} Noury Dental Opportunities. All rights reserved.</p>
        <button
          onClick={() => setShowIntro(true)}
          className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-2 transition-colors bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/20 hover:border-brand-500/30 px-4 py-2 rounded-full cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'إعادة تشغيل مقدمة نوري 💌' : 'Replay Noury Intro 💌'}</span>
        </button>
      </footer>
    </div>
  );
}
