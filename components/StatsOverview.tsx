'use client';

import React from 'react';
import { DailyMetrics } from '@/types/fitness';
import CircularProgress from './CircularProgress';
import AnimatedNumber from './AnimatedNumber';

interface StatsOverviewProps {
  metrics: DailyMetrics;
  totalWorkoutCalories: number;
  totalWorkoutMinutes: number;
  onQuickAddSteps: (amount: number) => void;
  onOpenQuickStats: () => void;
  onQuickAddWater?: (amount: number) => void;
  onOpenLogWorkout?: () => void;
  onStartLive?: () => void;
}

export default function StatsOverview({
  metrics,
  totalWorkoutCalories,
  totalWorkoutMinutes,
  onQuickAddSteps,
  onOpenQuickStats,
  onQuickAddWater,
  onOpenLogWorkout,
  onStartLive,
}: StatsOverviewProps) {
  // Total calories burned is baseline active + logged workout burns
  const totalBurned = Math.max(metrics.calorieGoal ? 0 : 0, totalWorkoutCalories + Math.round(metrics.steps * 0.04));
  const stepPercent = Math.round((metrics.steps / metrics.stepGoal) * 100);
  const calPercent = Math.round((totalBurned / metrics.calorieGoal) * 100);
  const minPercent = Math.round((totalWorkoutMinutes / metrics.activeMinuteGoal) * 100);
  const waterPercent = Math.round((metrics.waterMl / metrics.waterGoalMl) * 100);

  // Approximate distance: ~0.762 meters per step
  const distanceKm = Number(((metrics.steps * 0.762) / 1000).toFixed(1));

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="metric-label">Daily Steps</span>
            <button
              type="button"
              className="metric-goal-edit-btn"
              onClick={onOpenQuickStats}
              title="Edit daily step target"
              aria-label="Edit step goal"
            >
              ⚙️
            </button>
          </div>
          <div className="metric-value">
            <AnimatedNumber value={metrics.steps} />
          </div>
          <div className="metric-goal">
            Goal: {metrics.stepGoal.toLocaleString()} • <AnimatedNumber value={distanceKm} decimals={1} /> km
          </div>
          <div className="metric-actions-row">
            <button
              type="button"
              className="chart-pill action-pill"
              onClick={() => onQuickAddSteps(500)}
              title="Add 500 steps"
            >
              +500
            </button>
            <button
              type="button"
              className="chart-pill action-pill"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="metric-label">Active Calories</span>
            <button
              type="button"
              className="metric-goal-edit-btn"
              onClick={onOpenQuickStats}
              title="Edit daily calorie target"
              aria-label="Edit calorie goal"
            >
              ⚙️
            </button>
          </div>
          <div className="metric-value">
            <AnimatedNumber value={totalBurned} />{' '}
            <span style={{ fontSize: '15px', fontWeight: 600 }}>kcal</span>
          </div>
          <div className="metric-goal">
            Target: {metrics.calorieGoal} kcal ({calPercent}%)
          </div>
          <div className="metric-actions-row">
            {onOpenLogWorkout && (
              <button
                type="button"
                className="chart-pill action-pill"
                onClick={onOpenLogWorkout}
                title="Log a workout to record calories burned"
              >
                + Log Burn
              </button>
            )}
            <button
              type="button"
              className="chart-pill action-pill"
              onClick={onOpenQuickStats}
              title="Adjust calorie goal"
            >
              🎯 Goal
            </button>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="metric-label">Active Time</span>
            <button
              type="button"
              className="metric-goal-edit-btn"
              onClick={onOpenQuickStats}
              title="Edit daily active time goal"
              aria-label="Edit active time goal"
            >
              ⚙️
            </button>
          </div>
          <div className="metric-value">
            <AnimatedNumber value={totalWorkoutMinutes} />{' '}
            <span style={{ fontSize: '15px', fontWeight: 600 }}>min</span>
          </div>
          <div className="metric-goal">
            Goal: {metrics.activeMinuteGoal} min ({minPercent}%)
          </div>
          <div className="metric-actions-row">
            {onStartLive && (
              <button
                type="button"
                className="chart-pill action-pill"
                onClick={onStartLive}
                title="Start a live timed gym session"
              >
                ⚡ Live Timer
              </button>
            )}
            {onOpenLogWorkout && (
              <button
                type="button"
                className="chart-pill action-pill"
                onClick={onOpenLogWorkout}
                title="Log manual workout duration"
              >
                + Log
              </button>
            )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="metric-label">Hydration</span>
            <button
              type="button"
              className="metric-goal-edit-btn"
              onClick={onOpenQuickStats}
              title="Edit daily water goal"
              aria-label="Edit water goal"
            >
              ⚙️
            </button>
          </div>
          <div className="metric-value">
            <AnimatedNumber value={metrics.waterMl / 1000} decimals={1} />{' '}
            <span style={{ fontSize: '15px', fontWeight: 600 }}>L</span>
          </div>
          <div className="metric-goal">
            Target: {(metrics.waterGoalMl / 1000).toFixed(1)} L ({waterPercent}%)
          </div>
          <div className="metric-actions-row">
            {onQuickAddWater && (
              <>
                <button
                  type="button"
                  className="chart-pill action-pill"
                  onClick={() => onQuickAddWater(250)}
                  title="Add 250ml water (1 glass)"
                >
                  +250ml
                </button>
                <button
                  type="button"
                  className="chart-pill action-pill"
                  onClick={() => onQuickAddWater(500)}
                  title="Add 500ml water (1 bottle)"
                >
                  +500ml
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
