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
      timestamp: new Date().toISOString(),
    };

    onSaveWorkout(newWorkout);

    // Trigger celebratory confetti!
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Fallback silently if canvas not supported
    }

    onClose();
  };

  const activityKeys = Object.keys(ACTIVITY_DETAILS) as ActivityType[];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Log Fitness Activity</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Select Activity Type */}
          <div className="form-group">
            <label className="form-label">
              <span>Exercise Type</span>
              <span style={{ color: 'var(--accent-steps)', textTransform: 'capitalize' }}>
                {ACTIVITY_DETAILS[type].label}
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

          {/* Workout Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="workout-title-input">
              Session Title
            </label>
            <input
              id="workout-title-input"
              type="text"
              className="form-input"
              placeholder="e.g. Morning 5k Trail Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Duration & Intensity */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="workout-duration-input">
                Duration (minutes)
              </label>
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

            <div className="form-group">
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
                <option value="light">Light (Aerobic / Warmup)</option>
                <option value="moderate">Moderate (Standard)</option>
                <option value="high">High (Challenging)</option>
                <option value="vigorous">Vigorous (Max Effort)</option>
              </select>
            </div>
          </div>

          {/* Calories (with smart auto-calc indicator) */}
          <div className="form-group">
            <label className="form-label" htmlFor="workout-calories-input">
              <span>Calories Burned (kcal)</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isManualCalories ? 'Custom entered' : '✨ Auto-estimated via MET'}
              </span>
            </label>
            <input
              id="workout-calories-input"
              type="number"
              min="0"
              max="5000"
              className="form-input"
              value={calories}
              onChange={(e) => {
                setCalories(parseInt(e.target.value, 10) || 0);
                setIsManualCalories(true);
              }}
            />
          </div>

          {/* Optional Distance & Heart Rate */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="workout-distance-input">
                Distance (km) <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <input
                id="workout-distance-input"
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="e.g. 5.2"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="workout-hr-input">
                Avg Heart Rate <span style={{ color: 'var(--text-muted)' }}>(Optional bpm)</span>
              </label>
              <input
                id="workout-hr-input"
                type="number"
                min="40"
                max="220"
                className="form-input"
                placeholder="e.g. 145"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="workout-notes-input">
              Notes & Highlights <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            <textarea
              id="workout-notes-input"
              className="form-textarea"
              rows={2}
              placeholder="e.g. Felt energetic, beat previous 5k split time by 40s!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-workout"
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              Save Workout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
