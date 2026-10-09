/**
 * صفحه جامع آموزش تخصصی دستگاه شور و سایر دستگاه‌ها
 * شامل مسیر آموزشی کامل ۶ مرحله‌ای، پلیر صوتی پیشرفته با کنترل سرعت،
 * پرده‌بندی مدال سنتی و پیوند مستقیم به دروس و تمرین‌های ارزیابی صوتی
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Mic,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Info,
  Clock,
  Compass,
  ArrowUpRight,
  Headphones,
  Check,
} from 'lucide-react';
import { Dastgah, Gusheh, Lesson, Exercise } from '../types/music';
import { ScaleVisualizer, ScaleVisualizerNote } from '../components/ScaleVisualizer';
import { persianSynth } from '../services/audio/synthPlayer';
import { LESSONS } from '../data/lessons';
import { EXERCISES } from '../data/exercises';
import { ProgressStorage } from '../services/storage';

interface DastgahDetailPageProps {
  dastgah: Dastgah;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const DastgahDetailPage: React.FC<DastgahDetailPageProps> = ({
  dastgah,
  onBack,
  onNavigate,
}) => {
  const isShour = dastgah.id === 'shour';
  const isMahour = dastgah.id === 'mahour';

  // وضعیت‌های صوتی
  const [playingGushehId, setPlayingGushehId] = useState<string | null>(null);
  const [expandedGushehId, setExpandedGushehId] = useState<string | null>(dastgah.gushehs[0]?.id || null);
  const [activePhraseNote, setActivePhraseNote] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [cancelPlaybackFn, setCancelPlaybackFn] = useState<(() => void) | null>(null);

  // پیشرفت کاربر
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [practiceAttemptsCount, setPracticeAttemptsCount] = useState<number>(0);

  useEffect(() => {
    const p = ProgressStorage.getProgress();
    setCompletedLessonIds(p.completedLessonIds);
    setPracticeAttemptsCount(p.practiceAttempts.filter((a) => a.exerciseId.includes(dastgah.id)).length);
  }, [dastgah.id]);

  // پاکسازی پخش صوت هنگام خروج
  useEffect(() => {
    return () => {
      if (cancelPlaybackFn) {
        cancelPlaybackFn();
      }
    };
  }, [cancelPlaybackFn]);

  const relatedLessons = LESSONS.filter((l) => l.dastgahId === dastgah.id).sort((a, b) => a.order - b.order);
  const relatedExercises = EXERCISES.filter((e) => e.dastgahId === dastgah.id);

  // محاسبه پیشرفت در مسیر آموزشی
  const completedLessonsCount = relatedLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = relatedLessons.length > 0 ? Math.round((completedLessonsCount / relatedLessons.length) * 100) : 0;

  // پخش نمونه صوتی گوشه
  const handlePlayGushehMelody = async (gusheh: Gusheh) => {
    if (cancelPlaybackFn) {
      cancelPlaybackFn();
      setCancelPlaybackFn(null);
    }

    if (playingGushehId === gusheh.id) {
      setPlayingGushehId(null);
      setActivePhraseNote(null);
      return;
    }

    setPlayingGushehId(gusheh.id);

    const defaultNotes = isMahour ? ['دو', 'می', 'سل', 'دو'] : ['سل', 'لا کُرُن', 'سی بمل', 'سل'];
    const notesSeq = (gusheh.sampleMelodyNotes || defaultNotes).map((note) => ({
      note,
      duration: 1.0,
      frequency: note === 'لا کُرُن' ? 426.2 : note === 'سی کُرُن' ? 480.0 : undefined,
    }));

    const cancel = await persianSynth.playMelody(
      notesSeq,
      (idx, noteName) => {
        setActivePhraseNote(noteName);
      },
      () => {
        setPlayingGushehId(null);
        setActivePhraseNote(null);
        setCancelPlaybackFn(null);
      },
      playbackSpeed
    );

    setCancelPlaybackFn(() => cancel);
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

  // تعریف درجات مدال دقیق شور با فرکانس سنتی
  const shourModalNotes: ScaleVisualizerNote[] = [
    {
      noteNameFa: 'سل',
      roleInScale: 'پایه',
      accidental: 'natural',
      frequencyHz: 392.0,
      modalExplanation: 'نت پایه و ایست نهایی تمام جملات درآمد و فرود شور.',
    },
    {
      noteNameFa: 'لا کُرُن',
      roleInScale: 'شاهد درآمد',
      accidental: 'koron',
      frequencyHz: 426.2,
      modalExplanation: 'فاصله خنثی سنتی (~۱۴۵ سنت بالاتر از سل). مرکز ثقل و ثروت صوتی درآمد شور.',
    },
    {
      noteNameFa: 'سی بمل',
      roleInScale: 'معمولی',
      accidental: 'flat',
      frequencyHz: 466.16,
      modalExplanation: 'سقف اولیه چرخش ملودی در درآمد اول.',
    },
    {
      noteNameFa: 'دو',
      roleInScale: 'معمولی',
      accidental: 'natural',
      frequencyHz: 523.25,
      modalExplanation: 'حد بالای دانگ اول و نت شاهد گوشه سلمک و آواز ابوعطا.',
    },
    {
      noteNameFa: 'رِ',
      roleInScale: 'متغیر',
      accidental: 'natural',
      frequencyHz: 587.33,
      modalExplanation: 'نت آغاز دانگ دوم و شاهد گوشه اوج قرچه.',
    },
    {
      noteNameFa: 'می بمل',
      roleInScale: 'معمولی',
      accidental: 'flat',
      frequencyHz: 622.25,
      modalExplanation: 'شاهد گوشه رضوی در منطقه اوج شور.',
    },
    {
      noteNameFa: 'فا',
      roleInScale: 'محسوس',
      accidental: 'natural',
      frequencyHz: 698.46,
      modalExplanation: 'نغمه گذر به سوی اکتاو بالاتر.',
    },
  ];

  // تعریف درجات مدال دقیق ماهور پایه دو
  const mahourScaleNotes: ScaleVisualizerNote[] = [
    {
      noteNameFa: 'دو',
      roleInScale: 'پایه',
      accidental: 'natural',
      frequencyHz: 261.63,
      modalExplanation: 'نت پایه و تونیک ماهور؛ ایست نهایی تمام جملات درآمد و فرود.',
    },
    {
      noteNameFa: 'رِ',
      roleInScale: 'معمولی',
      accidental: 'natural',
      frequencyHz: 293.66,
      modalExplanation: 'درجه دوم؛ نت ایست موقت در گوشه داد.',
    },
    {
      noteNameFa: 'می',
      roleInScale: 'شاهد درآمد',
      accidental: 'natural',
      frequencyHz: 329.63,
      modalExplanation: 'درجه سوم و شاهد درآمد و گشایش ماهور.',
    },
    {
      noteNameFa: 'فا',
      roleInScale: 'معمولی',
      accidental: 'natural',
      frequencyHz: 349.23,
      modalExplanation: 'درجه چهارم و نت شاهد در گوشه داد.',
    },
    {
      noteNameFa: 'سل',
      roleInScale: 'ایست',
      accidental: 'natural',
      frequencyHz: 392.00,
      modalExplanation: 'درجه پنجم و نت ایست موقت درآمد و شاهد گوشه دلکش.',
    },
    {
      noteNameFa: 'لا',
      roleInScale: 'معمولی',
      accidental: 'natural',
      frequencyHz: 440.00,
      modalExplanation: 'درجه ششم ماهور (در گوشه دلکش به لا کُرُن تبدیل می‌شود).',
    },
    {
      noteNameFa: 'سی',
      roleInScale: 'محسوس',
      accidental: 'natural',
      frequencyHz: 493.88,
      modalExplanation: 'محسوس ماهور با کشش صعودی به سوی دو اکتاو بالا.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
      {/* دکمه بازگشت و نوار ابزار بالا */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست دستگاه‌ها</span>
        </button>

        <button
          onClick={() => onNavigate(`/exercise?dastgah=${dastgah.id}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-xs"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>کارگاه تمرین صوتی {dastgah.nameFa}</span>
        </button>
      </div>

      {/* ۱. معرفی دستگاه (Hero Header) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold px-2.5 py-0.5 rounded-full bg-stone-900 text-amber-400">
            {dastgah.type === 'dastgah' ? 'دستگاه اصلی' : `آواز وابسته به ${dastgah.parentDastgahNameFa}`}
          </span>
          <span className="text-stone-300">·</span>
          <span className="font-mono text-stone-500">{dastgah.nameEn}</span>
          <span className="text-stone-300">·</span>
          <span className="font-mono text-stone-700 font-semibold">پایه: {dastgah.tonicNote}</span>
          {(isShour || isMahour) && (
            <>
              <span className="text-stone-300">·</span>
              <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-bold">
                مسیر آموزشی کامل (۷ درس)
              </span>
            </>
          )}
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            {dastgah.nameFa}
          </h1>
          <p className="text-sm font-semibold text-amber-800 mt-1">
            شخصیت صوتی: {dastgah.characterFa}
          </p>
        </div>

        <p className="text-sm text-stone-700 leading-relaxed max-w-4xl text-justify">
          {dastgah.fullHistory}
        </p>

        {/* جعبه کوک سازهای ایرانی */}
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

        {/* پلاک منبع علمی */}
        {dastgah.sourceAttribution && (
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-2 border-t border-stone-100">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>منبع و مبنای علمی: {dastgah.sourceAttribution.sourceName}</span>
          </div>
        )}
      </div>

      {/* ۲. نقشه یادگیری ۶ مرحله‌ای دستگاه شور (ویژه شور) */}
      {isShour && (
        <section className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                مسیر گام‌به‌گام هنرجو
              </span>
              <h2 className="text-xl font-bold text-white">
                نقشه ۶ مرحله‌ای یادگیری دستگاه شور
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                از شناخت فضای صوتی تا ارزیابی زنده حنجره با میکروفون
              </p>
            </div>

            {/* نشانگر درصد پیشرفت */}
            <div className="flex items-center gap-3 bg-stone-800 px-4 py-2 rounded-xl border border-stone-700 self-start sm:self-auto">
              <div className="text-left font-mono">
                <span className="text-xs text-stone-400 block">پیشرفت شما</span>
                <span className="text-base font-black text-amber-400">{progressPercent}%</span>
              </div>
              <div className="w-20 bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ۶ گام نقشه یادگیری شور */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            {[
              {
                step: 1,
                title: '۱. آشنایی',
                subtitle: 'فضای صوتی و هویت مدال',
                lessonId: 'lesson_shour_1_intro',
                isDone: completedLessonIds.includes('lesson_shour_1_intro'),
              },
              {
                step: 2,
                title: '۲. نت‌های مهم',
                subtitle: 'نقش سل، لا کُرُن و رِ',
                lessonId: 'lesson_shour_2_key_notes',
                isDone: completedLessonIds.includes('lesson_shour_2_key_notes'),
              },
              {
                step: 3,
                title: '۳. درآمد اول',
                subtitle: 'اسکلت نغمگی ردیف',
                lessonId: 'lesson_shour_3_daramad',
                isDone: completedLessonIds.includes('lesson_shour_3_daramad'),
              },
              {
                step: 4,
                title: '۴. تمرین شنیداری',
                subtitle: 'تمایز فواصل ربع‌پرده‌ای',
                lessonId: 'lesson_shour_5_ear_training',
                isDone: completedLessonIds.includes('lesson_shour_5_ear_training'),
              },
              {
                step: 5,
                title: '۵. تمرین تقلید',
                subtitle: 'بازخوانی سینه به سینه',
                lessonId: 'lesson_shour_6_imitation',
                isDone: completedLessonIds.includes('lesson_shour_6_imitation'),
              },
              {
                step: 6,
                title: '۶. ارزیابی صوتی',
                subtitle: 'سنجش با میکروفون',
                lessonId: 'lesson_shour_7_mic_evaluation',
                isDone: completedLessonIds.includes('lesson_shour_7_mic_evaluation'),
              },
            ].map((st) => (
              <button
                key={st.step}
                onClick={() => onNavigate(`/lessons/${st.lessonId}`)}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  st.isDone
                    ? 'bg-amber-950/40 border-amber-500/50 hover:border-amber-400'
                    : 'bg-stone-800/80 border-stone-700 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-amber-400 font-bold">
                    گام {st.step}
                  </span>
                  {st.isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-white block text-xs">{st.title}</span>
                  <span className="text-[11px] text-stone-400 block mt-0.5 leading-snug">
                    {st.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ۲ (ب). نقشه یادگیری ۷ مرحله‌ای دستگاه ماهور (ویژه ماهور) */}
      {isMahour && (
        <section className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                مسیر گام‌به‌گام هنرجو
              </span>
              <h2 className="text-xl font-bold text-white">
                نقشه ۷ مرحله‌ای یادگیری دستگاه ماهور
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                از شناخت فضای صوتی تا درآمد، گوشه‌ها، پرده‌گردانی و ارزیابی جامع با میکروفون
              </p>
            </div>

            {/* نشانگر درصد پیشرفت */}
            <div className="flex items-center gap-3 bg-stone-800 px-4 py-2 rounded-xl border border-stone-700 self-start sm:self-auto">
              <div className="text-left font-mono">
                <span className="text-xs text-stone-400 block">پیشرفت شما</span>
                <span className="text-base font-black text-amber-400">{progressPercent}%</span>
              </div>
              <div className="w-20 bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ۷ گام نقشه یادگیری ماهور */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 text-xs">
            {[
              {
                step: 1,
                title: '۱. آشنایی',
                subtitle: 'فضای صوتی و گام پایه',
                lessonId: 'lesson_mahour_1_intro',
                isDone: completedLessonIds.includes('lesson_mahour_1_intro'),
              },
              {
                step: 2,
                title: '۲. نت‌های مهم',
                subtitle: 'پایه دو، شاهد و ایست',
                lessonId: 'lesson_mahour_2_key_notes',
                isDone: completedLessonIds.includes('lesson_mahour_2_key_notes'),
              },
              {
                step: 3,
                title: '۳. درآمد ماهور',
                subtitle: 'اسکلت نغمگی ردیف',
                lessonId: 'lesson_4_mahour_daramad',
                isDone: completedLessonIds.includes('lesson_4_mahour_daramad'),
              },
              {
                step: 4,
                title: '۴. گوشه گشایش',
                subtitle: 'گسترش به دانگ میانی',
                lessonId: 'lesson_mahour_4_goshaiesh',
                isDone: completedLessonIds.includes('lesson_mahour_4_goshaiesh'),
              },
              {
                step: 5,
                title: '۵. گوشه داد',
                subtitle: 'اوج‌گیری و صلابت آواز',
                lessonId: 'lesson_mahour_5_dad',
                isDone: completedLessonIds.includes('lesson_mahour_5_dad'),
              },
              {
                step: 6,
                title: '۶. پرده‌گردانی',
                subtitle: 'دلکش، شکسته و لا کُرُن',
                lessonId: 'lesson_mahour_6_melodic_expansion',
                isDone: completedLessonIds.includes('lesson_mahour_6_melodic_expansion'),
              },
              {
                step: 7,
                title: '۷. ارزیابی جامع',
                subtitle: 'فرود و سنجش حنجره',
                lessonId: 'lesson_mahour_7_forood_evaluation',
                isDone: completedLessonIds.includes('lesson_mahour_7_forood_evaluation'),
              },
            ].map((st) => (
              <button
                key={st.step}
                onClick={() => onNavigate(`/lessons/${st.lessonId}`)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  st.isDone
                    ? 'bg-amber-950/40 border-amber-500/50 hover:border-amber-400'
                    : 'bg-stone-800/80 border-stone-700 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-amber-400 font-bold">
                    گام {st.step}
                  </span>
                  {st.isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-white block text-xs">{st.title}</span>
                  <span className="text-[11px] text-stone-400 block mt-0.5 leading-snug">
                    {st.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ۳. پرده‌بندی و درجات مدال دستگاه با پخش زنده و کوک مدال */}
      <ScaleVisualizer
        title={`پرده‌بندی و گام ${dastgah.nameFa}`}
        notes={
          isShour
            ? shourModalNotes
            : isMahour
            ? mahourScaleNotes
            : (dastgah.scaleNotes as ScaleVisualizerNote[])
        }
        defaultOctave={4}
        tuningProfileName={
          isShour
            ? 'شور سنتی سل (SHOUR_MODAL)'
            : isMahour
            ? 'ماهور پایه دو (MAHOUR_NATURAL)'
            : undefined
        }
      />

      {/* ۴. فهرست دروس ساختاریافته آموزش دستگاه */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>دروس آموزشی {dastgah.nameFa} (برنامه مدون ردیف)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              هر درس شامل هدف آموزشی، شنیدن نمونه ساز، نکات اجرایی و تمرین عملی اختصاصی است
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
            {relatedLessons.length} درس مدون
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatedLessons.map((l, index) => {
            const isCompleted = completedLessonIds.includes(l.id);
            return (
              <div
                key={l.id}
                className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 hover:border-amber-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      درس شماره {index + 1} · {l.level}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400">
                      <Clock className="w-3 h-3" />
                      <span>{l.estimatedMinutes} دقیقه</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-stone-900 text-sm leading-snug">
                    {l.titleFa}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {l.learningObjective || l.subtitleFa}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>تکمیل‌شده</span>
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">در انتظار مطالعه</span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate(`/lessons/${l.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-400 hover:text-stone-950 font-bold text-xs text-stone-800 transition-colors"
                  >
                    <span>ورود به درس</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ۵. گوشه‌ها و سیر تحول ملودیک ردیف */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              <span>گوشه‌های ردیف و سیر تحول ملودیک {dastgah.nameFa}</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              ترتیب ردیف از درآمد تا اوج و فرود؛ روی هر گوشه کلیک کنید تا نغمات و جزئیات آن را بشنوید
            </p>
          </div>

          {/* ابزار کنترل سرعت پخش نغمه‌ها */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs self-start sm:self-auto">
            <span className="text-[11px] text-stone-500 px-1">سرعت:</span>
            {[0.75, 1.0, 1.25].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  playbackSpeed === spd
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {dastgah.gushehs.map((gusheh) => {
            const isExpanded = expandedGushehId === gusheh.id;
            const isPlaying = playingGushehId === gusheh.id;

            return (
              <div
                key={gusheh.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs transition-all"
              >
                <div
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/70"
                  onClick={() => setExpandedGushehId(isExpanded ? null : gusheh.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-stone-400 font-bold w-5">
                      {gusheh.orderIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900 text-sm sm:text-base">
                          {gusheh.nameFa}
                        </span>
                        <span className="text-stone-400 text-xs hidden sm:inline">
                          ({gusheh.nameEn})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                        <span>محدوده: {gusheh.melodicRange}</span>
                        <span>·</span>
                        <span>شاهد: {gusheh.shahedNote}</span>
                        <span>·</span>
                        <span>ایست: {gusheh.istNote}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleStyle(
                        gusheh.role
                      )}`}
                    >
                      {gusheh.role}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayGushehMelody(gusheh);
                      }}
                      className={`p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        isPlaying
                          ? 'bg-amber-400 text-stone-950 animate-pulse'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                      }`}
                      title="شنیدن ملودی گوشه با سنتور"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isPlaying ? 'در حال پخش' : 'شنیدن'}</span>
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* پانل بازشونده جزئیات گوشه */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-100 text-xs space-y-4">
                    <p className="text-stone-700 leading-relaxed">{gusheh.description}</p>

                    {gusheh.listeningGuideFa && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-amber-950 flex items-start gap-2">
                        <Headphones className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">راهنمای شنیداری: </span>
                          <span>{gusheh.listeningGuideFa}</span>
                        </div>
                      </div>
                    )}

                    {/* مشخصات مدال گوشه */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/60 font-mono">
                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-400 block font-sans">نت شاهد:</span>
                        <span className="font-bold text-stone-900">{gusheh.shahedNote}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-400 block font-sans">نت ایست:</span>
                        <span className="font-bold text-stone-900">{gusheh.istNote}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-400 block font-sans">نوع ریتم:</span>
                        <span className="font-bold text-stone-900 font-sans">{gusheh.rhythmicType}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-400 block font-sans">نت متغیر:</span>
                        <span className="font-bold text-stone-900 font-sans">
                          {gusheh.motegheyerNote || 'ندارد'}
                        </span>
                      </div>
                    </div>

                    {/* دنباله نغمات نمونه و تمرین مرتبط */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      {gusheh.sampleMelodyNotes && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-stone-500 font-bold">گردش نغمات:</span>
                          {gusheh.sampleMelodyNotes.map((n, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                activePhraseNote === n && isPlaying
                                  ? 'bg-amber-400 text-stone-950 font-bold scale-110 shadow-xs'
                                  : 'bg-white text-stone-700 border border-stone-200'
                              }`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}

                      {gusheh.relatedExerciseId && (
                        <button
                          onClick={() => onNavigate(`/exercise/${gusheh.relatedExerciseId}`)}
                          className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-bold text-xs underline"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>تمرین صوتی این گوشه</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ۶. بنر اقدام به تمرین و کارگاه حنجره */}
      <section className="bg-gradient-to-l from-amber-500 to-amber-400 text-stone-950 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-right">
          <span className="text-xs font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded">
            کارگاه ارزیابی حنجره
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            آماده خواندن و سنجش صدای خود در {dastgah.nameFa} هستید؟
          </h3>
          <p className="text-xs sm:text-sm text-stone-900/80 max-w-xl">
            میکروفون را روشن کنید و نغمات {dastgah.nameFa} را در حضور سنسور وب‌آدیو اجرا کنید تا درصد انطباق صدا با فواصل را مشاهده کنید.
          </p>
        </div>

        <button
          onClick={() => onNavigate(`/exercise?dastgah=${dastgah.id}`)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 text-xs sm:text-sm font-bold transition-all shadow-md shrink-0 active:scale-95"
        >
          <Mic className="w-4 h-4" />
          <span>ورود به کارگاه تمرین صوتی {dastgah.nameFa}</span>
        </button>
      </section>
    </div>
  );
};
