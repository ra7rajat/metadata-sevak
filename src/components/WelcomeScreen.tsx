/**
 * WelcomeScreen - Initial welcome UI with quick suggestions.
 * Displayed when user has no messages.
 * @module components/WelcomeScreen
 */

interface WelcomeScreenProps {
  onSelectSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  { emoji: '🗳️', text: 'How do I register to vote?' },
  { emoji: '📍', text: 'Find my polling booth' },
  { emoji: '📋', text: 'मतदाता पहचान पत्र कैसे बनवाएं?' },
  { emoji: '📰', text: 'Latest election schedule' },
] as const;

export default function WelcomeScreen({ onSelectSuggestion }: WelcomeScreenProps) {
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
        {SUGGESTIONS.map((suggestion) => (
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