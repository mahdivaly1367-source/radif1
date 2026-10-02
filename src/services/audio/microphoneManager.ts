/**
 * مدیریت اتصال به میکروفون کاربر، وضعیت دسترسی، اشتراک چندگانه (Multi-subscriber)
 * پاکسازی کامل جریان‌های صوتی و اتصال به معماری سه‌لایه‌ای Pitch Engine
 */

import { audioContextManager } from './audioContext';
import { PitchDetector } from './pitchDetector';
import {
  PitchDetectionResult,
  RawPitchResult,
  MusicalInterpretation,
  TuningProfile,
  ExerciseTargetNote,
} from '../../types/music';
import { interpretPitch } from './pitch/musicalInterpretation';
import { VAZIRI_24TET_PROFILE } from './pitch/tuningProfiles';

export type MicrophoneStatus = 'idle' | 'requesting' | 'recording' | 'muted' | 'error';

export interface MicrophoneErrorDetails {
  code: 'NOT_ALLOWED' | 'NOT_FOUND' | 'NOT_SUPPORTED' | 'SECURITY_ERROR' | 'UNKNOWN';
  messageFa: string;
}

export type MicrophoneStatusListener = (status: MicrophoneStatus, error?: MicrophoneErrorDetails) => void;

export class MicrophoneManager {
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pitchDetector: PitchDetector | null = null;
  private status: MicrophoneStatus = 'idle';
  private lastError?: MicrophoneErrorDetails;
  private listeners: Set<MicrophoneStatusListener> = new Set();
  private activeProfile: TuningProfile = VAZIRI_24TET_PROFILE;

  /**
   * الگوی استاندارد اشتراک چندگانه (Multi-subscriber Pattern)
   * بازگرداندن تابع لغو اشتراک برای جلوگیری از memory leak در کامپوننت‌های React
   */
  public subscribe(listener: MicrophoneStatusListener): () => void {
    this.listeners.add(listener);
    // ارسال وضعیت لحظه‌ای بلافاصله پس از ثبت‌نام شنونده
    listener(this.status, this.lastError);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * متد سازگار با کدهای قبلی
   */
  public setStatusListener(listener: MicrophoneStatusListener): void {
    this.subscribe(listener);
  }

  private notify(status: MicrophoneStatus, error?: MicrophoneErrorDetails): void {
    this.status = status;
    this.lastError = error;
    this.listeners.forEach((listener) => {
      try {
        listener(status, error);
      } catch (err) {
        console.error('Error in microphone status listener:', err);
      }
    });
  }

  public getStatus(): MicrophoneStatus {
    return this.status;
  }

  public isRecording(): boolean {
    return this.status === 'recording' && this.stream !== null;
  }

  public setTuningProfile(profile: TuningProfile): void {
    this.activeProfile = profile;
    if (this.pitchDetector) {
      this.pitchDetector.setTuningProfile(profile);
    }
  }

  public getTuningProfile(): TuningProfile {
    return this.activeProfile;
  }

  public getAudioContextState(): AudioContextState | 'uninitialized' {
    try {
      const ctx = audioContextManager.getContext();
      return ctx.state;
    } catch {
      return 'uninitialized';
    }
  }

  public getSampleRate(): number {
    try {
      return audioContextManager.getSampleRate();
    } catch {
      return 44100;
    }
  }

  public async start(): Promise<boolean> {
    if (this.status === 'recording' && this.stream) {
      return true;
    }

    this.notify('requesting');

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NOT_SUPPORTED');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      const audioCtx = await audioContextManager.resumeContext();

      this.stream = stream;
      this.sourceNode = audioCtx.createMediaStreamSource(stream);

      this.analyserNode = audioCtx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.7;

      this.sourceNode.connect(this.analyserNode);

      this.pitchDetector = new PitchDetector(this.analyserNode);
      this.pitchDetector.setTuningProfile(this.activeProfile);

      this.notify('recording');
      return true;
    } catch (err: unknown) {
      const errorObj = err as Error;
      let errorDetails: MicrophoneErrorDetails = {
        code: 'UNKNOWN',
        messageFa: 'خطای نامشخص در اتصال به میکروفون رخ داد.'
      };

      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        errorDetails = {
          code: 'NOT_ALLOWED',
          messageFa: 'مجوز دسترسی به میکروفون داده نشد. لطفاً در نوار آدرس مرورگر روی علامت قفل یا میکروفون کلیک کرده و دسترسی را مجاز کنید.'
        };
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        errorDetails = {
          code: 'NOT_FOUND',
          messageFa: 'هیچ میکروفون یا ورودی صوتی فیزیکی در سیستم متصل نیست.'
        };
      } else if (errorObj.name === 'SecurityError') {
        errorDetails = {
          code: 'SECURITY_ERROR',
          messageFa: 'سیاست امنیتی مرورگر مانع از دریافت صدای میکروفون شد.'
        };
      } else if (errorObj.message === 'NOT_SUPPORTED') {
        errorDetails = {
          code: 'NOT_SUPPORTED',
          messageFa: 'مرورگر مورد استفاده از ضبط زنده صدا پشتیبانی نمی‌کند.'
        };
      }

      this.stop();
      this.notify('error', errorDetails);
      return false;
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      this.stream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore disconnect error
      }
      this.sourceNode = null;
    }

    this.analyserNode = null;
    this.pitchDetector = null;
    if (this.status !== 'idle' && this.status !== 'error') {
      this.notify('idle');
    }
  }

  /**
   * دریافت فرکانس خام (لایه ۱)
   */
  public getRawPitch(): RawPitchResult | null {
    if (!this.pitchDetector || this.status !== 'recording') {
      return null;
    }
    const sampleRate = this.getSampleRate();
    return this.pitchDetector.getRawPitch(sampleRate);
  }

  /**
   * دریافت تفسیر موسیقایی (لایه ۳)
   */
  public getMusicalInterpretation(
    targetNote?: ExerciseTargetNote | null,
    toleranceCents = 20
  ): MusicalInterpretation | null {
    const raw = this.getRawPitch();
    if (!raw) return null;
    return interpretPitch(raw, {
      profile: this.activeProfile,
      targetNote,
      toleranceCents,
    });
  }

  /**
   * متد سازگار با کدهای قبلی
   */
  public getLivePitch(toleranceCents = 18): PitchDetectionResult | null {
    if (!this.pitchDetector || this.status !== 'recording') {
      return null;
    }
    const sampleRate = this.getSampleRate();
    return this.pitchDetector.detectPitch(sampleRate, toleranceCents);
  }

  public getLiveVolume(): number {
    if (!this.pitchDetector || this.status !== 'recording') {
      return 0;
    }
    return this.pitchDetector.getRmsVolume();
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }
}

export const microphoneManager = new MicrophoneManager();
