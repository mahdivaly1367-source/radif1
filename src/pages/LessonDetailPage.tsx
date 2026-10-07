/**
 * صفحه جزئیات درس آموزشی با الگوی استاندارد ردیف:
 * «ببین → بشنو → امتحان کن → تمرین کن»
 * شامل هدف یادگیری، پلیر صوتی پیشرفته، کنترل سرعت، بخش «در این درس چه یاد می‌گیرید؟»
 * و پیوند مستقیم به تمرین‌های ارزیابی صوتی
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  Volume2,
  Mic,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Award,
  Sparkles,
  Info,
  Check,
  Headphones,
  Sliders,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { Lesson } from '../types/music';
import { LESSONS } from '../data/lessons';
import { persianSynth } from '../services/audio/synthPlayer';
import { ProgressStorage } from '../services/storage';

interface LessonDetailPageProps {
  lesson: Lesson;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({
  lesson,
  onBack,
  onNavigate,
}) => {
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [cancelPlayFn, setCancelPlayFn] = useState<(() => void) | null>(null);

  const [isCompleted, setIsCompleted] = useState(() => {
    return ProgressStorage.getProgress().completedLessonIds.includes(lesson.id);
  });

  const currentIndex = LESSONS.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? LESSONS[currentIndex - 1] : null;

  // پاکسازی صوتی هنگام تعویض درس
  useEffect(() => {
    return () => {
      if (cancelPlayFn) {
        cancelPlayFn();
      }
    };
  }, [cancelPlayFn]);

  // پخش دنباله صوتی درس
  const handlePlaySequence = async () => {
    if (cancelPlayFn) {
      cancelPlayFn();
      setCancelPlayFn(null);
    }

    if (isPlayingSeq) {
      setIsPlayingSeq(false);
      setActiveNoteIndex(null);
      return;
    }

    setIsPlayingSeq(true);

    const notes = lesson.audioGuide.notesSequence.map((n) => ({
      ...n,
      frequency: n.note === 'لا کُرُن' ? 426.2 : undefined, // اعمال فرکانس دقیق مدال شور
    }));

    const cancel = await persianSynth.playMelody(
      notes,
      (idx) => setActiveNoteIndex(idx),
      () => {
        setIsPlayingSeq(false);
        setActiveNoteIndex(null);
        setCancelPlayFn(null);
      },
      playbackSpeed
    );

    setCancelPlayFn(() => cancel);
  };

  // پخش یک نت منفرد با کلیک
  const handlePlaySingleNote = async (noteName: string, index: number) => {
    setActiveNoteIndex(index);
    if (noteName === 'لا کُرُن') {
      await persianSynth.playFrequency(426.2, 1.4);
    } else {
      await persianSynth.playNoteByName(noteName, 4, 1.4);
    }
    setTimeout(() => {
      setActiveNoteIndex(null);
    }, 800);
  };

  const handleComplete = () => {
    ProgressStorage.markLessonCompleted(lesson.id);
    setIsCompleted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28 text-stone-900">
      {/* ناوبری بالا */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست درس‌ها</span>
        </button>

        <div className="flex items-center gap-2">
          {prevLesson && (
            <button
              onClick={() => onNavigate(`/lessons/${prevLesson.id}`)}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors text-xs flex items-center gap-1"
              title={prevLesson.titleFa}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">درس قبلی</span>
            </button>
          )}
          {nextLesson && (
            <button
              onClick={() => onNavigate(`/lessons/${nextLesson.id}`)}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors text-xs flex items-center gap-1"
              title={nextLesson.titleFa}
            >
              <span className="hidden sm:inline">درس بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* کارت سربرگ درس */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold px-2.5 py-0.5 rounded-full bg-stone-900 text-amber-400">
            درس شماره {lesson.order}
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-stone-600 font-medium">سطح {lesson.level}</span>
          <span className="text-stone-300">·</span>
          <span className="font-mono text-stone-500">{lesson.estimatedMinutes} دقیقه مطالعه و تمرین</span>
          {lesson.prerequisite && (
            <>
              <span className="text-stone-300">·</span>
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                پیش‌نیاز: {lesson.prerequisite}
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
          {lesson.titleFa}
        </h1>

        <p className="text-sm font-semibold text-amber-800">
          {lesson.subtitleFa}
        </p>

        {lesson.learningObjective && (
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start gap-2.5 text-xs text-stone-700">
            <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-900">هدف آموزشی این درس: </span>
              <span>{lesson.learningObjective}</span>
            </div>
          </div>
        )}

        <p className="text-sm text-stone-700 leading-relaxed pt-2 border-t border-stone-100 text-justify">
          {lesson.introduction}
        </p>
      </div>

      {/* بخش اجباری ۱: «در این درس چه یاد می‌گیرید؟» */}
      <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>در این درس چه یاد می‌گیرید؟</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-950">
          {(lesson.whatYouWillLearn || [
            'شناخت ساختار نغمات و فواصل این درس',
            'شنیدن دقیق الگوی ملودی با سنتور ایرانی',
            'تمرین عملی و انطباق فرکانس با میکروفون',
          ]).map((item, idx) => (
            <div key={idx} className="bg-white/80 p-3 rounded-xl border border-amber-200/60 flex items-start gap-2 shadow-xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ساختار ۴ مرحله‌ای آموزشی: ببین → بشنو → امتحان کن → تمرین کن */}

      {/* ۱. ببین (مفاهیم و کلیدواژه‌های اصلی ردیف) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            ۱
          </span>
          <h2 className="text-lg font-bold text-stone-900">ببین: مفاهیم و کلیدواژه‌های نظری</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lesson.keyConcepts.map((concept, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-stone-200 p-5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="font-bold text-sm text-stone-900">{concept.title}</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed text-justify">{concept.explanation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ۲. بشنو (تحلیل فواصل و شبیه‌ساز صوتی تعاملی) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            ۲
          </span>
          <h2 className="text-lg font-bold text-stone-900">بشنو: تحلیل فواصل و الگوی صوتی ساز</h2>
        </div>

        {/* جعبه فواصل */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
          <h3 className="font-bold text-sm text-stone-900">
            {lesson.scaleAnalysis.title}
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed">
            {lesson.scaleAnalysis.notesDescription}
          </p>
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 font-mono text-xs text-amber-900 font-bold">
            گردش فواصل: {lesson.scaleAnalysis.intervals}
          </div>
        </div>

        {/* پلیر صوتی پیشرفته */}
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
                شبیه‌ساز صوتی سنتور سنتی
              </span>
              <h4 className="font-bold text-sm text-white">{lesson.audioGuide.description}</h4>
            </div>

            {/* کنترل سرعت */}
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg text-xs self-start sm:self-auto">
              <span className="text-[10px] text-stone-400 px-1">سرعت:</span>
              {[0.75, 1.0, 1.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-mono font-bold ${
                    playbackSpeed === spd
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* کارت نغمات توالی جهت پخش */}
          <div className="flex flex-wrap items-center gap-2">
            {lesson.audioGuide.notesSequence.map((item, idx) => {
              const isCurrent = activeNoteIndex === idx;
              const isKoron = item.note.includes('کُرُن');

              return (
                <button
                  key={idx}
                  onClick={() => handlePlaySingleNote(item.note, idx)}
                  className={`p-3 rounded-xl border text-center transition-all min-w-[70px] ${
                    isCurrent
                      ? 'bg-amber-400 border-amber-300 text-stone-950 scale-105 shadow-md font-bold'
                      : 'bg-stone-800 border-stone-700 text-white hover:border-amber-400/60'
                  }`}
                  title="کلیک برای شنیدن این نت"
                >
                  <span className="text-xs font-black block">{item.note}</span>
                  <span className="text-[10px] text-stone-400 font-mono block mt-1">
                    {item.duration} ثانیه
                  </span>
                  {isKoron && (
                    <span className="text-[9px] text-amber-300 font-bold block mt-0.5">
                      مجنب 𝄳
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* دکمه‌های اجرای فراز */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-800">
            <button
              onClick={handlePlaySequence}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isPlayingSeq
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
              }`}
            >
              {isPlayingSeq ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlayingSeq ? 'توقف پخش ملودی' : 'پخش کامل الگوی ملودی'}</span>
            </button>

            <span className="text-[11px] text-stone-400">
              * روی هر نت کلیک کنید تا فرکانس مستقل آن را بشنوید
            </span>
          </div>
        </div>
      </section>

      {/* ۳. امتحان کن (نکات مهم اجرایی و حنجره) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            ۳
          </span>
          <h2 className="text-lg font-bold text-stone-900">امتحان کن: نکات اجرایی و تمرکز ذهنی</h2>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
          <ul className="space-y-2.5 text-xs text-stone-700">
            {lesson.performanceTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ۴. تمرین کن (بخش اجباری: «حالا امتحان کنید») */}
      <section className="bg-gradient-to-l from-amber-500 to-amber-400 text-stone-950 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-stone-950 text-amber-400 flex items-center justify-center font-bold text-xs">
            ۴
          </span>
          <span className="text-xs font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded">
            تمرین کن: حالا امتحان کنید
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black">
              {lesson.tryItNowPrompt?.title || 'آماده آزمون عملی این درس با میکروفون هستید؟'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-900/80 max-w-xl">
              {lesson.tryItNowPrompt?.description || 'وارد کارگاه ارزیابی حنجره شوید و میزان تسلط خود بر فواصل این درس را بسنجید.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate(`/exercise/${lesson.associatedExerciseId}`)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 text-xs sm:text-sm font-bold transition-all shadow-md shrink-0 active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>{lesson.tryItNowPrompt?.actionLabel || 'ورود به تمرین با میکروفون'}</span>
          </button>
        </div>
      </section>

      {/* دکمه تکمیل درس و پانویس منبع */}
      <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleComplete}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-colors ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCompleted ? 'این درس به عنوان تکمیل‌شده علامت خورد' : 'علامت‌گذاری این درس به عنوان تکمیل‌شده'}</span>
        </button>

        {lesson.sourceAttribution && (
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>منبع: {lesson.sourceAttribution.sourceName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
