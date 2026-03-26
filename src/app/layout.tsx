import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

import './globals.css';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'BrandsBridge - Smart Business Management',
  description: 'Real-time business management dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
