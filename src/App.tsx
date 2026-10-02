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
import { QAPage } from './pages/QAPage';
import { DASTGAHS } from './data/dastgahs';
import { LESSONS } from './data/lessons';
import { microphoneManager, MicrophoneStatus } from './services/audio/microphoneManager';
import { useAppRouter } from './router';

export default function App() {
  const { route, navigate } = useAppRouter();
  const [isMicActive, setIsMicActive] = useState(false);

  // اشتراک استاندارد در وضعیت میکروفون (Multi-subscriber)
  useEffect(() => {
    const unsub = microphoneManager.subscribe((status: MicrophoneStatus) => {
      setIsMicActive(status === 'recording');
    });
    return () => unsub();
  }, []);

  // محافظ پاکسازی صوتی هنگام خروج از صفحات کارگاه تمرین یا کنسول QA
  useEffect(() => {
    if (route.routeName !== 'exercise' && route.routeName !== 'qa') {
      if (microphoneManager.isRecording()) {
        microphoneManager.stop();
      }
    }
  }, [route.routeName]);

  // استخراج موجودیت‌های متناظر با پارامترهای آدرس
  const selectedDastgah = route.params.dastgahId
    ? DASTGAHS.find((d) => d.id === route.params.dastgahId) || null
    : null;

  const selectedLesson = route.params.lessonId
    ? LESSONS.find((l) => l.id === route.params.lessonId) || null
    : null;

  // نگاشت نام مسیر به PageRoute جهت فعال‌سازی تب مربوطه در Navbar
  const currentNavRoute: PageRoute = route.routeName as PageRoute;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Global Top Navbar */}
      <Navbar
        currentRoute={currentNavRoute}
        onNavigate={navigate}
        isMicActive={isMicActive}
      />

      {/* Main Content Area with Real Browser History Routing */}
      <main className="flex-1">
        {route.routeName === 'home' && (
          <HomePage onNavigate={navigate} />
        )}

        {route.routeName === 'dastgahs' && (
          <DastgahsPage
            onNavigate={navigate}
            onSelectDastgah={(id) => navigate(`/dastgahs/${id}`)}
          />
        )}

        {route.routeName === 'dastgah_detail' && (
          selectedDastgah ? (
            <DastgahDetailPage
              dastgah={selectedDastgah}
              onBack={() => navigate('/dastgahs')}
              onNavigate={navigate}
            />
          ) : (
            <DastgahsPage
              onNavigate={navigate}
              onSelectDastgah={(id) => navigate(`/dastgahs/${id}`)}
            />
          )
        )}

        {route.routeName === 'lessons' && (
          <LessonsPage
            onNavigate={navigate}
            onSelectLesson={(id) => navigate(`/lessons/${id}`)}
          />
        )}

        {route.routeName === 'lesson_detail' && (
          selectedLesson ? (
            <LessonDetailPage
              lesson={selectedLesson}
              onBack={() => navigate('/lessons')}
              onNavigate={navigate}
            />
          ) : (
            <LessonsPage
              onNavigate={navigate}
              onSelectLesson={(id) => navigate(`/lessons/${id}`)}
            />
          )
        )}

        {route.routeName === 'exercise' && (
          <ExercisePage
            initialExerciseId={route.params.exerciseId}
            onNavigate={navigate}
          />
        )}

        {route.routeName === 'progress' && (
          <ProgressPage onNavigate={navigate} />
        )}

        {route.routeName === 'qa' && (
          <QAPage />
        )}
      </main>

      {/* Global Audio Playback Status Bar */}
      <AudioPlayerBar />

      {/* Footer with QA link and route paths */}
      <Footer onNavigate={navigate} />
    </div>
  );
}
