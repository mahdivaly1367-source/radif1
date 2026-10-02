/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, PageRoute } from './components/Navbar';
import { Footer } from './components/Footer';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { HomePage } from './pages/HomePage';
import { DastgahsPage } from './pages/DastgahsPage';
import { DastgahDetailPage } from './pages/DastgahDetailPage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { ExercisePage } from './pages/ExercisePage';
import { ProgressPage } from './pages/ProgressPage';
import { DASTGAHS } from './data/dastgahs';
import { LESSONS } from './data/lessons';
import { microphoneManager, MicrophoneStatus } from './services/audio/microphoneManager';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedDastgahId, setSelectedDastgahId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);

  // نظارت بر وضعیت میکروفون در سطح برنامه
  useEffect(() => {
    microphoneManager.setStatusListener((status: MicrophoneStatus) => {
      setIsMicActive(status === 'recording');
    });
  }, []);

  const handleNavigate = (
    page: PageRoute,
    params?: { dastgahId?: string; lessonId?: string; exerciseId?: string }
  ) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (params?.dastgahId) {
      setSelectedDastgahId(params.dastgahId);
    } else if (page !== 'dastgahs') {
      setSelectedDastgahId(null);
    }

    if (params?.lessonId) {
      setSelectedLessonId(params.lessonId);
    } else if (page !== 'lessons') {
      setSelectedLessonId(null);
    }

    if (params?.exerciseId) {
      setSelectedExerciseId(params.exerciseId);
    }
  };

  const selectedDastgah = selectedDastgahId
    ? DASTGAHS.find((d) => d.id === selectedDastgahId) || null
    : null;

  const selectedLesson = selectedLessonId
    ? LESSONS.find((l) => l.id === selectedLessonId) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Global Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isMicActive={isMicActive}
      />

      {/* Main Content Area with Routing */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {currentPage === 'dastgahs' && (
          selectedDastgah ? (
            <DastgahDetailPage
              dastgah={selectedDastgah}
              onBack={() => setSelectedDastgahId(null)}
              onNavigate={handleNavigate}
            />
          ) : (
            <DastgahsPage
              onNavigate={handleNavigate}
              onSelectDastgah={(id) => setSelectedDastgahId(id)}
            />
          )
        )}

        {currentPage === 'lessons' && (
          selectedLesson ? (
            <LessonDetailPage
              lesson={selectedLesson}
              onBack={() => setSelectedLessonId(null)}
              onNavigate={handleNavigate}
            />
          ) : (
            <LessonsPage
              onNavigate={handleNavigate}
              onSelectLesson={(id) => setSelectedLessonId(id)}
            />
          )
        )}

        {currentPage === 'exercise' && (
          <ExercisePage
            initialExerciseId={selectedExerciseId}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'progress' && (
          <ProgressPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Audio Playback Status Bar */}
      <AudioPlayerBar />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
