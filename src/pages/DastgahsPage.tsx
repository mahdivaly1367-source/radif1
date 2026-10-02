import React, { useState } from 'react';
import { Search, Layers, Volume2, ArrowLeft, Filter, Sparkles } from 'lucide-react';
import { PageRoute } from '../components/Navbar';
import { DASTGAHS } from '../data/dastgahs';
import { DastgahCategory } from '../types/music';
import { persianSynth } from '../services/audio/synthPlayer';

interface DastgahsPageProps {
  onNavigate: (path: string) => void;
  onSelectDastgah: (dastgahId: string) => void;
}

export const DastgahsPage: React.FC<DastgahsPageProps> = ({ onNavigate, onSelectDastgah }) => {
  const [filterType, setFilterType] = useState<'all' | DastgahCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDastgahs = DASTGAHS.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nameFa.toLowerCase().includes(q) ||
      item.shortDescription.toLowerCase().includes(q) ||
      item.characterFa.toLowerCase().includes(q) ||
      item.gushehs.some((g) => g.nameFa.toLowerCase().includes(q))
    );
  });

  const playTonic = async (e: React.MouseEvent, noteName: string) => {
    e.stopPropagation();
    await persianSynth.playNoteByName(noteName.split(' ')[0], 4, 1.6);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
          دانشنامه ردیف
        </span>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          دستگاه‌ها و آوازهای ردیف موسیقی ایرانی
        </h1>
        <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
          نظام ردیف شامل ۷ دستگاه مادر و ۵ آواز منشعب است. برای مشاهده ساختار فواصل، گوشه‌ها، نت شاهد و ایست، و شبیه‌ساز صوتی، دستگاه مورد نظر خود را انتخاب کنید.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            همه ({DASTGAHS.length})
          </button>
          <button
            onClick={() => setFilterType('dastgah')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'dastgah'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            دستگاه‌های هفت‌گانه (۷)
          </button>
          <button
            onClick={() => setFilterType('avaz')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'avaz'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            آوازهای پنج‌گانه (۵)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی دستگاه، گوشه، حس و حال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Grid of Dastgahs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDastgahs.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectDastgah(item.id)}
            className="group bg-white rounded-xl border border-stone-200 hover:border-amber-400/80 p-5 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                      {item.nameFa}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.type === 'dastgah'
                          ? 'bg-stone-900 text-amber-400'
                          : 'bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {item.type === 'dastgah' ? 'دستگاه اصلی' : 'آواز وابسته'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono block mt-0.5">
                    {item.nameEn}
                  </span>
                </div>

                <button
                  onClick={(e) => playTonic(e, item.tonicNote)}
                  className="p-2 rounded-lg bg-stone-50 hover:bg-amber-100 text-stone-500 hover:text-amber-800 transition-colors"
                  title="شنیدن صدای نت پایه با سنتور"
                  aria-label="شنیدن صدای نت پایه با سنتور"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-amber-800 font-medium mb-3">
                حس و حال: {item.characterFa}
              </p>

              <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-3">
                {item.shortDescription}
              </p>

              {/* Scale Preview Pills */}
              <div className="mb-4">
                <span className="text-[10px] text-stone-400 block mb-1.5">نغمات گام:</span>
                <div className="flex flex-wrap gap-1">
                  {item.scaleNotes.slice(0, 5).map((n, i) => (
                    <span
                      key={i}
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        n.accidental === 'koron'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {n.noteNameFa}
                    </span>
                  ))}
                  {item.scaleNotes.length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-stone-400">
                      +{item.scaleNotes.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span className="text-[11px]">
                {item.gushehs.length} گوشه در ردیف
              </span>
              <span className="text-amber-700 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                <span>مشاهده و پخش</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
