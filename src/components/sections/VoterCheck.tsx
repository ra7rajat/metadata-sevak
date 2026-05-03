'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { INDIA_STATES } from '@/lib/appData';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { PollingBoothResult, VoterRollResult } from '@/types';

type VoterCheckResponse = VoterRollResult & {
  booth?: PollingBoothResult | null;
};

function isSuccessfulBoothResult(value: PollingBoothResult | null | undefined): value is Extract<PollingBoothResult, { success: true }> {
  return Boolean(value && value.success);
}

function isSuccessfulVoterResult(value: VoterCheckResponse | PollingBoothResult | null): value is Extract<VoterRollResult, { success: true }> & { booth?: PollingBoothResult | null } {
  return Boolean(value && 'records' in value && value.success);
}

export default function VoterCheck() {
  const { language } = useLanguage();
  const [method, setMethod] = useState<'details' | 'epic'>('details');
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState<string>(INDIA_STATES[0].value);
  const [district, setDistrict] = useState<string>(INDIA_STATES[0].districts[0]);
  const [epic, setEpic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoterCheckResponse | PollingBoothResult | null>(null);

  const copy = {
    heading: language === 'hi' ? 'मतदाता सूची जांचें' : 'Check Your Voter Registration',
    subheading: language === 'hi' ? 'नाम से या EPIC नंबर से अपनी जानकारी खोजें।' : 'Search by your name details or EPIC number.',
    fullName: language === 'hi' ? 'पूरा नाम' : 'Full Name',
    state: language === 'hi' ? 'राज्य' : 'State',
    district: language === 'hi' ? 'जिला' : 'District',
    epic: language === 'hi' ? 'EPIC नंबर' : 'EPIC Number',
    search: language === 'hi' ? 'खोजें' : 'Search',
    register: language === 'hi' ? 'NVSP पर पंजीकरण करें' : 'Register on NVSP',
    notFound: language === 'hi' ? 'रिकॉर्ड नहीं मिला। आप NVSP पर नया पंजीकरण कर सकते हैं।' : 'No record found. You can register fresh on NVSP.',
    directions: language === 'hi' ? 'दिशा देखें' : 'Get Directions',
    slip: language === 'hi' ? 'मतदाता पर्ची डाउनलोड करें' : 'Download Voter Slip',
  };

  const districts = useMemo(
    () => INDIA_STATES.find((entry) => entry.value === state)?.districts || [],
    [state]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const url = method === 'epic'
        ? `/api/voter-check?method=epic&epic=${encodeURIComponent(epic)}`
        : `/api/voter-check?method=details&name=${encodeURIComponent(fullName)}&state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`;
      const response = await fetch(url);
      setResult(await response.json());
    } finally {
      setLoading(false);
    }
  };

  const printSlip = () => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win || !isSuccessfulVoterResult(result)) return;
    const booth = isSuccessfulBoothResult(result.booth) ? result.booth.booth : null;
    const voter = result.records[0];
    win.document.write(`
      <html><head><title>Voter Slip</title></head><body style="font-family: sans-serif; padding: 24px;">
      <h1>MataData Voter Slip</h1>
      <p><strong>Name:</strong> ${voter?.name || ''}</p>
      <p><strong>Constituency:</strong> ${voter?.constituency || booth?.constituency || ''}</p>
      <p><strong>Booth Number:</strong> ${booth?.boothNumber || voter?.pollingStation || ''}</p>
      <p><strong>Booth Address:</strong> ${booth?.address || ''}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const renderResult = () => {
    if (!result) return null;

    if (!result.success) {
      return (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <p>{copy.notFound}</p>
          <a href="https://www.nvsp.in" target="_blank" rel="noreferrer" className="inline-flex mt-3 text-amber-200 underline">
            {copy.register} ↗
          </a>
        </div>
      );
    }

    const booth = isSuccessfulVoterResult(result) && isSuccessfulBoothResult(result.booth) ? result.booth.booth : null;
    const voter = isSuccessfulVoterResult(result) ? result.records[0] : null;

    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6 shadow-2xl">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">{voter?.name || method === 'epic' ? epic : ''}</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-200">
              <Detail label="Constituency" value={voter?.constituency || booth?.constituency || 'To be verified'} />
              <Detail label="Booth Number" value={booth?.boothNumber || 'To be verified'} />
              <Detail label="Booth Address" value={booth?.address || 'Address not available'} />
              <Detail label="State" value={booth?.state || state} />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {booth?.directionsUrl && (
                <a href={booth.directionsUrl} target="_blank" rel="noreferrer" className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white">
                  {copy.directions}
                </a>
              )}
              <button type="button" onClick={printSlip} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
                {copy.slip}
              </button>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/20 min-h-[240px]">
            {booth?.mapImageUrl ? (
              <Image src={booth.mapImageUrl} alt="Booth map" fill className="object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400 px-6 text-center">
                Map preview will appear when a booth location is available.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-8 md:py-12 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Voter Check</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-white">{copy.heading}</h2>
        <p className="text-gray-400">{copy.subheading}</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6 space-y-5">
        <div className="flex gap-3">
          <button type="button" onClick={() => setMethod('details')} className={`rounded-full px-4 py-2 text-sm ${method === 'details' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>
            {language === 'hi' ? 'नाम से खोजें' : 'Search by name'}
          </button>
          <button type="button" onClick={() => setMethod('epic')} className={`rounded-full px-4 py-2 text-sm ${method === 'epic' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>
            {language === 'hi' ? 'EPIC से खोजें' : 'Search by EPIC'}
          </button>
        </div>

        {method === 'details' ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={copy.fullName} value={fullName} onChange={setFullName} />
            <SelectField label={copy.state} value={state} onChange={(value) => {
              setState(value);
              const nextDistricts = INDIA_STATES.find((entry) => entry.value === value)?.districts || [];
              setDistrict(nextDistricts[0] || '');
            }} options={INDIA_STATES.map((entry) => entry.value)} />
            <SelectField label={copy.district} value={district} onChange={setDistrict} options={districts} />
          </div>
        ) : (
          <Field label={copy.epic} value={epic} onChange={setEpic} />
        )}

        <button type="submit" className="rounded-full bg-gradient-to-r from-orange-500 to-green-600 px-6 py-3 text-sm font-semibold text-white">
          {copy.search}
        </button>
      </form>

      {loading ? <LoadingCard /> : renderResult()}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-1 text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-gray-300">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-gray-300">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none">
        {options.map((option) => (
          <option key={option} value={option} className="bg-gray-900">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-2xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}
