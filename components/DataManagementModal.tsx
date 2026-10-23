'use client';

import React, { useRef } from 'react';
import { FitnessAppData } from '@/types/fitness';
import { INITIAL_FITNESS_DATA } from '@/lib/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  data: FitnessAppData;
  onClose: () => void;
  onImportData: (imported: FitnessAppData) => void;
  onResetData: () => void;
  onClearData: () => void;
}

export default function DataManagementModal({
  isOpen,
  data,
  onClose,
  onImportData,
  onResetData,
  onClearData,
}: DataManagementModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `fitpulse_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.metrics && parsed.workouts) {
          onImportData(parsed);
          onClose();
        } else {
          alert('Invalid FitPulse data format.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💾 Local Storage & Data Sync</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            All your workouts, steps, and hydration data are automatically saved in browser{' '}
            <strong style={{ color: 'var(--text-primary)' }}>localStorage</strong>. You can export a JSON backup or import saved records anytime.
          </p>

          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div>
              <strong>Storage Status:</strong> Active (Persisted)
            </div>
            <div>
              <strong>Total Workouts Logged:</strong> {data.workouts.length}
            </div>
            <div>
              <strong>Today&apos;s Date:</strong> {data.metrics.date}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportJSON}
            >
              📥 Export All Data (Download JSON)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              📤 Import Data from JSON File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '13px' }}
                onClick={() => {
                  if (confirm('Reset to initial realistic demo workout data?')) {
                    onResetData();
                    onClose();
                  }
                }}
              >
                🔄 Reset to Demo Data
              </button>

              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  fontSize: '13px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
                onClick={() => {
                  if (confirm('Are you sure you want to clear all workouts and reset metrics?')) {
                    onClearData();
                    onClose();
                  }
                }}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
