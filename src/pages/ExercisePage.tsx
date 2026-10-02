import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle2, RotateCcw, Award, Volume2, ArrowLeft, ArrowRight, Play, Sparkles, BookOpen } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import { Exercise, ExerciseTargetNote } from '../types/music';
import { PersianTuner } from '../components/PersianTuner';
import { ProgressStorage } from '../services/storage';
import { PageRoute } from '../components/Navbar';
import { persianSynth } from '../services/audio/synthPlayer';

interface ExercisePageProps {
  initialExerciseId?: string | null;
  onNavigate: (path: string) => void;
}

export const ExercisePage: React.FC<ExercisePageProps> = ({
  initialExerciseId = null,
  onNavigate,
}) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    initialExerciseId || EXERCISES[0].id
  );
  const [mode, setMode] = useState<'exercise' | 'free_tuner'>('exercise');
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [exerciseResult, setExerciseResult] = useState<{
    score: number;
    passed: boolean;
    averageCents: number;
  } | null>(null);

  const currentExercise = EXERCISES.find((e) => e.id === selectedExerciseId) || EXERCISES[0];
  const targetNote: ExerciseTargetNote | null =
    mode === 'exercise' ? currentExercise.targetNotes[currentNoteIndex] || null : null;

  useEffect(() => {
    if (initialExerciseId) {
      setSelectedExerciseId(initialExerciseId);
      setMode('exercise');
      setCurrentNoteIndex(0);
      setExerciseResult(null);
    }
  }, [initialExerciseId]);

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setMode('exercise');
    setCurrentNoteIndex(0);
    setExerciseResult(null);
  };

  const handleMatchSuccess = (score: number, avgCents: number) => {
    // اگر هنوز نتهای دیگری در تمرین هست، به نت بعدی برو
    if (currentNoteIndex < currentExercise.targetNotes.length - 1) {
      setCurrentNoteIndex((prev) => prev + 1);
    } else {
      // تمرین به پایان رسید
      const passed = score >= currentExercise.passingScore;
      setExerciseResult({ score, passed, averageCents: avgCents });

      // ذخیره نتیجه در تاریخچه پیشرفت
      ProgressStorage.recordPracticeAttempt({
        exerciseId: currentExercise.id,
        score,
        averageCentsDeviation: avgCents,
        durationSeconds: 30,
        passed,
      });
    }
  };

  const handleRestartExercise = () => {
    setCurrentNoteIndex(0);
    setExerciseResult(null);
  };

  const playEntireExerciseMelody = async () => {
    const seq = currentExercise.targetNotes.map((n) => ({
      note: n.noteFa.split(' ')[0],
      duration: 1.2,
    }));
    await persianSynth.playMelody(seq);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-28">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
            کارگاه عملی آکوستیک
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            کارگاه تمرین صوتی و تحلیل زنده گام
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            صدای خود را از طریق میکروفون وارد کنید. سامانه با استفاده از وب‌آدیو و فواصل ربع‌پرده‌ای، فرکانس صدای شما را سنجیده و انحراف سنت را لحظه‌به‌لحظه نمایش می‌دهد.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg shrink-0">
          <button
            onClick={() => setMode('exercise')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'exercise'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            تمرین‌های مرحله‌ای
          </button>
          <button
            onClick={() => {
              setMode('free_tuner');
              setExerciseResult(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'free_tuner'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            تیونر آزاد سنتی
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Tuner & Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <PersianTuner
            targetNote={targetNote}
            onMatchSuccess={handleMatchSuccess}
            showCanvasGraph={true}
          />

          {/* Exercise Completion Result Card */}
          {exerciseResult && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      exerciseResult.passed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900">
                      {exerciseResult.passed ? 'تمرین با موفقیت انجام شد!' : 'نیاز به تمرین بیشتر'}
                    </h3>
                    <span className="text-xs text-stone-500">
                      نتیجه در سوابق کارنامه شما ثبت گردید
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRestartExercise}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تکرار مجدد تمرین</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
                <div>
                  <span className="text-xs text-stone-500 block">امتیاز کسب‌شده</span>
                  <span className="text-2xl font-black text-amber-600 font-mono">
                    {exerciseResult.score} / ۱۰۰
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">میانگین خطای فرکانسی</span>
                  <span className="text-2xl font-black text-stone-800 font-mono">
                    ±{exerciseResult.averageCents} سنت
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current Target Notes Stepper (when in exercise mode) */}
          {mode === 'exercise' && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900">
                  توالی نغمات این تمرین (پله {currentNoteIndex + 1} از {currentExercise.targetNotes.length})
                </h3>
                <button
                  onClick={playEntireExerciseMelody}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>پخش کل الگو با سنتور</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currentExercise.targetNotes.map((note, idx) => {
                  const isCurrent = idx === currentNoteIndex;
                  const isPassed = idx < currentNoteIndex;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-50 border-amber-500 shadow-sm'
                          : isPassed
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-stone-50 border-stone-200 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                        <span>پله {idx + 1}</span>
                        {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className="font-bold text-sm text-stone-900 block">
                        {note.noteFa}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500">
                        {Math.round(note.frequencyHz)} Hz
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Exercise Selection & Instructions */}
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>راهنمای اجرای صحیح</span>
            </h3>
            <ul className="space-y-2 text-xs text-stone-600 leading-relaxed list-disc list-inside">
              {currentExercise.instructionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
              <li>در محیطی با نویز کم تمرین کنید و از هدفون استفاده نمایید تا صدای بلندگو دوباره وارد میکروفون نشود.</li>
            </ul>
          </div>

          {/* Exercise List */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900">فهرست تمرین‌های استاندارد</h3>
              <span className="text-xs text-stone-400">{EXERCISES.length} تمرین</span>
            </div>

            <div className="space-y-2.5">
              {EXERCISES.map((ex) => {
                const isSelected = selectedExerciseId === ex.id && mode === 'exercise';

                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex.id)}
                    className={`w-full text-right p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                        : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-stone-900 block truncate">
                        {ex.titleFa}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                          ex.difficulty === 'ساده'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ex.difficulty === 'متوسط'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ex.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {ex.descriptionFa}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
