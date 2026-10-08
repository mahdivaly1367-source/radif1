/**
 * سیستم فواصل و محاسبات فرکانسی موسیقی ایرانی شامل ربع‌پرده‌ها (کُرُن و سُری)
 * استاندارد مرجع: A4 = 440 Hz و تقسیم گام بر مبنای اعتدال ربع‌پرده‌ای (24-Quarter Tone System)
 */

import { Accidental } from '../../types/music';

export interface NoteDefinition {
  nameFa: string;
  western: string;
  symbol: string;
  stepInOctave: number; // 0 to 23
  accidental: Accidental;
}

// ۲۴ ربع‌پرده در هر اکتاو
export const PERSIAN_OCTAVE_STEPS: NoteDefinition[] = [
  { nameFa: 'دو', western: 'C', symbol: 'C', stepInOctave: 0, accidental: 'natural' },
  { nameFa: 'دو سُری', western: 'C+', symbol: 'C𝄰', stepInOctave: 1, accidental: 'sori' },
  { nameFa: 'دو دیز / رِ بمل', western: 'C#/Db', symbol: 'C♯', stepInOctave: 2, accidental: 'sharp' },
  { nameFa: 'رِ کُرُن', western: 'Dd', symbol: 'D𝄳', stepInOctave: 3, accidental: 'koron' },
  { nameFa: 'رِ', western: 'D', symbol: 'D', stepInOctave: 4, accidental: 'natural' },
  { nameFa: 'رِ سُری', western: 'D+', symbol: 'D𝄰', stepInOctave: 5, accidental: 'sori' },
  { nameFa: 'رِ دیز / می بمل', western: 'D#/Eb', symbol: 'E♭', stepInOctave: 6, accidental: 'flat' },
  { nameFa: 'می کُرُن', western: 'Ed', symbol: 'E𝄳', stepInOctave: 7, accidental: 'koron' },
  { nameFa: 'می', western: 'E', symbol: 'E', stepInOctave: 8, accidental: 'natural' },
  { nameFa: 'فا کُرُن', western: 'Fd', symbol: 'F𝄳', stepInOctave: 9, accidental: 'koron' },
  { nameFa: 'فا', western: 'F', symbol: 'F', stepInOctave: 10, accidental: 'natural' },
  { nameFa: 'فا سُری', western: 'F+', symbol: 'F𝄰', stepInOctave: 11, accidental: 'sori' },
  { nameFa: 'فا دیز / سل بمل', western: 'F#/Gb', symbol: 'F♯', stepInOctave: 12, accidental: 'sharp' },
  { nameFa: 'سل کُرُن', western: 'Gd', symbol: 'G𝄳', stepInOctave: 13, accidental: 'koron' },
  { nameFa: 'سل', western: 'G', symbol: 'G', stepInOctave: 14, accidental: 'natural' },
  { nameFa: 'سل سُری', western: 'G+', symbol: 'G𝄰', stepInOctave: 15, accidental: 'sori' },
  { nameFa: 'سل دیز / لا بمل', western: 'G#/Ab', symbol: 'A♭', stepInOctave: 16, accidental: 'flat' },
  { nameFa: 'لا کُرُن', western: 'Ad', symbol: 'A𝄳', stepInOctave: 17, accidental: 'koron' },
  { nameFa: 'لا', western: 'A', symbol: 'A', stepInOctave: 18, accidental: 'natural' },
  { nameFa: 'لا سُری', western: 'A+', symbol: 'A𝄰', stepInOctave: 19, accidental: 'sori' },
  { nameFa: 'لا دیز / سی بمل', western: 'A#/Bb', symbol: 'B♭', stepInOctave: 20, accidental: 'flat' },
  { nameFa: 'سی کُرُن', western: 'Bd', symbol: 'B𝄳', stepInOctave: 21, accidental: 'koron' },
  { nameFa: 'سی', western: 'B', symbol: 'B', stepInOctave: 22, accidental: 'natural' },
  { nameFa: 'سی سُری / دو کُرُن', western: 'B+/Cd', symbol: 'B𝄰', stepInOctave: 23, accidental: 'sori' },
];

const A4_FREQUENCY = 440.0;
// A4 corresponds to Octave 4, step 18 in 24-quarter tone system (9 semitones above C4)
// C4 (Middle C) is at step 0 of Octave 4 (-18 quarter tones = -900 cents from A4).
// Each step = 50 cents = 2^(1/24)
export const STEP_RATIO = Math.pow(2, 1 / 24);

/**
 * محاسبه فرکانس یک نت خاص بر اساس گام و اکتاو
 */
export function getFrequency(stepInOctave: number, octave: number): number {
  // A4 is reference at octave 4, step 18
  const stepsFromC4 = (octave - 4) * 24 + stepInOctave;
  const stepsFromA4 = stepsFromC4 - 18;
  return A4_FREQUENCY * Math.pow(STEP_RATIO, stepsFromA4);
}

export interface NearestNoteMatch {
  frequency: number;
  targetFrequency: number;
  centsDeviation: number;
  nameFa: string;
  symbol: string;
  western: string;
  octave: number;
  accidental: Accidental;
  isInTune: boolean;
}

/**
 * تبدیل هر فرکانس به نزدیک‌ترین نت در سیستم موسیقی ایرانی همراه با خطای سنت
 */
export function findNearestPersianNote(frequency: number, toleranceCents = 18): NearestNoteMatch | null {
  if (frequency < 55 || frequency > 2200 || isNaN(frequency) || !isFinite(frequency)) {
    return null;
  }

  // محاسبه تعداد گام‌ها از A4 بر حسب ربع‌پرده‌ها (هر گام = ۵۰ سنت)
  const stepsFromA4 = Math.log(frequency / A4_FREQUENCY) / Math.log(STEP_RATIO);
  const roundedStepFromA4 = Math.round(stepsFromA4);

  // محاسبه انحراف به سنت (هر گام ربع‌پرده ۵۰ سنت است)
  const centsDeviation = Math.round((stepsFromA4 - roundedStepFromA4) * 50);

  // گام‌ها از C4 (A4 is 18 quarter tones above C4)
  const stepsFromC4 = roundedStepFromA4 + 18;
  
  // محاسبه اکتاو و موقعیت در اکتاو (۲۴ پله‌ای)
  let octave = 4 + Math.floor(stepsFromC4 / 24);
  let stepInOctave = ((stepsFromC4 % 24) + 24) % 24;

  const noteDef = PERSIAN_OCTAVE_STEPS[stepInOctave];
  const targetFrequency = getFrequency(stepInOctave, octave);

  return {
    frequency: Math.round(frequency * 10) / 10,
    targetFrequency: Math.round(targetFrequency * 10) / 10,
    centsDeviation,
    nameFa: `${noteDef.nameFa} ${octave}`,
    symbol: `${noteDef.symbol}${octave}`,
    western: `${noteDef.western}${octave}`,
    octave,
    accidental: noteDef.accidental,
    isInTune: Math.abs(centsDeviation) <= toleranceCents
  };
}

/**
 * دریافت فرکانس دقیق با نام فارسی یا نماد به همراه اکتاو
 * اولویت:
 * 1. استخراج اکتاو از انتهای نام (مانند "دو ۵" یا "C5" یا "لا ۴")
 * 2. نگاشت به فرکانس دقیق مدال در صورت تطابق با نتهای شاخص (مانند لا کُرُن در شور: ۴۲۶.۲Hz در اکتاو ۴)
 * 3. محاسبه فرکانس استاندارد با فرمول گام ۲۴ ربع‌پرده‌ای
 * 4. مقدار بازگشتی نهایی A4 = 440 Hz در صورت عدم تطابق
 */
export function getNoteFrequencyByName(nameOrSymbol: string, defaultOctave = 4): number {
  if (!nameOrSymbol) return 440.0;
  let clean = nameOrSymbol.trim();

  // تبدیل ارقام فارسی به انگلیسی: ۰-۹ به 0-9
  clean = clean.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  // بررسی وجود عدد اکتاو در انتهای رشته (مانند "دو 5" یا "C5" یا "لا کُرُن 4")
  let targetOctave = defaultOctave;
  const octaveMatch = clean.match(/^(.*?)\s*([0-8])$/);
  let baseName = clean;

  if (octaveMatch) {
    baseName = octaveMatch[1].trim();
    targetOctave = parseInt(octaveMatch[2], 10);
  }

  // حذف حرکات و اعراب اعم از فتحه و کسره و ضمه و فاصله‌های مجازی
  const normalizedBase = baseName
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[\u200c\u200b\u00a0]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();

  // بررسی فرکانس‌های خاص مدال ایرانی:
  // لا کُرُن شور: مبنای هرمز فرهت ۴۲۶.۲ هرتز در اکتاو ۴
  if (
    normalizedBase === 'لا کرن' ||
    normalizedBase === 'لا کُرُن' ||
    normalizedBase === 'Ad' ||
    normalizedBase === 'A𝄳'
  ) {
    const base4 = 426.2;
    return Math.round(base4 * Math.pow(2, targetOctave - 4) * 100) / 100;
  }

  // می کُرُن سه‌گاه: مبنای ۳۲۰.۲۴ هرتز در اکتاو ۴
  if (
    normalizedBase === 'می کرن' ||
    normalizedBase === 'می کُرُن' ||
    normalizedBase === 'Ed' ||
    normalizedBase === 'E𝄳'
  ) {
    const base4 = 320.24;
    return Math.round(base4 * Math.pow(2, targetOctave - 4) * 100) / 100;
  }

  // نگاشت نام‌های رایج بر پایه ۲۴ ربع‌پرده معتدل
  const mapping: Record<string, { step: number; octaveOffset: number }> = {
    'دو': { step: 0, octaveOffset: 0 },
    'C': { step: 0, octaveOffset: 0 },
    'دو سری': { step: 1, octaveOffset: 0 },
    'دو سُری': { step: 1, octaveOffset: 0 },
    'C+': { step: 1, octaveOffset: 0 },
    'C𝄰': { step: 1, octaveOffset: 0 },
    'دو دیز': { step: 2, octaveOffset: 0 },
    'C#': { step: 2, octaveOffset: 0 },
    'ر بمل': { step: 2, octaveOffset: 0 },
    'Db': { step: 2, octaveOffset: 0 },
    'ر کرن': { step: 3, octaveOffset: 0 },
    'رِ کُرُن': { step: 3, octaveOffset: 0 },
    'Dd': { step: 3, octaveOffset: 0 },
    'D𝄳': { step: 3, octaveOffset: 0 },
    'ر': { step: 4, octaveOffset: 0 },
    'رِ': { step: 4, octaveOffset: 0 },
    'D': { step: 4, octaveOffset: 0 },
    'ر سری': { step: 5, octaveOffset: 0 },
    'رِ سُری': { step: 5, octaveOffset: 0 },
    'D+': { step: 5, octaveOffset: 0 },
    'می بمل': { step: 6, octaveOffset: 0 },
    'Eb': { step: 6, octaveOffset: 0 },
    'می کرن': { step: 7, octaveOffset: 0 },
    'می کُرُن': { step: 7, octaveOffset: 0 },
    'Ed': { step: 7, octaveOffset: 0 },
    'E𝄳': { step: 7, octaveOffset: 0 },
    'می': { step: 8, octaveOffset: 0 },
    'E': { step: 8, octaveOffset: 0 },
    'فا کرن': { step: 9, octaveOffset: 0 },
    'فا کُرُن': { step: 9, octaveOffset: 0 },
    'فا': { step: 10, octaveOffset: 0 },
    'F': { step: 10, octaveOffset: 0 },
    'فا سری': { step: 11, octaveOffset: 0 },
    'فا سُری': { step: 11, octaveOffset: 0 },
    'F+': { step: 11, octaveOffset: 0 },
    'F𝄰': { step: 11, octaveOffset: 0 },
    'فا دیز': { step: 12, octaveOffset: 0 },
    'F#': { step: 12, octaveOffset: 0 },
    'سل بمل': { step: 12, octaveOffset: 0 },
    'Gb': { step: 12, octaveOffset: 0 },
    'سل کرن': { step: 13, octaveOffset: 0 },
    'سل کُرُن': { step: 13, octaveOffset: 0 },
    'Gd': { step: 13, octaveOffset: 0 },
    'G𝄳': { step: 13, octaveOffset: 0 },
    'سل': { step: 14, octaveOffset: 0 },
    'G': { step: 14, octaveOffset: 0 },
    'سل سری': { step: 15, octaveOffset: 0 },
    'سل سُری': { step: 15, octaveOffset: 0 },
    'G+': { step: 15, octaveOffset: 0 },
    'سل دیز': { step: 16, octaveOffset: 0 },
    'G#': { step: 16, octaveOffset: 0 },
    'لا بمل': { step: 16, octaveOffset: 0 },
    'Ab': { step: 16, octaveOffset: 0 },
    'لا کرن': { step: 17, octaveOffset: 0 },
    'لا کُرُن': { step: 17, octaveOffset: 0 },
    'Ad': { step: 17, octaveOffset: 0 },
    'A𝄳': { step: 17, octaveOffset: 0 },
    'لا': { step: 18, octaveOffset: 0 },
    'A': { step: 18, octaveOffset: 0 },
    'لا سری': { step: 19, octaveOffset: 0 },
    'لا سُری': { step: 19, octaveOffset: 0 },
    'A+': { step: 19, octaveOffset: 0 },
    'لا دیز': { step: 20, octaveOffset: 0 },
    'A#': { step: 20, octaveOffset: 0 },
    'سی بمل': { step: 20, octaveOffset: 0 },
    'Bb': { step: 20, octaveOffset: 0 },
    'سی کرن': { step: 21, octaveOffset: 0 },
    'سی کُرُن': { step: 21, octaveOffset: 0 },
    'Bd': { step: 21, octaveOffset: 0 },
    'B𝄳': { step: 21, octaveOffset: 0 },
    'سی': { step: 22, octaveOffset: 0 },
    'B': { step: 22, octaveOffset: 0 },
    'سی سری': { step: 23, octaveOffset: 0 },
    'سی سُری': { step: 23, octaveOffset: 0 },
    'دو کرن': { step: 23, octaveOffset: 0 },
  };

  const found = mapping[baseName] || mapping[normalizedBase];
  if (found) {
    const calculated = getFrequency(found.step, targetOctave + found.octaveOffset);
    return Math.round(calculated * 100) / 100;
  }

  // fallback to standard A4 (با تغییر اکتاو در صورت لزوم)
  return Math.round(A4_FREQUENCY * Math.pow(2, targetOctave - 4) * 100) / 100;
}
