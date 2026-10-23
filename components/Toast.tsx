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
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span>{toast.icon || '✨'}</span>
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
