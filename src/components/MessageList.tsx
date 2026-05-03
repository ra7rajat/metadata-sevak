/**
 * MessageList - Renders chat messages in a scrollable container.
 * @module components/MessageList
 */

import { useRef, useEffect } from 'react';
import MessageBubble from '@/components/MessageBubble';
import type { ChatMessage } from '@/types';

interface MessageListProps {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages.length > 0;

  if (!hasMessages) {
    return null;
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
    >
      <div role="list" aria-label="Conversation">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
}