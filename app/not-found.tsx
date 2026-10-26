import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080b11',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '20px',
        }}
      >
        ⚡
      </div>

      <h1
        style={{
          fontSize: '48px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </h1>

      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#e2e8f0',
          marginBottom: '10px',
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          color: '#94a3b8',
          fontSize: '14px',
          maxWidth: '420px',
          lineHeight: '1.6',
          marginBottom: '24px',
        }}
      >
        You navigated to an unrecognized URL path. You can easily return to the FitPulse Dashboard below:
      </p>

      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          padding: '12px 28px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
        }}
      >
        🏠 Return to Athlete Dashboard
      </Link>
    </div>
  );
}
