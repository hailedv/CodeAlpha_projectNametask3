import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'FitPulse — Smart Fitness & Activity Tracker',
  description:
    'Track daily fitness activities, steps, workouts, calories burned, and hydration with interactive charts and real-time statistics.',
  keywords: ['fitness tracker', 'workout log', 'calorie counter', 'step tracker', 'health dashboard', 'PWA'],
  authors: [{ name: 'CodeAlpha Intern' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitPulse',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <div className="ambient-glow" />
        {children}
      </body>
    </html>
  );
}
