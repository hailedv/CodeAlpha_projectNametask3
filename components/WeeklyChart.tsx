'use client';

import React, { useState } from 'react';
import { DayActivityData } from '@/types/fitness';

interface WeeklyChartProps {
  pastWeek: DayActivityData[];
}

type ChartMetric = 'calories' | 'steps' | 'activeMinutes' | 'water';

export default function WeeklyChart({ pastWeek }: WeeklyChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('calories');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(pastWeek.length - 1);

  // Extend with simulated water if not present
  const extendedPastWeek = pastWeek.map((d, idx) => ({
    ...d,
    water: [2250, 2500, 1800, 2400, 2800, 2100, 2000][idx % 7] || 2000,
  }));

  // Compute max value for scaling bar heights
  const values = extendedPastWeek.map((d) => d[metric]);
  const maxValue = Math.max(...values, 1);

  const total = values.reduce((acc, curr) => acc + curr, 0);
  const avg = Math.round(total / (values.length || 1));

  // Find best day
  let bestDayIndex = 0;
  let highestVal = 0;
  values.forEach((v, idx) => {
    if (v > highestVal) {
      highestVal = v;
      bestDayIndex = idx;
    }
  });
  const bestDay = extendedPastWeek[bestDayIndex];

  const metricConfig: Record<
    ChartMetric,
    { label: string; unit: string; color: string; accentColor: string }
  > = {
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
    water: {
      label: 'Hydration Intake',
      unit: 'ml',
      color: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
      accentColor: 'var(--accent-water)',
    },
  };

  const currentConfig = metricConfig[metric];
  const selectedDay = extendedPastWeek[selectedDayIndex] || extendedPastWeek[extendedPastWeek.length - 1];

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="card chart-container" id="weekly-progress-section">
      <div className="chart-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="card-title">
              <span>📊 Weekly Progress Dashboard</span>
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-steps)',
              }}
            >
              7-DAY SUMMARY
            </span>
          </div>
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
          <button
            type="button"
            className={`chart-pill ${metric === 'water' ? 'active' : ''}`}
            onClick={() => setMetric('water')}
          >
            💧 Water
          </button>
        </div>
      </div>

      {/* Interactive Bar Chart */}
      <div className="bars-wrapper" aria-label="Weekly activity bar chart">
        {extendedPastWeek.map((day, idx) => {
          const val = day[metric];
          const heightPercent = Math.max(14, Math.round((val / maxValue) * 100));
          const isSelected = idx === selectedDayIndex;
          const isBest = idx === bestDayIndex;

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
                    background: isBest
                      ? 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)'
                      : currentConfig.color,
                  }}
                />
              </div>
              <span className="bar-label">
                {day.dayName} {isBest ? '⭐' : ''}
              </span>
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
            marginTop: '8px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Selected Day: </span>
            <strong>{selectedDay.dayName}, {selectedDay.shortDate}</strong>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <span>👟 <strong>{selectedDay.steps.toLocaleString()}</strong> steps</span>
            <span>🔥 <strong>{selectedDay.calories}</strong> kcal</span>
            <span>⚡ <strong>{selectedDay.activeMinutes}</strong> mins</span>
            <span>💧 <strong>{selectedDay.water}</strong> ml</span>
          </div>
        </div>
      )}

      {/* Weekly High-Level Summary Card */}
      <div
        style={{
          marginTop: '10px',
          background: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⭐</span>
          <span>
            <strong>Peak Performance:</strong> {bestDay.dayName} ({bestDay[metric].toLocaleString()} {currentConfig.unit})
          </span>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handlePrintSummary}
          title="Print or export PDF of weekly activity summary"
          style={{ fontSize: '11px', padding: '4px 10px' }}
        >
          🖨️ Print / Save Report
        </button>
      </div>
    </div>
  );
}
