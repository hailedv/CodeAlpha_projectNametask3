'use client';

import React, { useState } from 'react';
import AnimatedNumber from './AnimatedNumber';

interface WaterTrackerProps {
  waterMl: number;
  waterGoalMl: number;
  onUpdateWater: (newMl: number) => void;
}

export default function WaterTracker({
  waterMl,
  waterGoalMl,
  onUpdateWater,
}: WaterTrackerProps) {
  const GLASS_SIZE_ML = 250;
  const totalGlasses = Math.max(8, Math.round(waterGoalMl / GLASS_SIZE_ML));
  const currentGlasses = Math.floor(waterMl / GLASS_SIZE_ML);
  const percentage = Math.min(100, Math.round((waterMl / waterGoalMl) * 100));

  const [clickedGlassIdx, setClickedGlassIdx] = useState<number | null>(null);

  const handleGlassClick = (index: number) => {
    setClickedGlassIdx(index);
    setTimeout(() => setClickedGlassIdx(null), 400);

    // If clicking current highest glass, unfill one; else fill up to this glass
    const newGlasses = index + 1 === currentGlasses ? index : index + 1;
    onUpdateWater(newGlasses * GLASS_SIZE_ML);
  };

  const handleAddMl = (amount: number) => {
    onUpdateWater(Math.max(0, waterMl + amount));
  };

  const isGoalReached = percentage >= 100;

  return (
    <div className={`card water-tracker ${isGoalReached ? 'water-goal-achieved' : ''}`} id="water-tracker-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <span className="water-drop-icon">💧</span>
            <span>Daily Hydration</span>
          </h3>
          <div className="card-subtitle">
            <AnimatedNumber value={waterMl} /> / {waterGoalMl} ml (
            <AnimatedNumber value={percentage} />%)
          </div>
        </div>
        <span
          className={`hydration-badge ${isGoalReached ? 'badge-goal-reached' : ''}`}
          style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            background: isGoalReached ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            color: isGoalReached ? 'var(--accent-steps)' : 'var(--accent-water)',
            transition: 'all 0.3s ease',
          }}
        >
          {isGoalReached ? 'Goal Reached 🎉' : `${Math.max(0, waterGoalMl - waterMl)} ml to go`}
        </span>
      </div>

      {/* Interactive Glasses Row */}
      <div className="water-glasses-row" aria-label="Interactive water glasses">
        {Array.from({ length: totalGlasses }).map((_, i) => {
          const isFilled = i < currentGlasses;
          const isPopping = clickedGlassIdx === i;
          return (
            <button
              key={i}
              type="button"
              className={`water-glass-btn ${isFilled ? 'filled' : ''} ${isPopping ? 'glass-pop' : ''}`}
              onClick={() => handleGlassClick(i)}
              title={`Glass ${i + 1} (${(i + 1) * GLASS_SIZE_ML} ml)`}
              aria-label={`Water glass ${i + 1}, ${isFilled ? 'Filled' : 'Empty'}`}
            >
              <span className="glass-emoji">{isFilled ? '💧' : '🥛'}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="water-quick-buttons">
        <button
          type="button"
          className="water-quick-btn"
          onClick={() => handleAddMl(250)}
        >
          + 250 ml (1 Cup)
        </button>
        <button
          type="button"
          className="water-quick-btn"
          onClick={() => handleAddMl(500)}
        >
          + 500 ml (Bottle)
        </button>
        <button
          type="button"
          className="water-quick-btn water-reset-btn"
          onClick={() => onUpdateWater(0)}
          style={{ flex: 0.5, color: 'var(--text-muted)' }}
          title="Reset hydration for today"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
