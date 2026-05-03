'use client';

/**
 * ChatInterface — The main conversational UI for MataData.
 * Handles message input, streaming response display, and keyboard navigation.
 * Fully accessible with ARIA labels and semantic HTML.
 * @module components/ChatInterface
 */

import React, { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import type { ChatMessage, ConversationTurn } from '@/types';
import WelcomeScreen from '@/components/WelcomeScreen';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';

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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <MessageList messages={messages} />
      {!hasMessages && <WelcomeScreen onSelectSuggestion={(text) => setInput(text)} />}

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
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        voiceState={voiceState}
        inputRef={inputRef}
        placeholder={detectedLang === 'hi' ? "चुनाव, मतदान केंद्र, या वोटर आईडी के बारे में पूछें..." : "Ask about elections, voter registration, polling booths... (English / हिंदी)"}
        disabled={isLoading || voiceState !== 'idle'}
        onVoiceStart={startListening}
        onVoiceStop={stopListening}
        voiceError={voiceError}
      />
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
    </div>
  );
}


