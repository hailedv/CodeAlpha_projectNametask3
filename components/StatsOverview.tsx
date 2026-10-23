'use client';

import React from 'react';
import { DailyMetrics } from '@/types/fitness';
import CircularProgress from './CircularProgress';

interface StatsOverviewProps {
  metrics: DailyMetrics;
  totalWorkoutCalories: number;
  totalWorkoutMinutes: number;
  onQuickAddSteps: (amount: number) => void;
  onOpenQuickStats: () => void;
}

export default function StatsOverview({
  metrics,
  totalWorkoutCalories,
  totalWorkoutMinutes,
  onQuickAddSteps,
  onOpenQuickStats,
}: StatsOverviewProps) {
  // Total calories burned is baseline active + logged workout burns
  const totalBurned = Math.max(metrics.calorieGoal ? 0 : 0, totalWorkoutCalories + Math.round(metrics.steps * 0.04));
  const stepPercent = Math.round((metrics.steps / metrics.stepGoal) * 100);
  const calPercent = Math.round((totalBurned / metrics.calorieGoal) * 100);
  const minPercent = Math.round((totalWorkoutMinutes / metrics.activeMinuteGoal) * 100);
  const waterPercent = Math.round((metrics.waterMl / metrics.waterGoalMl) * 100);

  // Approximate distance: ~0.762 meters per step
  const distanceKm = ((metrics.steps * 0.762) / 1000).toFixed(1);

  return (
    <section className="metrics-row" aria-label="Daily Fitness Activity Metrics">
      {/* Steps Card */}
      <div className="metric-card" id="card-steps">
        <CircularProgress
          percentage={stepPercent}
          color="var(--accent-steps)"
          icon="👟"
        />
        <div className="metric-info">
          <span className="metric-label">Daily Steps</span>
          <div className="metric-value">
            {metrics.steps.toLocaleString()}
          </div>
          <div className="metric-goal">
            Goal: {metrics.stepGoal.toLocaleString()} • {distanceKm} km
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button
              type="button"
              className="chart-pill"
              onClick={() => onQuickAddSteps(500)}
              title="Add 500 steps"
            >
              +500
            </button>
            <button
              type="button"
              className="chart-pill"
              onClick={() => onQuickAddSteps(1000)}
              title="Add 1,000 steps"
            >
              +1k
            </button>
          </div>
        </div>
      </div>

      {/* Calories Card */}
      <div className="metric-card" id="card-calories">
        <CircularProgress
          percentage={calPercent}
          color="var(--accent-calories)"
          icon="🔥"
        />
        <div className="metric-info">
          <span className="metric-label">Active Calories</span>
          <div className="metric-value">
            {totalBurned.toLocaleString()} <span style={{ fontSize: '15px', fontWeight: 600 }}>kcal</span>
          </div>
          <div className="metric-goal">
            Target: {metrics.calorieGoal} kcal ({calPercent}%)
          </div>
        </div>
      </div>

      {/* Active Minutes Card */}
      <div className="metric-card" id="card-active-minutes">
        <CircularProgress
          percentage={minPercent}
          color="var(--accent-active)"
          icon="⚡"
        />
        <div className="metric-info">
          <span className="metric-label">Active Time</span>
          <div className="metric-value">
            {totalWorkoutMinutes} <span style={{ fontSize: '15px', fontWeight: 600 }}>min</span>
          </div>
          <div className="metric-goal">
            Goal: {metrics.activeMinuteGoal} min ({minPercent}%)
          </div>
        </div>
      </div>

      {/* Water Hydration Card */}
      <div className="metric-card" id="card-water">
        <CircularProgress
          percentage={waterPercent}
          color="var(--accent-water)"
          icon="💧"
        />
        <div className="metric-info">
          <span className="metric-label">Hydration</span>
          <div className="metric-value">
            {(metrics.waterMl / 1000).toFixed(1)} <span style={{ fontSize: '15px', fontWeight: 600 }}>L</span>
          </div>
          <div className="metric-goal">
            Target: {(metrics.waterGoalMl / 1000).toFixed(1)} L ({waterPercent}%)
          </div>
        </div>
      </div>
    </section>
  );
}
