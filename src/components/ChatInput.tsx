/**
 * ChatInput - Text input form with voice button support.
 * @module components/ChatInput
 */

import { useRef, useState, type ChangeEvent, type KeyboardEvent, type FormEvent, type RefObject } from 'react';
import dynamic from 'next/dynamic';
import type { VoiceChatState } from '@/types';

const VoiceButton = dynamic(() => import('@/components/VoiceButton'), { ssr: false });

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  voiceState: VoiceChatState;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
  disabled?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  voiceError?: string | null;
}

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  voiceState,
  inputRef,
  placeholder,
  disabled = false,
  onVoiceStart,
  onVoiceStop,
  voiceError,
}: ChatInputProps) {
  const [localInput, setLocalInput] = useState(input);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setLocalInput(e.target.value);
    onInputChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    onSubmit(e);
  };

  return (
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
          value={localInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="
            flex-1 resize-none rounded-xl bg-white/10 border border-white/20
            px-4 py-3 text-sm md:text-base text-gray-100
            placeholder-gray-400 outline-none
            focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            min-h-[48px] max-h-[120px]
          "
          aria-describedby="input-hint"
        />
        <div id="input-hint" className="sr-only">
          Press Enter to send, Shift+Enter for new line
        </div>

        {onVoiceStart && onVoiceStop && (
          <VoiceButton
            state={voiceState}
            onStart={onVoiceStart}
            onStop={onVoiceStop}
            error={voiceError || null}
            disabled={disabled}
          />
        )}
      </form>
    </footer>
  );
}