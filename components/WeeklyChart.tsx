'use client';

import React, { useState } from 'react';
import { DayActivityData } from '@/types/fitness';

interface WeeklyChartProps {
  pastWeek: DayActivityData[];
}

type ChartMetric = 'calories' | 'steps' | 'activeMinutes';

export default function WeeklyChart({ pastWeek }: WeeklyChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('calories');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(pastWeek.length - 1);

  // Compute max value for scaling bar heights
  const values = pastWeek.map((d) => d[metric]);
  const maxValue = Math.max(...values, 1);

  const total = values.reduce((acc, curr) => acc + curr, 0);
  const avg = Math.round(total / (values.length || 1));

  const metricConfig = {
    calories: {
      label: 'Calories Burned',
      unit: 'kcal',
      color: 'linear-gradient(180deg, #ff5238 0%, #b91c1c 100%)',
      accentColor: 'var(--accent-calories)',
    },
    steps: {
      label: 'Steps Taken',
      unit: 'steps',
      color: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
      accentColor: 'var(--accent-steps)',
    },
    activeMinutes: {
      label: 'Active Minutes',
      unit: 'mins',
      color: 'linear-gradient(180deg, #06b6d4 0%, #0369a1 100%)',
      accentColor: 'var(--accent-active)',
    },
  };

  const currentConfig = metricConfig[metric];
  const selectedDay = pastWeek[selectedDayIndex] || pastWeek[pastWeek.length - 1];

  return (
    <div className="card chart-container" id="weekly-progress-section">
      <div className="chart-header">
        <div>
          <h2 className="card-title">
            <span>📊 Weekly Activity Trend</span>
          </h2>
          <div className="card-subtitle">
            Avg: <strong style={{ color: 'var(--text-primary)' }}>{avg.toLocaleString()} {currentConfig.unit}/day</strong> • Total:{' '}
            <strong style={{ color: currentConfig.accentColor }}>{total.toLocaleString()} {currentConfig.unit}</strong>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="chart-pill-selector" role="tablist">
          <button
            type="button"
            className={`chart-pill ${metric === 'calories' ? 'active' : ''}`}
            onClick={() => setMetric('calories')}
          >
            🔥 Calories
          </button>
          <button
            type="button"
            className={`chart-pill ${metric === 'steps' ? 'active' : ''}`}
            onClick={() => setMetric('steps')}
          >
            👟 Steps
          </button>
          <button
            type="button"
            className={`chart-pill ${metric === 'activeMinutes' ? 'active' : ''}`}
            onClick={() => setMetric('activeMinutes')}
          >
            ⚡ Time
          </button>
        </div>
      </div>

      {/* Interactive Bar Chart */}
      <div className="bars-wrapper" aria-label="Weekly activity bar chart">
        {pastWeek.map((day, idx) => {
          const val = day[metric];
          const heightPercent = Math.max(12, Math.round((val / maxValue) * 100));
          const isSelected = idx === selectedDayIndex;

          return (
            <div
              key={day.fullDate}
              className={`bar-column ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelectedDayIndex(idx)}
              title={`${day.dayName} (${day.shortDate}): ${val.toLocaleString()} ${currentConfig.unit}`}
            >
              <div className="bar-tooltip">
                {val.toLocaleString()} {currentConfig.unit}
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    height: `${heightPercent}%`,
                    background: currentConfig.color,
                  }}
                />
              </div>
              <span className="bar-label">{day.dayName}</span>
            </div>
          );
        })}
      </div>

      {/* Selected Day Detail Card */}
      {selectedDay && (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            marginTop: '4px',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Selected Day: </span>
            <strong>{selectedDay.dayName}, {selectedDay.shortDate}</strong>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>👟 <strong>{selectedDay.steps.toLocaleString()}</strong> steps</span>
            <span>🔥 <strong>{selectedDay.calories}</strong> kcal</span>
            <span>⚡ <strong>{selectedDay.activeMinutes}</strong> mins</span>
          </div>
        </div>
      )}
    </div>
  );
}
