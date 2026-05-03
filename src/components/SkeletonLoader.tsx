/**
 * SkeletonLoader - Pulsing skeleton while news data loads.
 * @module components/SkeletonLoader
 */

export default function SkeletonLoader() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse"
      aria-label="Loading news coverage"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-3 w-24 bg-white/[0.08] rounded" />
          {[0, 1].map((j) => (
            <div
              key={j}
              className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-white/[0.08]" />
                <div className="h-2.5 w-16 bg-white/[0.08] rounded" />
              </div>
              <div className="h-3.5 w-full bg-white/[0.08] rounded" />
              <div className="h-3.5 w-3/4 bg-white/[0.08] rounded" />
              <div className="h-2.5 w-full bg-white/[0.06] rounded" />
              <div className="h-2.5 w-2/3 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading news articles...</span>
    </div>
  );
}