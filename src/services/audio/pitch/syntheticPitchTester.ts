/**
 * ارزیاب حلقه-بسته فرکانس‌های سینتتیک (Synthetic Pitch Loopback Tester)
 * تولید تن‌های دقیق آکوستیک در Web Audio و انتقال مستقیم به AnalyserNode جهت
 * ارزیابی صددرصد واقعی و اندازه‌گیری‌شده الگوریتم YIN CMNDF بدون نویز محیطی
 */

import { audioContextManager } from '../audioContext';
import { RawPitchDetector } from './rawPitchDetector';

export interface SyntheticTestResult {
  frequencyHz: number;
  expectedHz: number;
  detectedHz: number;
  errorHz: number;
  errorCents: number;
  confidence: number;
  voiced: boolean;
  processingTimeMs: number;
  status: 'PASS' | 'FAIL';
}

export class SyntheticPitchTester {
  /**
   * آزمایش یک فرکانس خالص از طریق حلقه تحلیل صوتی داخلی
   * @param frequencyHz فرکانس هدف بر حسب هرتز
   * @param audible آیا کاربر تن تست را از بلندگو نیز بشنود؟ (پیش‌فرض: false برای تست بی‌صدا)
   */
  public static async testFrequency(
    frequencyHz: number,
    audible = false
  ): Promise<SyntheticTestResult> {
    const ctx = await audioContextManager.resumeContext();
    const sampleRate = ctx.sampleRate;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const analyser = ctx.createAnalyser();

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.0; // بدون smoothing برای تست دقیق خام

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);

    // اتصال به آنالایزر جهت تست
    osc.connect(gainNode);
    gainNode.connect(analyser);

    if (audible) {
      // اتصال به اسپیکر با حجم ملایم
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.connect(ctx.destination);
    } else {
      // فقط در زنجیره تست پردازش شود
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    }

    const detector = new RawPitchDetector(analyser, {
      rmsThreshold: 0.005,
      yinThreshold: 0.15,
    });

    osc.start();

    // انتظار کوتاه (۶۰ میلی‌ثانیه) جهت پر شدن بافر time domain
    await new Promise((resolve) => setTimeout(resolve, 60));

    const t0 = performance.now();
    const rawResult = detector.extractRawPitch(sampleRate);
    const t1 = performance.now();

    // پاکسازی منابع صوتی
    try {
      osc.stop();
      osc.disconnect();
      gainNode.disconnect();
    } catch {
      // ignore teardown errors
    }

    const detectedHz = rawResult.frequencyHz;
    const errorHz = Math.round((detectedHz - frequencyHz) * 100) / 100;
    const errorCents =
      detectedHz > 0
        ? Math.round(1200 * Math.log2(detectedHz / frequencyHz) * 10) / 10
        : 999;

    // قبولی تست: اگر خطا کمتر از ±4 سنت باشد (دقت استاندارد YIN با درون‌یابی سهموی)
    const passed = rawResult.isVoiced && Math.abs(errorCents) <= 4.0;

    return {
      frequencyHz,
      expectedHz: frequencyHz,
      detectedHz,
      errorHz,
      errorCents,
      confidence: rawResult.confidence,
      voiced: rawResult.isVoiced,
      processingTimeMs: Math.round((t1 - t0) * 100) / 100,
      status: passed ? 'PASS' : 'FAIL',
    };
  }

  /**
   * اجرای آزمون دسته‌جمعی روی شش فرکانس معیار درخواستی
   */
  public static async runStandardSuite(
    onProgress?: (index: number, total: number, result: SyntheticTestResult) => void
  ): Promise<SyntheticTestResult[]> {
    const targetFrequencies = [
      320.24, // می کُرُن ۴ (شاهد سه‌گاه)
      392.0,  // سل ۴ (پایه شور)
      426.2,  // لا کُرُن ۴ (مدال شور)
      440.0,  // لا ۴ (دیاپازون استاندارد)
      466.16, // سی بمل ۴
      523.25, // دو ۵ (ایست شور)
    ];

    const results: SyntheticTestResult[] = [];
    for (let i = 0; i < targetFrequencies.length; i++) {
      const freq = targetFrequencies[i];
      const res = await this.testFrequency(freq, false);
      results.push(res);
      if (onProgress) {
        onProgress(i + 1, targetFrequencies.length, res);
      }
      // وقفه کوتاه بین تست‌ها
      await new Promise((r) => setTimeout(r, 40));
    }

    return results;
  }
}
