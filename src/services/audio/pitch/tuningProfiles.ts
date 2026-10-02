/**
 * لایه ۲: پروفایل‌های کوک و مراجع موسیقایی (Tuning Profiles)
 * 
 * توجه مهم در موسیقی‌شناسی:
 * سیستم ۲۴ ربع‌پرده‌ای معتدل (24-TET) یک «مدل نظری مرجع» برای نت‌نگاری و آموزش آکادمیک (وزیری) است.
 * در ردیف سنتی و اجرای اساتید، فواصل خنثی (مانند لا کُرُن در شور یا می کُرُن در سه‌گاه)
 * لزوماً مضرب ۵۰ سنت نیستند و بر اساس مکتب، ساز و گردش نغمه تغییر می‌کنند.
 */

import { TuningProfile, TuningProfileNote } from '../../../types/music';

const A4_STANDARD = 440.0;
const STEP_24_RATIO = Math.pow(2, 1 / 24);

/**
 * تولید خودکار نتهای مدل نظری ۲۴ ربع‌پرده‌ای (24-TET Vaziri Reference)
 */
function build24TETNotes(baseFreq = A4_STANDARD): TuningProfileNote[] {
  const noteNames: { fa: string; sym: string; base: string; acc: TuningProfileNote['accidental']; step: number }[] = [
    { fa: 'دو', sym: 'C', base: 'C', acc: 'natural', step: 0 },
    { fa: 'دو سُری', sym: 'C𝄰', base: 'C', acc: 'sori', step: 1 },
    { fa: 'دو دیز / رِ بمل', sym: 'C♯', base: 'C', acc: 'sharp', step: 2 },
    { fa: 'رِ کُرُن', sym: 'D𝄳', base: 'D', acc: 'koron', step: 3 },
    { fa: 'رِ', sym: 'D', base: 'D', acc: 'natural', step: 4 },
    { fa: 'رِ سُری', sym: 'D𝄰', base: 'D', acc: 'sori', step: 5 },
    { fa: 'می بمل', sym: 'E♭', base: 'E', acc: 'flat', step: 6 },
    { fa: 'می کُرُن', sym: 'E𝄳', base: 'E', acc: 'koron', step: 7 },
    { fa: 'می', sym: 'E', base: 'E', acc: 'natural', step: 8 },
    { fa: 'فا', sym: 'F', base: 'F', acc: 'natural', step: 9 },
    { fa: 'فا سُری', sym: 'F𝄰', base: 'F', acc: 'sori', step: 10 },
    { fa: 'فا دیز', sym: 'F♯', base: 'F', acc: 'sharp', step: 11 },
    { fa: 'سل کُرُن', sym: 'G𝄳', base: 'G', acc: 'koron', step: 12 },
    { fa: 'سل', sym: 'G', base: 'G', acc: 'natural', step: 13 },
    { fa: 'سل سُری', sym: 'G𝄰', base: 'G', acc: 'sori', step: 14 },
    { fa: 'لا بمل', sym: 'A♭', base: 'A', acc: 'flat', step: 15 },
    { fa: 'لا کُرُن', sym: 'A𝄳', base: 'A', acc: 'koron', step: 16 },
    { fa: 'لا', sym: 'A', base: 'A', acc: 'natural', step: 17 },
    { fa: 'لا سُری', sym: 'A𝄰', base: 'A', acc: 'sori', step: 18 },
    { fa: 'سی بمل', sym: 'B♭', base: 'B', acc: 'flat', step: 19 },
    { fa: 'سی کُرُن', sym: 'B𝄳', base: 'B', acc: 'koron', step: 20 },
    { fa: 'سی', sym: 'B', base: 'B', acc: 'natural', step: 21 },
    { fa: 'دو کُرُن', sym: 'C𝄳', base: 'C', acc: 'koron', step: 22 },
    { fa: 'سی سُری', sym: 'B𝄰', base: 'B', acc: 'sori', step: 23 },
  ];

  const notes: TuningProfileNote[] = [];

  // پوشش اکتاوهای ۳ تا ۵ (بازه اصلی آواز و ساز)
  for (let octave = 3; octave <= 5; octave++) {
    for (const def of noteNames) {
      // تعداد پله از A4 (اکتاو ۴، پله ۱۷)
      const stepsFromC4 = (octave - 4) * 24 + def.step;
      const stepsFromA4 = stepsFromC4 - 17;
      const freq = baseFreq * Math.pow(STEP_24_RATIO, stepsFromA4);
      const centsFrom12TET = (def.step % 2) !== 0 ? -50 : 0; // تقریب انحراف ربع‌پرده

      notes.push({
        nameFa: `${def.fa} ${octave}`,
        symbol: `${def.sym}${octave}`,
        westernBase: def.base,
        frequencyHz: Math.round(freq * 100) / 100,
        centsOffsetFrom12TET: centsFrom12TET,
        octave,
        accidental: def.acc,
      });
    }
  }

  return notes;
}

/**
 * ۱. مدل نظری ۲۴ ربع‌پرده‌ای معتدل وزیری (24-TET Reference)
 */
export const VAZIRI_24TET_PROFILE: TuningProfile = {
  id: 'profile_24tet_vaziri',
  nameFa: 'مدل مرجع ۲۴ ربع‌پرده‌ای (علینقی وزیری)',
  nameEn: '24-TET Academic Theoretical Model',
  descriptionFa: 'تقسیم اکتاو به ۲۴ ربع‌پرده مساوی (هر ربع‌پرده دقیقاً ۵۰ سنت). این مدل به عنوان یک استاندارد آکادمیک اولیه برای آموزش و نت‌نگاری استفاده می‌شود.',
  baseFrequencyHz: A4_STANDARD,
  tuningType: '24-TET',
  sourceCitation: 'دستور تار و سه تار — علینقی وزیری (۱۳۰۱) و روح‌الله خالقی',
  notes: build24TETNotes(A4_STANDARD),
};

/**
 * ۲. پروفایل مدال دستگاه شور با فواصل سنتی (Traditional Shour Acoustic Profile)
 * با فاصله خنثی واقعی برای نت لا کُرُن (~۱۴۵ سنت بالاتر از سل، نه ۵۰ سنت جبری)
 */
export const SHOUR_MODAL_PROFILE: TuningProfile = {
  id: 'profile_shour_modal',
  nameFa: 'کوک سنتی مدال دستگاه شور (سل)',
  nameEn: 'Traditional Shour G Modal Tuning',
  descriptionFa: 'انطباق آکوستیک با ردیف سازی و آوازی شور سل. فاصله سل تا لا کُرُن حدود ۱۴۵ سنت (مجنب/لیمای ایرانی) و سی بمل حدود ۲۹۴ سنت است.',
  baseFrequencyHz: A4_STANDARD,
  tuningType: 'modal_persian',
  dastgahId: 'shour',
  sourceCitation: 'The Dastgah Concept in Persian Music — هرمز فرهت و ردیف آوازی محمود کریمی',
  notes: [
    {
      nameFa: 'سل ۴',
      symbol: 'G4',
      westernBase: 'G',
      frequencyHz: 392.0,
      centsOffsetFrom12TET: 0,
      octave: 4,
      accidental: 'natural',
      roleInMode: 'پایه',
    },
    {
      nameFa: 'لا کُرُن ۴ (مدال شور)',
      symbol: 'A𝄳4',
      westernBase: 'A',
      frequencyHz: 426.2, // ~145 سنت بالای سل (به جای 150 سنت 24-TET)
      centsOffsetFrom12TET: -55,
      octave: 4,
      accidental: 'koron',
      roleInMode: 'شاهد',
    },
    {
      nameFa: 'سی بمل ۴',
      symbol: 'B♭4',
      westernBase: 'B',
      frequencyHz: 466.16,
      centsOffsetFrom12TET: 0,
      octave: 4,
      accidental: 'flat',
      roleInMode: 'معمولی',
    },
    {
      nameFa: 'دو ۵',
      symbol: 'C5',
      westernBase: 'C',
      frequencyHz: 523.25,
      centsOffsetFrom12TET: 0,
      octave: 5,
      accidental: 'natural',
      roleInMode: 'ایست',
    },
    {
      nameFa: 'رِ ۵',
      symbol: 'D5',
      westernBase: 'D',
      frequencyHz: 587.33,
      centsOffsetFrom12TET: 0,
      octave: 5,
      accidental: 'natural',
      roleInMode: 'متغیر',
    },
    {
      nameFa: 'می بمل ۵',
      symbol: 'E♭5',
      westernBase: 'E',
      frequencyHz: 622.25,
      centsOffsetFrom12TET: 0,
      octave: 5,
      accidental: 'flat',
      roleInMode: 'معمولی',
    },
    {
      nameFa: 'فا ۵',
      symbol: 'F5',
      westernBase: 'F',
      frequencyHz: 698.46,
      centsOffsetFrom12TET: 0,
      octave: 5,
      accidental: 'natural',
      roleInMode: 'محسوس',
    },
  ],
};

/**
 * ۳. پروفایل مدال دستگاه سه‌گاه با فاصله سوم خنثی (Neutral Third Segah Profile)
 */
export const SEGAH_MODAL_PROFILE: TuningProfile = {
  id: 'profile_segah_modal',
  nameFa: 'کوک سنتی مدال دستگاه سه‌گاه (می کُرُن)',
  nameEn: 'Traditional Segah Modal Tuning',
  descriptionFa: 'فواصل سه‌گاه با تکیه بر نت می کُرُن به عنوان مرکز ثقل و فاصله سوم خنثی (~۳۵۰ سنت نسبت به دو).',
  baseFrequencyHz: A4_STANDARD,
  tuningType: 'modal_persian',
  dastgahId: 'segah',
  sourceCitation: 'تحلیل ردیف موسیقی ایران — داریوش طلایی و ردیف میرزا عبدالله',
  notes: [
    {
      nameFa: 'دو ۴',
      symbol: 'C4',
      westernBase: 'C',
      frequencyHz: 261.63,
      centsOffsetFrom12TET: 0,
      octave: 4,
      accidental: 'natural',
      roleInMode: 'معمولی',
    },
    {
      nameFa: 'رِ کُرُن ۴',
      symbol: 'D𝄳4',
      westernBase: 'D',
      frequencyHz: 285.3,
      centsOffsetFrom12TET: -50,
      octave: 4,
      accidental: 'koron',
      roleInMode: 'محسوس',
    },
    {
      nameFa: 'می کُرُن ۴ (شاهد سه‌گاه)',
      symbol: 'E𝄳4',
      westernBase: 'E',
      frequencyHz: 320.24,
      centsOffsetFrom12TET: -45,
      octave: 4,
      accidental: 'koron',
      roleInMode: 'پایه',
    },
    {
      nameFa: 'فا ۴',
      symbol: 'F4',
      westernBase: 'F',
      frequencyHz: 349.23,
      centsOffsetFrom12TET: 0,
      octave: 4,
      accidental: 'natural',
      roleInMode: 'معمولی',
    },
    {
      nameFa: 'سل ۴',
      symbol: 'G4',
      westernBase: 'G',
      frequencyHz: 392.0,
      centsOffsetFrom12TET: 0,
      octave: 4,
      accidental: 'natural',
      roleInMode: 'ایست',
    },
  ],
};

export const AVAILABLE_TUNING_PROFILES: TuningProfile[] = [
  VAZIRI_24TET_PROFILE,
  SHOUR_MODAL_PROFILE,
  SEGAH_MODAL_PROFILE,
];

/**
 * یافتن نزدیک‌ترین نت در یک پروفایل کوک مشخص
 */
export function findNearestNoteInProfile(
  frequencyHz: number,
  profile: TuningProfile,
  toleranceCents = 20
): {
  note: TuningProfileNote;
  centsDeviation: number;
  isInTune: boolean;
} | null {
  if (frequencyHz <= 0 || !isFinite(frequencyHz) || profile.notes.length === 0) {
    return null;
  }

  let bestNote: TuningProfileNote = profile.notes[0];
  let minCentsDiff = Infinity;

  for (const n of profile.notes) {
    // محاسبه فاصله به سنت: 1200 * log2(f / f_ref)
    const centsDiff = 1200 * Math.log2(frequencyHz / n.frequencyHz);
    if (Math.abs(centsDiff) < Math.abs(minCentsDiff)) {
      minCentsDiff = centsDiff;
      bestNote = n;
    }
  }

  const roundedCents = Math.round(minCentsDiff);
  return {
    note: bestNote,
    centsDeviation: roundedCents,
    isInTune: Math.abs(roundedCents) <= toleranceCents,
  };
}
