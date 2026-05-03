'use client';

/**
 * VoiceButton — Interactive microphone button for initiating voice chat.
 *
 * Features:
 * - Dynamic color and animation based on VoiceChatState
 * - Accessible keyboard interaction (Space/Enter to toggle)
 * - Dynamic ARIA labels
 * - Error tooltip
 *
 * @module components/VoiceButton
 */

import React, { KeyboardEvent } from 'react';
import type { VoiceChatState } from '@/types';

interface VoiceButtonProps {
  /** Current state of the voice session */
  state: VoiceChatState;
  /** Callback to start listening */
  onStart: () => void;
  /** Callback to stop listening */
  onStop: () => void;
  /** Optional error message to display */
  error: string | null;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Renders a circular microphone button that animates based on state.
 */
export default function VoiceButton({
  state,
  onStart,
  onStop,
  error,
  disabled = false,
}: VoiceButtonProps) {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing' || state === 'speaking';
  const hasError = state === 'error' || !!error;

  const handleClick = () => {
    if (disabled) return;
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // ─── State-based Styling ───
  let buttonClasses = 'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/20 ';
  let iconClasses = 'w-5 h-5 transition-colors duration-300 ';
  let ariaLabel = 'Start voice input';

  if (disabled) {
    buttonClasses += 'bg-gray-800/50 cursor-not-allowed opacity-50';
    iconClasses += 'text-gray-500';
    ariaLabel = 'Voice input unavailable';
  } else if (hasError) {
    buttonClasses += 'bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400 focus:ring-red-500';
    iconClasses += 'text-red-400';
    ariaLabel = 'Voice error, click to retry';
  } else if (isListening) {
    buttonClasses += 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] focus:ring-red-500 scale-105';
    iconClasses += 'text-white animate-pulse';
    ariaLabel = 'Listening, click to stop';
  } else if (isProcessing) {
    buttonClasses += 'bg-indigo-500/20 border border-indigo-500/50 cursor-wait focus:ring-indigo-500';
    iconClasses += 'text-indigo-400 animate-bounce';
    ariaLabel = 'Processing voice';
  } else {
    buttonClasses += 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 focus:ring-indigo-500';
    iconClasses += 'text-gray-300 group-hover:text-white';
  }

  return (
    <div className="relative group inline-flex">
      {/* ── Pulse Animation (Behind Button) ── */}
      {isListening && (
        <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" aria-hidden="true" />
      )}

      {/* ── Main Button ── */}
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || (isProcessing && !isListening)}
        className={buttonClasses}
        aria-label={ariaLabel}
        aria-pressed={isListening}
        title={error || ariaLabel}
      >
        {isProcessing ? (
          // Processing/Speaking Animation (Small equalizer bars)
          <div className="flex gap-1 items-center justify-center h-5" aria-hidden="true">
            <div className="w-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0ms]" style={{ height: state === 'speaking' ? '80%' : '40%' }} />
            <div className="w-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_200ms]" style={{ height: state === 'speaking' ? '100%' : '60%' }} />
            <div className="w-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms]" style={{ height: state === 'speaking' ? '60%' : '40%' }} />
          </div>
        ) : hasError ? (
          // Error Icon
          <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          // Mic Icon
          <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* ── Error Tooltip ── */}
      {error && !disabled && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-red-900/90 border border-red-500/50 text-red-200 text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
