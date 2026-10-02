/**
 * سامانه مسیریابی استاندارد مرورگر (Browser History Routing)
 * پشتیبانی کامل از Back/Forward، آدرس‌های مستقیم (Direct URLs) و حفظ وضعیت با Refresh
 */

import { useEffect, useState } from 'react';

export type AppRouteName =
  | 'home'
  | 'dastgahs'
  | 'dastgah_detail'
  | 'lessons'
  | 'lesson_detail'
  | 'exercise'
  | 'progress'
  | 'qa';

export interface RouteState {
  routeName: AppRouteName;
  path: string;
  params: {
    dastgahId?: string;
    lessonId?: string;
    exerciseId?: string;
  };
}

type RouteListener = (route: RouteState) => void;
const listeners = new Set<RouteListener>();

/**
 * تبدیل مسیر URL مرورگر به وضعیت RouteState
 */
export function parseCurrentLocation(): RouteState {
  if (typeof window === 'undefined') {
    return { routeName: 'home', path: '/home', params: {} };
  }

  // بررسی هم pathname و هم hash (جهت پشتیبانی از هر دو حالت در محیط‌های iframe)
  let rawPath = window.location.pathname;
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    rawPath = window.location.hash.substring(1);
  }

  const cleanPath = rawPath.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);

  // تطبیق الگوهای URL
  if (cleanPath === '/' || cleanPath === '/home') {
    return { routeName: 'home', path: '/home', params: {} };
  }

  if (cleanPath === '/dastgahs') {
    return { routeName: 'dastgahs', path: '/dastgahs', params: {} };
  }

  const dastgahMatch = cleanPath.match(/^\/dastgahs\/([a-zA-Z0-9_-]+)$/);
  if (dastgahMatch) {
    return {
      routeName: 'dastgah_detail',
      path: cleanPath,
      params: { dastgahId: dastgahMatch[1] },
    };
  }

  if (cleanPath === '/lessons') {
    return { routeName: 'lessons', path: '/lessons', params: {} };
  }

  const lessonMatch = cleanPath.match(/^\/lessons\/([a-zA-Z0-9_-]+)$/);
  if (lessonMatch) {
    return {
      routeName: 'lesson_detail',
      path: cleanPath,
      params: { lessonId: lessonMatch[1] },
    };
  }

  const exerciseMatch = cleanPath.match(/^\/exercise(?:\/([a-zA-Z0-9_-]+))?$/);
  if (exerciseMatch) {
    const exId = exerciseMatch[1] || searchParams.get('id') || undefined;
    return {
      routeName: 'exercise',
      path: cleanPath,
      params: { exerciseId: exId },
    };
  }

  if (cleanPath === '/progress') {
    return { routeName: 'progress', path: '/progress', params: {} };
  }

  if (cleanPath === '/qa') {
    return { routeName: 'qa', path: '/qa', params: {} };
  }

  // fallback به صفحه اصلی
  return { routeName: 'home', path: '/home', params: {} };
}

/**
 * هدایت به مسیر جدید با بروزرسانی History API مرورگر
 */
export function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;

  const current = window.location.pathname;
  if (current !== path) {
    window.history.pushState({}, '', path);
  }

  const nextState = parseCurrentLocation();
  listeners.forEach((listener) => listener(nextState));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ثبت شنونده رویداد popstate برای دکمه‌های Back/Forward مرورگر
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const nextState = parseCurrentLocation();
    listeners.forEach((listener) => listener(nextState));
  });
}

/**
 * هوک React برای اشتراک در وضعیت مسیر فعلی
 */
export function useAppRouter(): {
  route: RouteState;
  navigate: (path: string) => void;
} {
  const [route, setRoute] = useState<RouteState>(() => parseCurrentLocation());

  useEffect(() => {
    const handler: RouteListener = (newRoute) => {
      setRoute(newRoute);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return { route, navigate: navigateTo };
}
