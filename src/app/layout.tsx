import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import FaviconManager from '@/components/FaviconManager';
import Providers from '@/components/Providers';
import CookieConsent from '@/components/CookieConsent';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import 'rsuite-table/dist/css/rsuite-table.css';
import './globals.css';
import '../styles/scrollbar.css';

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  preload: true,
});

export const metadata: Metadata = {
  title:
    'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
  description:
    'Authorized dealer of Osaka, AGS, Exide, Phoenix & Daewoo batteries. Professional UPS systems, solar solutions, and expert installation services in Dera Ghazi Khan, Pakistan.',
  keywords:
    'batteries Dera Ghazi Khan, Osaka batteries, AGS batteries, Exide batteries, Phoenix batteries, Daewoo batteries, UPS systems, solar solutions, power solutions, battery installation, Pakistan',
  authors: [{ name: 'Mudasir Traders' }],
  creator: 'Mudasir Traders',
  publisher: 'Mudasir Traders',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://mudasirtraders.com/',
  },
  openGraph: {
    title: 'Mudasir Traders - Premium Batteries & Power Solutions',
    description:
      'Authorized dealer of top battery brands with professional installation services in Dera Ghazi Khan',
    url: 'https://mudasirtraders.com',
    siteName: 'Mudasir Traders',
    locale: 'en_PK',
    type: 'website',
    images: [
      {
        url: 'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
        width: 1200,
        height: 630,
        alt: 'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mudasir Traders - Premium Batteries & Power Solutions',
    description:
      'Authorized dealer of Osaka, AGS, Exide, Phoenix & Daewoo batteries in Dera Ghazi Khan',
    images: [
      'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
    ],
  },
  icons: {
    icon: { url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%232563EB" filter="url(%23shadow)"/><path d="M26 12L18 26H24L22 36L30 22H24L26 12Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/></svg>', type: 'image/svg+xml' },
    shortcut: { url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%232563EB" filter="url(%23shadow)"/><path d="M26 12L18 26H24L22 36L30 22H24L26 12Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/></svg>', type: 'image/svg+xml' },
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en-PK' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <FaviconManager />
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
