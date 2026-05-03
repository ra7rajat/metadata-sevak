'use client';

/**
 * MessageBubble component for rendering individual chat messages.
 * Supports user and assistant roles with distinct styling.
 * Handles bilingual (Hindi/English) text display.
 * @module components/MessageBubble
 */

import React from 'react';
import Link from 'next/link';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  /** The chat message to render */
  message: ChatMessage;
}

/**
 * Renders a single chat message bubble with role-appropriate styling.
 * Displays a typing indicator when the assistant is actively streaming.
 *
 * @param props - Component props containing the message to render.
 * @returns The rendered message bubble element.
 */
export default React.memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
      role="listitem"
      aria-label={`${isUser ? 'Your' : "MataData's"} message`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-green-600 flex items-center justify-center mr-3 mt-1 shadow-lg"
          aria-hidden="true"
        >
          <span className="text-white text-xs font-bold">म</span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-md
          ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md'
              : isError
                ? 'bg-red-900/30 border border-red-500/40 text-red-200 rounded-bl-md'
                : 'bg-white/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-bl-md'
          }
        `}
      >
        {/* Message text with bilingual support */}
        <p
          className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words"
          lang={detectLanguage(message.content)}
          dir="ltr"
        >
          {message.content}
        </p>

        {/* Streaming indicator */}
        {message.isStreaming && (
          <span
            className="inline-flex items-center gap-1 mt-2"
            aria-label="MataData is typing"
            role="status"
          >
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        )}

         {message.quickAction && !message.isStreaming && (
          <Link
            href={message.quickAction.href}
            prefetch={true}
            className="mt-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
          >
            {message.quickAction.label}
          </Link>
        )}

        {/* Timestamp */}
        <time
          className={`block text-[10px] mt-2 ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}
          dateTime={message.timestamp}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ml-3 mt-1 shadow-lg"
          aria-hidden="true"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
    </div>
  );
});

/**
 * Simple language detection heuristic for Hindi vs English.
 * Checks for Devanagari script characters.
 *
 * @param text - The text to analyze.
 * @returns 'hi' for Hindi, 'en' for English.
 */
function detectLanguage(text: string): string {
  // Devanagari Unicode range: \u0900-\u097F
  const devanagariPattern = /[\u0900-\u097F]/;
  return devanagariPattern.test(text) ? 'hi' : 'en';
}
