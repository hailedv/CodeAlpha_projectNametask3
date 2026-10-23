'use client';

import React, { useState } from 'react';
import { DailyMetrics, UserProfile } from '@/types/fitness';

interface QuickStatsModalProps {
  isOpen: boolean;
  metrics: DailyMetrics;
  user: UserProfile;
  onClose: () => void;
  onSave: (updatedMetrics: DailyMetrics, updatedUser: UserProfile) => void;
}

export default function QuickStatsModal({
  isOpen,
  metrics,
  user,
  onClose,
  onSave,
}: QuickStatsModalProps) {
  const [steps, setSteps] = useState(metrics.steps);
  const [stepGoal, setStepGoal] = useState(metrics.stepGoal);
  const [calorieGoal, setCalorieGoal] = useState(metrics.calorieGoal);
  const [activeGoal, setActiveGoal] = useState(metrics.activeMinuteGoal);
  const [waterGoalMl, setWaterGoalMl] = useState(metrics.waterGoalMl);
  const [weightKg, setWeightKg] = useState(user.weightKg);
  const [heightCm, setHeightCm] = useState(user.heightCm || 178);
  const [userName, setUserName] = useState(user.name);

  if (!isOpen) return null;

  // Real-time BMI calculation
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '22.0';
  const bmiNum = parseFloat(bmi);
  let bmiCategory = 'Normal Weight';
  let bmiColor = '#10b981';
  if (bmiNum < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = '#38bdf8';
  } else if (bmiNum >= 25 && bmiNum < 30) {
    bmiCategory = 'Overweight';
    bmiColor = '#f59e0b';
  } else if (bmiNum >= 30) {
    bmiCategory = 'Obese';
    bmiColor = '#ef4444';
  }

  // Estimated Basal Metabolic Rate (BMR)
  const estimatedBMR = Math.round(10 * weightKg + 6.25 * heightCm - 5 * 26 + 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...metrics,
        steps: Number(steps),
        stepGoal: Number(stepGoal),
        calorieGoal: Number(calorieGoal),
        activeMinuteGoal: Number(activeGoal),
        waterGoalMl: Number(waterGoalMl),
      },
      {
        ...user,
        name: userName.trim() || 'Athlete',
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
      }
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Athlete Profile & Targets</h2>
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
          {/* User profile & Biometrics */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="user-name-input">
                Athlete Name
              </label>
              <input
                id="user-name-input"
                type="text"
                className="form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="user-weight-input">
                Weight (kg)
              </label>
              <input
                id="user-weight-input"
                type="number"
                min="30"
                max="250"
                className="form-input"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-height-input">
              Height (cm)
            </label>
            <input
              id="user-height-input"
              type="number"
              min="100"
              max="250"
              className="form-input"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              required
            />
          </div>

          {/* Biometrics Card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BMI Score</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: bmiColor }}>
                {bmi} <span style={{ fontSize: '11px', fontWeight: 600 }}>({bmiCategory})</span>
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated BMR</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-active)' }}>
                {estimatedBMR.toLocaleString()} <span style={{ fontSize: '11px' }}>kcal/day</span>
              </div>
            </div>
          </div>

          {/* Today's Steps */}
          <div className="form-group">
            <label className="form-label" htmlFor="daily-steps-input">
              Today&apos;s Current Steps
            </label>
            <input
              id="daily-steps-input"
              type="number"
              min="0"
              max="100000"
              className="form-input"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
            />
          </div>

          <h3
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '18px 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 700,
            }}
          >
            Daily Target Goals
          </h3>

          {/* Step Goal & Calorie Goal */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="goal-steps-input">
                Step Target
              </label>
              <input
                id="goal-steps-input"
                type="number"
                min="1000"
                step="500"
                className="form-input"
                value={stepGoal}
                onChange={(e) => setStepGoal(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-cal-input">
                Active Cal Target (kcal)
              </label>
              <input
                id="goal-cal-input"
                type="number"
                min="100"
                step="50"
                className="form-input"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Active Minutes Goal & Water Goal */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="goal-min-input">
                Active Time Target (min)
              </label>
              <input
                id="goal-min-input"
                type="number"
                min="10"
                step="5"
                className="form-input"
                value={activeGoal}
                onChange={(e) => setActiveGoal(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-water-input">
                Hydration Target (ml)
              </label>
              <input
                id="goal-water-input"
                type="number"
                min="500"
                step="250"
                className="form-input"
                value={waterGoalMl}
                onChange={(e) => setWaterGoalMl(Number(e.target.value))}
              />
            </div>
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
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
