import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/hooks/useAuth';
import MuiThemeProvider from './shared/components/mui-theme-provider';

export const metadata = {
  metadataBase: new URL('https://postgres-drizzle.vercel.app'),
  title: 'AESPT - PostgreSQL with Drizzle',
  description: 'A modern Next.js application with PostgreSQL database and Drizzle ORM',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AESPT Application',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.variable}>
        <AuthProvider>
          <MuiThemeProvider>
            {children}
          </MuiThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
