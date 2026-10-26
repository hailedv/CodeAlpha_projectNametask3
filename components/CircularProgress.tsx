'use client';

import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  icon?: string;
}

export default function CircularProgress({
  percentage,
  size = 68,
  strokeWidth = 6,
  color = '#10b981',
  icon,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);

  // Animated mount sweep effect: starts at 0, smoothly sweeps to current target
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth fill animation on mount
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const activePercent = mounted ? clamped : 0;
  const strokeDashoffset = circumference - (activePercent / 100) * circumference;
  const isGoalReached = clamped >= 100;

  return (
    <div
      className={`ring-container ${isGoalReached ? 'is-goal-achieved' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg className="ring-svg" width={size} height={size}>
        <circle
          className="ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          className="ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      {icon && (
        <span
          className={`ring-icon ${isGoalReached ? 'ring-icon-achieved' : ''}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
    </div>
  );
}
