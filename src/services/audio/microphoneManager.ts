/**
 * مدیریت اتصال به میکروفون کاربر، وضعیت دسترسی، مدیریت خطاها و اتصال به AnalyserNode
 */

import { audioContextManager } from './audioContext';
import { PitchDetector } from './pitchDetector';
import { PitchDetectionResult } from '../../types/music';

export type MicrophoneStatus = 'idle' | 'requesting' | 'recording' | 'muted' | 'error';

export interface MicrophoneErrorDetails {
  code: 'NOT_ALLOWED' | 'NOT_FOUND' | 'NOT_SUPPORTED' | 'UNKNOWN';
  messageFa: string;
}

export class MicrophoneManager {
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pitchDetector: PitchDetector | null = null;
  private status: MicrophoneStatus = 'idle';
  private statusListener: ((status: MicrophoneStatus, error?: MicrophoneErrorDetails) => void) | null = null;

  public setStatusListener(listener: (status: MicrophoneStatus, error?: MicrophoneErrorDetails) => void) {
    this.statusListener = listener;
  }

  private notify(status: MicrophoneStatus, error?: MicrophoneErrorDetails) {
    this.status = status;
    if (this.statusListener) {
      this.statusListener(status, error);
    }
  }

  public getStatus(): MicrophoneStatus {
    return this.status;
  }

  public async start(): Promise<boolean> {
    if (this.status === 'recording' && this.stream) {
      return true;
    }

    this.notify('requesting');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
      this.analyserNode.fftSize = 2048; // دقت مناسب برای خودهمبستگی فرکانس‌های بم
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.sourceNode.connect(this.analyserNode);

      this.pitchDetector = new PitchDetector(this.analyserNode);
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
          messageFa: 'مجوز دسترسی به میکروفون رد شد. لطفاً در تنظیمات مرورگر اجازه دسترسی صوتی را فعال کنید.'
        };
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        errorDetails = {
          code: 'NOT_FOUND',
          messageFa: 'هیچ دستگاه ورودی صوتی (میکروفون) در سیستم شما پیدا نشد.'
        };
      } else if (errorObj.message === 'NOT_SUPPORTED') {
        errorDetails = {
          code: 'NOT_SUPPORTED',
          messageFa: 'مرورگر شما از دریافت زنده صدای میکروفون پشتیبانی نمی‌کند.'
        };
      }

      this.notify('error', errorDetails);
      return false;
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.sourceNode = null;
    }

    this.analyserNode = null;
    this.pitchDetector = null;
    this.notify('idle');
  }

  public getLivePitch(toleranceCents = 18): PitchDetectionResult | null {
    if (!this.pitchDetector || this.status !== 'recording') {
      return null;
    }
    const sampleRate = audioContextManager.getSampleRate();
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
