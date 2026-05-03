'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

const SERVICES = [
  'Gemini AI',
  'Google Maps',
  'Google News',
  'Fact Check API',
  'Google Translate',
];

export default function PoweredByFooter() {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-white/10 bg-black/30 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 pb-24 md:pb-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-400">
            {language === 'hi' ? 'संचालित द्वारा' : 'Powered by'}
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((service) => (
              <span
                key={service}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
