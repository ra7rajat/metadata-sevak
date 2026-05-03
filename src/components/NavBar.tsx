'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const NAV_ITEMS = [
  { href: '/', label: { en: 'Chat', hi: 'चैट' }, icon: '💬' },
  { href: '/voter-check', label: { en: 'Voter Check', hi: 'मतदाता जांच' }, icon: '🪪' },
  { href: '/news', label: { en: 'News', hi: 'समाचार' }, icon: '📰' },
  { href: '/booth', label: { en: 'Booth', hi: 'बूथ' }, icon: '📍' },
  { href: '/guide', label: { en: 'Guide', hi: 'मार्गदर्शिका' }, icon: '🗳️' },
  { href: '/bookmarks', label: { en: 'Saved', hi: 'सहेजे गए' }, icon: '🔖' },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const moveFocus = (nextIndex: number) => {
    const normalized = (nextIndex + NAV_ITEMS.length) % NAV_ITEMS.length;
    tabRefs.current[normalized]?.focus();
  };

  return (
    <>
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center shadow-lg"
              aria-hidden="true"
            >
              <span className="text-lg font-bold text-gray-900">म</span>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-white leading-tight">
                MataData
              </p>
              <p className="text-[11px] text-gray-400 leading-tight" lang="hi">
                मतदाता — Election Assistant
              </p>
            </div>
          </Link>

          <nav
            className="hidden md:flex flex-1 justify-center"
            aria-label="Primary navigation"
          >
            <div
              role="tablist"
              aria-label="Main app sections"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1"
            >
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        moveFocus(index + 1);
                      }
                      if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        moveFocus(index - 1);
                      }
                    }}
                    className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label[language]}
                    <span
                      className={`absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-green-600 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-3 py-1 text-xs ${language === 'en' ? 'bg-white/15 text-white' : 'text-gray-400'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`rounded-full px-3 py-1 text-xs ${language === 'hi' ? 'bg-white/15 text-white' : 'text-gray-400'}`}
              >
                हिं
              </button>
            </div>
            <a
              href="https://eci.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-300 hover:text-white transition-colors"
            >
              ECI Official Site ↗
            </a>
          </div>
        </div>
      </header>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl"
        aria-label="Mobile navigation"
      >
        <div role="tablist" aria-label="Main app sections" className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="tab"
                aria-selected={isActive}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-[11px] ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label[language]}</span>
                <span
                  className={`h-0.5 w-8 rounded-full bg-gradient-to-r from-orange-500 to-green-600 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
