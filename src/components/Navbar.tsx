import React, { useState } from 'react';
import { Music, Mic, BookOpen, Layers, Award, Menu, X, Volume2 } from 'lucide-react';

export type PageRoute = 'home' | 'dastgahs' | 'lessons' | 'exercise' | 'progress' | 'dastgah_detail' | 'lesson_detail' | 'qa';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (path: string) => void;
  isMicActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, isMicActive }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageRoute; path: string; label: string; icon: React.ReactNode }[] = [
    { id: 'home', path: '/home', label: 'صفحه اصلی', icon: <Music className="w-4 h-4" /> },
    { id: 'dastgahs', path: '/dastgahs', label: 'دستگاه‌ها و آوازها', icon: <Layers className="w-4 h-4" /> },
    { id: 'lessons', path: '/lessons', label: 'درس‌های ردیف', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'exercise', path: '/exercise', label: 'کارگاه تمرین و تحلیل صوت', icon: <Mic className="w-4 h-4" /> },
    { id: 'progress', path: '/progress', label: 'پیشرفت من', icon: <Award className="w-4 h-4" /> },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('/home')}
              className="flex items-center gap-2.5 text-right group text-amber-400 hover:text-amber-300 transition-colors focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white block">
                  رَدیفستان
                </span>
                <span className="text-[10px] text-stone-400 block -mt-1 font-medium">
                  آموزش تخصصی دستگاه‌ها و ردیف موسیقی ایرانی
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const active =
                currentRoute === item.id ||
                (item.id === 'dastgahs' && currentRoute === 'dastgah_detail') ||
                (item.id === 'lessons' && currentRoute === 'lesson_detail');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                    active
                      ? 'bg-stone-800 text-amber-400 shadow-sm border border-stone-700'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Status */}
          <div className="flex items-center gap-3">
            {isMicActive && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                میکروفون فعال
              </span>
            )}

            <button
              onClick={() => handleNavClick('/exercise')}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-md transition-colors shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>ورود به کارگاه صدا</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 focus:outline-none"
              aria-label="باز کردن منو"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-800 bg-stone-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const active =
              currentRoute === item.id ||
              (item.id === 'dastgahs' && currentRoute === 'dastgah_detail') ||
              (item.id === 'lessons' && currentRoute === 'lesson_detail');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-right transition-colors ${
                  active
                    ? 'bg-stone-800 text-amber-400'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2">
            <button
              onClick={() => handleNavClick('/exercise')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors"
            >
              <Mic className="w-4 h-4" />
              <span>شروع تحلیل زنده صدا</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
