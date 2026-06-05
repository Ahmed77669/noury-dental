'use client';

import React from 'react';
import { MapPin, Calendar, ExternalLink, Phone, Send, Heart } from 'lucide-react';

export default function ResultCard({ item, onSelect, t, lang }) {
  // Color-coded badge configurations
  const getBadgeColors = (type) => {
    switch (type) {
      case 'job':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'internship':
        return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
      case 'training':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      case 'course':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      case 'residency':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  // Humanize posted age
  const getRelativeTime = (isoString) => {
    try {
      const now = new Date();
      const postDate = new Date(isoString);
      const diffTime = Math.abs(now.getTime() - postDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        return t.today;
      }
      if (diffDays === 2) {
        return t.yesterday;
      }
      return `${diffDays} ${t.daysAgo}`;
    } catch (e) {
      return '';
    }
  };

  const titleText = lang === 'ar' && item.title_ar ? item.title_ar : item.title;
  const summaryText = lang === 'ar' ? item.summary_ar : item.summary_en;

  const govLabel = item.governorate;

  return (
    <div className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 flex flex-col justify-between h-full animate-fade-in-up">
      <div>
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${getBadgeColors(item.job_type)} font-semibold tracking-wide uppercase`}>
              {t[item.job_type] || item.job_type}
            </span>
            {item.specialty && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-slate-800 bg-slate-800/60 text-slate-300 font-medium">
                {t[item.specialty] || item.specialty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <MapPin className="w-4 h-4 text-brand-500" />
            <span>{govLabel}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 mb-3 leading-snug">
          {titleText}
        </h3>

        {/* Meta details */}
        <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed font-sans">
          {summaryText}
        </p>
      </div>

      <div className="border-t border-slate-800/60 pt-4 mt-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{getRelativeTime(item.posted_at)}</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="uppercase text-slate-400 tracking-wider font-semibold">{item.source_type}</span>
        </div>

        <button
          onClick={() => onSelect(item)}
          className="text-brand-400 hover:text-brand-300 text-sm font-semibold flex items-center gap-1 transition-all group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
        >
          <span>{t.details}</span>
          <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
}
