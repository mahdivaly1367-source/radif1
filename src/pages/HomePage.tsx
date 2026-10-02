import React from 'react';
import { Play, Mic, BookOpen, Layers, Sparkles, ArrowLeft, Volume2, Compass, CheckCircle } from 'lucide-react';
import { PageRoute } from '../components/Navbar';
import { DASTGAHS } from '../data/dastgahs';
import { LESSONS } from '../data/lessons';
import { persianSynth } from '../services/audio/synthPlayer';

interface HomePageProps {
  onNavigate: (page: PageRoute, params?: { dastgahId?: string; lessonId?: string; exerciseId?: string }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const primaryDastgahs = DASTGAHS.filter((d) => d.type === 'dastgah');
  const avazes = DASTGAHS.filter((d) => d.type === 'avaz');

  const playDastgahTonic = async (e: React.MouseEvent, noteName: string) => {
    e.stopPropagation();
    await persianSynth.playNoteByName(noteName.split(' ')[0], 4, 1.8);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100 py-16 sm:py-24 border-b border-stone-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پلتفرم تعاملی و عملی ردیف موسیقی اصیل ایرانی</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight sm:leading-snug text-balance">
              یادگیری اصولی دستگاه‌ها، آوازها و گوشه‌های ردیف با تحلیل زنده صدا
            </h1>

            <p className="text-base sm:text-lg text-stone-300 leading-relaxed text-pretty">
              موسیقی ایرانی فقط تئوری روی کاغذ نیست. در ردیفستان، دستگاه‌ها و گوشه‌ها را بشناسید، نمونه‌های صوتی را با پرده‌بندی سنتور و تار گوش کنید و صدای خود را با میکروفون بسنجید تا فرکانس، نتها و ربع‌پرده‌ها (کُرُن و سُری) به شکل زنده تحلیل شوند.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('lessons')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>شروع یادگیری ردیف</span>
              </button>

              <button
                onClick={() => onNavigate('exercise')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-all shadow-sm active:scale-95"
              >
                <Mic className="w-4 h-4 text-amber-400" />
                <span>کارگاه سنجش زنده صدا و تیونر</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Dastgahs Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
              ساختار نظام مدال
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              دستگاه‌های هفت‌گانه موسیقی ایرانی
            </h2>
            <p className="text-sm text-stone-600 mt-1 max-w-2xl">
              هفت دستگاه بنیادین که اقیانوس نغمگی ردیف را شکل می‌دهند، هر یک با شخصیت، فواصل و گوشه‌های منحصر‌به‌فرد.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dastgahs')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <span>مشاهده همه و جزئیات گوشه‌ها</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {primaryDastgahs.map((dastgah) => (
            <div
              key={dastgah.id}
              onClick={() => onNavigate('dastgahs', { dastgahId: dastgah.id })}
              className="group bg-white rounded-xl border border-stone-200 hover:border-amber-400/80 p-5 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                    {dastgah.nameFa}
                  </h3>
                  <button
                    onClick={(e) => playDastgahTonic(e, dastgah.tonicNote)}
                    className="p-1.5 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title={`شنیدن نت پایه ${dastgah.tonicNote}`}
                    aria-label={`شنیدن نت پایه ${dastgah.tonicNote}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-amber-800 font-medium mb-3">
                  حس و حال: {dastgah.characterFa}
                </p>
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3 mb-4">
                  {dastgah.shortDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                  پایه: {dastgah.tonicNote}
                </span>
                <span className="text-[11px] font-medium text-amber-700 group-hover:translate-x-[-2px] transition-transform flex items-center gap-1">
                  <span>بررسی گوشه‌ها</span>
                  <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Avazes Section */}
      <section className="bg-stone-100/70 border-y border-stone-200/80 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
              نغمات منشعب
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              پنج آواز وابسته (شور و همایون)
            </h2>
            <p className="text-sm text-stone-600 mt-1 max-w-2xl">
              آوازهایی مستقل با گستره عاطفی بی‌نظیر که از دستگاه‌های مادر مشتق شده‌اند.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {avazes.map((avaz) => (
              <div
                key={avaz.id}
                onClick={() => onNavigate('dastgahs', { dastgahId: avaz.id })}
                className="bg-white rounded-xl border border-stone-200 hover:border-amber-400 p-5 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-base text-stone-900">
                      {avaz.nameFa}
                    </h3>
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      وابسته به {avaz.parentDastgahNameFa}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium mb-2.5">
                    {avaz.characterFa}
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {avaz.shortDescription}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span className="text-[11px]">تعداد گوشه‌ها: {avaz.gushehs.length}</span>
                  <span className="text-amber-700 font-medium text-xs flex items-center gap-1">
                    <span>مشاهده نتها</span>
                    <ArrowLeft className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Pathway */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
            نقشه راه
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            مسیر پیشنهادی تسلط بر ردیف
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            مسیری اصولی برای نوآموزان و نوازندگان جهت ارتقای گام‌به‌گام حس شنوایی و اجرای دقیق فواصل ایرانی
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 relative">
            <span className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 text-xs font-bold flex items-center justify-center">
              ۱
            </span>
            <h3 className="font-bold text-stone-900 text-sm">درک فواصل و ربع‌پرده‌ها</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              آشنایی با علامت‌های کُرُن و سُری، تفاوت فواصل طنینی و مجنب، و تمرین شنوایی با سنتور شبیه‌ساز.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 relative">
            <span className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 text-xs font-bold flex items-center justify-center">
              ۲
            </span>
            <h3 className="font-bold text-stone-900 text-sm">درآمد و محور نغمگی</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              فهم نقش نت شاهد، نت ایست و فرود در درآمد دستگاه شور و ماهور همراه با زمزمه ملودیک.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 relative">
            <span className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 text-xs font-bold flex items-center justify-center">
              ۳
            </span>
            <h3 className="font-bold text-stone-900 text-sm">سیر گوشه‌ها و اوج</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              حرکت ملودی از درآمد به دانگ‌های بالاتر، اجرای گوشه‌های اوج نظیر قرچه، رضوی، بیداد و حجاز.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 relative">
            <span className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 text-xs font-bold flex items-center justify-center">
              ۴
            </span>
            <h3 className="font-bold text-stone-900 text-sm">سنجش و اجرای زنده با میکروفون</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              اجرای آواز و تک‌نوازی در میکروفون، مشاهده انحراف سنت لحظه‌ای و نمودار نوسان گام در تیونر.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Lessons & CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-700">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold text-amber-400 tracking-wide uppercase block">
              آماده شروع تمرین هستید؟
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">
              تطبیق صدای خود با نتهای پایه و ربع‌پرده‌های ردیف
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              بدون نیاز به نصب نرم‌افزار اضافی، میکروفون مرورگر خود را فعال کرده و فرکانس صدای خود را با سنتور سنتی ایرانی محک بزنید.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigate('exercise')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md"
            >
              <Mic className="w-4 h-4" />
              <span>ورود به محیط تمرین</span>
            </button>
            <button
              onClick={() => onNavigate('lessons')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-stone-800 hover:bg-stone-700 border border-stone-600 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-stone-300" />
              <span>مشاهده درس‌ها</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
