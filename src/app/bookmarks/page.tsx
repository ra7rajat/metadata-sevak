'use client';

import Link from 'next/link';
import { useBookmarks } from '@/hooks/useBookmarks';

export default function BookmarksPage() {
  const { bookmarks, removeBoothBookmark, removeScheduleBookmark } = useBookmarks();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Your Saved Items</h1>
      
      {/* Polling Booths */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Polling Booths</h2>
        {bookmarks.booths.length === 0 ? (
          <p className="text-gray-500">No bookmarked booths yet.</p>
        ) : (
          <div className="space-y-3">
            {bookmarks.booths.map(booth => (
              <div key={booth.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white">{booth.boothName}</h3>
                    <p className="text-sm text-gray-400 mt-1">{booth.address}</p>
                    <p className="text-xs text-gray-500 mt-2">EPIC: {booth.epicNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    {booth.directionsUrl && (
                      <a
                        href={booth.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                      >
                        Directions
                      </a>
                    )}
                    <button
                      onClick={() => removeBoothBookmark(booth.id)}
                      className="text-xs px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Election Schedules */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Election Schedules</h2>
        {bookmarks.schedules.length === 0 ? (
          <p className="text-gray-500">No bookmarked schedules yet.</p>
        ) : (
          <div className="space-y-3">
            {bookmarks.schedules.map(schedule => (
              <div key={schedule.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white">{schedule.state}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {schedule.electionType} - Polling: {schedule.pollingDate}
                    </p>
                  </div>
                  <button
                    onClick={() => removeScheduleBookmark(schedule.id)}
                    className="text-xs px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Back link */}
      <div className="mt-8">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300">
          ← Back to Chat
        </Link>
      </div>
    </div>
  );
}