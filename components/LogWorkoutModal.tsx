'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ActivityType, IntensityLevel, WorkoutEntry } from '@/types/fitness';
import { ACTIVITY_DETAILS, estimateCalories } from '@/lib/storage';

interface LogWorkoutModalProps {
  isOpen: boolean;
  userWeightKg: number;
  onClose: () => void;
  onSaveWorkout: (entry: WorkoutEntry) => void;
}

export default function LogWorkoutModal({
  isOpen,
  userWeightKg,
  onClose,
  onSaveWorkout,
}: LogWorkoutModalProps) {
  const [type, setType] = useState<ActivityType>('running');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<IntensityLevel>('moderate');
  const [calories, setCalories] = useState<number>(0);
  const [distance, setDistance] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isManualCalories, setIsManualCalories] = useState(false);
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Auto calculate calories whenever type, duration, or intensity changes
  useEffect(() => {
    if (!isManualCalories) {
      const estimated = estimateCalories(type, duration, intensity, userWeightKg);
      setCalories(estimated);
    }
  }, [type, duration, intensity, userWeightKg, isManualCalories]);

  // Set default title when type changes if title is empty or matching old label
  useEffect(() => {
    const detail = ACTIVITY_DETAILS[type];
    if (detail && (!title || Object.values(ACTIVITY_DETAILS).some((d) => d.label === title))) {
      setTitle(detail.label);
    }
  }, [type, title]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || duration <= 0) return;

    const newWorkout: WorkoutEntry = {
      id: `w-${Date.now()}`,
      type,
      title: title.trim(),
      durationMinutes: Number(duration),
      caloriesBurned: Number(calories) || 10,
      intensity,
      distanceKm: distance ? parseFloat(distance) : undefined,
      heartRateAvg: heartRate ? parseInt(heartRate, 10) : undefined,
      notes: notes.trim() || undefined,
      timestamp: new Date(`${workoutDate}T12:00:00`).toISOString(),
    };

    onSaveWorkout(newWorkout);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Fallback silently
    }

    onClose();
  };

  const activityKeys = Object.keys(ACTIVITY_DETAILS) as ActivityType[];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ fontSize: '20px' }}>Record Workout Session</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Log training duration, exercise discipline, and caloric expenditure
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          {/* Select Activity Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Activity Discipline</span>
              <span style={{ color: 'var(--accent-steps)', textTransform: 'capitalize', fontWeight: 600 }}>
                {ACTIVITY_DETAILS[type].label} • {ACTIVITY_DETAILS[type].category}
              </span>
            </label>
            <div className="chip-grid">
              {activityKeys.map((key) => {
                const act = ACTIVITY_DETAILS[key];
                const isSelected = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setType(key);
                      setIsManualCalories(false);
                    }}
                  >
                    <span className="chip-icon">{act.icon}</span>
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workout Title & Date */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
              <label className="form-label" htmlFor="workout-title-input">
                Workout Title
              </label>
              <input
                id="workout-title-input"
                type="text"
                className="form-input"
                placeholder="e.g. Morning 5k Tempo Run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="workout-date-input">
                Date
              </label>
              <input
                id="workout-date-input"
                type="date"
                className="form-input"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Workout Time / Duration & Quick Chips */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="workout-duration-input" style={{ margin: 0 }}>
                Duration (Minutes)
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setDuration(mins);
                      setIsManualCalories(false);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: duration === mins ? 'var(--accent-steps)' : 'var(--bg-surface-elevated)',
                      color: duration === mins ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
            <input
              id="workout-duration-input"
              type="number"
              min="1"
              max="720"
              className="form-input"
              value={duration}
              onChange={(e) => {
                setDuration(Math.max(1, parseInt(e.target.value, 10) || 1));
                setIsManualCalories(false);
              }}
              required
            />
          </div>

          {/* Calories Burned (Manual vs Auto MET) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="workout-calories-input" style={{ margin: 0 }}>
                Calories Burned (kcal)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualCalories(false)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: !isManualCalories ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: !isManualCalories ? 'var(--accent-steps)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ MET Auto-Estimate
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualCalories(true)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: isManualCalories ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: isManualCalories ? '#f59e0b' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Custom Entry
                </button>
              </div>
            </div>
            <input
              id="workout-calories-input"
              type="number"
              min="1"
              max="6000"
              className="form-input"
              value={calories}
              onChange={(e) => {
                setCalories(parseInt(e.target.value, 10) || 0);
                setIsManualCalories(true);
              }}
              required
            />
          </div>

          {/* Intensity & Distance & Heart Rate */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="workout-intensity-select">
                Intensity Level
              </label>
              <select
                id="workout-intensity-select"
                className="form-select"
                value={intensity}
                onChange={(e) => {
                  setIntensity(e.target.value as IntensityLevel);
                  setIsManualCalories(false);
                }}
              >
                <option value="light">Light (Recovery / Warmup)</option>
                <option value="moderate">Moderate (Standard)</option>
                <option value="high">High (Challenging)</option>
                <option value="vigorous">Vigorous (Max Output)</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="workout-distance-input">
                Distance (km)
              </label>
              <input
                id="workout-distance-input"
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="Optional (e.g. 5.2)"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="workout-hr-input">
                Avg Heart Rate (bpm)
              </label>
              <input
                id="workout-hr-input"
                type="number"
                min="40"
                max="220"
                className="form-input"
                placeholder="Optional (e.g. 142)"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="workout-notes-input">
              Session Notes
            </label>
            <input
              id="workout-notes-input"
              type="text"
              className="form-input"
              placeholder="e.g. Negative splits on back half, felt strong"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-save-manual-workout"
            >
              <span>✓ Save Workout</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
