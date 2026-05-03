'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { CandidateProfile } from '@/types';

const STEP_ICONS = ['🧾', '🗺️', '🧠', '🎒', '🏫'];

export default function VotingGuide() {
  const { language, setLanguage } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);

  useEffect(() => {
    fetch('/api/candidates')
      .then((response) => response.json())
      .then((data) => setCandidates(data.candidates || []))
      .catch(() => setCandidates([]));
  }, []);

  const steps = useMemo(() => [
    {
      title: language === 'hi' ? 'पंजीकरण जांचें' : 'Check Registration',
      points: language === 'hi'
        ? ['नाम, राज्य, जिला तैयार रखें', 'EPIC नंबर से तेज़ खोज करें', 'रिकॉर्ड न मिले तो NVSP पर पंजीकरण करें']
        : ['Keep your name, state, and district ready', 'Use EPIC for a faster lookup', 'Register on NVSP if no record appears'],
      fact: language === 'hi' ? '18 वर्ष पूरा होने पर आप पंजीकरण के पात्र होते हैं।' : 'You become eligible once you are 18 years old.',
      href: '/voter-check',
    },
    {
      title: language === 'hi' ? 'अपना निर्वाचन क्षेत्र जानें' : 'Know Your Constituency',
      points: language === 'hi'
        ? ['पिनकोड से क्षेत्र देखें', 'मतदान केंद्र का पता नोट करें', 'मतदान समय पहले से जान लें']
        : ['Look up your area by pincode', 'Save your booth address', 'Confirm polling timings in advance'],
      fact: language === 'hi' ? 'अलग-अलग वार्डों में मतदान केंद्र बदल सकते हैं।' : 'Polling booths can change across wards even within one city.',
      href: '/booth',
    },
    {
      title: language === 'hi' ? 'उम्मीदवारों को समझें' : 'Research Candidates',
      points: language === 'hi'
        ? ['शपथपत्र पढ़ें', 'शिक्षा और संपत्ति देखें', 'अपराधिक मामलों की जानकारी जांचें']
        : ['Read candidate affidavits', 'Review education and assets', 'Check disclosed criminal cases'],
      fact: language === 'hi' ? 'ECI शपथपत्र उम्मीदवार की घोषित जानकारी का आधिकारिक स्रोत है।' : 'ECI affidavits are the official source for declared candidate information.',
      href: '/guide',
    },
    {
      title: language === 'hi' ? 'मतदान दिवस तैयारी' : 'Voting Day Preparation',
      points: language === 'hi'
        ? ['वैध पहचान पत्र साथ रखें', 'लाइन के लिए समय रखें', 'मतदाता पर्ची होने पर उपयोगी है']
        : ['Carry a valid identity document', 'Plan extra time for queues', 'A voter slip is helpful if available'],
      fact: language === 'hi' ? 'मतदान के लिए केवल पहचान दस्तावेज़ आवश्यक है।' : 'A valid identity document is the only essential item you need.',
      href: '/booth',
    },
    {
      title: language === 'hi' ? 'मतदान केंद्र पर' : 'At the Polling Booth',
      points: language === 'hi'
        ? ['लाइन में अपनी बारी की प्रतीक्षा करें', 'EVM/VVPAT निर्देश ध्यान से सुनें', 'स्याही लगने के बाद पर्ची सत्यापित करें']
        : ['Wait for your turn in line', 'Follow EVM/VVPAT instructions carefully', 'Verify the process after indelible ink is applied'],
      fact: language === 'hi' ? 'मतदान आमतौर पर सुबह 7 बजे से शाम 6 बजे तक होता है।' : 'Polling is typically open from 7:00 AM to 6:00 PM.',
      href: '/booth',
    },
  ], [language]);

  const step = steps[activeStep];

  return (
    <section className="py-8 md:py-12 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-300">Guide</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white">
            {language === 'hi' ? 'मतदान मार्गदर्शिका' : 'Voting Guide'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setLanguage('en')} className={`rounded-full px-3 py-2 text-sm ${language === 'en' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>EN</button>
          <button type="button" onClick={() => setLanguage('hi')} className={`rounded-full px-3 py-2 text-sm ${language === 'hi' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>हिं</button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`rounded-3xl border px-4 py-3 text-left ${index === activeStep ? 'border-orange-500/40 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <span>{STEP_ICONS[index]}</span>
                <div>
                  <p className="text-xs text-gray-500">{language === 'hi' ? `चरण ${index + 1}` : `Step ${index + 1}`}</p>
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{STEP_ICONS[activeStep]}</span>
            <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
          </div>
          <ul className="mt-5 space-y-3 text-gray-200">
            {step.points.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Did you know?</p>
            <p className="mt-2 text-sm text-amber-100">{step.fact}</p>
          </div>
          <Link href={step.href} className="mt-6 inline-flex rounded-full bg-gradient-to-r from-orange-500 to-green-600 px-4 py-2 text-sm font-medium text-white">
            {language === 'hi' ? 'संबंधित कार्रवाई खोलें' : 'Open related action'}
          </Link>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">
            {language === 'hi' ? 'उम्मीदवार जानकारी' : 'Candidate Info'}
          </h3>
          <div className="mt-4 space-y-4">
            {candidates.slice(0, 3).map((candidate) => (
              <div key={candidate.name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{candidate.name}</p>
                    <p className="text-sm text-indigo-300">{candidate.party}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-gray-400">
                    Neutral
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-300">
                  <p>{candidate.education}</p>
                  <p>{candidate.assets}</p>
                  <p>{candidate.criminalCases}</p>
                </div>
                <p className="mt-3 text-xs text-gray-500">{candidate.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
