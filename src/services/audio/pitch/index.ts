/**
 * موتور پردازش صوت و گام در موسیقی ایرانی (Pitch Engine)
 * معماری سه‌لایه‌ای:
 * لایه ۱: فرکانس خام آکوستیک (RawPitchDetector)
 * لایه ۲: پروفایل‌های کوک مرجع (TuningProfiles: 24-TET, Modal Shour, Modal Segah)
 * لایه ۳: تفسیر و داوری موسیقایی (interpretPitch)
 */

export * from './rawPitchDetector';
export * from './tuningProfiles';
export * from './musicalInterpretation';
