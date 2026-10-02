import React, { useState } from 'react';
import { ArrowRight, Volume2, Play, BookOpen, Mic, Sliders, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dastgah, Gusheh } from '../types/music';
import { ScaleVisualizer } from '../components/ScaleVisualizer';
import { PageRoute } from '../components/Navbar';
import { persianSynth } from '../services/audio/synthPlayer';
import { LESSONS } from '../data/lessons';
import { EXERCISES } from '../data/exercises';

interface DastgahDetailPageProps {
  dastgah: Dastgah;
  onBack: () => void;
  onNavigate: (page: PageRoute, params?: { dastgahId?: string; lessonId?: string; exerciseId?: string }) => void;
}

export const DastgahDetailPage: React.FC<DastgahDetailPageProps> = ({
  dastgah,
  onBack,
  onNavigate,
}) => {
  const [playingGushehId, setPlayingGushehId] = useState<string | null>(null);
  const [expandedGushehId, setExpandedGushehId] = useState<string | null>(dastgah.gushehs[0]?.id || null);

  const relatedLessons = LESSONS.filter((l) => l.dastgahId === dastgah.id);
  const relatedExercises = EXERCISES.filter((e) => e.dastgahId === dastgah.id);

  const handlePlayGushehMelody = async (gusheh: Gusheh) => {
    if (!gusheh.sampleMelodyNotes || gusheh.sampleMelodyNotes.length === 0) {
      // Play tonic note as fallback
      await persianSynth.playNoteByName(dastgah.tonicNote.split(' ')[0], 4, 1.5);
      return;
    }

    setPlayingGushehId(gusheh.id);

    const notesSeq = gusheh.sampleMelodyNotes.map((note) => ({
      note,
      duration: 0.9,
    }));

    await persianSynth.playMelody(
      notesSeq,
      undefined,
      () => setPlayingGushehId(null)
    );
  };

  const getRoleStyle = (role: Gusheh['role']) => {
    switch (role) {
      case 'درآمد':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'اوج':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'فرود':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'کرشمه':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'حزین':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست دستگاه‌ها</span>
        </button>

        <button
          onClick={() => onNavigate('exercise', { dastgahId: dastgah.id })}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-xs"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>تمرین آوازی این دستگاه</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold px-2.5 py-0.5 rounded-full bg-stone-900 text-amber-400">
            {dastgah.type === 'dastgah' ? 'دستگاه اصلی' : `آواز وابسته به ${dastgah.parentDastgahNameFa}`}
          </span>
          <span className="text-stone-400">·</span>
          <span className="font-mono text-stone-500">{dastgah.nameEn}</span>
          <span className="text-stone-400">·</span>
          <span className="font-mono text-stone-700 font-semibold">پایه: {dastgah.tonicNote}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          {dastgah.nameFa}
        </h1>

        <p className="text-sm font-semibold text-amber-800">
          حس و حال و شخصیت صوتی: {dastgah.characterFa}
        </p>

        <p className="text-sm text-stone-700 leading-relaxed max-w-3xl">
          {dastgah.fullHistory}
        </p>

        {/* Instrument Tuning Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80">
            <span className="text-[11px] font-bold text-stone-500 block mb-1">کوک تار و سه‌تار</span>
            <p className="text-xs text-stone-800 font-medium">{dastgah.tuningTarSetar}</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80">
            <span className="text-[11px] font-bold text-stone-500 block mb-1">کوک سنتور</span>
            <p className="text-xs text-stone-800 font-medium">{dastgah.tuningSantur}</p>
          </div>
        </div>
      </div>

      {/* Scale Visualizer */}
      <ScaleVisualizer
        title={`پرده‌بندی و گام ${dastgah.nameFa}`}
        notes={dastgah.scaleNotes}
        defaultOctave={4}
      />

      {/* Gusheh Tree & Structure */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              گوشه‌ها و سیر تحول ملودیک ردیف
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              ترتیب گوشه‌ها از درآمد تا اوج و فرود؛ روی هر گوشه کلیک کنید تا نغمات و جزئیات آن را بشنوید
            </p>
          </div>
          <span className="text-xs text-stone-500">
            {dastgah.gushehs.length} گوشه ثبت‌شده
          </span>
        </div>

        <div className="space-y-3">
          {dastgah.gushehs.map((gusheh) => {
            const isExpanded = expandedGushehId === gusheh.id;
            const isPlaying = playingGushehId === gusheh.id;

            return (
              <div
                key={gusheh.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-all shadow-xs"
              >
                {/* Accordion Head */}
                <div
                  onClick={() => setExpandedGushehId(isExpanded ? null : gusheh.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {gusheh.orderIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-stone-900">{gusheh.nameFa}</h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRoleStyle(
                            gusheh.role
                          )}`}
                        >
                          {gusheh.role}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500 block mt-0.5 font-mono">
                        {gusheh.nameEn} · محدوده: {gusheh.melodicRange}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayGushehMelody(gusheh);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        isPlaying
                          ? 'bg-amber-500 text-stone-950 animate-pulse'
                          : 'bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlaying ? 'در حال پخش...' : 'پخش الگو'}</span>
                    </button>

                    <div className="text-stone-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 bg-stone-50/40 space-y-4">
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      {gusheh.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-400 block">نت شاهد (ثقل نغمه)</span>
                        <span className="font-bold text-teal-800">{gusheh.shahedNote}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-400 block">نت ایست (توقف)</span>
                        <span className="font-bold text-sky-800">{gusheh.istNote}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-400 block">ساختار ریتمیک</span>
                        <span className="font-medium text-stone-700">{gusheh.rhythmicType}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-400 block">گستره ملودیک</span>
                        <span className="font-medium text-stone-700">{gusheh.melodicRange}</span>
                      </div>
                    </div>

                    {gusheh.sampleMelodyNotes && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-stone-500">نغمات ملودی نمونه:</span>
                        <div className="flex items-center gap-1">
                          {gusheh.sampleMelodyNotes.map((n, i) => (
                            <span
                              key={i}
                              className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-800"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Lessons & Exercises */}
      {(relatedLessons.length > 0 || relatedExercises.length > 0) && (
        <div className="pt-6 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatedLessons.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>درس‌های مرتبط با {dastgah.nameFa}</span>
              </div>
              <div className="space-y-2">
                {relatedLessons.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onNavigate('lessons', { lessonId: l.id })}
                    className="w-full text-right p-3 rounded-lg border border-stone-100 hover:border-amber-300 hover:bg-amber-50/40 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{l.titleFa}</span>
                      <span className="text-[11px] text-stone-500">{l.subtitleFa}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700">مطالعه</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {relatedExercises.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Mic className="w-4 h-4 text-amber-600" />
                <span>تمرین‌های عملی با میکروفون</span>
              </div>
              <div className="space-y-2">
                {relatedExercises.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onNavigate('exercise', { exerciseId: e.id })}
                    className="w-full text-right p-3 rounded-lg border border-stone-100 hover:border-amber-300 hover:bg-amber-50/40 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{e.titleFa}</span>
                      <span className="text-[11px] text-stone-500">سختی: {e.difficulty}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700">شروع تمرین</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
