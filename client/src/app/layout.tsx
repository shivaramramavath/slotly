// React component for layout.
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { ToastContainer } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider } from '@/features/auth/components/auth-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** Constant representing metadata. */
export const metadata: Metadata = {
  title: 'Slotly — Academic Timetable Platform',
  description: 'Visual blueprint architecture and conflict-free constraint solver platform.',
};

/** React component rendering root layout. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
              <ToastContainer />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
