'use client';

import React from 'react';
import { useLanguage } from './providers/LanguageProvider';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isHindi ? 'कुछ गलत हो गया' : 'Something went wrong'}
          </h2>
          <p className="text-gray-400 text-sm">
            {error?.message || (isHindi ? 'एक अप्रत्याशित त्रुटि हुई' : 'An unexpected error occurred')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-medium hover:from-indigo-600 hover:to-purple-500 transition-all"
          >
            {isHindi ? 'पुनः प्रयास करें' : 'Try Again'}
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-white/20 text-white rounded-full font-medium hover:bg-white/5 transition-all"
          >
            {isHindi ? 'होम पेज पर जाएं' : 'Go to Home'}
          </a>
        </div>

        <p className="text-xs text-gray-600">
          {isHindi 
            ? 'यदि समस्या बनी रहे, तो पेज रिफ्रेश करें।' 
            : 'If the problem persists, try refreshing the page.'}
        </p>
      </div>
    </div>
  );
}
