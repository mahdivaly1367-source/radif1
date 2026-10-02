/**
 * لایه ۱: استخراج فرکانس خام آکوستیک (Raw Pitch Extraction)
 * پیاده‌سازی بهینه الگوریتم بر مبنای تابع تفاضل نرمال‌شده تجمعی (YIN-based CMNDF)
 * به همراه درون‌یابی سهموی برای دقت اعشاری هرتز بدون بار پردازشی اضافه
 */

import { RawPitchResult } from '../../../types/music';

export interface RawPitchConfig {
  minFrequencyHz?: number;    // حداقل فرکانس بم (مثلاً ۷۰ هرتز)
  maxFrequencyHz?: number;    // حداکثر فرکانس زیر (مثلاً ۱۱۰۰ هرتز)
  rmsThreshold?: number;      // آستانه قطع نویز و سکوت
  yinThreshold?: number;      // آستانه فرود در تابع YIN برای جلوگیری از خطای جهش اکتاو
}

export class RawPitchDetector {
  private analyser: AnalyserNode;
  private buffer: Float32Array;
  private diffBuffer: Float32Array;
  private minFreq: number;
  private maxFreq: number;
  private rmsThreshold: number;
  private yinThreshold: number;

  constructor(analyser: AnalyserNode, config?: RawPitchConfig) {
    this.analyser = analyser;
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.diffBuffer = new Float32Array(Math.floor(this.analyser.fftSize / 2));
    this.minFreq = config?.minFrequencyHz ?? 70;
    this.maxFreq = config?.maxFrequencyHz ?? 1100;
    this.rmsThreshold = config?.rmsThreshold ?? 0.012;
    this.yinThreshold = config?.yinThreshold ?? 0.15;
  }

  /**
   * محاسبه مقدار انرژی سیگنال (RMS) جهت بررسی شدت و نویزگیر
   */
  public getRmsVolume(): number {
    this.analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>);
    let sum = 0;
    const len = this.buffer.length;
    for (let i = 0; i < len; i++) {
      sum += this.buffer[i] * this.buffer[i];
    }
    return Math.sqrt(sum / len);
  }

  /**
   * استخراج فرکانس خام بدون هیچ‌گونه قضاوت یا نگاشت به نت
   */
  public extractRawPitch(sampleRate: number): RawPitchResult {
    const timestamp = Date.now();
    this.analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>);

    const bufferLength = this.buffer.length;
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);

    // اگر صدا پایین‌تر از حد آستانه سکوت/نویز باشد
    if (rms < this.rmsThreshold) {
      return {
        frequencyHz: 0,
        confidence: 0,
        rmsVolume: rms,
        timestamp,
        isVoiced: false,
      };
    }

    const minPeriod = Math.max(2, Math.floor(sampleRate / this.maxFreq));
    const maxPeriod = Math.min(Math.floor(bufferLength / 2) - 1, Math.floor(sampleRate / this.minFreq));
    const windowSize = Math.floor(bufferLength / 2);

    // مرحله ۱ الگوریتم YIN: تابع تفاضل مربع‌ها d(tau) = sum (x[i] - x[i+tau])^2
    this.diffBuffer[0] = 0;
    for (let tau = 1; tau <= maxPeriod; tau++) {
      let diffSum = 0;
      for (let i = 0; i < windowSize; i++) {
        const delta = this.buffer[i] - this.buffer[i + tau];
        diffSum += delta * delta;
      }
      this.diffBuffer[tau] = diffSum;
    }

    // مرحله ۲ الگوریتم YIN: تابع تفاضل نرمال‌شده میانگین تجمعی (CMNDF)
    // d'(tau) = d(tau) / [ (1/tau) * sum_{j=1}^tau d(j) ]
    let runningSum = 0;
    this.diffBuffer[0] = 1;
    for (let tau = 1; tau <= maxPeriod; tau++) {
      runningSum += this.diffBuffer[tau];
      if (runningSum > 0) {
        this.diffBuffer[tau] = (this.diffBuffer[tau] * tau) / runningSum;
      } else {
        this.diffBuffer[tau] = 1;
      }
    }

    // مرحله ۳: یافتن اولین کمینه موضعی زیر حد آستانه YIN (Absolute Threshold)
    // این تکنیک نقطه قوت اصلی الگوریتم YIN در پیشگیری از خطای جهش اکتاو (Octave Halving/Doubling) است.
    let bestTau = -1;
    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      if (this.diffBuffer[tau] < this.yinThreshold) {
        while (tau + 1 <= maxPeriod && this.diffBuffer[tau + 1] < this.diffBuffer[tau]) {
          tau++;
        }
        bestTau = tau;
        break;
      }
    }

    // در صورتی که هیچ مقداری زیر آستانه دقیق نبود، کمینه مطلق در بازه جستجو می‌شود
    if (bestTau === -1) {
      let globalMin = 1.0;
      for (let tau = minPeriod; tau <= maxPeriod; tau++) {
        if (this.diffBuffer[tau] < globalMin) {
          globalMin = this.diffBuffer[tau];
          bestTau = tau;
        }
      }
      // اگر حتی کمینه مطلق هم به اندازه کافی مشخص نباشد، سیگنال ناواک/غیرموسیقایی است
      if (globalMin > 0.45) {
        return {
          frequencyHz: 0,
          confidence: Math.max(0, 1 - globalMin),
          rmsVolume: rms,
          timestamp,
          isVoiced: false,
        };
      }
    }

    // مرحله ۴: درون‌یابی سهموی (Parabolic Interpolation) روی کمینه برای دقت زیر-سمپل
    let refinedTau = bestTau;
    if (bestTau > minPeriod && bestTau < maxPeriod) {
      const s0 = this.diffBuffer[bestTau - 1];
      const s1 = this.diffBuffer[bestTau];
      const s2 = this.diffBuffer[bestTau + 1];
      const denom = 2 * (s0 - 2 * s1 + s2);
      if (denom !== 0) {
        const delta = (s0 - s2) / denom;
        if (Math.abs(delta) < 1) {
          refinedTau = bestTau + delta;
        }
      }
    }

    const frequencyHz = sampleRate / refinedTau;
    const cmndfVal = this.diffBuffer[bestTau];
    const confidence = Math.max(0, Math.min(1, 1 - cmndfVal));

    return {
      frequencyHz: Math.round(frequencyHz * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      rmsVolume: Math.min(1, rms * 5),
      timestamp,
      isVoiced: confidence >= 0.5 && frequencyHz >= this.minFreq && frequencyHz <= this.maxFreq,
      periodSamples: refinedTau,
    };
  }
}
