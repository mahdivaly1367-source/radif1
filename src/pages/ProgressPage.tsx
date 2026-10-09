import React, { useState } from 'react';
import {
  Award,
  Clock,
  BookOpen,
  RotateCcw,
  Headphones,
  Mic,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { ProgressStorage } from '../services/storage';
import { UserProgress, UserPracticeAttempt } from '../types/music';
import { DASTGAHS } from '../data/dastgahs';
import { LESSONS } from '../data/lessons';
import { EXERCISES } from '../data/exercises';

interface ProgressPageProps {
  onNavigate: (path: string) => void;
}

type HistoryFilter = 'all' | 'ear_training' | 'microphone_pitch';

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState<UserProgress>(() => ProgressStorage.getProgress());
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  const handleReset = () => {
    if (window.confirm('آیا از بازنشانی کامل سوابق و پیشرفت‌های خود اطمینان دارید؟')) {
      ProgressStorage.resetProgress();
      setProgress(ProgressStorage.getProgress());
    }
  };

  const completedCount = progress.completedLessonIds.length;
  const totalLessons = LESSONS.length;
  const allAttempts = progress.practiceAttempts;
  const totalAttemptsCount = allAttempts.length;

  // محاسبه مجموع زمان کل تمرین‌ها (شامل شنیداری و میکروفونی) به دقیقه
  const totalMinutes = Math.round(progress.totalPracticeTimeSeconds / 60);

  // تفکیک بر اساس نوع تمرین: فقط سوابق دارای attemptType معتبر
  const earTrainingAttempts = allAttempts.filter((att) => att.attemptType === 'ear_training');
  const micAttempts = allAttempts.filter((att) => att.attemptType === 'microphone_pitch');
  const legacyAttempts = allAttempts.filter(
    (att) => att.attemptType !== 'ear_training' && att.attemptType !== 'microphone_pitch'
  );

  // میانگین نمرات همه تمرین‌های ثبت‌شده
  const averageScore =
    totalAttemptsCount > 0
      ? Math.round(allAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttemptsCount)
      : null;

  // فیلتر کردن سوابق نمایشی:
  // سوابق قدیمی بدون نوع مشخص فقط در تب «همه» نمایش داده می‌شوند و به اشتباه وارد فیلتر شنیداری یا میکروفونی نمی‌شوند
  const filteredAttempts = allAttempts.filter((att) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'ear_training') return att.attemptType === 'ear_training';
    if (historyFilter === 'microphone_pitch') return att.attemptType === 'microphone_pitch';
    return true;
  });

  // محاسبه پیشرفت واقعی برای هر دستگاه بر مبنای تمرین‌های سپری‌شده همان دستگاه
  const getDastgahCalculatedMastery = (dastgahId: string) => {
    const dastgahExercises = EXERCISES.filter((e) => e.dastgahId === dastgahId);
    if (dastgahExercises.length === 0) return null;

    const dastgahExerciseIds = new Set(dastgahExercises.map((e) => e.id));
    const passedExerciseIds = new Set(
      allAttempts
        .filter((att) => att.passed && dastgahExerciseIds.has(att.exerciseId))
        .map((att) => att.exerciseId)
    );

    if (passedExerciseIds.size === 0) {
      return {
        passedCount: 0,
        totalCount: dastgahExercises.length,
        percentage: 0,
        hasActivity: allAttempts.some((att) => dastgahExerciseIds.has(att.exerciseId)),
      };
    }

    const percentage = Math.round((passedExerciseIds.size / dastgahExercises.length) * 100);
    return {
      passedCount: passedExerciseIds.size,
      totalCount: dastgahExercises.length,
      percentage,
      hasActivity: true,
    };
  };

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
            مشاهده گزارش تحلیلی تمرین‌های شنیداری، انطباق صدا با میکروفون و سنجش دقیق فواصل ردیف موسیقی ایرانی.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی پیشرفت</span>
        </button>
      </div>

      {/* Metrics Row - آمار واقعی و معتبر */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ۱. درس‌های تکمیل‌شده */}
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

        {/* ۲. زمان کل فعالیت‌های تمرینی */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>زمان کل فعالیت‌های تمرینی</span>
          </div>
          <span className="text-2xl font-black text-stone-900 font-mono">
            {totalMinutes} <span className="text-xs font-normal text-stone-400">دقیقه</span>
          </span>
          <p className="text-[10px] text-stone-500 mt-3">
            مجموع زمان آزمون‌های شنیداری و تمرین با میکروفون
          </p>
        </div>

        {/* ۳. میانگین نمرات */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>میانگین امتیاز تمرین‌ها</span>
          </div>
          {averageScore !== null ? (
            <>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {averageScore} <span className="text-xs font-normal text-stone-400">از ۱۰۰</span>
              </span>
              <p className="text-[10px] text-stone-500 mt-3 font-mono">
                {totalAttemptsCount} نوبت ثبت‌شده
              </p>
            </>
          ) : (
            <>
              <span className="text-xs text-stone-400 font-medium block mt-1">
                هنوز داده‌ای ثبت نشده
              </span>
              <p className="text-[10px] text-stone-400 mt-4">پس از اجرای تمرین‌ها محاسبه می‌شود</p>
            </>
          )}
        </div>

        {/* ۴. تفکیک نوبت‌های تمرین شنیداری و میکروفونی */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 text-xs mb-2">
            <div className="flex items-center -space-x-1">
              <Headphones className="w-3.5 h-3.5 text-sky-600 ml-1" />
              <Mic className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span>تعداد تمرین‌های انجام‌شده</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-stone-900 font-mono">
              {totalAttemptsCount}
            </span>
            <span className="text-xs text-stone-400">نوبت</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-600 mt-3 pt-2 border-t border-stone-100 font-mono">
            <span className="flex items-center gap-1 text-sky-700">
              <Headphones className="w-3 h-3" />
              {earTrainingAttempts.length} شنیداری
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1 text-amber-700">
              <Mic className="w-3 h-3" />
              {micAttempts.length} میکروفونی
            </span>
            {legacyAttempts.length > 0 && (
              <>
                <span className="text-stone-300">|</span>
                <span className="flex items-center gap-1 text-stone-500">
                  <HelpCircle className="w-3 h-3" />
                  {legacyAttempts.length} قدیمی
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* بخش اصلی دو ستونه: تاریخچه تفکیک‌شده تمرین‌ها و وضعیت تسلط بر دستگاه‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ستون راست و میانی: تاریخچه تمرین‌ها */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-bold text-base text-stone-900">سوابق و کارنامه تمرین‌ها</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                تفکیک نتایج آزمون‌های تمایز شنیداری و سنجش انحراف سنتی صدا با میکروفون
              </p>
            </div>

            {/* فیلتر نوع تمرین */}
            {allAttempts.length > 0 && (
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs self-start sm:self-auto">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  همه ({allAttempts.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('ear_training')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    historyFilter === 'ear_training'
                      ? 'bg-white text-sky-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-sky-700'
                  }`}
                >
                  <Headphones className="w-3 h-3" />
                  <span>شنیداری ({earTrainingAttempts.length})</span>
                </button>
                <button
                  onClick={() => setHistoryFilter('microphone_pitch')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    historyFilter === 'microphone_pitch'
                      ? 'bg-white text-amber-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-amber-700'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>میکروفونی ({micAttempts.length})</span>
                </button>
              </div>
            )}
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-3">
              <Award className="w-10 h-10 mx-auto opacity-40 text-stone-400" />
              <p className="text-xs text-stone-500">
                {allAttempts.length === 0
                  ? 'هنوز هیچ تمرین صوتی یا شنیداری ثبت نشده است.'
                  : 'هیچ موردی مطابق فیلتر انتخابی یافت نشد.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('/dastgahs/shour')}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  مسیر آموزشی دستگاه شور
                </button>
                <button
                  onClick={() => onNavigate('/exercise')}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  کارگاه تمرین و سنجش
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredAttempts.map((att) => {
                const ex = EXERCISES.find((e) => e.id === att.exerciseId);
                const dateStr = new Date(att.timestamp).toLocaleDateString('fa-IR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                // تعیین وضعیت نوع تمرین
                const isEar = att.attemptType === 'ear_training';
                const isMic = att.attemptType === 'microphone_pitch';
                const isLegacy = !isEar && !isMic;

                // برای سوابق شنیداری معتبر: تعداد پاسخ‌های صحیح در صورت ثبت واقعی
                const hasValidQuizData =
                  isEar &&
                  typeof att.correctAnswers === 'number' &&
                  typeof att.totalQuestions === 'number';

                return (
                  <div
                    key={att.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-stone-50/50 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isEar && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            <Headphones className="w-3 h-3 text-sky-600" />
                            <span>آزمون شنیداری</span>
                          </span>
                        )}
                        {isMic && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Mic className="w-3 h-3 text-amber-600" />
                            <span>تمرین با میکروفون</span>
                          </span>
                        )}
                        {isLegacy && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                            <HelpCircle className="w-3 h-3 text-stone-400" />
                            <span>سابقه قدیمی / نوع نامشخص</span>
                          </span>
                        )}

                        <span className="font-bold text-stone-900 text-sm">
                          {ex?.titleFa || 'تمرین موسیقی ایرانی'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono">
                        <span>{dateStr}</span>
                        {att.durationSeconds > 0 && (
                          <>
                            <span>•</span>
                            <span>مدت: {att.durationSeconds} ثانیه</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      {/* نمایش جزئیات بسته به نوع تمرین */}
                      {isEar && hasValidQuizData ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 text-stone-700 font-mono text-[11px]">
                          <span className="text-stone-400">نتیجه آزمون:</span>
                          <span className="font-bold text-stone-900">
                            {att.correctAnswers} از {att.totalQuestions} صحیح
                          </span>
                        </div>
                      ) : isMic && typeof att.averageCentsDeviation === 'number' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 text-stone-700 font-mono text-[11px]">
                          <span className="text-stone-400">انحراف سنتی:</span>
                          <span className="font-bold text-stone-900">
                            ±{att.averageCentsDeviation}¢
                          </span>
                        </div>
                      ) : null}

                      {/* نشان امتیاز و قبولی */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded text-xs flex items-center gap-1 ${
                            att.passed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {att.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{att.score} / ۱۰۰</span>
                          <span className="text-[10px] font-normal mr-0.5">
                            ({att.passed ? 'قبول' : 'نیاز به تکرار'})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ستون چپ: میزان تسلط بر مبنای تمرین‌های واقعی هر دستگاه */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="font-bold text-base text-stone-900">میزان تسلط بر دستگاه‌ها</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              محاسبه‌شده از روی تمرین‌های موفق ثبت‌شده برای هر دستگاه
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {DASTGAHS.filter((d) => d.type === 'dastgah').map((dastgah) => {
              const stats = getDastgahCalculatedMastery(dastgah.id);
              const hasData = stats !== null && stats.hasActivity;

              return (
                <div key={dastgah.id} className="space-y-1.5 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-800 flex items-center gap-1.5">
                      <span>{dastgah.nameFa}</span>
                      {dastgah.id === 'shour' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                          مسیر فعال
                        </span>
                      )}
                    </span>

                    {hasData && stats ? (
                      <span className="font-mono text-stone-700 text-[11px] font-bold">
                        {stats.percentage}%{' '}
                        <span className="text-stone-400 font-normal text-[10px]">
                          ({stats.passedCount}/{stats.totalCount} تمرین)
                        </span>
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px] italic">
                        هنوز داده‌ای ثبت نشده
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        hasData && stats && stats.percentage > 0
                          ? 'bg-amber-500'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${stats ? stats.percentage : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* راهنمای کوتاه در پایین کارت */}
          <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
            <p className="flex items-center gap-1 text-stone-600 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>نحوه محاسبه درصد تسلط:</span>
            </p>
            <p className="text-stone-500 leading-relaxed text-[10px]">
              درصد تسلط هر دستگاه مستقیماً از نسبت تمرین‌های گذرانده‌شده (با نمره قبولی) به کل تمرین‌های تعریف‌شده همان دستگاه به‌دست می‌آید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

