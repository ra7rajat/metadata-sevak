'use client';

import dynamic from 'next/dynamic';
import NavBar from '@/components/NavBar';
import PoweredByFooter from '@/components/PoweredByFooter';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const PerformanceMonitor = dynamic(() => import('@/components/PerformanceMonitor'), { ssr: false });
const FirstVisitWrapper = dynamic(() => import('@/components/FirstVisitWrapper'), { ssr: false });

const showPerformanceMonitor =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR === '1';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg"
        >
          Skip to content
        </a>

        <NavBar />

        <main
          id="main-content"
          className="flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 px-4 md:px-8"
        >
          <FirstVisitWrapper>{children}</FirstVisitWrapper>
        </main>

        <PoweredByFooter />
        {showPerformanceMonitor && <PerformanceMonitor />}
      </LanguageProvider>
    </ErrorBoundary>
  );
}