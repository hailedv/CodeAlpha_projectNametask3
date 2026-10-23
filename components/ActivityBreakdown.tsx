'use client';

import React from 'react';
import { WorkoutEntry } from '@/types/fitness';
import { ACTIVITY_DETAILS } from '@/lib/storage';

interface ActivityBreakdownProps {
  workouts: WorkoutEntry[];
}

export default function ActivityBreakdown({ workouts }: ActivityBreakdownProps) {
  // Aggregate duration and calories by category
  const categories: Record<string, { label: string; minutes: number; calories: number; color: string; icon: string }> = {
    cardio: { label: 'Cardio', minutes: 0, calories: 0, color: '#10b981', icon: '🏃' },
    strength: { label: 'Strength', minutes: 0, calories: 0, color: '#8b5cf6', icon: '🏋️' },
    flexibility: { label: 'Flexibility', minutes: 0, calories: 0, color: '#ec4899', icon: '🧘' },
    sports: { label: 'Sports / MMA', minutes: 0, calories: 0, color: '#ef4444', icon: '🥊' },
  };

  workouts.forEach((w) => {
    const detail = ACTIVITY_DETAILS[w.type] || { category: 'cardio' };
    const cat = detail.category || 'cardio';
    if (categories[cat]) {
      categories[cat].minutes += w.durationMinutes;
      categories[cat].calories += w.caloriesBurned;
    }
  });

  const totalMinutes = Object.values(categories).reduce((sum, c) => sum + c.minutes, 0) || 1;

  return (
    <div className="card" id="activity-breakdown-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <span>🎯 Workout Distribution</span>
          </h3>
          <div className="card-subtitle">By category & active time</div>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-steps)',
          }}
        >
          {totalMinutes} mins total
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div
        style={{
          display: 'flex',
          height: '10px',
          borderRadius: '5px',
          overflow: 'hidden',
          background: 'var(--bg-surface-elevated)',
          marginBottom: '16px',
          gap: '2px',
        }}
      >
        {Object.entries(categories).map(([key, cat]) => {
          const pct = Math.round((cat.minutes / totalMinutes) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={key}
              style={{
                width: `${pct}%`,
                background: cat.color,
                transition: 'width 0.4s ease',
              }}
              title={`${cat.label}: ${pct}% (${cat.minutes}m)`}
            />
          );
        })}
      </div>

      {/* Category Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        {Object.entries(categories).map(([key, cat]) => {
          const pct = Math.round((cat.minutes / totalMinutes) * 100);
          return (
            <div
              key={key}
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {cat.minutes} min • {cat.calories} kcal
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: cat.color,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
