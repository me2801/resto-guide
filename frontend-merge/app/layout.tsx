import type { Metadata } from 'next';
import { withBase } from '@/lib/basePath';

export const metadata: Metadata = {
  title: 'Resto',
  description: 'Resto web and mobile',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href={withBase('/icon-192.png')} />
      </head>
      <body>{children}</body>
    </html>
  );
}
