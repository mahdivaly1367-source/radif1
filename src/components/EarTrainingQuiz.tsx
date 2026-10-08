/**
 * کامپوننت کارگاه آزمون شنیداری و تربیت شنوایی موسیقی ایرانی (Ear Training Quiz)
 * 
 * روند ۳ مرحله‌ای استاندارد:
 * مرحله ۱: 🎧 الگوی صوتی را گوش کنید (با امکان پخش مجدد پیش از پاسخ)
 * مرحله ۲: یکی از گزینه‌ها را انتخاب کنید (تولید شده بر اساس داده واقعی تمرین با تصادفی‌سازی منطقی گزینه‌ها)
 * مرحله ۳: نتیجه را ببینید (نمایش پاسخ صحیح، پاسخ کاربر، درست/غلط و امتیاز)
 * 
 * بدون فعال‌سازی میکروفون، با محاسبه دقیق امتیاز (5/5 = 100, 4/5 = 80, ...) و ذخیره در ProgressStorage
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Headphones,
  Check,
  X,
  ArrowLeft,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Exercise } from '../types/music';
import { persianSynth } from '../services/audio/synthPlayer';
import { ProgressStorage } from '../services/storage';

export interface QuizQuestion {
  id: string;
  prompt: string;
  audioItems: { note: string; frequency?: number; duration: number }[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface EarTrainingQuizProps {
  exercise: Exercise;
  onComplete?: (score: number, passed: boolean) => void;
  onNavigateLesson?: () => void;
}

/**
 * تابع کمکی برای درهم‌آمیزی تصادفی گزینه‌ها با ردیابی دقیق اندیس پاسخ صحیح
 */
function shuffleOptions(
  correctOption: string,
  wrongOptions: string[]
): { options: string[]; correctIndex: number } {
  const all = [correctOption, ...wrongOptions];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const correctIndex = all.indexOf(correctOption);
  return { options: all, correctIndex };
}

export const EarTrainingQuiz: React.FC<EarTrainingQuizProps> = ({
  exercise,
  onComplete,
  onNavigateLesson,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const cancelPlaybackRef = useRef<(() => void) | null>(null);

  // تولید ۵ سؤال ساختاریافته بر اساس محتوای تمرین
  useEffect(() => {
    const generated = buildQuestionsForExercise(exercise);
    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectAnswersCount(0);
    setIsQuizFinished(false);
  }, [exercise.id]);

  // پاکسازی صدا هنگام خروج یا تغییر سؤال
  useEffect(() => {
    return () => {
      if (cancelPlaybackRef.current) {
        cancelPlaybackRef.current();
      }
    };
  }, [currentQuestionIndex]);

  const currentQ = questions[currentQuestionIndex];

  // پخش صدای سؤال فعلی با سنتور با حفظ فرکانس و اکتاو دقیق
  const playQuestionAudio = async () => {
    if (!currentQ) return;
    if (cancelPlaybackRef.current) {
      cancelPlaybackRef.current();
    }

    setIsPlayingAudio(true);

    const cancel = await persianSynth.playMelody(
      currentQ.audioItems,
      undefined,
      () => {
        setIsPlayingAudio(false);
      },
      1.0
    );

    cancelPlaybackRef.current = cancel;
  };

  // پخش خودکار صدای سؤال هنگام ورود به هر سؤال
  useEffect(() => {
    if (currentQ && !isQuizFinished) {
      const timer = setTimeout(() => {
        playQuestionAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, questions]);

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
    setIsAnswerSubmitted(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // پایان کوییز و محاسبه امتیاز نهایی: 5/5 = 100, 4/5 = 80, ...
      const finalCorrect = correctAnswersCount;
      const total = questions.length;
      const score = Math.round((finalCorrect / total) * 100);
      const passed = score >= exercise.passingScore;
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      setIsQuizFinished(true);

      // ثبت نتیجه در سوابق تمرین
      ProgressStorage.recordPracticeAttempt({
        exerciseId: exercise.id,
        score,
        averageCentsDeviation: 0,
        durationSeconds,
        passed,
        attemptType: 'ear_training',
        correctAnswers: finalCorrect,
        totalQuestions: total,
      });

      if (onComplete) {
        onComplete(score, passed);
      }
    }
  };

  const handleRestart = () => {
    const generated = buildQuestionsForExercise(exercise);
    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectAnswersCount(0);
    setIsQuizFinished(false);
  };

  if (!currentQ && !isQuizFinished) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
        در حال آماده‌سازی سؤالات شنیداری...
      </div>
    );
  }

  // نمایش کارنامه پایان کوییز
  if (isQuizFinished) {
    const finalScore = Math.round((correctAnswersCount / questions.length) * 100);
    const passed = finalScore >= exercise.passingScore;

    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in text-stone-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-400 block mb-0.5">کارنامه آزمون شنیداری (Ear Training)</span>
              <h2 className="text-xl font-black text-stone-900">
                {passed ? 'آفرین! گوش شما با موفقیت فواصل را تشخیص داد' : 'نیاز به تمرکز و تکرار شنیداری بیشتر'}
              </h2>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
              passed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {passed ? '✓ قبول شدید (بالاتر از حد نصاب)' : '! نمره زیر حد نصاب قبولی'}
          </span>
        </div>

        {/* جعبه آمار عملکرد */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <span className="text-[11px] text-stone-500 block mb-1">امتیاز نهایی</span>
            <span className="font-mono text-3xl font-black text-amber-600">{finalScore}٪</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <span className="text-[11px] text-stone-500 block mb-1">پاسخ‌های صحیح</span>
            <span className="font-mono text-3xl font-black text-stone-900">
              {correctAnswersCount} <span className="text-sm font-normal text-stone-400">از {questions.length}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-stone-500 block mb-1">حد نصاب قبولی</span>
            <span className="font-mono text-3xl font-black text-stone-700">
              {exercise.passingScore}٪
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed text-justify">
          {passed
            ? 'گوش موسیقایی شما فواصل ربع‌پرده‌ای و هویت صوتی دستگاه را به درستی تفکیک کرد. نتیجه در پرونده پیشرفت شما ذخیره شد.'
            : 'برای کالیبره کردن بهتر گوش، پیشنهاد می‌شود نمونه‌های صوتی درس را مجدداً گوش دهید و سپس این آزمون را تکرار فرمایید.'}
        </p>

        {/* دکمه‌های اقدام */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تکرار مجدد آزمون شنیداری</span>
          </button>

          {onNavigateLesson && (
            <button
              onClick={onNavigateLesson}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all shadow-xs"
            >
              <span>بازگشت به درس آموزشی</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // محاسبه امتیاز تا این لحظه
  const answeredCountSoFar = isAnswerSubmitted ? currentQuestionIndex + 1 : currentQuestionIndex;
  const currentScorePercent =
    answeredCountSoFar > 0
      ? Math.round((correctAnswersCount / (currentQuestionIndex + (isAnswerSubmitted ? 1 : 0))) * 100)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs text-stone-900">
      {/* سربرگ پیشرفت کوییز شنیداری */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
            {currentQuestionIndex + 1}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                تمرین شنیداری (بدون میکروفون)
              </span>
              <span className="text-xs font-bold text-stone-900">
                سؤال {currentQuestionIndex + 1} از {questions.length}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              تربیت شنوایی: بشنو ➔ پاسخ بده ➔ نتیجه را ببین
            </span>
          </div>
        </div>

        {/* نشانگر درصد پیشرفت و پاسخ‌های صحیح تا کنون */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-stone-600 bg-stone-100 px-2 py-1 rounded">
            صحیح: {correctAnswersCount} از {questions.length}
          </span>
          <div className="w-24 bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          مرحله ۱: 🎧 الگوی صوتی را گوش کنید
         ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black text-[11px]">
            ۱
          </span>
          <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
            <Headphones className="w-4 h-4 text-amber-600" />
            <span>مرحله ۱: الگوی صوتی را گوش کنید</span>
          </h4>
        </div>

        <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-3 text-right">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                isPlayingAudio ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-800 text-stone-300'
              }`}
            >
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">
                {isPlayingAudio ? 'در حال پخش الگوی صوتی...' : 'الگوی صوتی آماده شنیدن است'}
              </span>
              <p className="text-xs text-stone-400 mt-0.5">
                {currentQ.prompt}
              </p>
            </div>
          </div>

          <button
            onClick={playQuestionAudio}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
              isPlayingAudio
                ? 'bg-amber-400 text-stone-950'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700'
            }`}
            title="پخش مجدد صدای این سؤال"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPlayingAudio ? 'در حال پخش...' : 'پخش مجدد الگو'}</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          مرحله ۲: یکی از گزینه‌ها را انتخاب کنید
         ========================================================================= */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black text-[11px]">
            ۲
          </span>
          <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
            مرحله ۲: یکی از گزینه‌ها را انتخاب کنید
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800';

            if (isAnswerSubmitted) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-400/40';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-bold ring-2 ring-rose-400/40';
              } else {
                btnStyle = 'bg-stone-50/50 border-stone-200 text-stone-400 opacity-60';
              }
            } else if (isSelected) {
              btnStyle = 'bg-amber-50 border-amber-400 text-stone-950 font-bold';
            }

            const optionLetters = ['الف', 'ب', 'ج', 'د'];

            return (
              <button
                key={idx}
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between gap-3 text-xs ${btnStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-200/80 text-stone-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {optionLetters[idx] || idx + 1}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </div>

                {isAnswerSubmitted && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {isAnswerSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          مرحله ۳: نتیجه را ببینید
         ========================================================================= */}
      {isAnswerSubmitted && (
        <section className="space-y-3 pt-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black text-[11px]">
              ۳
            </span>
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
              مرحله ۳: نتیجه را ببینید
            </h4>
          </div>

          <div
            className={`p-5 rounded-2xl border text-xs space-y-4 shadow-xs ${
              selectedOption === currentQ.correctIndex
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/90 border-rose-300 text-rose-950'
            }`}
          >
            {/* بنر وضعیت درست / غلط */}
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                {selectedOption === currentQ.correctIndex ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>پاسخ شما درست است!</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>پاسخ شما نادرست بود</span>
                  </>
                )}
              </div>

              {/* محاسبه امتیاز لحظه‌ای بر اساس فرمول */}
              <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white/80 border border-black/10">
                امتیاز شما: {correctAnswersCount} از {currentQuestionIndex + 1} ({Math.round((correctAnswersCount / (currentQuestionIndex + 1)) * 100)}٪)
              </div>
            </div>

            {/* تفکیک مقایسه‌ای: پاسخ کاربر در برابر پاسخ صحیح */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 p-3 rounded-xl border border-black/10 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 block">پاسخ انتخابی کاربر:</span>
                <span className="font-bold text-stone-900 block leading-snug">
                  {selectedOption !== null ? currentQ.options[selectedOption] : '—'}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-300 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 block">پاسخ صحیح:</span>
                <span className="font-bold text-emerald-950 block leading-snug">
                  {currentQ.options[currentQ.correctIndex]}
                </span>
              </div>
            </div>

            {/* توضیح علمی و موسیقایی */}
            <div className="bg-white/60 p-3 rounded-xl border border-black/5">
              <span className="font-bold text-stone-800 block mb-1">توضیح موسیقایی:</span>
              <p className="leading-relaxed text-stone-700 text-justify">{currentQ.explanation}</p>
            </div>

            {/* دکمه حرکت به سؤال بعدی */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>{currentQuestionIndex < questions.length - 1 ? 'سؤال بعدی' : 'مشاهده کارنامه نهایی'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * ساخت حداقل ۵ سؤال تخصصی بر اساس نوع تمرین شنیداری با تصادفی‌سازی منطقی گزینه‌ها
 */
function buildQuestionsForExercise(exercise: Exercise): QuizQuestion[] {
  // تمرین ۱: فواصل دانگ اول شور (ex_shour_listen_intervals)
  if (exercise.id === 'ex_shour_listen_intervals') {
    const rawQuestions = [
      {
        id: 'q_shour_int_1',
        prompt: 'دو نغمه پیاپی پخش شد. فاصله شنیده‌شده میان این دو نغمه چیست؟',
        audioItems: [
          { note: 'سل ۴', frequency: 392.0, duration: 1.2 },
          { note: 'لا کُرُن ۴', frequency: 426.2, duration: 1.8 },
        ],
        correct: 'فاصله سه ربع پرده / دوم نیم‌بزرگ (سل ۴ به لا کُرُن ۴)',
        wrongs: [
          'فاصله پرده کامل طنینی (سل ۴ به لا ۴ بکار)',
          'فاصله نیم‌پرده معتدل (سل ۴ به لا بمل ۴)',
          'فاصله چهارم درست (سل ۴ به دو ۵)',
        ],
        explanation:
          'فاصله میان نت پایه (سل ۴) و نت شاهد (لا کُرُن ۴) حدود ۱۴۵ سنت (مجنب) است که هویت شاخص دانگ اول شور را خلق می‌کند.',
      },
      {
        id: 'q_shour_int_2',
        prompt: 'توالی دو نغمه را شنیدید. فاصله شنیده‌شده میان این دو نغمه چیست؟',
        audioItems: [
          { note: 'لا کُرُن ۴', frequency: 426.2, duration: 1.2 },
          { note: 'سی بمل ۴', frequency: 466.16, duration: 1.8 },
        ],
        correct: 'فاصله سه ربع پرده / مجنب (لا کُرُن ۴ به سی بمل ۴)',
        wrongs: [
          'فاصله یک پرده کامل (۲۰۰ سنت)',
          'فاصله نیم‌پرده کوچک (۱۰۰ سنت)',
          'فاصله سوم بزرگ (۴۰۰ سنت)',
        ],
        explanation:
          'از نت شاهد لا کُرُن به درجه سوم (سی بمل)، مجدداً یک فاصله سه ربع پرده وجود دارد که سقف دانگ اولیه درآمد را می‌سازد.',
      },
      {
        id: 'q_shour_int_3',
        prompt: 'دو نغمه با جهش صعودی پخش شدند. این فاصله در دانگ اول شور چه نام دارد؟',
        audioItems: [
          { note: 'سل ۴', frequency: 392.0, duration: 1.2 },
          { note: 'دو ۵', frequency: 523.25, duration: 2.0 },
        ],
        correct: 'فاصله چهارم درست (سل ۴ به دو ۵ - انتهای دانگ اول)',
        wrongs: [
          'فاصله سوم کوچک (سل ۴ به سی بمل ۴)',
          'فاصله اکتاو کامل (سل ۴ به سل ۵)',
          'فاصله پنجم درست (سل ۴ به رِ ۵)',
        ],
        explanation:
          'فاصله سل ۴ تا دو ۵ دقیقاً فاصله چهارم درست (۵۰۰ سنت) است که محدوده گردش دانگ اول شور را در بر می‌گیرد.',
      },
      {
        id: 'q_shour_int_4',
        prompt: 'توالی دو نغمه شنیده شد. این حرکت نغمگی چه نقشی در درآمد اول شور دارد؟',
        audioItems: [
          { note: 'لا کُرُن ۴', frequency: 426.2, duration: 1.4 },
          { note: 'سل ۴', frequency: 392.0, duration: 2.0 },
        ],
        correct: 'فرود نغمگی از نت شاهد (لا کُرُن) به نت پایه و ایست (سل)',
        wrongs: [
          'صعود به اوج دانگ دوم',
          'توقف موقت روی درجه چهارم',
          'پرده‌گردانی به دستگاه همایون',
        ],
        explanation:
          'حرکت نزولی از لا کُرُن (شاهد) به سوی نت سل (ایست)، حرکت فرود کلاسیک درآمد شور است که حس آرامش و بسته شدن جمله را منتقل می‌کند.',
      },
      {
        id: 'q_shour_int_5',
        prompt: 'به دو نغمه پایانی دانگ اول شور گوش دهید. فاصله میان سی بمل ۴ تا دو ۵ چیست؟',
        audioItems: [
          { note: 'سی بمل ۴', frequency: 466.16, duration: 1.2 },
          { note: 'دو ۵', frequency: 523.25, duration: 2.0 },
        ],
        correct: 'فاصله یک پرده کامل طنینی (سی بمل ۴ به دو ۵ - ۲۰۰ سنت)',
        wrongs: [
          'فاصله ربع‌پرده خنثی',
          'فاصله نیم‌پرده معتدل',
          'فاصله سوم درست',
        ],
        explanation:
          'فاصله میان سی بمل ۴ و دو ۵، بر خلاف دو فاصله خنثی قبلی، یک پرده کامل طنینی (۲۰۰ سنت) است که دانگ اول شور را به انتها می‌رساند.',
      },
    ];

    return rawQuestions.map((q) => {
      const { options, correctIndex } = shuffleOptions(q.correct, q.wrongs);
      return {
        id: q.id,
        prompt: q.prompt,
        audioItems: q.audioItems,
        options,
        correctIndex,
        explanation: q.explanation,
      };
    });
  }

  // تمرین ۵: تمایز شنیداری لا کُرُن از لا بمل و لا بکار (ex_shour_listen_discrim)
  if (exercise.id === 'ex_shour_listen_discrim') {
    const rawDiscrim = [
      {
        id: 'qd1',
        prompt: 'به نغمه پخش‌شده گوش دهید. آیا این نغمه لا کُرُن شور است یا لا بمل یا لا بکار؟',
        audioItems: [{ note: 'لا کُرُن ۴', frequency: 426.2, duration: 1.8 }],
        correct: 'لا کُرُن ۴ شور (~۴۲۶ هرتز / ۱۴۵ سنت بالاتر از سل)',
        wrongs: [
          'لا بمل ۴ غربی (~۴۱۵ هرتز / ۱۰۰ سنت)',
          'لا ۴ دیاپازون طبیعی (~۴۴۰ هرتز / ۲۰۰ سنت)',
        ],
        explanation:
          'فرکانس حدود ۴۲۶.۲ هرتز در میانه لا بمل و لا بکار قرار دارد و طنین ربع‌پرده‌ای اصیل شور را خلق می‌کند.',
      },
      {
        id: 'qd2',
        prompt: 'به نت پخش‌شده گوش دهید. این نغمه کدام است؟',
        audioItems: [{ note: 'لا بمل ۴', frequency: 415.3, duration: 1.8 }],
        correct: 'لا بمل ۴ (نیم‌پرده غربی - بم‌تر از لا کُرُن)',
        wrongs: [
          'لا کُرُن ۴ (مجنب شور)',
          'لا ۴ بکار طبیعی',
        ],
        explanation:
          'نت پخش‌شده لا بمل با فرکانس حدود ۴۱۵ هرتز است که حسی شبیه به گام مینور غربی دارد و نسبت به لا کُرُن بم‌تر است.',
      },
      {
        id: 'qd3',
        prompt: 'به نت پخش‌شده گوش دهید. این نغمه کدام است؟',
        audioItems: [{ note: 'لا ۴', frequency: 440.0, duration: 1.8 }],
        correct: 'لا ۴ بکار (دیاپازون طبیعی ۴۴۰ هرتز - پرده کامل نسبت به سل)',
        wrongs: [
          'لا کُرُن ۴ شور',
          'لا بمل ۴',
        ],
        explanation:
          'نت پخش‌شده لا ۴ با فرکانس دقیق ۴۴۰ هرتز است که فاصله‌ای بازتر (پرده کامل نسبت به سل) دارد.',
      },
      {
        id: 'qd4',
        prompt: 'به نت پخش‌شده گوش کنید. با توجه به لطافت صوتی، کدام پرده نواخته شد؟',
        audioItems: [{ note: 'لا کُرُن ۴', frequency: 426.2, duration: 1.8 }],
        correct: 'لا کُرُن ۴ شور (طنین خنثی و ویژه ردیف)',
        wrongs: [
          'لا ۴ بکار',
          'لا بمل ۴',
        ],
        explanation:
          'طنین آرامش‌بخش و میانه این نت نشان‌دهنده لا کُرُن سنتی شور است.',
      },
      {
        id: 'qd5',
        prompt: 'به توالی دو نغمه گوش دهید. فاصله نت دوم نسبت به نت اول چه نوع فاصله‌ای است؟',
        audioItems: [
          { note: 'سل ۴', frequency: 392.0, duration: 1.2 },
          { note: 'لا کُرُن ۴', frequency: 426.2, duration: 1.8 },
        ],
        correct: 'فاصله سه ربع پرده (دوم نیم‌بزرگ ایرانی - ۱۴۵ سنت)',
        wrongs: [
          'فاصله نیم‌پرده معتدل (۱۰۰ سنت)',
          'فاصله پرده کامل (۲۰۰ سنت)',
        ],
        explanation:
          'فاصله میان سل و لا کُرُن یک فاصله سه ربع پرده (~۱۴۵ سنت) است که گوش ایرانی آن را به عنوان ویژگی هویتی شور می‌شناسد.',
      },
    ];

    return rawDiscrim.map((q) => {
      const { options, correctIndex } = shuffleOptions(q.correct, q.wrongs);
      return {
        id: q.id,
        prompt: q.prompt,
        audioItems: q.audioItems,
        options,
        correctIndex,
        explanation: q.explanation,
      };
    });
  }

  // ایجاد عمومی ۵ سؤال از روی targetNotes برای هر تمرین شنیداری دیگر
  const notes = exercise.targetNotes;
  const questionsList: QuizQuestion[] = [];

  for (let i = 0; i < 5; i++) {
    const targetIdx = i % notes.length;
    const target = notes[targetIdx];
    const otherNotes = notes.filter((_, idx) => idx !== targetIdx);

    const wrong1 = otherNotes[0]?.noteFa || 'سل ۴';
    const wrong2 = otherNotes[1]?.noteFa || 'دو ۵';
    const wrong3 = otherNotes[2]?.noteFa || 'سی بمل ۴';

    const { options, correctIndex } = shuffleOptions(target.noteFa, [wrong1, wrong2, wrong3]);

    questionsList.push({
      id: `gen_q${i + 1}`,
      prompt: `سؤال ${i + 1}: به نت پخش‌شده گوش دهید. کدام نغمه نواخته شد؟`,
      audioItems: [{ note: target.noteFa, frequency: target.frequencyHz, duration: 1.8 }],
      options,
      correctIndex,
      explanation: `نت پخش‌شده «${target.noteFa}» با فرکانس حدود ${Math.round(target.frequencyHz)} هرتز است.`,
    });
  }

  return questionsList;
}
