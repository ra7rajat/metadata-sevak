'use client';

/**
 * PerformanceMonitor — A diagnostic component that tracks and logs
 * system resource usage in real-time.
 * 
 * Tracks:
 * - FPS (Frames Per Second) to detect UI thread jank/hangs
 * - Memory Usage (JS Heap) via non-standard performance.memory API (Chrome only)
 * - Component re-render frequency
 * 
 * Displays a small overlay HUD in the corner and logs warnings to console
 * if FPS drops below 30 or memory usage spikes.
 * 
 * @module components/PerformanceMonitor
 */

import React, { useState, useEffect, useRef } from 'react';

interface MemoryPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState<{ used: number; total: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const requestRef = useRef<number | null>(null);

  // Toggle visibility with Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Long Tasks Tracking (to detect UI thread blocks)
  useEffect(() => {
    if (!isVisible) return;
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Tasks > 100ms
            console.warn(`[PerformanceMonitor] Long Task detected: ${Math.round(entry.duration)}ms. This is blocking the UI thread!`, entry);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      return () => observer.disconnect();
    } catch (e) {
      console.error('[PerformanceMonitor] Failed to start PerformanceObserver:', e);
    }
  }, [isVisible]);

  // FPS Tracking loop
  useEffect(() => {
    if (!isVisible) {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      frameCountRef.current++;
      
      if (time - lastTimeRef.current >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (time - lastTimeRef.current));
        setFps(currentFps);
        
        // Log warning if jank detected
        if (currentFps < 30) {
          console.warn(`[PerformanceMonitor] Low FPS detected: ${currentFps}fps. UI thread might be blocked.`);
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = time;

        // Memory tracking (Chrome only)
        const perf = window.performance as MemoryPerformance;
        if (perf && perf.memory) {
          const used = Math.round(perf.memory.usedJSHeapSize / 1048576);
          const total = Math.round(perf.memory.totalJSHeapSize / 1048576);
          const limit = Math.round(perf.memory.jsHeapSizeLimit / 1048576);
          setMemory({ used, total });
          
          if (used > 800) { // Warning if heap > 800MB
            console.warn(`[PerformanceMonitor] CRITICAL memory usage: ${used}MB / ${limit}MB limit.`);
          } else if (used > 500) {
            console.warn(`[PerformanceMonitor] High memory usage: ${used}MB used.`);
          }
        }
      }
      
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-[9999] px-3 py-2 rounded-lg 
        bg-black/80 backdrop-blur-md border border-white/20 
        text-[10px] font-mono text-white/90 shadow-2xl pointer-events-none
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0 md:opacity-40'}
      `}
      aria-hidden="true"
    >
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">FPS:</span>
          <span className={fps < 30 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{fps}</span>
        </div>
        {memory && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">RAM:</span>
            <span className={memory.used > 400 ? 'text-red-400 font-bold' : 'text-indigo-400'}>
              {memory.used}MB / {memory.total}MB
            </span>
          </div>
        )}
        <div className="mt-1 pt-1 border-t border-white/10 text-[8px] text-gray-500">
          Shift+P to toggle HUD
        </div>
      </div>
    </div>
  );
}
