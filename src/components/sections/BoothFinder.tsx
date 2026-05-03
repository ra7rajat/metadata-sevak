'use client';

import { useEffect, useMemo, useState } from 'react';
import { ACCEPTED_IDS } from '@/lib/appData';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface BoothResponse {
  success: boolean;
  error?: string;
  code?: string;
  epicNumber?: string;
  booth?: {
    boothNumber: string;
    boothName: string;
    address: string;
    constituency: string;
    district: string;
    state: string;
  };
  embedUrl?: string;
  directionsUrl?: string;
  data?: {
    constituency: string;
    state: string;
    district: string;
  };
}

export default function BoothFinder() {
  const { language } = useLanguage();
  const [method, setMethod] = useState<'pincode' | 'epic'>('pincode');
  const [pincode, setPincode] = useState('');
  const [epic, setEpic] = useState('');
  const [result, setResult] = useState<BoothResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [distanceNote, setDistanceNote] = useState('');

  const copy = useMemo(() => ({
    heading: language === 'hi' ? 'अपना मतदान केंद्र खोजें' : 'Find Your Polling Booth',
    pincode: language === 'hi' ? 'पिनकोड' : 'Pincode',
    epic: language === 'hi' ? 'EPIC नंबर' : 'EPIC Number',
    search: language === 'hi' ? 'बूथ खोजें' : 'Find Booth',
    openMaps: language === 'hi' ? 'Google Maps में खोलें' : 'Open in Google Maps',
    share: language === 'hi' ? 'साझा करें' : 'Share booth details',
  }), [language]);

  useEffect(() => {
    if (!navigator.geolocation || !result?.booth) return;
    navigator.geolocation.getCurrentPosition(
      () => setDistanceNote(language === 'hi' ? 'आपकी वर्तमान लोकेशन से दूरी Maps में दिखाई जाएगी।' : 'Distance from your current location will be shown in Google Maps.'),
      () => setDistanceNote(language === 'hi' ? 'लोकेशन एक्सेस नहीं मिला।' : 'Location access not available.')
    );
  }, [language, result]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const url = method === 'epic'
        ? `/api/booth?epic=${encodeURIComponent(epic)}`
        : `/api/booth?pincode=${encodeURIComponent(pincode)}`;
      const response = await fetch(url);
      setResult(await response.json());
    } finally {
      setLoading(false);
    }
  };

  const shareDetails = async () => {
    if (!navigator.share || !result?.booth) return;
    await navigator.share({
      title: 'MataData Booth Details',
      text: `${result.booth.boothName}, ${result.booth.address}`,
      url: result.directionsUrl,
    });
  };

  return (
    <section className="py-8 md:py-12 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Booth Finder</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-white">{copy.heading}</h2>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6 space-y-5">
        <div className="flex gap-3">
          <button type="button" onClick={() => setMethod('pincode')} className={`rounded-full px-4 py-2 text-sm ${method === 'pincode' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>
            {copy.pincode}
          </button>
          <button type="button" onClick={() => setMethod('epic')} className={`rounded-full px-4 py-2 text-sm ${method === 'epic' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>
            {copy.epic}
          </button>
        </div>
        <input
          value={method === 'pincode' ? pincode : epic}
          onChange={(event) => method === 'pincode' ? setPincode(event.target.value.replace(/\D/g, '').slice(0, 6)) : setEpic(event.target.value.toUpperCase())}
          placeholder={method === 'pincode' ? '226012' : 'ABC1234567'}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
        <button type="submit" className="rounded-full bg-gradient-to-r from-orange-500 to-green-600 px-6 py-3 text-sm font-semibold text-white">
          {copy.search}
        </button>
      </form>

      {loading && (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 animate-pulse">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-white/10" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-20 rounded-2xl bg-white/10" />
            <div className="h-32 rounded-2xl bg-white/10" />
          </div>
        </div>
      )}

      {result?.success && result.booth && (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-white">{result.booth.constituency}</h3>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              {result.booth.state}
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-3">
              <p className="text-white">{result.booth.boothName}</p>
              <p className="text-gray-300">{result.booth.address}</p>
              <p className="text-sm text-gray-400">{distanceNote}</p>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">7:00 AM - 6:00 PM</p>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-orange-500 to-green-600" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white mb-2">{language === 'hi' ? 'क्या लेकर जाएं' : 'What to bring'}</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  {ACCEPTED_IDS.slice(0, 2).map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                  <li>✓ {language === 'hi' ? '12 स्वीकृत पहचान पत्रों में से कोई भी' : 'Any of the 12 accepted identity documents'}</li>
                  <li>✓ {language === 'hi' ? 'और कुछ आवश्यक नहीं' : 'Nothing else required'}</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3">
                {result.directionsUrl && (
                  <a href={result.directionsUrl} target="_blank" rel="noreferrer" className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white">
                    {copy.openMaps}
                  </a>
                )}
                <button type="button" onClick={shareDetails} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                  {copy.share}
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 min-h-[320px]">
              {result.embedUrl ? (
                <iframe title="Booth map" src={result.embedUrl} className="h-[320px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  Map embed unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {result?.success && !result.booth && result.data && (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-white text-lg">{result.data.constituency}</p>
          <p className="text-gray-400">{result.data.district}, {result.data.state}</p>
        </div>
      )}

      {result && !result.success && (
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-5 text-red-100">
          {result.error}
        </div>
      )}
    </section>
  );
}
