import React, { useState } from 'react';
import { BookOpen, Clock, ArrowLeft, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import { LESSONS, getLessonLocalNumber } from '../data/lessons';
import { PageRoute } from '../components/Navbar';
import { ProgressStorage } from '../services/storage';

interface LessonsPageProps {
  onNavigate: (path: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ onNavigate, onSelectLesson }) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'مقدماتی' | 'متوسط' | 'پیشرفته'>('all');
  const userProgress = ProgressStorage.getProgress();

  const filteredLessons = LESSONS.filter((l) => {
    if (levelFilter === 'all') return true;
    return l.level === levelFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-28">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
          سلسله درس‌های گام‌به‌گام
        </span>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          درس‌های جامع ردیف و تئوری موسیقی ایرانی
        </h1>
        <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
          از مفاهیم فواصل و ربع‌پرده‌ها تا گوشه‌های عمیق شور، ماهور، سه‌گاه و همایون. هر درس شامل توضیحات مدال، راهنمای صوتی سنتور و تمرین عملی سنجش صداست.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-fit">
        <button
          onClick={() => setLevelFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            levelFilter === 'all'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-950'
          }`}
        >
          همه درس‌ها ({LESSONS.length})
        </button>
        <button
          onClick={() => setLevelFilter('مقدماتی')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            levelFilter === 'مقدماتی'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-950'
          }`}
        >
          مقدماتی
        </button>
        <button
          onClick={() => setLevelFilter('متوسط')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            levelFilter === 'متوسط'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-950'
          }`}
        >
          متوسط
        </button>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {filteredLessons.map((lesson) => {
          const isCompleted = userProgress.completedLessonIds.includes(lesson.id);

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className="group bg-white rounded-xl border border-stone-200 hover:border-amber-400/80 p-5 sm:p-6 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-700 border border-stone-200 group-hover:bg-amber-100 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    getLessonLocalNumber(lesson)
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-base sm:text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                      {lesson.titleFa}
                    </h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                      سطح {lesson.level}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        تکمیل شده
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-800 font-medium">{lesson.subtitleFa}</p>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-3xl line-clamp-2 pt-1">
                    {lesson.introduction}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lesson.estimatedMinutes} دقیقه</span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-[-2px] transition-transform">
                  <span>مطالعه درس</span>
                  <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
