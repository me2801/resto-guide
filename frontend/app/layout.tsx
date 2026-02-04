import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resto Discovery',
  description: 'Discover curated restaurants in Dutch cities',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Resto',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // For iOS safe areas
  themeColor: '#c45d35', // Terracotta
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <div className="app-shell">{children}</div>
        <div className="desktop-hint" aria-hidden="true">
          Want to preview phone sizes? Open DevTools (F12 or Ctrl+Shift+I), then toggle the device toolbar with
          Ctrl+Shift+M and pick a device.
        </div>
      </body>
    </html>
  );
}
