/**
 * Voice chat and Gemini Live types.
 * @module types/voice
 */

export type VoiceChatState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface LiveSessionCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioChunk: (audioData: ArrayBuffer) => void;
  onError: (error: Error) => void;
  onStateChange?: (state: VoiceChatState) => void;
}

export interface VoiceChatReturn {
  state: VoiceChatState;
  startListening: () => Promise<void>;
  stopListening: () => void;
  transcript: string;
  error: string | null;
  isSupported: boolean;
}