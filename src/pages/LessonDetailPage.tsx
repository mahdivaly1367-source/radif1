import React, { useState } from 'react';
import { ArrowRight, BookOpen, Volume2, Mic, CheckCircle2, ChevronLeft, ChevronRight, Play, Square, Award } from 'lucide-react';
import { Lesson } from '../types/music';
import { LESSONS } from '../data/lessons';
import { PageRoute } from '../components/Navbar';
import { persianSynth } from '../services/audio/synthPlayer';
import { ProgressStorage } from '../services/storage';

interface LessonDetailPageProps {
  lesson: Lesson;
  onBack: () => void;
  onNavigate: (page: PageRoute, params?: { lessonId?: string; exerciseId?: string; dastgahId?: string }) => void;
}

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({
  lesson,
  onBack,
  onNavigate,
}) => {
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(() => {
    return ProgressStorage.getProgress().completedLessonIds.includes(lesson.id);
  });

  const currentIndex = LESSONS.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? LESSONS[currentIndex - 1] : null;

  const handlePlaySequence = async () => {
    if (isPlayingSeq) return;
    setIsPlayingSeq(true);

    const notes = lesson.audioGuide.notesSequence;
    await persianSynth.playMelody(
      notes,
      (idx) => setActiveNoteIndex(idx),
      () => {
        setIsPlayingSeq(false);
        setActiveNoteIndex(null);
      }
    );
  };

  const handleComplete = () => {
    ProgressStorage.markLessonCompleted(lesson.id);
    setIsCompleted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
      {/* Top Bar Navigation */}
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
              onClick={() => onNavigate('lessons', { lessonId: prevLesson.id })}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors text-xs flex items-center gap-1"
              title={prevLesson.titleFa}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">درس قبلی</span>
            </button>
          )}
          {nextLesson && (
            <button
              onClick={() => onNavigate('lessons', { lessonId: nextLesson.id })}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors text-xs flex items-center gap-1"
              title={nextLesson.titleFa}
            >
              <span className="hidden sm:inline">درس بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold px-2.5 py-0.5 rounded-full bg-stone-900 text-amber-400">
            درس شماره {lesson.order}
          </span>
          <span className="text-stone-400">·</span>
          <span className="text-stone-600">سطح {lesson.level}</span>
          <span className="text-stone-400">·</span>
          <span className="font-mono text-stone-500">{lesson.estimatedMinutes} دقیقه مطالعه و تمرین</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          {lesson.titleFa}
        </h1>

        <p className="text-sm font-semibold text-amber-800">
          {lesson.subtitleFa}
        </p>

        <p className="text-sm text-stone-700 leading-relaxed pt-2 border-t border-stone-100">
          {lesson.introduction}
        </p>
      </div>

      {/* Key Concepts */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900">مفاهیم و کلیدواژه‌های اصلی ردیف</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lesson.keyConcepts.map((concept, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-stone-200 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="font-bold text-sm text-stone-900">{concept.title}</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{concept.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scale & Intervals Analysis */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
        <h3 className="font-bold text-base text-stone-900">
          {lesson.scaleAnalysis.title}
        </h3>
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
          {lesson.scaleAnalysis.notesDescription}
        </p>
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 font-mono text-xs text-amber-900 font-bold">
          گردش فواصل: {lesson.scaleAnalysis.intervals}
        </div>
      </div>

      {/* Interactive Audio Synthesizer Guide */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-7 space-y-5 border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Volume2 className="w-5 h-5" />
              <span>راهنمای صوتی و ملودیک درس (سنتور ایرانی)</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {lesson.audioGuide.description}
            </p>
          </div>

          <button
            onClick={handlePlaySequence}
            disabled={isPlayingSeq}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isPlayingSeq
                ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-300 text-stone-950 active:scale-95 shadow-md'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlayingSeq ? 'در حال نواختن نتها...' : 'پخش توالی نغمات'}</span>
          </button>
        </div>

        {/* Note Sequence Visualizer */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {lesson.audioGuide.notesSequence.map((item, idx) => {
            const isActive = activeNoteIndex === idx;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 border-amber-300 scale-110 shadow-lg font-bold'
                    : 'bg-stone-800/80 text-stone-300 border-stone-700'
                }`}
              >
                <span className="text-sm font-black">{item.note}</span>
                <span className="text-[10px] opacity-75 font-mono">{item.duration}s</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance & Vocal Tips */}
      <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-5 sm:p-6 space-y-3">
        <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-700" />
          <span>توصیه‌های اجرایی و خوانش نغمه</span>
        </h3>
        <ul className="space-y-2 text-xs text-amber-900 leading-relaxed list-disc list-inside">
          {lesson.performanceTips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Bottom Actions: Completion and Exercise Link */}
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
          <span>{isCompleted ? 'درس به عنوان تکمیل‌شده علامت خورد' : 'علامت‌گذاری به عنوان تکمیل‌شده'}</span>
        </button>

        <button
          onClick={() => onNavigate('exercise', { exerciseId: lesson.associatedExerciseId })}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-sm active:scale-95"
        >
          <Mic className="w-4 h-4" />
          <span>ورود به تمرین صوتی این درس</span>
        </button>
      </div>
    </div>
  );
};
