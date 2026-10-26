'use client';

import React from 'react';

import AnimatedNumber from './AnimatedNumber';

export type MainNavTab = 'dashboard' | 'library' | 'coach' | 'live' | 'body';

interface HeaderProps {
  streakDays: number;
  userName: string;
  theme: 'dark' | 'light';
  viewMode?: 'desktop' | 'mobile';
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onToggleTheme: () => void;
  onToggleViewMode?: (mode: 'desktop' | 'mobile') => void;
  onOpenLogWorkout: () => void;
  onOpenQuickStats: () => void;
  onOpenDataModal: () => void;
}

export default function Header({
  streakDays,
  userName,
  theme,
  activeTab,
  onSelectTab,
  onToggleTheme,
  onOpenLogWorkout,
  onOpenQuickStats,
  onOpenDataModal,
}: HeaderProps) {
  return (
    <header className="top-bar-container">
      {/* Row 1: Brand Identity & Utility Actions */}
      <div className="top-bar-primary">
        {/* Real App Brand Identity */}
        <div
          className="brand-wrapper"
          onClick={() => onSelectTab('dashboard')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectTab('dashboard');
          }}
          aria-label="Return to Dashboard"
        >
          <div className="brand-logo" aria-label="FitPulse Logo">
            ⚡
          </div>
          <div className="brand-text-block">
            <div className="brand-title">
              FitPulse
              <span className="brand-badge">ATHLETE OS</span>
            </div>
            <div className="brand-athlete-subtitle">
              Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong> • <AnimatedNumber value={streakDays} />-day streak 🔥
            </div>
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="top-actions">
          {/* Action Button Group */}
          <div className="utility-buttons-group">
            {/* Cloud Sync & Storage Engine Modal */}
            <button
              type="button"
              className="btn-icon"
              onClick={onOpenDataModal}
              title="Cloud Sync (Firebase) & SQLite Local Storage Engine"
              aria-label="Cloud and local storage data management"
            >
              ☁️
            </button>

            {/* Edit Goals & Profile Settings */}
            <button
              type="button"
              className="btn-icon"
              onClick={onOpenQuickStats}
              title="Athlete Profile & Daily Target Goals"
              aria-label="Profile and daily targets"
            >
              ⚙️
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              className="btn-icon"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Daylight Clean Mode' : 'Switch to Obsidian Dark Mode'}
              aria-label="Toggle dark and light color theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Primary Quick Log Action */}
          <button
            type="button"
            id="btn-log-workout-header"
            className="btn btn-primary"
            onClick={onOpenLogWorkout}
          >
            <span>+ Log Workout</span>
          </button>
        </div>
      </div>

      {/* Row 2: Dedicated Navigation Tab Dock */}
      <div className="top-bar-nav-row">
        <nav className="desktop-main-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`main-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
            id="nav-tab-dashboard"
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`main-nav-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => onSelectTab('library')}
            id="nav-tab-library"
          >
            <span className="nav-icon">🏋️</span>
            <span>Exercise Library</span>
            <span className="tab-pill-badge">53</span>
          </button>

          <button
            type="button"
            className={`main-nav-btn ${activeTab === 'coach' ? 'active' : ''}`}
            onClick={() => onSelectTab('coach')}
            id="nav-tab-coach"
          >
            <span className="nav-icon">👨‍🏫</span>
            <span>Coach Hub</span>
            <span className="tab-pill-badge coach">PRO</span>
          </button>

          <button
            type="button"
            className={`main-nav-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => onSelectTab('live')}
            id="nav-tab-live"
          >
            <span className="nav-icon live-pulse-icon">⏱️</span>
            <span>Live Workout</span>
          </button>

          <button
            type="button"
            className={`main-nav-btn ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => onSelectTab('body')}
            id="nav-tab-body"
          >
            <span className="nav-icon">📈</span>
            <span>Body & Analytics</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
