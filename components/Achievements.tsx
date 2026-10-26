'use client';

import React from 'react';
import { Achievement } from '@/types/fitness';

interface AchievementsProps {
  achievements: Achievement[];
}

export default function Achievements({ achievements }: AchievementsProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="card" id="achievements-section">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <span className="trophy-sparkle-icon">🏆</span>
            <span>Milestones & Trophies</span>
          </h3>
          <div className="card-subtitle">
            {unlockedCount} of {achievements.length} unlocked
          </div>
        </div>
        <span
          className="level-badge-glow"
          style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
          }}
        >
          Level 2 Athlete
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {achievements.map((ach, idx) => (
          <div
            key={ach.id}
            className={`achievement-card ${ach.unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: ach.unlocked ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
              border: ach.unlocked
                ? '1px solid rgba(245, 158, 11, 0.35)'
                : '1px solid var(--border-subtle)',
              opacity: ach.unlocked ? 1 : 0.78,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              animationDelay: `${idx * 0.08}s`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`achievement-icon ${ach.unlocked ? 'icon-unlocked-glow' : ''}`} style={{ fontSize: '24px' }}>
                {ach.icon}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: ach.unlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: ach.unlocked ? 'var(--accent-steps)' : 'var(--text-muted)',
                }}
              >
                {ach.unlocked ? '✓ Unlocked' : `${ach.progress}%`}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ach.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {ach.description}
              </div>
            </div>

            {/* Progress bar with animated shimmer */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginTop: 'auto',
              }}
            >
              <div
                className={`achievement-bar-fill ${ach.unlocked ? 'bar-shimmer' : ''}`}
                style={{
                  width: `${ach.progress}%`,
                  height: '100%',
                  background: ach.unlocked
                    ? 'linear-gradient(90deg, #f59e0b, #10b981)'
                    : 'var(--accent-active)',
                  borderRadius: '3px',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
