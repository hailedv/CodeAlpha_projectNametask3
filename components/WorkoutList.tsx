'use client';

import React, { useState } from 'react';
import { WorkoutEntry } from '@/types/fitness';
import { ACTIVITY_DETAILS } from '@/lib/storage';

interface WorkoutListProps {
  workouts: WorkoutEntry[];
  onDeleteWorkout: (id: string) => void;
  onOpenLogWorkout: () => void;
}

export default function WorkoutList({
  workouts,
  onDeleteWorkout,
  onOpenLogWorkout,
}: WorkoutListProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredWorkouts = workouts.filter((w) => {
    const details = ACTIVITY_DETAILS[w.type] || { category: 'cardio' };
    const matchesCategory = filterCategory === 'all' || details.category === filterCategory;
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.notes && w.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      details.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDeleteWithAnimation = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDeleteWorkout(id);
      setDeletingId(null);
    }, 280);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const intensityColors: Record<string, string> = {
    light: '#10b981',
    moderate: '#06b6d4',
    high: '#f59e0b',
    vigorous: '#ef4444',
  };

  return (
    <div className="card" id="workouts-history-section">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="card-title">
            <span>🏋️ Workout Activity Log</span>
          </h2>
          <div className="card-subtitle">
            {workouts.length} recorded {workouts.length === 1 ? 'session' : 'sessions'}
          </div>
        </div>

        <button
          type="button"
          id="btn-log-workout-feed"
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={onOpenLogWorkout}
        >
          + Log Workout
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'cardio', 'strength', 'flexibility', 'sports'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chart-pill ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
              style={{ textTransform: 'capitalize' }}
            >
              {cat === 'all' ? '🌟 All Activities' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="form-input workout-search-input"
          style={{ padding: '8px 12px', fontSize: '13px' }}
          placeholder="🔍 Search workout by name, notes, or exercise type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Workouts Feed */}
      <div className="workout-list" aria-label="Recent workouts list">
        {filteredWorkouts.length === 0 ? (
          <div
            className="empty-state-card"
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="floating-empty-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>
              🏃
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No workouts found
            </p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              {searchQuery ? 'Try adjusting your search query or category filter.' : 'Log your fitness activity to start tracking progress.'}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenLogWorkout}
            >
              Log an Activity Now
            </button>
          </div>
        ) : (
          filteredWorkouts.map((workout, idx) => {
            const details = ACTIVITY_DETAILS[workout.type] || {
              label: 'Workout',
              icon: '⚡',
              color: '#10b981',
            };
            const isDeleting = deletingId === workout.id;

            return (
              <div
                key={workout.id}
                className={`workout-item workout-item-stagger ${isDeleting ? 'workout-item-exiting' : ''}`}
                style={{ '--item-idx': Math.min(idx, 8) } as React.CSSProperties}
                id={`workout-${workout.id}`}
              >
                <div className="workout-left">
                  <div
                    className="workout-icon-badge"
                    style={{
                      background: `${details.color}20`,
                      border: `1px solid ${details.color}40`,
                    }}
                  >
                    {details.icon}
                  </div>
                  <div className="workout-main">
                    <div className="workout-name">{workout.title}</div>
                    <div className="workout-meta">
                      <span style={{ color: details.color, fontWeight: 600 }}>{details.label}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(workout.timestamp)}</span>
                      <span>•</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: `${intensityColors[workout.intensity] || '#10b981'}20`,
                          color: intensityColors[workout.intensity] || '#10b981',
                          textTransform: 'capitalize',
                          fontWeight: 600,
                        }}
                      >
                        {workout.intensity}
                      </span>
                      {workout.distanceKm && (
                        <>
                          <span>•</span>
                          <span>{workout.distanceKm} km</span>
                        </>
                      )}
                      {workout.heartRateAvg && (
                        <>
                          <span>•</span>
                          <span>❤️ {workout.heartRateAvg} bpm</span>
                        </>
                      )}
                    </div>
                    {workout.notes && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          fontStyle: 'italic',
                        }}
                      >
                        &quot;{workout.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                <div className="workout-right">
                  <div className="workout-burn">
                    <div className="workout-kcal">+{workout.caloriesBurned} kcal</div>
                    <div className="workout-duration">{workout.durationMinutes} min</div>
                  </div>

                  <button
                    type="button"
                    className="btn-delete-workout"
                    onClick={() => handleDeleteWithAnimation(workout.id)}
                    title="Delete workout entry"
                    aria-label={`Delete ${workout.title}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
