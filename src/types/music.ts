/**
 * تعاریف مدل‌های داده برای سیستم آموزش موسیقی سنتی ایرانی، ردیف، دستگاه‌ها و گوشه‌ها
 * همراه با معماری سه‌لایه‌ای تحلیل صوت (Raw Pitch -> Tuning Profile -> Musical Interpretation)
 */

export type Accidental = 'natural' | 'koron' | 'sori' | 'flat' | 'sharp';

export interface PersianNote {
  nameFa: string;          // e.g. "می کُرُن"
  symbol: string;          // e.g. "E𝄳" or "Ed"
  westernBase: string;     // e.g. "E"
  accidental: Accidental;  // e.g. 'koron'
  frequency: number;       // فرکانس مرجع (Hz)
  octave: number;          // e.g. 4
  centsFromC0?: number;    // برای محاسبات دقیق فواصل
}

export type DastgahCategory = 'dastgah' | 'avaz';

export interface SourceAttribution {
  sourceName: string;           // e.g. "ردیف میرزا عبدالله به روایت نورعلی برومند"
  sourceType: 'radif_mirza_abdollah' | 'radif_karimi' | 'musicological_study' | 'pedagogical_adaptation';
  referenceMaster?: string;     // e.g. "نورعلی برومند / داریوش طلایی / هرمز فرهت"
  notes?: string;               // یادداشت‌های تطبیقی
}

export interface Gusheh {
  id: string;
  nameFa: string;
  nameEn: string;
  role: 'درآمد' | 'آواز' | 'اوج' | 'فرود' | 'کرشمه' | 'حزین' | 'رنگ' | 'چهارمضراب' | 'ضربی';
  description: string;
  melodicRange: string;         // e.g. "دانگ اول، از سل تا دو"
  shahedNote: string;           // نت شاهد (مرکز ثقل نغمه)
  istNote: string;              // نت ایست (نقطه توقف موقت یا نهایی)
  motegheyerNote?: string;      // نت متغیر در صورت وجود
  foroodNote?: string;          // نت فرود
  rhythmicType: 'آوازی (غیر ضربی)' | 'متریک (ضربی)' | 'نیمه متریک';
  sampleMelodyNotes?: string[]; // توالی نتها برای شبیه‌ساز صوتی
  orderIndex: number;
  sourceAttribution?: SourceAttribution;
}

export interface Dastgah {
  id: string;
  type: DastgahCategory;
  nameFa: string;
  nameEn: string;
  parentDastgahId?: string;     // برای آوازها: مثلاً شور برای ابوعطا
  parentDastgahNameFa?: string;
  characterFa: string;          // حس و حال نغمه
  shortDescription: string;
  fullHistory: string;
  scaleDescription: string;
  tonicNote: string;            // نت پایه / تونیک
  scaleNotes: {
    noteNameFa: string;
    roleInScale: 'پایه' | 'شاهد درآمد' | 'ایست' | 'متغیر' | 'محسوس' | 'معمولی';
    accidental?: Accidental;
  }[];
  tuningTarSetar: string;       // کوک معمول تار یا سه‌تار
  tuningSantur: string;         // کوک سنتور
  gushehs: Gusheh[];
  suggestedLearningPath: string[];
  sourceAttribution?: SourceAttribution;
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
    intervals: string;
  };
  audioGuide: {
    description: string;
    notesSequence: { note: string; duration: number }[];
    tempoBpm: number;
  };
  performanceTips: string[];
  associatedExerciseId: string;
  sourceAttribution?: SourceAttribution;
}

export interface ExerciseTargetNote {
  noteFa: string;
  westernName: string;
  frequencyHz: number;
  durationMs: number;
  accidental: Accidental;
  centsTolerance: number;       // حد خطای مجاز سنت (پیش‌فرض ±20 سنت)
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
  passingScore: number;
  instructionSteps: string[];
  tuningProfileId?: string;     // شناسه پروفایل کوک مرجع برای این تمرین
}

// ==========================================
// معماری سه‌لایه‌ای تحلیل صوت (PITCH ENGINE)
// ==========================================

/**
 * لایه ۱: فرکانس خام آکوستیک (Raw Pitch)
 * صرفاً بیانگر این است که حنجره یا ساز چه فرکانسی را با چه شدتی تولید کرده است.
 */
export interface RawPitchResult {
  frequencyHz: number;          // فرکانس فیزیکی تخمین‌زده‌شده به هرتز
  confidence: number;           // میزان قطعیت سیگنال (بین ۰ تا ۱)
  rmsVolume: number;            // حجم انرژی صدا (بین ۰ تا ۱)
  timestamp: number;            // زمان ثبت سمپل (ms)
  isVoiced: boolean;            // آیا سیگنال صوتی واک‌دار است یا نویز/سکوت؟
  periodSamples?: number;       // پریود پایه بر حسب تعداد نمونه
}

/**
 * نت منفرد درون یک پروفایل کوک
 */
export interface TuningProfileNote {
  nameFa: string;               // e.g. "لا کُرُن ۴"
  symbol: string;               // e.g. "A𝄳4"
  westernBase: string;          // e.g. "A"
  frequencyHz: number;          // فرکانس دقیق مرجع بر اساس این پروفایل
  centsOffsetFrom12TET: number; // انحراف سنت از گام معتدل ۱۲ نیم‌پرده‌ای
  octave: number;
  accidental: Accidental;
  roleInMode?: 'پایه' | 'شاهد' | 'ایست' | 'متغیر' | 'محسوس' | 'معمولی';
}

/**
 * لایه ۲: پروفایل کوک و مرجع موسیقایی (Pitch Reference / Tuning Profile)
 * مرجعی که فرکانس کاربر با آن سنجیده می‌شود (۲۴ ربع‌پرده‌ای، کوک سنتی دستگاه، یا کوک استاد خاص)
 */
export interface TuningProfile {
  id: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  baseFrequencyHz: number;      // معمولاً A4 = 440 Hz
  tuningType: '24-TET' | 'modal_persian' | 'custom';
  dastgahId?: string;
  gushehId?: string;
  sourceCitation: string;       // منبع فواصل (مثلاً "نظریه علینقی وزیری" یا "تحلیل آکوستیک هرمز فرهت")
  notes: TuningProfileNote[];
}

/**
 * لایه ۳: تفسیر موسیقایی (Musical Interpretation)
 * نگاشت فرکانس فیزیکی به نغمه، نقش دستگاه، درصد انحراف سنت، وضعیت کوک و امتیاز
 */
export interface MusicalInterpretation {
  rawPitch: RawPitchResult;
  matchedNote: TuningProfileNote;
  targetFrequencyHz: number;
  centsDeviation: number;       // انحراف به سنت (-50 تا +50 نسبت به نت مرجع)
  isInTune: boolean;
  toleranceCents: number;
  tuningProfileId: string;
  tuningProfileNameFa: string;
  directionAdvice: 'higher' | 'lower' | 'in_tune';
  score: number;                // نمره تطابق ۰ تا ۱۰۰
}

// ساختار پیشین برای سازگاری عقب‌رو (Backward compatibility)
export interface PitchDetectionResult {
  frequency: number;
  closestNoteFa: string;
  closestWesternNote: string;
  octave: number;
  centsDeviation: number;
  isInTune: boolean;
  confidence: number;
  volume: number;
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
  dastgahMastery: Record<string, number>;
  lastActiveTimestamp: number;
}
