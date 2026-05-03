/**
 * Chat and conversation types.
 * @module types/chat
 */

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

export interface ChatQuickAction {
  label: string;
  href: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  quickAction?: ChatQuickAction;
}

export interface ChatRequest {
  message: string;
  history?: ConversationTurn[];
}

export interface ConversationTurn {
  role: 'user' | 'model';
  parts: ContentPart[];
}

export interface ContentPart {
  text: string;
}