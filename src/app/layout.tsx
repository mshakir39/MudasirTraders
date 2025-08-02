import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-data-grid/lib/styles.css';
import 'rsuite-table/dist/css/rsuite-table.css';
import SessionWrapper from '@/components/sessionWrapper';
import SideBar from '@/components/sidebar';

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
    <html lang='en'>
      <body className={inter.className}>
        <SessionWrapper>
          <div className='flex min-h-screen w-full'>
            <SideBar />
            <main className='flex-1 overflow-x-hidden p-4'>{children}</main>
            <ToastContainer />
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
