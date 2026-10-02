/**
 * پل سازگاری و کلاس جامع آنالیزور گام (PitchDetector)
 * متصل به معماری سه‌لایه‌ای: RawPitchDetector -> TuningProfile -> MusicalInterpretation
 */

import { RawPitchDetector } from './pitch/rawPitchDetector';
import { interpretPitch } from './pitch/musicalInterpretation';
import { VAZIRI_24TET_PROFILE } from './pitch/tuningProfiles';
import { PitchDetectionResult, RawPitchResult, MusicalInterpretation, TuningProfile } from '../../types/music';

export class PitchDetector {
  private rawDetector: RawPitchDetector;
  private currentProfile: TuningProfile = VAZIRI_24TET_PROFILE;

  constructor(analyser: AnalyserNode) {
    this.rawDetector = new RawPitchDetector(analyser);
  }

  public setTuningProfile(profile: TuningProfile): void {
    this.currentProfile = profile;
  }

  public getTuningProfile(): TuningProfile {
    return this.currentProfile;
  }

  public getRmsVolume(): number {
    return this.rawDetector.getRmsVolume();
  }

  /**
   * استخراج فرکانس خام (لایه ۱)
   */
  public getRawPitch(sampleRate: number): RawPitchResult {
    return this.rawDetector.extractRawPitch(sampleRate);
  }

  /**
   * تفسیر کامل موسیقایی (لایه ۳)
   */
  public getInterpretation(sampleRate: number, toleranceCents = 18): MusicalInterpretation | null {
    const raw = this.getRawPitch(sampleRate);
    return interpretPitch(raw, {
      profile: this.currentProfile,
      toleranceCents,
    });
  }

  /**
   * متد سازگار با کدهای قبلی (Backward Compatibility)
   */
  public detectPitch(sampleRate: number, toleranceCents = 18): PitchDetectionResult | null {
    const interp = this.getInterpretation(sampleRate, toleranceCents);
    if (!interp) {
      return null;
    }

    return {
      frequency: interp.rawPitch.frequencyHz,
      closestNoteFa: interp.matchedNote.nameFa,
      closestWesternNote: interp.matchedNote.symbol,
      octave: interp.matchedNote.octave,
      centsDeviation: interp.centsDeviation,
      isInTune: interp.isInTune,
      confidence: interp.rawPitch.confidence,
      volume: interp.rawPitch.rmsVolume,
    };
  }
}
