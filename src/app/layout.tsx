import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import ConditionalGlobalDataProvider from '@/components/providers/ConditionalGlobalDataProvider';
import CookieConsent from '@/components/CookieConsent';
import FloatingAIAssistantWrapper from '@/components/FloatingAIAssistantWrapper';
import { InternetStatusIndicator } from '@/components/InternetStatusIndicator';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import 'rsuite-table/dist/css/rsuite-table.css';
import './globals.css';
import '../styles/scrollbar.css';
import '../styles/flatpickr-override.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  preload: true, // Change back to true for better UX
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title:
    'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
  description:
    'Authorized Dealer of Fujika & Exide in Dera Ghazi Khan. Leading retailer of genuine Osaka, AGS, Phoenix, Daewoo, Volta, Alaska, Power Plus & Bridge Power batteries for automotive, UPS, and solar systems. Free load testing and scrap exchange at General Bus Stand, DG Khan.',
  keywords:
    'Fujika authorized dealer DG Khan, Exide authorized dealer Dera Ghazi Khan, batteries Dera Ghazi Khan, car battery seller DG Khan, UPS battery shop Dera Ghazi Khan, solar tubular battery DG Khan, scrap battery price Dera Ghazi Khan, Osaka battery dealer DG Khan, AGS battery DG Khan, Phoenix battery DG Khan, Daewoo dry battery DG Khan, Volta solar battery DG Khan, Mudasir Traders',
  authors: [{ name: 'Mudasir Traders' }],
  creator: 'Mudasir Traders',
  publisher: 'Mudasir Traders',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://mudasirtraders.com/',
  },
  openGraph: {
    title:
      'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
    description:
      'Authorized Dealer of Fujika & Exide in Dera Ghazi Khan. Complete range of Osaka, AGS, Phoenix, Daewoo, Volta, Alaska, Power Plus & Bridge Power batteries for cars, UPS systems, and solar setups.',
    url: 'https://mudasirtraders.com/',
    siteName: 'Mudasir Traders',
    locale: 'en_PK',
    type: 'website',
    images: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%232563EB" filter="url(%23shadow)"/><path d="M26 12L18 26H24L22 36L30 22H24L26 12Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/></svg>',
        width: 1200,
        height: 630,
        alt: 'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
    description:
      'Authorized Dealer of Fujika & Exide in Dera Ghazi Khan. Complete range of Osaka, AGS, Phoenix, Daewoo, Volta, Alaska, Power Plus & Bridge Power batteries for cars, UPS systems, and solar setups.',
    images: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%232563EB" filter="url(%23shadow)"/><path d="M26 12L18 26H24L22 36L30 22H24L26 12Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/></svg>',
        width: 1200,
        height: 630,
        alt: 'Mudasir Traders - Premium Batteries & Power Solutions in Dera Ghazi Khan',
      },
    ],
  },
  icons: {
    icon: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%232563EB" filter="url(%23shadow)"/><path d="M26 12L18 26H24L22 36L30 22H24L26 12Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/></svg>',
      type: 'image/svg+xml',
    },
    shortcut: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="betterShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" floodOpacity="0.2"/><feMergeNode in="SourceGraphic" in2="BackgroundImageFix"/><feMergeNode in="SourceGraphic" in3="BackgroundImageFix"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%232563EB" filter="url(%23betterShadow)"/><path d="M26 12L18 26H24L22 36L30 22H24L26 12Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/></svg>',
      type: 'image/svg+xml',
    },
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
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
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutoPartsStore'],
    name: 'Mudasir Traders',
    alternateName: ['Mudasir Battery Traders', 'مدثر ٹریڈرز'],
    slogan: 'Authorized Dealer of Fujika & Exide Batteries in Dera Ghazi Khan',
    description:
      'Official Authorized Dealer of Fujika & Exide batteries in Dera Ghazi Khan. Wholesale and retail supplier of genuine Osaka, AGS, Fujika, Exide, Phoenix, Daewoo, Volta, Alaska, Power Plus, and Bridge Power batteries for automotive, UPS, solar, and industrial applications. Free digital load testing and scrap battery exchange at General Bus Stand, DG Khan.',
    url: 'https://mudasirtraders.com',
    telephone: '+92-334-9627745',
    email: 'owner@mudasirtraders.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'General Bus Stand, near Badozai Market',
      addressLocality: 'Dera Ghazi Khan',
      addressRegion: 'Punjab',
      postalCode: '32200',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '30.0472',
      longitude: '70.6401',
    },
    areaServed: [
      { '@type': 'City', name: 'Dera Ghazi Khan' },
      { '@type': 'City', name: 'Taunsa Sharif' },
      { '@type': 'City', name: 'Kot Chutta' },
      { '@type': 'City', name: 'Rajanpur' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    award: [
      'Official Authorized Dealer of Fujika Batteries',
      'Official Authorized Dealer of Exide Batteries',
    ],
    knowsAbout: [
      'Car & Automotive Batteries',
      'Solar Power Tubular Storage Batteries',
      'UPS & Inverter Deep Cycle Batteries',
      'Digital Battery Load Testing',
      'Scrap Battery Valuation & Instant Trade-in',
      'Acid Specific Gravity Testing',
      'Authorized Warranty Support & Replacement',
    ],
    brand: [
      { '@type': 'Brand', name: 'Fujika', description: 'Authorized Dealer' },
      { '@type': 'Brand', name: 'Exide', description: 'Authorized Dealer' },
      { '@type': 'Brand', name: 'Osaka' },
      { '@type': 'Brand', name: 'AGS' },
      { '@type': 'Brand', name: 'Phoenix' },
      { '@type': 'Brand', name: 'Daewoo' },
      { '@type': 'Brand', name: 'Volta' },
      { '@type': 'Brand', name: 'Alaska' },
      { '@type': 'Brand', name: 'Power Plus' },
      { '@type': 'Brand', name: 'Bridge Power' },
    ],
    openingHours: 'Mo-Th 09:00-20:00, Fr-Sa 09:00-21:00, Su 10:00-18:00',
    priceRange: '$$',
    image:
      'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
    sameAs: ['https://mudasirtraders.com'],
    offers: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Car & Automotive Batteries',
          description:
            'Premium car and vehicle batteries from Fujika, Exide, Osaka, AGS, Daewoo, Phoenix, Volta, Alaska, Power Plus & Bridge Power.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'UPS & Inverter Deep Cycle Batteries',
          description:
            'Long backup tubular and deep cycle batteries for UPS and home inverter systems.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Solar Power Storage Batteries',
          description:
            'Tubular and maintenance-free solar storage batteries for residential and commercial solar installations.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Old Scrap Battery Exchange & Adjustment',
          description:
            'Trade-in dead or old scrap batteries for instant cash deduction against new battery purchases.',
        },
      },
    ],
  };

  return (
    <html lang='en-PK' suppressHydrationWarning>
      <head>
        <link
          rel='alternate'
          type='text/markdown'
          href='/llms.txt'
          title='LLM and Agent Context'
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ConditionalGlobalDataProvider>
            {children}
            <CookieConsent />
            <FloatingAIAssistantWrapper />
            <InternetStatusIndicator />
          </ConditionalGlobalDataProvider>
        </Providers>
      </body>
    </html>
  );
}
