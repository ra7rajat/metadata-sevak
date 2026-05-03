/**
 * Gemini Live API Integration for MataData.
 *
 * Implements the WebSocket-based Live API for real-time bidirectional
 * voice conversations. Uses the @google/genai SDK's Live class.
 *
 * @module lib/geminiLive
 */

/**
 * GOOGLE SERVICE: Gemini Live API
 * PURPOSE: Enables real-time, low-latency, bidirectional voice interactions via WebSockets, allowing voters to speak queries and receive audio responses instantly.
 * ALTERNATIVES CONSIDERED: Traditional Text-to-Speech / Speech-to-Text pipelines (would be too slow, high latency, and lack the interruptibility/natural flow of the Live API).
 * API DOCS: https://ai.google.dev/api/rest/v1beta/models/streamGenerateContent
 */

import { Modality } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import type { Session, LiveServerMessage } from '@google/genai';
import type { LiveSessionCallbacks, DetectedLanguage } from '@/types';

/** The specific Live model required by the SDK */
const LIVE_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';

const SYSTEM_INSTRUCTION = `You are MataData (मतदाता), an election information assistant for India. You help voters understand the election process, find their polling booth, check voter registration, and get unbiased election news. Always be neutral and factual. Support Hindi and English seamlessly.

Key guidelines:
- Provide accurate information about Indian elections, ECI (Election Commission of India) processes, and voter rights.
- Help users find their polling booth location, check voter ID status, and understand voting procedures.
- When discussing candidates or parties, remain strictly neutral and present factual information only.
- Support both Hindi and English queries. If a user writes in Hindi, respond in Hindi. If in English, respond in English. If mixed, respond in the dominant language.
- Cite official sources like ECI (eci.gov.in), NVSP (nvsp.in) when providing procedural information.
- If you don't know something or the information might be outdated, clearly state that and direct users to official sources.
- Never express political opinions or bias toward any party or candidate.
- Be helpful, concise, and respectful in all interactions.`;

const clientApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Creates and connects a new Gemini Live WebSocket session.
 *
 * Configures the session for audio output and injects the system prompt
 * along with the detected language preference.
 *
 * @param callbacks - Handlers for transcripts, audio chunks, and errors.
 * @param language - Detected language preference ('en' or 'hi').
 * @returns The connected Live Session object.
 */
export async function createLiveSession(
  callbacks: LiveSessionCallbacks,
  language: DetectedLanguage = 'en'
): Promise<Session> {
  if (!clientApiKey) {
    const error = new Error(
      'Voice chat is not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to enable browser voice mode.'
    );
    callbacks.onError(error);
    throw error;
  }

  const client = new GoogleGenAI({ apiKey: clientApiKey });

  try {
    const langInstruction =
      language === 'hi'
        ? 'The user prefers Hindi. Please respond in Hindi.'
        : 'The user prefers English. Please respond in English.';

    const fullInstruction = `${SYSTEM_INSTRUCTION}\n\n${langInstruction}\nCRITICAL: You are having a voice conversation. Keep responses very brief, natural, and conversational. Do not use markdown formatting.`;

    // Connect to the Live API
    const session = await client.live.connect({
      model: LIVE_MODEL_ID,
      config: {
        systemInstruction: { parts: [{ text: fullInstruction }] },
        // We want the model to respond with AUDIO
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onmessage: (e: LiveServerMessage) => handleServerMessage(e, callbacks),
        onerror: (e: Event) => {
          console.error('[GeminiLive] WebSocket error:', e);
          callbacks.onError(new Error('WebSocket connection error'));
        },
        onclose: (e: CloseEvent) => {
          console.log('[GeminiLive] WebSocket closed:', e.code, e.reason);
        },
      },
    });

    console.log('[GeminiLive] Session connected');
    return session;
  } catch (error) {
    console.error('[GeminiLive] Connection failed:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError(err);
    throw err;
  }
}

/**
 * Handles incoming messages from the Live API server.
 * Extracts audio chunks and transcripts.
 */
function handleServerMessage(
  message: LiveServerMessage,
  callbacks: LiveSessionCallbacks
) {
  if (message.serverContent?.modelTurn?.parts) {
    for (const part of message.serverContent.modelTurn.parts) {
      // Handle text transcripts
      if (part.text) {
        callbacks.onTranscript(part.text, false);
      }

      // Handle audio response chunks
      if (
        part.inlineData &&
        part.inlineData.mimeType &&
        part.inlineData.mimeType.startsWith('audio/')
      ) {
        try {
          // Convert base64 audio data to ArrayBuffer
          if (part.inlineData.data) {
            const binaryString = atob(part.inlineData.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            callbacks.onAudioChunk(bytes.buffer);
          }
        } catch (err) {
          console.error('[GeminiLive] Failed to decode audio chunk:', err);
        }
      }
    }
  }

  // Handle turn completion
  if (message.serverContent?.turnComplete) {
    callbacks.onTranscript('', true); // Signal final chunk
  }
}

/**
 * Sends a chunk of microphone audio to the Live session.
 *
 * @param session - The active Live Session.
 * @param audioData - Audio chunk from the MediaRecorder (must be 16kHz PCM or base64 encoded).
 */
export function sendAudioChunk(session: Session, audioData: string): void {
  try {
    session.sendRealtimeInput({
      media: {
        mimeType: 'audio/pcm;rate=16000',
        data: audioData, // Base64 encoded PCM data
      },
    });
  } catch (err) {
    console.error('[GeminiLive] Failed to send audio chunk:', err);
  }
}

/**
 * Closes an active Live session.
 *
 * @param session - The session to close.
 */
export function closeLiveSession(session: Session): void {
  try {
    session.close();
    console.log('[GeminiLive] Session closed by client');
  } catch (err) {
    console.error('[GeminiLive] Error closing session:', err);
  }
}
