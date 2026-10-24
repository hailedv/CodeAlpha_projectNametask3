'use client';

import React, { useState } from 'react';
import { BodyMetricEntry, UserProfile } from '@/types/fitness';

interface BodyCompositionProps {
  metrics: BodyMetricEntry[];
  user: UserProfile;
  onAddMetric: (entry: BodyMetricEntry) => void;
}

export default function BodyComposition({
  metrics,
  user,
  onAddMetric,
}: BodyCompositionProps) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState(user.weightKg || 72);
  const [newBodyFat, setNewBodyFat] = useState(15.0);
  const [newMuscleMass, setNewMuscleMass] = useState(36.0);
  const [newWaist, setNewWaist] = useState(80.0);
  const [newChest, setNewChest] = useState(106.0);
  const [newArms, setNewArms] = useState(38.5);
  const [newNotes, setNewNotes] = useState('');

  // Latest measurement
  const latest = metrics[metrics.length - 1] || {
    weightKg: user.weightKg || 72,
    bodyFatPercent: 15.0,
    muscleMassKg: 36.0,
    waistCm: 80,
    chestCm: 106,
    armsCm: 38.5,
    date: new Date().toISOString().split('T')[0],
  };

  // Earliest measurement for delta
  const earliest = metrics[0] || latest;
  const weightDelta = (latest.weightKg - earliest.weightKg).toFixed(1);
  const isLoss = Number(weightDelta) < 0;

  // Calculate BMI
  const heightM = (user.heightCm || 178) / 100;
  const bmi = (latest.weightKg / (heightM * heightM)).toFixed(1);

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'var(--accent-active)' };
    if (val < 24.9) return { label: 'Athletic / Normal', color: 'var(--accent-steps)' };
    if (val < 29.9) return { label: 'Overweight', color: 'var(--accent-amber)' };
    return { label: 'Obese', color: 'var(--accent-calories)' };
  };

  const bmiCat = getBmiCategory(Number(bmi));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: BodyMetricEntry = {
      id: `bm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: Number(newWeight),
      bodyFatPercent: Number(newBodyFat),
      muscleMassKg: Number(newMuscleMass),
      waistCm: Number(newWaist),
      chestCm: Number(newChest),
      armsCm: Number(newArms),
      notes: newNotes.trim() || undefined,
    };
    onAddMetric(entry);
    setIsLogOpen(false);
    setNewNotes('');
  };

  // SVG Chart points calculation
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 35;

  const weights = metrics.map((m) => m.weightKg);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const rangeW = maxW - minW || 1;

  const points = metrics.map((m, idx) => {
    const x = padding + (idx / Math.max(1, metrics.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((m.weightKg - minW) / rangeW) * (chartHeight - 2 * padding);
    return { x, y, weight: m.weightKg, date: m.date };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="body-comp-section">
      {/* Top Banner */}
      <div className="body-hero-card">
        <div>
          <div className="hero-badge">PHYSICAL PROGRESSION & ANTHROPOMETRY</div>
          <h2>Body Composition & Measurements</h2>
          <p>
            Track body mass changes, visceral and subcutaneous fat trends, muscle mass hypertrophy, and body circumference records over time.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsLogOpen(true)}
          id="btn-log-body-metrics"
        >
          <span>+ Log New Weigh-In</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="body-kpi-grid">
        <div className="body-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Current Weight</span>
            <span className={`kpi-badge ${isLoss ? 'loss' : 'gain'}`}>
              {Number(weightDelta) > 0 ? `+${weightDelta}` : weightDelta} kg
            </span>
          </div>
          <div className="kpi-huge-number">
            {latest.weightKg} <span className="unit">kg</span>
          </div>
          <div className="kpi-subtext">Height: {user.heightCm} cm</div>
        </div>

        <div className="body-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Body Fat %</span>
            <span className="kpi-badge neutral">DEXA Equivalent</span>
          </div>
          <div className="kpi-huge-number" style={{ color: 'var(--accent-active)' }}>
            {latest.bodyFatPercent}%
          </div>
          <div className="kpi-subtext">Optimal Athletic Zone (10-16%)</div>
        </div>

        <div className="body-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Lean Muscle Mass</span>
            <span className="kpi-badge gain">+0.9 kg gain</span>
          </div>
          <div className="kpi-huge-number" style={{ color: 'var(--accent-purple)' }}>
            {latest.muscleMassKg} <span className="unit">kg</span>
          </div>
          <div className="kpi-subtext">Hypertrophy Index: High</div>
        </div>

        <div className="body-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Body Mass Index (BMI)</span>
            <span className="kpi-badge" style={{ color: bmiCat.color }}>
              {bmiCat.label}
            </span>
          </div>
          <div className="kpi-huge-number" style={{ color: bmiCat.color }}>
            {bmi}
          </div>
          <div className="kpi-subtext">Calculated from Wt/Ht²</div>
        </div>
      </div>

      {/* Visual Weight Trend Graph & Circumferences */}
      <div className="body-main-grid">
        {/* Trend Graph */}
        <div className="chart-card">
          <div className="card-header-line">
            <div>
              <h3>Body Weight Trajectory (Last 30 Days)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Visual trend showing steady body recomposition
              </p>
            </div>
          </div>

          <div className="svg-chart-container">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="trend-svg"
              preserveAspectRatio="none"
            >
              {/* Horizontal Grid lines */}
              <line
                x1={padding}
                y1={padding}
                x2={chartWidth - padding}
                y2={padding}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
              />
              <line
                x1={padding}
                y1={chartHeight / 2}
                x2={chartWidth - padding}
                y2={chartHeight / 2}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
              />
              <line
                x1={padding}
                y1={chartHeight - padding}
                x2={chartWidth - padding}
                y2={chartHeight - padding}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
              />

              {/* Area gradient under line */}
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-steps)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent-steps)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {points.length > 1 && (
                <path
                  d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`}
                  fill="url(#weightGrad)"
                />
              )}

              {/* Connecting line */}
              {points.length > 1 && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--accent-steps)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#080b11"
                    stroke="var(--accent-steps)"
                    strokeWidth="3"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {p.weight}kg
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="9"
                  >
                    {p.date.slice(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Circumference Measurements & History */}
        <div className="circumference-card">
          <div className="card-header-line">
            <h3>Circumference History (cm)</h3>
          </div>

          <div className="circumference-table-wrap">
            <table className="circumference-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CHEST</th>
                  <th>WAIST</th>
                  <th>ARMS</th>
                  <th>BF %</th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .slice()
                  .reverse()
                  .map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.date}</td>
                      <td>{m.chestCm || '—'} cm</td>
                      <td>{m.waistCm || '—'} cm</td>
                      <td>{m.armsCm || '—'} cm</td>
                      <td style={{ color: 'var(--accent-active)', fontWeight: 600 }}>
                        {m.bodyFatPercent}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {isLogOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Log Body Anthropometry</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsLogOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="wt-input">Body Weight (kg) *</label>
                  <input
                    id="wt-input"
                    type="number"
                    step="0.1"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bf-input">Body Fat (%)</label>
                  <input
                    id="bf-input"
                    type="number"
                    step="0.1"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mm-input">Lean Muscle Mass (kg)</label>
                  <input
                    id="mm-input"
                    type="number"
                    step="0.1"
                    value={newMuscleMass}
                    onChange={(e) => setNewMuscleMass(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="waist-input">Waist Circumference (cm)</label>
                  <input
                    id="waist-input"
                    type="number"
                    step="0.5"
                    value={newWaist}
                    onChange={(e) => setNewWaist(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="chest-input">Chest Circumference (cm)</label>
                  <input
                    id="chest-input"
                    type="number"
                    step="0.5"
                    value={newChest}
                    onChange={(e) => setNewChest(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="arms-input">Arms Circumference (cm)</label>
                  <input
                    id="arms-input"
                    type="number"
                    step="0.5"
                    value={newArms}
                    onChange={(e) => setNewArms(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes-input">Session Check-in Notes</label>
                <input
                  id="notes-input"
                  type="text"
                  placeholder="e.g. Fasted morning weigh-in, feeling energised"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsLogOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Weigh-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
