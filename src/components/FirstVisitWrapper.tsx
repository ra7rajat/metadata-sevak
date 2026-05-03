'use client';

import { useState, useLayoutEffect } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';

const ONBOARDING_KEY = 'matadata_onboarding_completed';

function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export default function FirstVisitWrapper({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Use useLayoutEffect to avoid flash - runs before paint
  useLayoutEffect(() => {
    setShowOnboarding(!hasSeenOnboarding());
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />
      )}
    </>
  );
}