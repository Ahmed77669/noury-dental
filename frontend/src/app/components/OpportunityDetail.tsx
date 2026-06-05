'use client';

import React from 'react';
import { X, MapPin, Briefcase, Sparkles, Award, Wallet, Calendar, Share2, Phone, MessageSquare, Mail, Link } from 'lucide-react';

export default function OpportunityDetail({ item, onClose, t, lang }) {
  if (!item) return null;

  const titleText = lang === 'ar' && item.title_ar ? item.title_ar : item.title;

  // Contact actions
  const whatsappUrl = item.contact_whatsapp 
    ? `https://wa.me/${item.contact_whatsapp.replace(/[^0-9]/g, '')}` 
    : null;

  const phoneUrl = item.contact_phone ? `tel:${item.contact_phone}` : null;
  const emailUrl = item.contact_email ? `mailto:${item.contact_email}` : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-brand-900 to-slate-900 p-6 border-b border-slate-800/80 flex justify-between items-start">
          <div className="space-y-2 max-w-[85%]">
            <span className="bg-brand-500/20 text-brand-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase border border-brand-500/20">
              {t[item.job_type] || item.job_type}
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mt-2 leading-tight">
              {titleText}
            </h2>
            <p className="text-slate-400 text-sm font-medium">{item.clinic_name}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full text-slate-300 hover:text-white transition-all shadow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-3">
              <MapPin className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <span className="block text-xs text-slate-500">{t.governorate}</span>
                <span className="text-sm font-semibold text-slate-200">{item.governorate} ({item.area})</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <span className="block text-xs text-slate-500">{t.specialty}</span>
                <span className="text-sm font-semibold text-slate-200 uppercase">{t[item.specialty] || item.specialty}</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-3">
              <Award className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <span className="block text-xs text-slate-500">{t.experience}</span>
                <span className="text-sm font-semibold text-slate-200">{t[item.experience_level] || item.experience_level}</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-3">
              <Wallet className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <span className="block text-xs text-slate-500">{t.salary}</span>
                <span className="text-sm font-semibold text-slate-200">{item.salary_text}</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-3">
              <Share2 className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <span className="block text-xs text-slate-500">{t.source}</span>
                <span className="text-sm font-semibold text-slate-200 uppercase">{item.source_type}</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <span className="block text-xs text-slate-500">Posted</span>
                <span className="text-sm font-semibold text-slate-200">
                  {new Date(item.posted_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Full description */}
          <div className="space-y-2.5">
            <h4 className="text-base font-bold text-slate-200 border-l-4 border-brand-500 pl-2 rtl:border-l-0 rtl:border-r-4 rtl:pr-2">
              Original Advertisement Text
            </h4>
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60 max-h-52 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed font-arabic">
                {item.full_text}
              </pre>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-slate-200 border-l-4 border-brand-500 pl-2 rtl:border-l-0 rtl:border-r-4 rtl:pr-2">
              {t.contact}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/10"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.whatsapp} ({item.contact_whatsapp})</span>
                </a>
              )}
              {phoneUrl && (
                <a
                  href={phoneUrl}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 px-4 rounded-xl border border-slate-700/60 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.phone} ({item.contact_phone})</span>
                </a>
              )}
              {emailUrl && (
                <a
                  href={emailUrl}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 px-4 rounded-xl border border-slate-700/60 transition-all col-span-1 md:col-span-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{t.email} ({item.contact_email})</span>
                </a>
              )}
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-brand-900/30 hover:bg-brand-900/50 text-brand-300 font-medium py-3 px-4 rounded-xl border border-brand-800/40 transition-all col-span-1 md:col-span-2"
                >
                  <Link className="w-4 h-4" />
                  <span>View Original Post Link</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
