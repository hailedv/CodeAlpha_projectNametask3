'use client';

import React from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  icon?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
}

export default function Toast({ toasts }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast, index) => (
        <div key={`${toast.id}-${index}`} className="toast">
          <span className="toast-icon">{toast.icon || '✨'}</span>
          <span className="toast-text">{toast.text}</span>
          <div className="toast-timer-bar" />
        </div>
      ))}
    </div>
  );
}
