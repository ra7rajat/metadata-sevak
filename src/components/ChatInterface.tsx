'use client';

/**
 * ChatInterface — The main conversational UI for MataData.
 * Handles message input, streaming response display, and keyboard navigation.
 * Fully accessible with ARIA labels and semantic HTML.
 * @module components/ChatInterface
 */

import dynamic from 'next/dynamic';
import React, { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import MessageBubble from '@/components/MessageBubble';
const VoiceButton = dynamic(() => import('@/components/VoiceButton'), { ssr: false });
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import type { ChatMessage, ConversationTurn } from '@/types';

/** Generates a unique message ID */
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Detects if the given text contains Devanagari (Hindi) characters */
function isHindi(text: string): boolean {
  // Use regex fallback - API detection happens in background
  // Devanagari Unicode range: 0900–097F
  return /[\u0900-\u097F]/.test(text);
}

/**
 * The primary chat interface component.
 * Manages conversation state, sends messages to the /api/chat endpoint,
 * and renders streaming responses word by word.
 *
 * @returns The rendered chat interface.
 */
export default function ChatInterface() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRegionRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAssistantTextRef = useRef('');
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use regex detection as immediate fallback, async API detection updates state
  const detectedLang = isHindi(input) ? 'hi' : 'en';

  const getQuickAction = useCallback((message: string) => {
    const normalized = message.toLowerCase();
    if (/(booth|polling|direction|map|where vote|केंद्र|बूथ)/.test(normalized)) {
      return {
        href: '/booth',
        label: language === 'hi' ? 'Booth Finder खोलें →' : 'Open Booth Finder →',
      };
    }
    if (/(news|headline|media|fact check|समाचार|खबर)/.test(normalized)) {
      return {
        href: '/news',
        label: language === 'hi' ? 'News Section खोलें →' : 'Open News Section →',
      };
    }
    if (/(register|registration|voter id|epic|मतदाता|registration|पहचान)/.test(normalized)) {
      return {
        href: '/voter-check',
        label: language === 'hi' ? 'Voter Check खोलें →' : 'Open Voter Check →',
      };
    }
    return undefined;
  }, [language]);

  // ── Voice Session ──
  // ── Auto-scroll to bottom on new messages ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isStreaming) {
      // Throttle scroll during streaming: at most once per 150ms.
      // Without this, scrollIntoView fires on every chunk (dozens/sec),
      // forcing the browser to recalculate layout constantly.
      if (!scrollTimerRef.current) {
        scrollTimerRef.current = setTimeout(() => {
          scrollToBottom();
          scrollTimerRef.current = null;
        }, 150);
      }
    } else {
      // Stream finished or new user message — scroll immediately
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      scrollToBottom();
    }

    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [messages, scrollToBottom]);

  // ── Focus input on mount ──
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (streamFlushTimerRef.current) {
        clearTimeout(streamFlushTimerRef.current);
      }
    };
  }, []);

  /**
   * Builds conversation history in Gemini's expected format
   * from the current messages array.
   */
  const buildHistory = useCallback((): ConversationTurn[] => {
    return messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));
  }, [messages]);

  const updateAssistantMessage = useCallback(
    (assistantId: string, content: string, isStreaming: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content, isStreaming }
            : m
        )
      );
    },
    []
  );

  const flushAssistantMessage = useCallback(
    (assistantId: string, isStreaming: boolean) => {
      if (streamFlushTimerRef.current) {
        clearTimeout(streamFlushTimerRef.current);
        streamFlushTimerRef.current = null;
      }

      updateAssistantMessage(
        assistantId,
        pendingAssistantTextRef.current,
        isStreaming
      );
    },
    [updateAssistantMessage]
  );

  const sendMessage = useCallback(
    async (rawInput: string): Promise<string> => {
      const trimmedInput = rawInput.trim();
      if (!trimmedInput) {
        throw new Error('Message cannot be empty.');
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmedInput,
        timestamp: new Date().toISOString(),
      };

      const history = buildHistory();
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const assistantId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
        quickAction: getQuickAction(trimmedInput),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedInput,
            history,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream available');

        const decoder = new TextDecoder();
        pendingAssistantTextRef.current = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          pendingAssistantTextRef.current += chunk;

          if (!streamFlushTimerRef.current) {
            streamFlushTimerRef.current = setTimeout(() => {
              streamFlushTimerRef.current = null;
              updateAssistantMessage(
                assistantId,
                pendingAssistantTextRef.current,
                true
              );
            }, 50);
          }
        }

        flushAssistantMessage(assistantId, false);
        return pendingAssistantTextRef.current;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        if (streamFlushTimerRef.current) {
          clearTimeout(streamFlushTimerRef.current);
          streamFlushTimerRef.current = null;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  role: 'error' as const,
                  content: errorMsg,
                  isStreaming: false,
                }
              : m
          )
        );

        throw new Error(errorMsg);
      } finally {
        pendingAssistantTextRef.current = '';
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [buildHistory, flushAssistantMessage, getQuickAction, updateAssistantMessage]
  );

  const {
    state: voiceState,
    startListening,
    stopListening,
    transcript: voiceTranscript,
    error: voiceError,
    isSupported: isVoiceSupported,
  } = useVoiceChat(detectedLang, {
    onVoiceMessage: sendMessage,
  });

  /**
   * Sends the user message and streams the AI response.
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const trimmedInput = input.trim();
      if (!trimmedInput || isLoading) return;
      await sendMessage(trimmedInput);
    },
    [input, isLoading, sendMessage]
  );

  /**
   * Handles keyboard shortcuts:
   * - Enter: Submit message
   * - Shift+Enter: New line
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  /**
   * Auto-resize textarea as content grows
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Debounce resize to prevent excessive reflows
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    resizeTimerRef.current = setTimeout(() => {
      // Reset height to auto to shrink if text is deleted
      e.target.style.height = 'auto';
      // Set to scroll height, capped at 120px
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    }, 300);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0" role="main">
      {/* ── Chat Messages Region ── */}
      <div
        ref={chatRegionRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {!hasMessages && <WelcomeScreen onSelectSuggestion={(text) => setInput(text)} />}

        <div role="list" aria-label="Conversation">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* ── Live Voice Transcript ── */}
      {voiceState !== 'idle' && voiceState !== 'error' && (
        <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-lg pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl animate-fade-in text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${voiceState === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-indigo-500 animate-bounce'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                {voiceState === 'listening' ? (detectedLang === 'hi' ? 'सुन रहा हूँ...' : 'Listening...') : 
                 voiceState === 'processing' ? (detectedLang === 'hi' ? 'समझ रहा हूँ...' : 'Processing...') :
                 (detectedLang === 'hi' ? 'बोल रहा हूँ...' : 'Speaking...')}
              </span>
            </div>
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium min-h-[1.5rem]" lang={detectedLang}>
              {voiceTranscript || '...'}
            </p>
          </div>
        </div>
      )}

      {/* ── Input Area ── */}
      <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-xl px-4 md:px-8 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-end gap-3"
          aria-label="Send a message"
        >
          <label htmlFor="chat-input" className="sr-only">
            Type your message in English or Hindi
          </label>
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={detectedLang === 'hi' ? "चुनाव, मतदान केंद्र, या वोटर आईडी के बारे में पूछें..." : "Ask about elections, voter registration, polling booths... (English / हिंदी)"}
            disabled={isLoading || voiceState !== 'idle'}
            rows={1}
            className="
              flex-1 resize-none rounded-xl bg-white/10 border border-white/20
              px-4 py-3 text-sm md:text-base text-gray-100
              placeholder-gray-400 outline-none
              focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
            aria-describedby="input-hint"
            autoComplete="off"
            spellCheck="true"
          />
          <span id="input-hint" className="sr-only">
            Press Enter to send, Shift+Enter for a new line
          </span>

          <div className="flex gap-2 mb-0.5">
            {isVoiceSupported && (
              <VoiceButton
                state={voiceState}
                onStart={startListening}
                onStop={stopListening}
                error={voiceError}
                disabled={isLoading}
              />
            )}

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && voiceState === 'idle') || voiceState !== 'idle'}
            className="
              flex-shrink-0 w-11 h-11 rounded-xl
              bg-gradient-to-br from-indigo-600 to-purple-600
              text-white flex items-center justify-center
              hover:from-indigo-500 hover:to-purple-500
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              active:scale-95
            "
            aria-label="Send message"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            )}
          </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-gray-500 mt-3 max-w-4xl mx-auto">
          MataData may occasionally provide inaccurate information. Always verify with{' '}
          <a
            href="https://eci.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline transition-colors"
          >
            ECI
          </a>{' '}
          and{' '}
          <a
            href="https://nvsp.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline transition-colors"
          >
            NVSP
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

/**
 * Welcome screen shown when no messages exist yet.
 * Displays the app name, tagline, and quick-start suggestions.
 */
function WelcomeScreen({ onSelectSuggestion }: { onSelectSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12 animate-fade-in">
      {/* Logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center shadow-2xl mb-6 animate-float">
        <span className="text-3xl font-bold text-gray-900">म</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Welcome to MataData
      </h2>
      <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md" lang="hi">
        मतदाता — Your Election Information Assistant
      </p>

      {/* Quick suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full" role="list" aria-label="Suggested questions">
        {[
          { emoji: '🗳️', text: 'How do I register to vote?' },
          { emoji: '📍', text: 'Find my polling booth' },
          { emoji: '📋', text: 'मतदाता पहचान पत्र कैसे बनवाएं?' },
          { emoji: '📰', text: 'Latest election schedule' },
        ].map((suggestion) => (
          <button
            key={suggestion.text}
            type="button"
            className="
              flex items-center gap-3 px-4 py-3 rounded-xl
              bg-white/5 border border-white/10 text-left
              hover:bg-white/10 hover:border-white/20
              transition-all duration-200 group
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
            "
            role="listitem"
            aria-label={`Ask: ${suggestion.text}`}
            onClick={() => onSelectSuggestion(suggestion.text)}
          >
            <span className="text-xl group-hover:scale-110 transition-transform" aria-hidden="true">
              {suggestion.emoji}
            </span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
