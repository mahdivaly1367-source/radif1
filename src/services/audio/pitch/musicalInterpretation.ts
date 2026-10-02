/**
 * لایه ۳: تفسیر موسیقایی (Musical Interpretation)
 * تطبیق فرکانس خام با پروفایل کوک مرجع و تحلیل انحراف سنت، نقش نت در مقام و راهنمای خوانش
 */

import {
  RawPitchResult,
  TuningProfile,
  TuningProfileNote,
  MusicalInterpretation,
  ExerciseTargetNote,
} from '../../../types/music';
import { findNearestNoteInProfile, VAZIRI_24TET_PROFILE } from './tuningProfiles';

export interface InterpretationOptions {
  profile?: TuningProfile;
  targetNote?: ExerciseTargetNote | null;
  toleranceCents?: number;
}

export function interpretPitch(
  rawPitch: RawPitchResult,
  options?: InterpretationOptions
): MusicalInterpretation | null {
  if (!rawPitch.isVoiced || rawPitch.frequencyHz <= 0) {
    return null;
  }

  const profile = options?.profile ?? VAZIRI_24TET_PROFILE;
  const toleranceCents = options?.toleranceCents ?? (options?.targetNote?.centsTolerance ?? 20);

  // حالت ۱: اگر نت هدف صریحی از یک تمرین مشخص داده شده است
  if (options?.targetNote) {
    const targetFreq = options.targetNote.frequencyHz;
    const centsDiff = Math.round(1200 * Math.log2(rawPitch.frequencyHz / targetFreq));
    const isInTune = Math.abs(centsDiff) <= toleranceCents;

    let directionAdvice: 'higher' | 'lower' | 'in_tune' = 'in_tune';
    if (!isInTune) {
      directionAdvice = centsDiff < 0 ? 'higher' : 'lower';
    }

    // محاسبه امتیاز تطابق بین ۰ تا ۱۰۰ بر اساس انحراف سنت
    const score = Math.max(0, Math.min(100, Math.round(100 - Math.abs(centsDiff) * 1.8)));

    const matchedNote: TuningProfileNote = {
      nameFa: options.targetNote.noteFa,
      symbol: options.targetNote.westernName,
      westernBase: options.targetNote.westernName.charAt(0),
      frequencyHz: targetFreq,
      centsOffsetFrom12TET: 0,
      octave: 4,
      accidental: options.targetNote.accidental,
      roleInMode: 'شاهد',
    };

    return {
      rawPitch,
      matchedNote,
      targetFrequencyHz: targetFreq,
      centsDeviation: centsDiff,
      isInTune,
      toleranceCents,
      tuningProfileId: profile.id,
      tuningProfileNameFa: profile.nameFa,
      directionAdvice,
      score,
    };
  }

  // حالت ۲: حالت آزاد؛ تطبیق با نزدیک‌ترین نت در پروفایل کوک انتخاب‌شده
  const match = findNearestNoteInProfile(rawPitch.frequencyHz, profile, toleranceCents);
  if (!match) {
    return null;
  }

  let directionAdvice: 'higher' | 'lower' | 'in_tune' = 'in_tune';
  if (!match.isInTune) {
    directionAdvice = match.centsDeviation < 0 ? 'higher' : 'lower';
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - Math.abs(match.centsDeviation) * 2)));

  return {
    rawPitch,
    matchedNote: match.note,
    targetFrequencyHz: match.note.frequencyHz,
    centsDeviation: match.centsDeviation,
    isInTune: match.isInTune,
    toleranceCents,
    tuningProfileId: profile.id,
    tuningProfileNameFa: profile.nameFa,
    directionAdvice,
    score,
  };
}
