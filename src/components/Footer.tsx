import React from 'react';
import { Music, Heart, Volume2 } from 'lucide-react';
import { PageRoute } from './Navbar';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-stone-900 border-t border-stone-800 text-stone-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          {/* Col 1 */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Music className="w-5 h-5" />
              <span>پایگاه آموزش ردیف و آواز ایرانی</span>
            </div>
            <p className="text-xs leading-relaxed text-stone-400">
              سامانه تعاملی یادگیری گوشه‌ها، دستگاه‌ها و نغمات موسیقی اصیل ایران بر پایه سنتور، تار و تحلیل صوتی فرکانسی با استانداردهای ربع‌پرده‌ای.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-semibold text-stone-200 tracking-wider mb-3">دستگاه‌های هفت‌گانه</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('/dastgahs/shour')} className="hover:text-amber-400 transition-colors">
                  دستگاه شور (مادر دستگاه‌ها)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dastgahs/mahour')} className="hover:text-amber-400 transition-colors">
                  دستگاه ماهور (گام ماژور)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dastgahs/homayoun')} className="hover:text-amber-400 transition-colors">
                  دستگاه همایون و بیداد
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dastgahs/segah')} className="hover:text-amber-400 transition-colors">
                  دستگاه سه‌گاه (نت می کُرُن)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-semibold text-stone-200 tracking-wider mb-3">آوازهای وابسته</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('/dastgahs/abouata')} className="hover:text-amber-400 transition-colors">
                  آواز ابوعطا (گوشه حجاز)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dastgahs/dashti')} className="hover:text-amber-400 transition-colors">
                  آواز دشتی (نغمه سوزناک)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dastgahs/bayat_tork')} className="hover:text-amber-400 transition-colors">
                  آواز بیات تُرک و شکسته
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dastgahs/esfahan')} className="hover:text-amber-400 transition-colors">
                  آواز بیات اصفهان (لطافت عاشقانه)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-semibold text-stone-200 tracking-wider mb-3">سیستم صوتی و تمرین</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('/exercise')} className="hover:text-amber-400 transition-colors">
                  کارگاه زنده تحلیل Pitch و فرکانس
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/lessons')} className="hover:text-amber-400 transition-colors">
                  فهرست درس‌های آموزشی ردیف
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/progress')} className="hover:text-amber-400 transition-colors">
                  کارنامه و سوابق تمرین
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/qa')} className="text-amber-500/80 hover:text-amber-400 transition-colors font-mono">
                  ابزار عیب‌یابی و مانیتورینگ QA
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p>© ردیفستان — آموزش عملی و تحلیل آکوستیک ردیف موسیقی ایرانی</p>
          <div className="flex items-center gap-1">
            <span>طراحی شده با احترام به میراث باربد و فارابی</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
