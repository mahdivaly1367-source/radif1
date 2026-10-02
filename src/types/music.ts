/**
 * تعاریف مدل‌های داده برای سیستم آموزش موسیقی سنتی ایرانی، ردیف، دستگاه‌ها و گوشه‌ها
 */

export type Accidental = 'natural' | 'koron' | 'sori' | 'flat' | 'sharp';

export interface PersianNote {
  nameFa: string;          // e.g. "می کُرُن"
  symbol: string;          // e.g. "E𝄳" or "Ed"
  westernBase: string;     // e.g. "E"
  accidental: Accidental;  // e.g. 'koron'
  frequency: number;       // e.g. 311.13 for Eb, or 320.24 for E koron in 4th octave
  octave: number;          // e.g. 4
  centsFromC0: number;     // برای محاسبات دقیق فواصل
}

export type DastgahCategory = 'dastgah' | 'avaz';

export interface Gusheh {
  id: string;
  nameFa: string;
  nameEn: string;
  role: 'درآمد' | 'آواز' | 'اوج' | 'فرود' | 'کرشمه' | 'حزین' | 'رنگ' | 'چهارمضراب' | 'ضربی';
  description: string;
  melodicRange: string;     // e.g. "دانگ اول، از سل تا دو"
  shahedNote: string;       // نت شاهد (مرکز ثقل نغمه)
  istNote: string;          // نت ایست (نقطه توقف موقت یا نهایی)
  motegheyerNote?: string;  // نت متغیر در صورت وجود
  foroodNote?: string;      // نت فرود
  rhythmicType: 'آوازی (غیر ضربی)' | 'متریک (ضربی)' | 'نیمه متریک';
  sampleMelodyNotes?: string[]; // توالی نتها برای شبیه‌ساز صوتی
  orderIndex: number;
}

export interface Dastgah {
  id: string;
  type: DastgahCategory;
  nameFa: string;
  nameEn: string;
  parentDastgahId?: string; // برای آوازها: مثلاً شور برای ابوعطا، همایون برای اصفهان
  parentDastgahNameFa?: string;
  characterFa: string;      // حس و حال: حزن، شور، تفکر، شکوه، آرامش...
  shortDescription: string;
  fullHistory: string;
  scaleDescription: string;
  tonicNote: string;        // نت پایه / پایه دستگاه مثلاً "شور سل" یا "ماهور دو"
  scaleNotes: {
    noteNameFa: string;
    roleInScale: 'پایه' | 'شاهد درآمد' | 'ایست' | 'متغیر' | 'محسوس' | 'معمولی';
    accidental?: Accidental;
  }[];
  tuningTarSetar: string;   // کوک معمول تار یا سه‌تار (مثلاً "دو - سل - دو - دو")
  tuningSantur: string;     // کوک سنتور (مثلاً "راست‌کوک سل / چپ‌کوک دو")
  gushehs: Gusheh[];
  suggestedLearningPath: string[]; // توالی پیشنهادی یادگیری گوشه‌ها
}

export interface Lesson {
  id: string;
  dastgahId: string;
  gushehId?: string;
  titleFa: string;
  subtitleFa: string;
  level: 'مقدماتی' | 'متوسط' | 'پیشرفته';
  estimatedMinutes: number;
  order: number;
  introduction: string;
  keyConcepts: {
    title: string;
    explanation: string;
  }[];
  scaleAnalysis: {
    title: string;
    notesDescription: string;
    intervals: string; // فواصل به پرده و نیم‌پرده و ربع‌پرده
  };
  audioGuide: {
    description: string;
    notesSequence: { note: string; duration: number }[]; // برای سینت سایزر داخلی
    tempoBpm: number;
  };
  performanceTips: string[];
  associatedExerciseId: string;
}

export interface ExerciseTargetNote {
  noteFa: string;
  westernName: string;
  frequencyHz: number;
  durationMs: number;
  accidental: Accidental;
  centsTolerance: number; // پیش‌فرض ±30 سنت
}

export interface Exercise {
  id: string;
  lessonId: string;
  dastgahId: string;
  titleFa: string;
  descriptionFa: string;
  difficulty: 'ساده' | 'متوسط' | 'چالش‌برانگیز';
  type: 'single_note' | 'interval' | 'melody_phrase';
  targetNotes: ExerciseTargetNote[];
  passingScore: number; // e.g. 70 out of 100
  instructionSteps: string[];
}

export interface PitchDetectionResult {
  frequency: number;        // هرتز واقعی تشخیص داده شده
  closestNoteFa: string;    // نام فارسی نزدیک‌ترین نت
  closestWesternNote: string; // نام غربی با نشان ربع‌پرده
  octave: number;
  centsDeviation: number;   // میزان انحراف از نت خالص (-50 تا +50)
  isInTune: boolean;        // آیا در محدوده خطای مجاز قرار دارد؟
  confidence: number;       // میزان اطمینان از وضوح سیگنال (0 تا 1)
  volume: number;           // سطح صدا (RMS نرمالایز شده بین 0 تا 1)
}

export interface UserPracticeAttempt {
  id: string;
  exerciseId: string;
  timestamp: number;
  score: number;
  averageCentsDeviation: number;
  durationSeconds: number;
  passed: boolean;
}

export interface UserProgress {
  completedLessonIds: string[];
  practiceAttempts: UserPracticeAttempt[];
  totalPracticeTimeSeconds: number;
  dastgahMastery: Record<string, number>; // dastgahId -> 0-100%
  lastActiveTimestamp: number;
}
