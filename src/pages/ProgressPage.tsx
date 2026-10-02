import React, { useState } from 'react';
import { Award, Clock, BookOpen, Layers, CheckCircle2, RotateCcw, TrendingUp } from 'lucide-react';
import { ProgressStorage } from '../services/storage';
import { UserProgress } from '../types/music';
import { DASTGAHS } from '../data/dastgahs';
import { LESSONS } from '../data/lessons';
import { EXERCISES } from '../data/exercises';
import { PageRoute } from '../components/Navbar';

interface ProgressPageProps {
  onNavigate: (page: PageRoute, params?: { lessonId?: string; exerciseId?: string }) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState<UserProgress>(() => ProgressStorage.getProgress());

  const handleReset = () => {
    if (window.confirm('آیا از بازنشانی کامل سوابق و پیشرفت‌های خود اطمینان دارید؟')) {
      ProgressStorage.resetProgress();
      setProgress(ProgressStorage.getProgress());
    }
  };

  const completedCount = progress.completedLessonIds.length;
  const totalLessons = LESSONS.length;
  const practiceAttemptsCount = progress.practiceAttempts.length;
  const totalMinutes = Math.round(progress.totalPracticeTimeSeconds / 60);

  // میانگین نمرات تمرین
  const averageScore =
    practiceAttemptsCount > 0
      ? Math.round(
          progress.practiceAttempts.reduce((acc, curr) => acc + curr.score, 0) / practiceAttemptsCount
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
            کارنامه یادگیری و سنجش
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            سوابق تمرین و پیشرفت من
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            مشاهده روند رشد گوش موسیقی، درصد انطباق صدا با نتهای ربع‌پرده‌ای و درس‌های گذرانده‌شده در ردیف.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors text-xs font-semibold self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی پیشرفت</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>درس‌های تکمیل‌شده</span>
          </div>
          <span className="text-2xl font-black text-stone-900 font-mono">
            {completedCount} <span className="text-xs font-normal text-stone-400">از {totalLessons}</span>
          </span>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round((completedCount / totalLessons) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>کل زمان تمرین صوتی</span>
          </div>
          <span className="text-2xl font-black text-stone-900 font-mono">
            {totalMinutes} <span className="text-xs font-normal text-stone-400">دقیقه</span>
          </span>
          <p className="text-[10px] text-stone-400 mt-3">تمرین پیوسته با میکروفون</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>میانگین امتیاز تمرین‌ها</span>
          </div>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {averageScore} <span className="text-xs font-normal text-stone-400">از ۱۰۰</span>
          </span>
          <p className="text-[10px] text-stone-400 mt-3">{practiceAttemptsCount} نوبت ثبت‌شده</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>سطح تسلط فعلی</span>
          </div>
          <span className="text-2xl font-black text-stone-900">
            {completedCount > 3 ? 'متوسط' : 'نوآموز'}
          </span>
          <p className="text-[10px] text-stone-400 mt-3">بر اساس ردیف میرزا عبدالله</p>
        </div>
      </div>

      {/* Two columns: Practice History & Dastgah Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Practice History */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h2 className="font-bold text-base text-stone-900">سوابق تمرین‌های صوتی ثبت‌شده</h2>

          {progress.practiceAttempts.length === 0 ? (
            <div className="text-center py-10 text-stone-400 space-y-2">
              <Award className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs">هنوز هیچ تمرین صوتی انجام نداده‌اید.</p>
              <button
                onClick={() => onNavigate('exercise')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 underline"
              >
                رفتن به کارگاه تمرین و سنجش صدا
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {progress.practiceAttempts.map((att) => {
                const ex = EXERCISES.find((e) => e.id === att.exerciseId);
                const dateStr = new Date(att.timestamp).toLocaleDateString('fa-IR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 block">
                        {ex?.titleFa || 'تمرین موسیقی ایرانی'}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-stone-500 font-mono">
                        خطا: ±{att.averageCentsDeviation}¢
                      </span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          att.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.score} / ۱۰۰
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dastgah Progress Breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h2 className="font-bold text-base text-stone-900">تسلط بر دستگاه‌های اصلی</h2>
          <div className="space-y-3">
            {DASTGAHS.filter((d) => d.type === 'dastgah').map((dastgah) => {
              const mastery = progress.dastgahMastery[dastgah.id] || 0;
              return (
                <div key={dastgah.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-800">{dastgah.nameFa}</span>
                    <span className="font-mono text-stone-500 text-[11px]">{mastery}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
