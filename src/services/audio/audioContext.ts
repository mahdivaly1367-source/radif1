/**
 * مدیریت یکپارچه AudioContext در مرورگر
 * رسیدگی به محدودیت‌های autoplay و تعلیق صوت در مرورگرها
 */

class AudioContextManager {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    return this.ctx;
  }

  public async resumeContext(): Promise<AudioContext> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  public getSampleRate(): number {
    return this.getContext().sampleRate;
  }

  public close(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioContextManager = new AudioContextManager();
