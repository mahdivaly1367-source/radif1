/**
 * ذخیره‌سازی وضعیت یادگیری، سوابق تمرین و پیشرفت کاربر در LocalStorage
 * با رابط ماژولار جهت سهولت در اتصال به Firebase / Cloud Backend در فازهای بعدی
 */

import { UserProgress, UserPracticeAttempt } from '../types/music';

const STORAGE_KEY = 'radif_learning_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  completedLessonIds: [],
  practiceAttempts: [],
  totalPracticeTimeSeconds: 0,
  dastgahMastery: {
    shour: 10,
    mahour: 0,
    homayoun: 0,
    segah: 0,
    chahargah: 0,
    nava: 0,
    rastpanjgah: 0,
    abouata: 0,
    dashti: 0,
    afshari: 0,
    bayat_tork: 0,
    esfahan: 0,
  },
  lastActiveTimestamp: Date.now(),
};

export class ProgressStorage {
  public static getProgress(): UserProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_PROGRESS;
      return { ...DEFAULT_PROGRESS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  public static saveProgress(progress: UserProgress): void {
    try {
      progress.lastActiveTimestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.warn('Could not save progress to localStorage:', err);
    }
  }

  public static markLessonCompleted(lessonId: string): UserProgress {
    const current = this.getProgress();
    if (!current.completedLessonIds.includes(lessonId)) {
      current.completedLessonIds.push(lessonId);
      this.saveProgress(current);
    }
    return current;
  }

  public static recordPracticeAttempt(attempt: Omit<UserPracticeAttempt, 'id' | 'timestamp'>): UserPracticeAttempt {
    const current = this.getProgress();
    const fullAttempt: UserPracticeAttempt = {
      ...attempt,
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };

    current.practiceAttempts.unshift(fullAttempt);
    current.totalPracticeTimeSeconds += attempt.durationSeconds;

    // به‌روزرسانی درصد تسلط بر دستگاه
    this.saveProgress(current);
    return fullAttempt;
  }

  public static updateDastgahMastery(dastgahId: string, percentage: number): void {
    const current = this.getProgress();
    current.dastgahMastery[dastgahId] = Math.max(0, Math.min(100, percentage));
    this.saveProgress(current);
  }

  public static resetProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
