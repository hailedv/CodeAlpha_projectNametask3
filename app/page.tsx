'use client';

import React, { useState, useEffect } from 'react';
import { FitnessAppData, DailyMetrics, UserProfile, WorkoutEntry } from '@/types/fitness';
import {
  loadFitnessData,
  saveFitnessData,
  resetFitnessData,
  INITIAL_FITNESS_DATA,
} from '@/lib/storage';

import Header from '@/components/Header';
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
import Toast, { ToastMessage } from '@/components/Toast';

// Lightweight Web Audio feedback for tactile user experience
function playHapticSound(type: 'chime' | 'water' | 'pop') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    // Graceful fallback if user hasn't interacted or audio context blocked
  }
}

export default function Home() {
  const [data, setData] = useState<FitnessAppData>(INITIAL_FITNESS_DATA);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isQuickStatsOpen, setIsQuickStatsOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize localStorage on mount
  useEffect(() => {
    const loaded = loadFitnessData();
    setData(loaded);

    const savedTheme = localStorage.getItem('fitpulse_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

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

    setData(newData);
    saveFitnessData(newData);
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

    setData(newData);
    saveFitnessData(newData);
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

    setData(newData);
    saveFitnessData(newData);
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

    setData(newData);
    saveFitnessData(newData);
    showToast(`Water updated to ${newMl} ml`, '💧');
  };

  const handleSaveMetrics = (updatedMetrics: DailyMetrics, updatedUser: UserProfile) => {
    const newData: FitnessAppData = {
      ...data,
      metrics: updatedMetrics,
      user: updatedUser,
    };

    setData(newData);
    saveFitnessData(newData);
    showToast('Goals and athlete profile saved!', '✅');
  };

  const handleResetData = () => {
    const res = resetFitnessData();
    setData(res);
    saveFitnessData(res);
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
    setData(cleared);
    saveFitnessData(cleared);
    showToast('All activity records cleared', '🧹');
  };

  const [mobileTab, setMobileTab] = useState<'dashboard' | 'workouts' | 'health' | 'achievements'>('dashboard');

  // Desktop full dashboard view
  const renderDesktopContent = () => (
    <>
      {/* 4 Circular Progress Metrics */}
      <StatsOverview
        metrics={data.metrics}
        totalWorkoutCalories={totalWorkoutCalories}
        totalWorkoutMinutes={totalWorkoutMinutes}
        onQuickAddSteps={handleQuickAddSteps}
        onOpenQuickStats={() => setIsQuickStatsOpen(true)}
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

  // Mobile dedicated tabbed view
  const renderMobileContent = () => {
    switch (mobileTab) {
      case 'workouts':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <WorkoutList
              workouts={data.workouts}
              onDeleteWorkout={handleDeleteWorkout}
              onOpenLogWorkout={() => setIsLogModalOpen(true)}
            />
            <ActivityBreakdown workouts={data.workouts} />
          </div>
        );
      case 'health':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <WaterTracker
              waterMl={data.metrics.waterMl}
              waterGoalMl={data.metrics.waterGoalMl}
              onUpdateWater={handleUpdateWater}
            />
            <MotivationCard />
          </div>
        );
      case 'achievements':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Achievements achievements={data.achievements} />
            <MotivationCard />
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <StatsOverview
              metrics={data.metrics}
              totalWorkoutCalories={totalWorkoutCalories}
              totalWorkoutMinutes={totalWorkoutMinutes}
              onQuickAddSteps={handleQuickAddSteps}
              onOpenQuickStats={() => setIsQuickStatsOpen(true)}
            />
            <WeeklyChart pastWeek={data.pastWeek} />
            <WaterTracker
              waterMl={data.metrics.waterMl}
              waterGoalMl={data.metrics.waterGoalMl}
              onUpdateWater={handleUpdateWater}
            />
          </div>
        );
    }
  };

  return (
    <main className="app-container">
      {/* Top Header */}
      <Header
        streakDays={data.user.streakDays}
        userName={data.user.name}
        theme={theme}
        viewMode={viewMode}
        onToggleTheme={toggleTheme}
        onToggleViewMode={setViewMode}
        onOpenLogWorkout={() => setIsLogModalOpen(true)}
        onOpenQuickStats={() => setIsQuickStatsOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
      />

      {/* Mobile Device Simulation OR Desktop Dashboard */}
      {viewMode === 'mobile' ? (
        <div className="mobile-frame-wrapper">
          <div className="mobile-phone">
            {/* Dynamic Island */}
            <div className="phone-island">
              <span style={{ fontSize: '10px', color: '#10b981' }}>⚡</span>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Active</span>
            </div>

            {/* Mobile Status Bar */}
            <div className="phone-status-bar">
              <span>9:41</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px' }}>5G</span>
                <span>🔋 98%</span>
              </div>
            </div>

            {/* Scrollable Phone Content */}
            <div className="phone-content">{renderMobileContent()}</div>

            {/* Native Mobile App Bottom Navigation */}
            <nav className="mobile-bottom-nav" aria-label="Mobile App Navigation">
              <button
                type="button"
                className={`nav-tab-btn ${mobileTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setMobileTab('dashboard')}
                title="Today's Overview"
              >
                <span className="nav-icon">📊</span>
                <span>Today</span>
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${mobileTab === 'workouts' ? 'active' : ''}`}
                onClick={() => setMobileTab('workouts')}
                title="Workouts History"
              >
                <span className="nav-icon">🏋️</span>
                <span>Workouts</span>
              </button>
              <button
                type="button"
                className="nav-tab-btn"
                onClick={() => setIsLogModalOpen(true)}
                style={{
                  background: 'var(--accent-steps)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  transform: 'translateY(-8px)',
                  boxShadow: '0 4px 14px var(--accent-steps-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Log New Workout"
              >
                <span style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>+</span>
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${mobileTab === 'health' ? 'active' : ''}`}
                onClick={() => setMobileTab('health')}
                title="Hydration & Insights"
              >
                <span className="nav-icon">💧</span>
                <span>Hydration</span>
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${mobileTab === 'achievements' ? 'active' : ''}`}
                onClick={() => setMobileTab('achievements')}
                title="Trophies & Badges"
              >
                <span className="nav-icon">🏆</span>
                <span>Badges</span>
              </button>
            </nav>
          </div>
        </div>
      ) : (
        renderDesktopContent()
      )}

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

      {/* Floating Notifications */}
      <Toast toasts={toasts} />
    </main>
  );
}
