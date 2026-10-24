'use client';

import React, { useState, useEffect } from 'react';
import {
  FitnessAppData,
  DailyMetrics,
  UserProfile,
  WorkoutEntry,
  Exercise,
  CoachClient,
  CoachNote,
  BodyMetricEntry,
} from '@/types/fitness';
import {
  loadFitnessData,
  saveFitnessData,
  resetFitnessData,
  INITIAL_FITNESS_DATA,
} from '@/lib/storage';
import { initDatabaseWithSeedData, saveAllToDatabase } from '@/lib/database';
import { getStoredFirebaseConfig, pushToFirebaseCloud } from '@/lib/firebase';

import Header, { MainNavTab } from '@/components/Header';
import StatsOverview from '@/components/StatsOverview';
import WeeklyChart from '@/components/WeeklyChart';
import WaterTracker from '@/components/WaterTracker';
import WorkoutList from '@/components/WorkoutList';
import ActivityBreakdown from '@/components/ActivityBreakdown';
import MotivationCard from '@/components/MotivationCard';
import Achievements from '@/components/Achievements';
import LogWorkoutModal from '@/components/LogWorkoutModal';
import QuickStatsModal from '@/components/QuickStatsModal';
import DataManagementModal from '@/components/DataManagementModal';
import TaskRequirementsModal from '@/components/TaskRequirementsModal';
import Toast, { ToastMessage } from '@/components/Toast';

import ExerciseLibrary from '@/components/ExerciseLibrary';
import CoachPortal from '@/components/CoachPortal';
import LiveWorkoutTracker from '@/components/LiveWorkoutTracker';
import BodyComposition from '@/components/BodyComposition';

// Lightweight Web Audio feedback for tactile user experience
function playHapticSound(type: 'chime' | 'water' | 'pop') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'chime') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'water') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } else {
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch {
    // Graceful fallback
  }
}

export default function Home() {
  const [data, setData] = useState<FitnessAppData>(INITIAL_FITNESS_DATA);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [selectedLiveExercise, setSelectedLiveExercise] = useState<Exercise | null>(null);

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isQuickStatsOpen, setIsQuickStatsOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize from Real Database (IndexedDB) & localStorage on mount
  useEffect(() => {
    let isMounted = true;
    const initializeDataSources = async () => {
      try {
        const dbData = await initDatabaseWithSeedData();
        if (isMounted && dbData && dbData.workouts && dbData.workouts.length > 0) {
          setData(dbData);
          saveFitnessData(dbData);
        } else {
          const loaded = loadFitnessData();
          if (isMounted) setData(loaded);
          await saveAllToDatabase(loaded);
        }
      } catch {
        const loaded = loadFitnessData();
        if (isMounted) setData(loaded);
      }
    };

    initializeDataSources();

    const savedTheme = localStorage.getItem('fitpulse_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Central persistence orchestrator: React State + Real IndexedDB + LocalStorage + Background Firebase Cloud Sync
  const persistData = (newData: FitnessAppData) => {
    setData(newData);
    saveFitnessData(newData);
    saveAllToDatabase(newData).catch((err) =>
      console.warn('[FitPulse DB] IndexedDB write error:', err)
    );

    // Continuous Real-Time Firebase sync if autoSync is active
    const fbConfig = getStoredFirebaseConfig();
    if (fbConfig.enabled && fbConfig.autoSync) {
      pushToFirebaseCloud(newData, fbConfig).catch((err) =>
        console.warn('[FitPulse Firebase] Auto-sync error:', err)
      );
    }
  };

  const showToast = (text: string, icon = '✨') => {
    const newToast: ToastMessage = { id: `t-${Date.now()}`, text, icon };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3200);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('fitpulse_theme', nextTheme);
  };

  // Calculate totals from today's workouts
  const totalWorkoutCalories = data.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const totalWorkoutMinutes = data.workouts.reduce((sum, w) => sum + w.durationMinutes, 0);

  // Handlers
  const handleSaveWorkout = (entry: WorkoutEntry) => {
    playHapticSound('chime');
    const updatedWorkouts = [entry, ...data.workouts];

    // Check achievement unlock
    const updatedAchievements = data.achievements.map((ach) => {
      if (ach.id === 'ach-2' && entry.caloriesBurned >= 500) {
        return { ...ach, unlocked: true, progress: 100 };
      }
      if (ach.id === 'ach-5') {
        const prog = Math.min(100, Math.round((updatedWorkouts.length / 15) * 100));
        return { ...ach, progress: prog, unlocked: prog >= 100 };
      }
      return ach;
    });

    // Update today's entry in pastWeek
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedPastWeek = data.pastWeek.map((day) => {
      if (day.fullDate === todayStr || day.fullDate === data.metrics.date) {
        return {
          ...day,
          calories: day.calories + entry.caloriesBurned,
          activeMinutes: day.activeMinutes + entry.durationMinutes,
        };
      }
      return day;
    });

    const newData: FitnessAppData = {
      ...data,
      workouts: updatedWorkouts,
      pastWeek: updatedPastWeek,
      achievements: updatedAchievements,
    };

    persistData(newData);
    showToast(`Logged "${entry.title}" (+${entry.caloriesBurned} kcal)!`, '🔥');
  };

  const handleDeleteWorkout = (id: string) => {
    playHapticSound('pop');
    const target = data.workouts.find((w) => w.id === id);
    const updatedWorkouts = data.workouts.filter((w) => w.id !== id);

    const newData: FitnessAppData = {
      ...data,
      workouts: updatedWorkouts,
    };

    persistData(newData);
    showToast(target ? `Removed "${target.title}"` : 'Workout removed', '🗑️');
  };

  const handleQuickAddSteps = (amount: number) => {
    playHapticSound('pop');
    const newSteps = data.metrics.steps + amount;
    const updatedMetrics: DailyMetrics = {
      ...data.metrics,
      steps: newSteps,
    };

    // Check 10k achievement
    const updatedAchievements = data.achievements.map((ach) => {
      if (ach.id === 'ach-1' && newSteps >= 10000) {
        return { ...ach, unlocked: true, progress: 100 };
      }
      return ach;
    });

    // Update today's entry in pastWeek
    const todayStr = data.metrics.date;
    const updatedPastWeek = data.pastWeek.map((day) => {
      if (day.fullDate === todayStr) {
        return { ...day, steps: newSteps };
      }
      return day;
    });

    const newData: FitnessAppData = {
      ...data,
      metrics: updatedMetrics,
      pastWeek: updatedPastWeek,
      achievements: updatedAchievements,
    };

    persistData(newData);
    showToast(`Added +${amount} steps!`, '👟');
  };

  const handleUpdateWater = (newMl: number) => {
    playHapticSound('water');
    const updatedMetrics: DailyMetrics = {
      ...data.metrics,
      waterMl: newMl,
    };

    const updatedAchievements = data.achievements.map((ach) => {
      if (ach.id === 'ach-4') {
        const prog = Math.min(100, Math.round((newMl / updatedMetrics.waterGoalMl) * 100));
        return { ...ach, progress: prog, unlocked: prog >= 100 };
      }
      return ach;
    });

    const newData: FitnessAppData = {
      ...data,
      metrics: updatedMetrics,
      achievements: updatedAchievements,
    };

    persistData(newData);
    showToast(`Water updated to ${newMl} ml`, '💧');
  };

  const handleSaveMetrics = (updatedMetrics: DailyMetrics, updatedUser: UserProfile) => {
    const newData: FitnessAppData = {
      ...data,
      metrics: updatedMetrics,
      user: updatedUser,
    };

    persistData(newData);
    showToast('Goals and athlete profile saved!', '✅');
  };

  const handleResetData = () => {
    const res = resetFitnessData();
    persistData(res);
    showToast('Reset to demo sample data', '🔄');
  };

  const handleClearData = () => {
    const cleared: FitnessAppData = {
      ...data,
      workouts: [],
      metrics: {
        ...data.metrics,
        steps: 0,
        waterMl: 0,
      },
    };
    persistData(cleared);
    showToast('All activity records cleared', '🧹');
  };

  // Start Live Workout with chosen exercise
  const handleStartWithExercise = (exercise: Exercise) => {
    setSelectedLiveExercise(exercise);
    setActiveTab('live');
    showToast(`Loaded "${exercise.name}" into Live Gym Tracker!`, '🏋️');
  };

  // Finish Live Workout Session
  const handleFinishLiveWorkout = (workout: WorkoutEntry) => {
    handleSaveWorkout(workout);
    setSelectedLiveExercise(null);
    setActiveTab('dashboard');
    showToast(`Completed Live Workout: +${workout.caloriesBurned} kcal!`, '🎉');
  };

  // Exercise Library handlers
  const handleToggleFavorite = (id: string) => {
    playHapticSound('pop');
    const currentFavs = data.favoriteExerciseIds || [];
    const isFav = currentFavs.includes(id);
    const updatedFavs = isFav ? currentFavs.filter((f) => f !== id) : [...currentFavs, id];

    const updatedData: FitnessAppData = {
      ...data,
      favoriteExerciseIds: updatedFavs,
    };
    persistData(updatedData);
    showToast(isFav ? 'Removed from favorites' : 'Saved to favorites ⭐', '⭐');
  };

  const handleAddCustomExercise = (exercise: Exercise) => {
    playHapticSound('chime');
    const updatedCustom = [exercise, ...(data.customExercises || [])];
    const updatedData: FitnessAppData = {
      ...data,
      customExercises: updatedCustom,
    };
    persistData(updatedData);
    showToast(`Created custom exercise "${exercise.name}"!`, '✅');
  };

  // Coach Portal handlers
  const handleUpdateClients = (updatedClients: CoachClient[]) => {
    const updatedData: FitnessAppData = {
      ...data,
      clients: updatedClients,
    };
    persistData(updatedData);
    showToast('Coach roster updated!', '📋');
  };

  const handleAddCoachNote = (note: CoachNote) => {
    playHapticSound('pop');
    const updatedNotes = [note, ...(data.coachNotes || [])];
    const updatedData: FitnessAppData = {
      ...data,
      coachNotes: updatedNotes,
    };
    persistData(updatedData);
    showToast(`Feedback posted for ${note.clientName}`, '📝');
  };

  // Body Composition handler
  const handleAddBodyMetric = (entry: BodyMetricEntry) => {
    playHapticSound('chime');
    const updatedMetrics = [...(data.bodyMetrics || []), entry];
    const updatedData: FitnessAppData = {
      ...data,
      bodyMetrics: updatedMetrics,
      user: {
        ...data.user,
        weightKg: entry.weightKg,
      },
    };
    persistData(updatedData);
    showToast(`Logged weigh-in: ${entry.weightKg} kg!`, '⚖️');
  };

  // Desktop full dashboard view
  const renderDesktopDashboard = () => (
    <>
      {/* Executive Daily Performance Briefing (Real App) */}
      <div className="executive-performance-banner">
        <div className="performance-brief-left">
          <div className="status-live-tag">
            <span className="live-pulsing-dot" /> ATHLETE PERFORMANCE OS • LIVE
          </div>
          <h1 className="performance-headline">
            Good morning, <span className="highlight-name">{data.user.name}</span>
          </h1>
          <p className="performance-summary-text">
            You&apos;re currently on a <strong>{data.user.streakDays}-day training streak</strong> 🔥. Today you&apos;ve completed <strong>{Math.round((data.metrics.steps / data.metrics.stepGoal) * 100)}%</strong> of your daily step goal and burned <strong>{totalWorkoutCalories + Math.round(data.metrics.steps * 0.04)} kcal</strong>.
          </p>
          <div className="performance-quick-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsLogModalOpen(true)}
              id="btn-hero-log-workout"
            >
              <span>+ Log Workout</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveTab('live')}
              id="btn-hero-live-session"
            >
              <span>⚡ Live Gym Session</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleUpdateWater(Math.min(data.metrics.waterGoalMl + 1000, data.metrics.waterMl + 250))}
              title="Quick add 250ml water"
            >
              <span>💧 +250ml Water</span>
            </button>
          </div>
        </div>

        {/* Right: Real App Athlete Readiness & Performance Gauge */}
        <div className="performance-brief-right">
          <div className="readiness-card">
            <div className="readiness-gauge-wrap">
              <svg className="readiness-svg" viewBox="0 0 100 100" width="84" height="84" aria-label="Readiness Score 94%">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="url(#readinessGlowGradient)"
                  strokeWidth="7"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.94)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="readinessGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="readiness-score-center">
                <span className="readiness-score-val">94%</span>
                <span className="readiness-score-lbl">OPTIMAL</span>
              </div>
            </div>

            <div className="readiness-details">
              <div className="readiness-status-row">
                <span className="readiness-title">Daily Readiness</span>
                <span className="readiness-badge">PEAK RECOVERY</span>
              </div>

              <div className="readiness-minibars">
                <div className="minibar-row">
                  <div className="minibar-label">
                    <span>Steps</span>
                    <strong>{data.metrics.steps.toLocaleString()} / {data.metrics.stepGoal.toLocaleString()}</strong>
                  </div>
                  <div className="minibar-track">
                    <div
                      className="minibar-fill steps"
                      style={{ width: `${Math.min(100, Math.round((data.metrics.steps / data.metrics.stepGoal) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="minibar-row">
                  <div className="minibar-label">
                    <span>Active Burn</span>
                    <strong>{totalWorkoutCalories + Math.round(data.metrics.steps * 0.04)} / {data.metrics.calorieGoal} kcal</strong>
                  </div>
                  <div className="minibar-track">
                    <div
                      className="minibar-fill calories"
                      style={{ width: `${Math.min(100, Math.round(((totalWorkoutCalories + Math.round(data.metrics.steps * 0.04)) / data.metrics.calorieGoal) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="minibar-row">
                  <div className="minibar-label">
                    <span>Hydration</span>
                    <strong>{(data.metrics.waterMl / 1000).toFixed(1)} / {(data.metrics.waterGoalMl / 1000).toFixed(1)} L</strong>
                  </div>
                  <div className="minibar-track">
                    <div
                      className="minibar-fill water"
                      style={{ width: `${Math.min(100, Math.round((data.metrics.waterMl / data.metrics.waterGoalMl) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Circular Progress Metrics */}
      <StatsOverview
        metrics={data.metrics}
        totalWorkoutCalories={totalWorkoutCalories}
        totalWorkoutMinutes={totalWorkoutMinutes}
        onQuickAddSteps={handleQuickAddSteps}
        onOpenQuickStats={() => setIsQuickStatsOpen(true)}
        onQuickAddWater={(amount) => handleUpdateWater(Math.min(data.metrics.waterGoalMl + 1000, data.metrics.waterMl + amount))}
        onOpenLogWorkout={() => setIsLogModalOpen(true)}
        onStartLive={() => setActiveTab('live')}
      />

      {/* Main Grid: Left = Trend & Workouts, Right = Breakdown, Hydration & Badges */}
      <div className="dashboard-grid">
        <div className="col-7" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <WeeklyChart pastWeek={data.pastWeek} />
          <WorkoutList
            workouts={data.workouts}
            onDeleteWorkout={handleDeleteWorkout}
            onOpenLogWorkout={() => setIsLogModalOpen(true)}
          />
        </div>

        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <MotivationCard />
          <ActivityBreakdown workouts={data.workouts} />
          <WaterTracker
            waterMl={data.metrics.waterMl}
            waterGoalMl={data.metrics.waterGoalMl}
            onUpdateWater={handleUpdateWater}
          />
          <Achievements achievements={data.achievements} />
        </div>
      </div>
    </>
  );

  // Desktop Tab Routing
  const renderDesktopContent = () => {
    switch (activeTab) {
      case 'library':
        return (
          <ExerciseLibrary
            customExercises={data.customExercises}
            favoriteIds={data.favoriteExerciseIds || []}
            onToggleFavorite={handleToggleFavorite}
            onAddCustomExercise={handleAddCustomExercise}
            onStartWithExercise={handleStartWithExercise}
          />
        );
      case 'coach':
        return (
          <CoachPortal
            clients={data.clients || []}
            coachNotes={data.coachNotes || []}
            coachName={`Coach ${data.user.name}`}
            onUpdateClients={handleUpdateClients}
            onAddCoachNote={handleAddCoachNote}
          />
        );
      case 'live':
        return (
          <LiveWorkoutTracker
            initialExercise={selectedLiveExercise}
            onFinishWorkout={handleFinishLiveWorkout}
            onCancel={() => {
              setSelectedLiveExercise(null);
              setActiveTab('dashboard');
            }}
            userWeightKg={data.user.weightKg}
          />
        );
      case 'body':
        return (
          <BodyComposition
            metrics={data.bodyMetrics || []}
            user={data.user}
            onAddMetric={handleAddBodyMetric}
          />
        );
      case 'dashboard':
      default:
        return renderDesktopDashboard();
    }
  };

  return (
    <main className="app-container">
      {/* Top Header */}
      <Header
        streakDays={data.user.streakDays}
        userName={data.user.name}
        theme={theme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleTheme={toggleTheme}
        onOpenLogWorkout={() => setIsLogModalOpen(true)}
        onOpenQuickStats={() => setIsQuickStatsOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
      />

      {/* Clean, Full-Feature Web Application Interface */}
      {renderDesktopContent()}

      {/* Modals */}
      <LogWorkoutModal
        isOpen={isLogModalOpen}
        userWeightKg={data.user.weightKg}
        onClose={() => setIsLogModalOpen(false)}
        onSaveWorkout={handleSaveWorkout}
      />

      <QuickStatsModal
        isOpen={isQuickStatsOpen}
        metrics={data.metrics}
        user={data.user}
        onClose={() => setIsQuickStatsOpen(false)}
        onSave={handleSaveMetrics}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        data={data}
        onClose={() => setIsDataModalOpen(false)}
        onImportData={(imported) => {
          setData(imported);
          saveFitnessData(imported);
          showToast('Imported fitness records successfully!', '📥');
        }}
        onResetData={handleResetData}
        onClearData={handleClearData}
      />

      <TaskRequirementsModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onNavigateToTab={setActiveTab}
        onOpenLogWorkout={() => setIsLogModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
      />

      {/* Floating Notifications */}
      <Toast toasts={toasts} />

      {/* Commercial Application Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>⚡ FitPulse Pro</span> • <span>Executive Athlete & Coach Suite</span>
          </div>
          <div className="footer-links">
            <button type="button" className="footer-link-btn" onClick={() => setIsDataModalOpen(true)}>
              ☁️ Cloud Sync & Storage
            </button>
            <button type="button" className="footer-link-btn" onClick={() => setIsQuickStatsOpen(true)}>
              ⚙️ Athlete Profile
            </button>
            <button type="button" className="footer-link-btn" onClick={() => setIsTaskModalOpen(true)}>
              📋 Architecture & Specifications
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
