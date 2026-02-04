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
    <>
      <div className="app-shell">{children}</div>
      <div className="desktop-hint" aria-hidden="true">
        Want to preview phone sizes? Open DevTools (F12 or Ctrl+Shift+I), then toggle the device toolbar with
        Ctrl+Shift+M and pick a device.
      </div>
    </>
  );
}
