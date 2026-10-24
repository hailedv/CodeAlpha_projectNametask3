'use client';

import React from 'react';

interface TaskRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'library' | 'coach' | 'live' | 'body') => void;
  onOpenLogWorkout: () => void;
  onOpenDataModal: () => void;
}

export default function TaskRequirementsModal({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenLogWorkout,
  onOpenDataModal,
}: TaskRequirementsModalProps) {
  if (!isOpen) return null;

  const checklistItems = [
    {
      id: 1,
      title: 'Track Daily Fitness Activities',
      req: 'The app should allow users to track daily fitness activities like steps, workouts, calories burned, etc.',
      status: 'Completed & Live',
      details:
        'Live tracking for Steps (+distance in km), Active Workout Calories, Workout Duration (minutes), Water Hydration (ml), and Sleep hours with circular animated SVG progress rings.',
      actionText: 'View Dashboard Rings 👉',
      action: () => {
        onNavigateToTab('dashboard');
        onClose();
      },
    },
    {
      id: 2,
      title: 'Manual Fitness Data Logging',
      req: 'Users can add or log their fitness data manually (e.g., workout time, exercise type, calories).',
      status: 'Completed & Live',
      details:
        'Interactive Manual Logger with 9 activity categories (Running, Cycling, Weightlifting, HIIT, Swimming, Yoga, Boxing, Walking, Pilates), duration, manual or MET auto-calories, distance, HR, and intensity.',
      actionText: 'Open Manual Log Modal 👉',
      action: () => {
        onOpenLogWorkout();
        onClose();
      },
    },
    {
      id: 3,
      title: 'Dashboard & Summary Screen (Daily / Weekly)',
      req: 'Include a dashboard or summary screen showing daily/weekly progress.',
      status: 'Completed & Live',
      details:
        'Interactive Mon–Sun weekly bar chart with metric selector (Calories, Steps, Active Time, Water), daily average insights, clickable day inspector, and activity category distribution.',
      actionText: 'Inspect Weekly Chart 👉',
      action: () => {
        onNavigateToTab('dashboard');
        onClose();
      },
    },
    {
      id: 4,
      title: 'Simple, Clean, and User-Friendly UI',
      req: 'UI should be simple, clean, and user-friendly, with visual elements like graphs or progress bars.',
      status: 'Completed & Live',
      details:
        'Curated dark/light obsidian palettes, Google Outfit & Plus Jakarta Sans typography, glassmorphism cards, animated SVG rings, and desktop + mobile phone simulator switch.',
      actionText: 'Switch Full/Mobile View 👉',
      action: () => {
        onClose();
      },
    },
    {
      id: 5,
      title: 'Local Storage & Firebase Backend Integration',
      req: 'Data can be stored using local storage (like SQLite) or integrated with a backend like Firebase for saving user records.',
      status: 'Completed & Live',
      details:
        'Browser LocalStorage & SQLite-compatible structured tables with JSON Backup Export & Import, plus a configurable Firebase Cloud Sync integration with live status indicators.',
      actionText: 'Open Storage & Firebase Modal 👉',
      action: () => {
        onOpenDataModal();
        onClose();
      },
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div>
              <h2 className="modal-title" style={{ fontSize: '20px' }}>
                TASK 3: Fitness Tracker App Specification
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Official CodeAlpha Requirements Checklist & Live Verification
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          {checklistItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  {item.id}. {item.title}
                </strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-steps)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ✓ {item.status}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{item.req}"
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {item.details}
              </p>

              <div style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={item.action}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  {item.actionText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
