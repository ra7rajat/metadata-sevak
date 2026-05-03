/**
 * Home page for MataData — renders the chat interface.
 * @module app/page
 */

import ClientLayout from '@/components/ClientLayout';
import ChatInterface from '@/components/ChatInterface';

/**
 * The main page component that renders the MataData chat interface.
 * This is the sole entry point for the application's user-facing UI.
 *
 * @returns The rendered home page with the chat interface.
 */
export default function HomePage() {
  return (
    <ClientLayout>
      <ChatInterface />
    </ClientLayout>
  );
}
