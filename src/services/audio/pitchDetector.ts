/**
 * الگوریتم پیشرفته تشخیص گام (Pitch Detection) بر پایه خودهمبستگی زمانی (Autocorrelation)
 * بهینه‌سازی شده برای فرکانس صدای انسان و سازهای سنتی ایرانی (۸۰ تا ۱۱۰۰ هرتز)
 * همراه با درون‌یابی سهموی (Parabolic Interpolation) برای دقت صدم هرتز
 */

import { findNearestPersianNote } from './persianScale';
import { PitchDetectionResult } from '../../types/music';

export class PitchDetector {
  private analyser: AnalyserNode;
  private buffer: Float32Array;
  private minFreq = 70;   // حداقل فرکانس بم آواز (حدود C#2)
  private maxFreq = 1200; // حداکثر فرکانس زیر آواز (حدود D6)
  private rmsThreshold = 0.012; // آستانه سکوت / فیلتر نویز محیط

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  /**
   * محاسبه مقدار RMS جهت سنجش حجم و شدت صدای ورودی
   */
  public getRmsVolume(): number {
    this.analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sum += this.buffer[i] * this.buffer[i];
    }
    return Math.sqrt(sum / this.buffer.length);
  }

  /**
   * تحلیل لحظه‌ای و استخراج فرکانس و نت موسیقی ایرانی
   */
  public detectPitch(sampleRate: number, toleranceCents = 18): PitchDetectionResult | null {
    this.analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>);

    const bufferLength = this.buffer.length;
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sum / bufferLength);

    // اگر صدا پایین‌تر از آستانه سکوت باشد
    if (rms < this.rmsThreshold) {
      return null;
    }

    const minPeriod = Math.floor(sampleRate / this.maxFreq);
    const maxPeriod = Math.floor(sampleRate / this.minFreq);

    // الگوریتم Normalized Autocorrelation
    let bestCorrelation = -1;
    let bestPeriod = -1;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let power1 = 0;
      let power2 = 0;

      // محاسبه خودهمبستگی روی پنجره داده
      const windowSize = bufferLength - period;
      for (let i = 0; i < windowSize; i++) {
        const val1 = this.buffer[i];
        const val2 = this.buffer[i + period];
        correlation += val1 * val2;
        power1 += val1 * val1;
        power2 += val2 * val2;
      }

      const normalization = Math.sqrt(power1 * power2);
      if (normalization > 0) {
        const normalizedCorr = correlation / normalization;
        if (normalizedCorr > bestCorrelation) {
          bestCorrelation = normalizedCorr;
          bestPeriod = period;
        }
      }
    }

    // بررسی آستانه اطمینان خودهمبستگی
    if (bestCorrelation < 0.65 || bestPeriod === -1) {
      return null;
    }

    // درون‌یابی سهموی (Parabolic Interpolation) برای یافتن قله دقیق بین سمپل‌ها
    let refinedPeriod = bestPeriod;
    if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
      const prevCorr = this.getAutocorrAt(bestPeriod - 1, bufferLength);
      const currCorr = bestCorrelation;
      const nextCorr = this.getAutocorrAt(bestPeriod + 1, bufferLength);

      const delta = (nextCorr - prevCorr) / (2 * (2 * currCorr - prevCorr - nextCorr));
      if (!isNaN(delta) && Math.abs(delta) < 1) {
        refinedPeriod = bestPeriod + delta;
      }
    }

    const frequency = sampleRate / refinedPeriod;

    // پیدا کردن نزدیک‌ترین نت با سیستم ربع‌پرده‌ای موسیقی ایرانی
    const noteMatch = findNearestPersianNote(frequency, toleranceCents);
    if (!noteMatch) {
      return null;
    }

    return {
      frequency: Math.round(frequency * 10) / 10,
      closestNoteFa: noteMatch.nameFa,
      closestWesternNote: noteMatch.symbol,
      octave: noteMatch.octave,
      centsDeviation: noteMatch.centsDeviation,
      isInTune: noteMatch.isInTune,
      confidence: Math.min(1, Math.max(0, (bestCorrelation - 0.5) * 2)),
      volume: Math.min(1, rms * 5)
    };
  }

  private getAutocorrAt(period: number, bufferLength: number): number {
    let correlation = 0;
    let power1 = 0;
    let power2 = 0;
    const windowSize = bufferLength - period;
    for (let i = 0; i < windowSize; i++) {
      const val1 = this.buffer[i];
      const val2 = this.buffer[i + period];
      correlation += val1 * val2;
      power1 += val1 * val1;
      power2 += val2 * val2;
    }
    const norm = Math.sqrt(power1 * power2);
    return norm > 0 ? correlation / norm : 0;
  }
}
