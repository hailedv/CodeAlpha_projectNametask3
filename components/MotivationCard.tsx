'use client';

import React, { useState } from 'react';

const TIPS = [
  {
    tag: 'Hydration Science',
    icon: '💧',
    tip: 'Drinking 500ml of water 30 minutes before high-intensity workouts helps regulate core temperature and boosts output by up to 15%.',
  },
  {
    tag: 'Recovery & Sleep',
    icon: '🌙',
    tip: '7 to 8 hours of deep sleep accounts for over 90% of your daily muscular recovery and peak cognitive sharpness.',
  },
  {
    tag: 'Active Recovery',
    icon: '🚶‍♂️',
    tip: 'A brisk 20-minute recovery walk improves circulation and clears metabolic waste twice as quickly as complete sedentary rest.',
  },
  {
    tag: 'Metabolism',
    icon: '🔥',
    tip: 'High-Intensity Interval Training (HIIT) triggers the EPOC effect, burning additional calories for up to 14 hours post-workout.',
  },
  {
    tag: 'Cardio Strength',
    icon: '❤️',
    tip: 'Keeping your heart rate in Zone 2 (60-70% max HR) builds mitochondrial density and cardiovascular endurance.',
  },
];

export default function MotivationCard() {
  const [tipIndex, setTipIndex] = useState(0);

  const currentTip = TIPS[tipIndex];

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % TIPS.length);
  };

  return (
    <div
      className="card"
      id="smart-insight-card"
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}
    >
      <div className="card-header" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <div>
            <h3 className="card-title" style={{ fontSize: '15px' }}>
              FitPulse Smart Coach
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-steps)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {currentTip.tag}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="chart-pill"
          onClick={handleNextTip}
          title="Next health insight"
          style={{ fontSize: '11px' }}
        >
          Next Tip ❯
        </button>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {currentTip.tip}
      </p>

      {/* Heart Rate Zones Mini Bar */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>HR Zones Today</span>
          <span>Target: Zone 2-3</span>
        </div>
        <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '2px' }}>
          <div style={{ flex: 3, background: '#3b82f6' }} title="Warmup (50-60%)" />
          <div style={{ flex: 5, background: '#10b981' }} title="Fat Burn / Zone 2 (60-70%)" />
          <div style={{ flex: 4, background: '#f59e0b' }} title="Cardio (70-85%)" />
          <div style={{ flex: 2, background: '#ef4444' }} title="Peak (85-100%)" />
        </div>
      </div>
    </div>
  );
}
