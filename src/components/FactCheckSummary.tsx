/**
 * FactCheckSummary - Renders a compact summary of fact-check verdicts.
 * @module components/FactCheckSummary
 */

import type { NewsSource, FactCheckVerdict } from '@/types';

interface FactCheckSummaryProps {
  sources: NewsSource[];
}

export default function FactCheckSummary({ sources }: FactCheckSummaryProps) {
  const allVerdicts: FactCheckVerdict[] = sources
    .flatMap((s) => s.articles)
    .flatMap((a) => a.factCheckVerdicts || []);

  if (allVerdicts.length === 0) return null;

  const trueCount = allVerdicts.filter((v) => v.normalizedRating === 'TRUE').length;
  const falseCount = allVerdicts.filter((v) => v.normalizedRating === 'FALSE').length;
  const mixedCount = allVerdicts.filter((v) => v.normalizedRating === 'MISSING_CONTEXT').length;

  return (
    <div className="mt-auto pt-3 border-t border-indigo-500/[0.15]">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Fact-Check Summary
      </p>
      <div className="flex gap-3 text-[11px]" role="list" aria-label="Fact-check counts">
        {trueCount > 0 && (
          <span className="text-emerald-400" role="listitem">
            ✓ {trueCount} verified
          </span>
        )}
        {falseCount > 0 && (
          <span className="text-red-400" role="listitem">
            ✗ {falseCount} false
          </span>
        )}
        {mixedCount > 0 && (
          <span className="text-amber-400" role="listitem">
            ⚠ {mixedCount} needs context
          </span>
        )}
      </div>
    </div>
  );
}