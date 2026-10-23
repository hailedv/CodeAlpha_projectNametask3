'use client';

import React from 'react';

interface HeaderProps {
  streakDays: number;
  userName: string;
  theme: 'dark' | 'light';
  viewMode: 'desktop' | 'mobile';
  onToggleTheme: () => void;
  onToggleViewMode: (mode: 'desktop' | 'mobile') => void;
  onOpenLogWorkout: () => void;
  onOpenQuickStats: () => void;
  onOpenDataModal: () => void;
}

export default function Header({
  streakDays,
  userName,
  theme,
  viewMode,
  onToggleTheme,
  onToggleViewMode,
  onOpenLogWorkout,
  onOpenQuickStats,
  onOpenDataModal,
}: HeaderProps) {
  return (
    <header className="top-bar">
      <div className="brand-wrapper">
        <div className="brand-logo" aria-label="FitPulse Logo">
          ⚡
        </div>
        <div>
          <div className="brand-title">
            FitPulse
            <span className="brand-badge">TASK 3</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong> • {streakDays}-day streak 🔥
          </div>
        </div>
      </div>

      <div className="top-actions">
        {/* Device Switcher (Mobile App Simulation vs Full Desktop) */}
        <div className="view-switch" role="group" aria-label="Layout view mode">
          <button
            type="button"
            className={viewMode === 'desktop' ? 'active' : ''}
            onClick={() => onToggleViewMode('desktop')}
            title="Desktop Dashboard View"
          >
            🖥️ Full View
          </button>
          <button
            type="button"
            className={viewMode === 'mobile' ? 'active' : ''}
            onClick={() => onToggleViewMode('mobile')}
            title="Mobile Device App View"
          >
            📱 Mobile View
          </button>
        </div>

        {/* Data & Backup */}
        <button
          type="button"
          className="btn-icon"
          onClick={onOpenDataModal}
          title="Backup & Data Management"
        >
          💾
        </button>

        {/* Edit Daily Metrics */}
        <button
          type="button"
          className="btn-icon"
          onClick={onOpenQuickStats}
          title="Edit Daily Stats & Goals"
        >
          ⚙️
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Primary Log Workout Button */}
        <button
          type="button"
          id="btn-log-workout-header"
          className="btn btn-primary"
          onClick={onOpenLogWorkout}
        >
          <span>+ Log Workout</span>
        </button>
      </div>
    </header>
  );
}
