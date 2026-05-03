'use client';

/**
 * useVoiceChat Hook — Browser speech input + speech synthesis wrapper.
 *
 * This voice mode keeps Gemini usage on the server by converting mic input
 * to text in the browser, sending that text through the existing chat API,
 * then speaking the assistant response back with speech synthesis.
 *
 * @module hooks/useVoiceChat
 */

import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import type { VoiceChatState, VoiceChatReturn, DetectedLanguage } from '@/types';

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResult>;
  resultIndex: number;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

interface UseVoiceChatOptions {
  onVoiceMessage: (message: string) => Promise<string>;
}

function buildLangCode(language: DetectedLanguage): string {
  return language === 'hi' ? 'hi-IN' : 'en-IN';
}

export function useVoiceChat(
  language: DetectedLanguage = 'en',
  options: UseVoiceChatOptions
): VoiceChatReturn {
  const languageRef = useRef<DetectedLanguage>(language);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldProcessRef = useRef(false);
  const mountedRef = useRef(true);
  const finalTranscriptRef = useRef('');

  const getVoiceSupportSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const browserWindow = window as WindowWithSpeechRecognition;
    return Boolean(
      browserWindow.SpeechRecognition &&
      window.speechSynthesis
    ) || Boolean(
      browserWindow.webkitSpeechRecognition &&
      window.speechSynthesis
    );
  }, []);

  const isSupported = useSyncExternalStore(
    () => () => {},
    getVoiceSupportSnapshot,
    () => false
  );

  const [state, setState] = useState<VoiceChatState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) {
      if (mountedRef.current) {
        setState('idle');
      }
      return;
    }

    stopSpeaking();
    setState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = buildLangCode(languageRef.current);
    utterance.rate = 1;
    utterance.onend = () => {
      if (mountedRef.current) {
        setState('idle');
      }
    };
    utterance.onerror = () => {
      if (mountedRef.current) {
        setError('Voice playback failed.');
        setState('error');
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking]);

  const processVoiceMessage = useCallback(async () => {
    const finalTranscript = finalTranscriptRef.current.trim();
    if (!finalTranscript) {
      setError('I could not hear anything clearly. Please try again.');
      setState('error');
      return;
    }

    try {
      setState('processing');
      const assistantReply = await options.onVoiceMessage(finalTranscript);
      if (!mountedRef.current) return;
      speakText(assistantReply);
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Voice request failed.';
      setError(message);
      setState('error');
    }
  }, [options, speakText]);

  const stopListening = useCallback(() => {
    shouldProcessRef.current = true;
    recognitionRef.current?.stop();
    if (mountedRef.current && state === 'listening') {
      setState('processing');
    }
  }, [state]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Voice chat is not supported in this browser.');
      setState('error');
      return;
    }

    stopSpeaking();
    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';
    shouldProcessRef.current = false;

    const browserWindow = window as WindowWithSpeechRecognition;
    const RecognitionCtor =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setError('Voice chat is not supported in this browser.');
      setState('error');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = buildLangCode(languageRef.current);

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript.trim();
        if (!chunk) {
          continue;
        }

        if (event.results[i].isFinal) {
          finalTranscriptRef.current =
            `${finalTranscriptRef.current} ${chunk}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${chunk}`.trim();
        }
      }

      setTranscript(
        `${finalTranscriptRef.current} ${interimTranscript}`.trim()
      );
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;

      const message = event.error === 'not-allowed'
        ? 'Microphone access denied. Please allow microphone access in your browser settings.'
        : 'Voice recognition failed. Please try again.';

      setError(message);
      setState('error');
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (!mountedRef.current) return;

      if (shouldProcessRef.current) {
        shouldProcessRef.current = false;
        void processVoiceMessage();
        return;
      }

      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState('listening');
  }, [isSupported, processVoiceMessage, state, stopSpeaking]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    state,
    startListening,
    stopListening,
    transcript,
    error,
    isSupported,
  };
}
