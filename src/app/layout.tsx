import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'rsuite-table/dist/css/rsuite-table.css';
import SessionWrapper from '@/components/sessionWrapper';
import LayoutWrapper from '@/components/LayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mudasir Traders',
  description: 'Inventory Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionWrapper>
          <LayoutWrapper>{children}</LayoutWrapper>
          <ToastContainer />
        </SessionWrapper>
      </body>
    </html>
  );
}
