/**
 * Bookmark hook for saving booth details and schedules to localStorage
 * @module hooks/useBookmarks
 */

import { useState, useEffect, useCallback } from 'react';

export interface BoothBookmark {
  id: string;
  epicNumber: string;
  boothName: string;
  address: string;
  directionsUrl: string;
  mapImageUrl?: string;
  savedAt: string;
}

export interface ScheduleBookmark {
  id: string;
  state: string;
  electionType: string;
  pollingDate: string;
  savedAt: string;
}

const STORAGE_KEY = 'matadata_bookmarks';

interface BookmarkData {
  booths: BoothBookmark[];
  schedules: ScheduleBookmark[];
}

function loadBookmarks(): BookmarkData {
  if (typeof window === 'undefined') return { booths: [], schedules: [] };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { booths: [], schedules: [] };
  } catch {
    return { booths: [], schedules: [] };
  }
}

function saveBookmarks(data: BookmarkData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkData>({ booths: [], schedules: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBookmarks(loadBookmarks());
  }, []);

  const addBoothBookmark = useCallback((booth: Omit<BoothBookmark, 'id' | 'savedAt'>) => {
    if (!mounted) return;
    const newBookmark: BoothBookmark = {
      ...booth,
      id: `booth-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const updated = { ...bookmarks, booths: [...bookmarks.booths, newBookmark] };
    saveBookmarks(updated);
    setBookmarks(updated);
  }, [bookmarks, mounted]);

  const removeBoothBookmark = useCallback((id: string) => {
    if (!mounted) return;
    const updated = { ...bookmarks, booths: bookmarks.booths.filter(b => b.id !== id) };
    saveBookmarks(updated);
    setBookmarks(updated);
  }, [bookmarks, mounted]);

  const addScheduleBookmark = useCallback((schedule: Omit<ScheduleBookmark, 'id' | 'savedAt'>) => {
    if (!mounted) return;
    const newBookmark: ScheduleBookmark = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const updated = { ...bookmarks, schedules: [...bookmarks.schedules, newBookmark] };
    saveBookmarks(updated);
    setBookmarks(updated);
  }, [bookmarks, mounted]);

  const removeScheduleBookmark = useCallback((id: string) => {
    if (!mounted) return;
    const updated = { ...bookmarks, schedules: bookmarks.schedules.filter(s => s.id !== id) };
    saveBookmarks(updated);
    setBookmarks(updated);
  }, [bookmarks, mounted]);

  const isBoothBookmarked = useCallback((epicNumber: string) => {
    return bookmarks.booths.some(b => b.epicNumber === epicNumber);
  }, [bookmarks]);

  const isScheduleBookmarked = useCallback((state: string, pollingDate: string) => {
    return bookmarks.schedules.some(s => s.state === state && s.pollingDate === pollingDate);
  }, [bookmarks]);

  return {
    bookmarks,
    addBoothBookmark,
    removeBoothBookmark,
    addScheduleBookmark,
    removeScheduleBookmark,
    isBoothBookmarked,
    isScheduleBookmarked,
  };
}