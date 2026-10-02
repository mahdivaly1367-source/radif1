/**
 * سینت‌سایزر آکوستیک تخصصی سازهای ایرانی (سنتور / تار) بر پایه Web Audio API
 * با قابلیت اجرای دقیق ربع‌پرده‌ها (کُرُن و سُری) و طنین طبیعی زخمه
 */

import { audioContextManager } from './audioContext';
import { getNoteFrequencyByName } from './persianScale';

export interface NotePlayOptions {
  frequency: number;
  durationSeconds?: number;
  volume?: number;
  instrument?: 'santur' | 'tar' | 'ney';
}

export class PersianSynth {
  /**
   * شبیه‌سازی صدای زنگ‌دار و اصیل سنتور با هارمونیک‌های غنی و زوال ملایم
   */
  public async playTone({
    frequency,
    durationSeconds = 1.6,
    volume = 0.4,
    instrument = 'santur',
  }: NotePlayOptions): Promise<void> {
    const ctx = await audioContextManager.resumeContext();
    const now = ctx.currentTime;

    // مستر گین
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.connect(ctx.destination);

    if (instrument === 'santur') {
      // سنتور: ارتعاش سیم مضراب خورده با دو اسیلاتور کمی Detune شده (Chorus طبیعی سیم‌های جفت)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      oscHarmonic.type = 'sine';

      // فرکانس اصلی و هارمونیک دوم
      osc1.frequency.setValueAtTime(frequency, now);
      osc2.frequency.setValueAtTime(frequency * 1.002, now); // Detune بسیار ریز مضراب سنتور
      oscHarmonic.frequency.setValueAtTime(frequency * 2, now);

      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gainH = ctx.createGain();

      gain1.gain.value = 0.6;
      gain2.gain.value = 0.4;
      gainH.gain.value = 0.15; // درخشش فلزی سیم

      osc1.connect(gain1).connect(masterGain);
      osc2.connect(gain2).connect(masterGain);
      oscHarmonic.connect(gainH).connect(masterGain);

      // پاکت ضربه (Attack تند، Decay طولانی سیم سنتور)
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(volume, now + 0.015);
      masterGain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.25);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc1.start(now);
      osc2.start(now);
      oscHarmonic.start(now);

      osc1.stop(now + durationSeconds + 0.05);
      osc2.stop(now + durationSeconds + 0.05);
      oscHarmonic.stop(now + durationSeconds + 0.05);
    } else {
      // تار: کاسه توخالی چوبی با پوست و پرده
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, now);

      // فیلتر پایین‌گذر برای گرم کردن زنگ تار
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(frequency * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.3);

      osc.connect(filter).connect(masterGain);

      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(volume, now + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc.start(now);
      osc.stop(now + durationSeconds + 0.05);
    }
  }

  /**
   * پخش یک نت با نام فارسی (مانند "سل ۴"، "لا کُرُن ۴"، "می کُرُن")
   */
  public async playNoteByName(noteName: string, octave = 4, durationSeconds = 1.4): Promise<void> {
    const freq = getNoteFrequencyByName(noteName, octave);
    await this.playTone({ frequency: freq, durationSeconds });
  }

  /**
   * نواختن یک ملودی یا دنباله نغمه با تاخیر زمانی (مثلاً درآمد شور)
   */
  public async playMelody(
    notes: { note: string; octave?: number; duration: number }[],
    onNoteChange?: (index: number, noteName: string) => void,
    onFinish?: () => void
  ): Promise<() => void> {
    let isCancelled = false;

    const run = async () => {
      for (let i = 0; i < notes.length; i++) {
        if (isCancelled) break;
        const item = notes[i];
        if (onNoteChange) {
          onNoteChange(i, item.note);
        }
        await this.playNoteByName(item.note, item.octave || 4, item.duration * 0.9);
        await new Promise((resolve) => setTimeout(resolve, item.duration * 1000));
      }
      if (!isCancelled && onFinish) {
        onFinish();
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }
}

export const persianSynth = new PersianSynth();
