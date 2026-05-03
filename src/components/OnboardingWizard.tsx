'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 1,
    title: {
      en: 'Register to Vote',
      hi: 'मतदाता के रूप में पंजीकरण करें'
    },
    description: {
      en: 'Visit nvsp.in to register as a voter. You need a valid ID and address proof.',
      hi: 'मतदाता के रूप में पंजीकरण करने के लिए nvsp.in पर जाएं। आपको वैध पहचान और पते का प्रमाण चाहिए।'
    },
    icon: '📝',
    href: '/guide'
  },
  {
    id: 2,
    title: {
      en: 'Find Your Polling Booth',
      hi: 'अपना मतदान केंद्र खोजें'
    },
    description: {
      en: 'Enter your EPIC number to find exactly where to vote on election day.',
      hi: 'चुनाव दिन पर वोट करने के लिए exact स्थान खोजने के लिए अपना EPIC नंबर दर्ज करें।'
    },
    icon: '📍',
    href: '/booth'
  },
  {
    id: 3,
    title: {
      en: 'Go Vote!',
      hi: 'वोट करने जाएं!'
    },
    description: {
      en: 'Vote for your chosen candidate. Remember to carry a valid photo ID.',
      hi: 'अपने चुने हुए उम्मीदवार के लिए वोट करें। वैध फोटो ID लाना याद रखें।'
    },
    icon: '🗳️',
    href: '/guide'
  }
];

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { language } = useLanguage();

  const t = (obj: Record<string, string>) => obj[language] || obj.en;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {language === 'hi' ? 'वोट करने की प्रक्रिया' : 'How to Vote'}
          </h2>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {language === 'hi' ? 'छोड़ें' : 'Skip'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-700 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-green-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step content */}
        <div className="text-center py-8">
          <div className="text-6xl mb-6">{steps[currentStep].icon}</div>
          <h3 className="text-2xl font-bold text-white mb-4">
            {t(steps[currentStep].title)}
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {t(steps[currentStep].description)}
          </p>
          
          <Link
            href={steps[currentStep].href}
            className="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            {language === 'hi' ? 'अधिक जानें' : 'Learn More'}
          </Link>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            ← {language === 'hi' ? 'पिछला' : 'Previous'}
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            {currentStep === steps.length - 1 
              ? (language === 'hi' ? 'पूर्ण करें' : 'Finish') 
              : (language === 'hi' ? 'अगला' : 'Next')}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentStep ? 'bg-indigo-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}