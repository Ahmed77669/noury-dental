'use client';

import React from 'react';
import { Filter, X, MapPin, Briefcase, Sparkles, Award } from 'lucide-react';

export default function FilterPanel({
  filters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  t,
  isMobile = false,
  onCloseMobile = () => {}
}) {
  const handleSelect = (category, value) => {
    if (selectedFilters[category] === value) {
      onFilterChange(category, ''); // Toggle off if clicked again
    } else {
      onFilterChange(category, value);
    }
  };

  const hasSelectedFilters = Object.values(selectedFilters).some(v => v !== '');

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 text-slate-400 font-semibold mb-3 mt-5 first:mt-0 text-sm tracking-wider uppercase">
      <Icon className="w-4 h-4 text-brand-500" />
      <span>{title}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-lg border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-400" />
          <h2 className="font-bold text-slate-100 text-lg">{t.filters}</h2>
        </div>
        {hasSelectedFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            {t.clearFilters}
          </button>
        )}
        {isMobile && (
          <button onClick={onCloseMobile} className="p-1 hover:bg-slate-800 rounded-md text-slate-400">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        {/* 1. Job Types */}
        <div>
          <SectionHeader icon={Briefcase} title={t.jobType} />
          <div className="space-y-1.5">
            {filters.job_types?.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelect('type', item.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left rtl:text-right ${
                  selectedFilters.type === item.value
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300 font-medium'
                    : 'bg-slate-800/30 border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span>{t[item.value] || item.label.split(' / ')[0]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedFilters.type === item.value ? 'bg-brand-500/30 text-brand-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Governorates */}
        <div>
          <SectionHeader icon={MapPin} title={t.governorate} />
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filters.governorates?.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelect('governorate', item.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left rtl:text-right ${
                  selectedFilters.governorate === item.value
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300 font-medium'
                    : 'bg-slate-800/30 border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span>{langLabel(item.label)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedFilters.governorate === item.value ? 'bg-brand-500/30 text-brand-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Specialties */}
        <div>
          <SectionHeader icon={Sparkles} title={t.specialty} />
          <div className="space-y-1.5">
            {filters.specialties?.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelect('specialty', item.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left rtl:text-right ${
                  selectedFilters.specialty === item.value
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300 font-medium'
                    : 'bg-slate-800/30 border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span>{t[item.value] || item.label.split(' / ')[0]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedFilters.specialty === item.value ? 'bg-brand-500/30 text-brand-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Experience Levels */}
        <div>
          <SectionHeader icon={Award} title={t.experience} />
          <div className="space-y-1.5">
            {filters.experience_levels?.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelect('experience', item.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left rtl:text-right ${
                  selectedFilters.experience === item.value
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300 font-medium'
                    : 'bg-slate-800/30 border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span>{t[item.value] || item.label.split(' / ')[0]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedFilters.experience === item.value ? 'bg-brand-500/30 text-brand-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to extract Arabic or English label from standard "AR / EN" filter label formats
  function langLabel(rawLabel) {
    if (!rawLabel) return '';
    const parts = rawLabel.split(' / ');
    return parts.length > 1 ? parts[0] : rawLabel;
  }
}
