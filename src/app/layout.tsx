import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionWrapper from '@/components/sessionWrapper';
import LayoutWrapper from '@/components/LayoutWrapper';
import { SpeedInsights } from '@vercel/speed-insights/next';
import FaviconManager from '@/components/FaviconManager';
import 'react-toastify/dist/ReactToastify.css';
import 'rsuite-table/dist/css/rsuite-table.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Mudasir Traders',
  description: 'Inventory Management System',
  icons: {
    icon: [
      {
        url: '/icon.svg?v=2',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-white.svg?v=2',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    shortcut: [
      {
        url: '/icon.svg?v=2',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-white.svg?v=2',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <FaviconManager />
        <SessionWrapper>
          <LayoutWrapper>{children}</LayoutWrapper>
        </SessionWrapper>
        <SpeedInsights />
      </body>
    </html>
  );
}
