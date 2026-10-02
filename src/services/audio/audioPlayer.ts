/**
 * پخش‌کننده صوتی ماژولار با پشتیبانی از فایل‌های صوتی استاندارد و سینت‌سایزر آموزشی
 */

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  title?: string;
  sourceType: 'file' | 'synth';
}

export type AudioPlayerListener = (state: AudioPlayerState) => void;

export class AudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private cancelSynthMelody: (() => void) | null = null;
  private state: AudioPlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isLoading: false,
    sourceType: 'file'
  };
  private listeners: Set<AudioPlayerListener> = new Set();
  private timer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.volume = this.state.volume;

      this.audioElement.addEventListener('play', () => this.update({ isPlaying: true }));
      this.audioElement.addEventListener('pause', () => this.update({ isPlaying: false }));
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement) {
          this.update({
            currentTime: this.audioElement.currentTime,
            duration: this.audioElement.duration || this.state.duration,
          });
        }
      });
      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement) {
          this.update({
            duration: this.audioElement.duration || 0,
            isLoading: false,
          });
        }
      });
      this.audioElement.addEventListener('ended', () => {
        this.update({ isPlaying: false, currentTime: 0 });
      });
      this.audioElement.addEventListener('waiting', () => this.update({ isLoading: true }));
      this.audioElement.addEventListener('canplay', () => this.update({ isLoading: false }));
    }
  }

  public subscribe(listener: AudioPlayerListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private update(partial: Partial<AudioPlayerState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn(this.state));
  }

  public async loadUrl(url: string, title?: string): Promise<void> {
    this.stop();
    this.update({ sourceType: 'file', isLoading: true, title, currentTime: 0, duration: 0 });
    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.load();
    }
  }

  public async play(): Promise<void> {
    if (this.state.sourceType === 'file' && this.audioElement) {
      try {
        await this.audioElement.play();
      } catch (err) {
        console.error('Playback error:', err);
      }
    }
  }

  public pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.cancelSynthMelody) {
      this.cancelSynthMelody();
      this.cancelSynthMelody = null;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.update({ isPlaying: false });
    }
  }

  public stop(): void {
    this.pause();
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
    }
    this.update({ isPlaying: false, currentTime: 0 });
  }

  public seek(seconds: number): void {
    if (this.audioElement && this.state.sourceType === 'file') {
      this.audioElement.currentTime = seconds;
      this.update({ currentTime: seconds });
    }
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    this.update({ volume: clamped });
  }

  public getState(): AudioPlayerState {
    return this.state;
  }
}

export const globalAudioPlayer = new AudioPlayer();
