/**
 * Core type definitions for the MataData election assistant.
 * @module types
 */

/** Supported roles in the chat conversation */
export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

/** Quick navigation action attached to a chat response */
export interface ChatQuickAction {
  label: string;
  href: string;
}

/** A single chat message exchanged between user and assistant */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message sender */
  role: MessageRole;
  /** Text content of the message (may contain Hindi/English) */
  content: string;
  /** ISO 8601 timestamp of message creation */
  timestamp: string;
  /** Whether the assistant is still streaming this message */
  isStreaming?: boolean;
  /** Optional contextual navigation shortcut */
  quickAction?: ChatQuickAction;
}

/** Request body for the /api/chat endpoint */
export interface ChatRequest {
  /** The user's message text */
  message: string;
  /** Previous conversation history for context */
  history?: ConversationTurn[];
}

/** A single turn in the conversation history sent to Gemini */
export interface ConversationTurn {
  /** Role: 'user' or 'model' (Gemini's terminology) */
  role: 'user' | 'model';
  /** Array of content parts */
  parts: ContentPart[];
}

/** A content part within a conversation turn */
export interface ContentPart {
  /** Text content */
  text: string;
}

/** Response from the /api/health endpoint */
export interface HealthResponse {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** ISO 8601 timestamp of the health check */
  timestamp: string;
  /** Individual service statuses */
  services: {
    gemini: ServiceStatus;
    customSearch: ServiceStatus;
    maps: ServiceStatus;
  };
}

/** Status of an individual Google service */
export interface ServiceStatus {
  /** Whether the service is reachable and configured */
  available: boolean;
  /** Human-readable status message */
  message: string;
  /** Response time in milliseconds, if checked */
  latencyMs?: number;
}

/** Environment variable keys required by the application */
export type RequiredEnvKey =
  | 'GEMINI_API_KEY'
  | 'GOOGLE_API_KEY'
  | 'GOOGLE_CSE_ID'
  | 'MAPS_API_KEY';

/** Rate limiter entry for tracking request counts per IP */
export interface RateLimitEntry {
  /** Number of requests made in the current window */
  count: number;
  /** Timestamp (ms) when the current window started */
  windowStart: number;
}

/** Gemini model identifiers in priority order for auto-fallback */
export const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemma-4-26b',
  'gemma-4-31b',
] as const;

/** Type for a valid Gemini model identifier */
export type GeminiModelId = (typeof GEMINI_MODELS)[number];

// ─── Tool Types ─────────────────────────────────────────────────────────────

/** Standard error shape returned by all tools when something goes wrong */
export interface ToolError {
  /** Whether the operation succeeded */
  success: false;
  /** Human-readable error message */
  error: string;
  /** Error category for programmatic handling */
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'INVALID_INPUT' | 'RATE_LIMITED' | 'UNAVAILABLE';
}

// ── ECI Scraper Types ──

/** A single voter record from the electoral roll */
export interface VoterRecord {
  /** Voter's full name */
  name: string;
  /** Father's/Husband's name */
  relativeName: string;
  /** Voter's age */
  age: number;
  /** Gender */
  gender: 'Male' | 'Female' | 'Other';
  /** EPIC (voter ID) number */
  epicNumber: string;
  /** Polling station name and number */
  pollingStation: string;
  /** Assembly constituency */
  constituency: string;
}

/** Successful voter roll search result */
export interface VoterRollSuccess {
  success: true;
  /** Total matching records found */
  totalResults: number;
  /** Array of voter records (max 10) */
  records: VoterRecord[];
  /** Data source attribution */
  source: string;
  /** ISO 8601 timestamp of when data was fetched */
  fetchedAt: string;
}

/** Union type for voter roll search results */
export type VoterRollResult = VoterRollSuccess | ToolError;

/** A single election event in the schedule */
export interface ElectionEvent {
  /** Type of election (General, State Assembly, By-election, etc.) */
  electionType: string;
  /** Phase number, if applicable */
  phase?: number;
  /** Date of polling */
  pollingDate: string;
  /** Constituencies covered */
  constituencies: string[];
  /** Date results are expected */
  resultDate?: string;
  /** Current status (Scheduled, Ongoing, Completed) */
  status: 'Scheduled' | 'Ongoing' | 'Completed';
}

/** Successful election schedule result */
export interface ElectionScheduleSuccess {
  success: true;
  /** State name */
  state: string;
  /** Array of election events */
  events: ElectionEvent[];
  /** Data source attribution */
  source: string;
  /** ISO 8601 timestamp of when data was fetched */
  fetchedAt: string;
}

/** Union type for election schedule results */
export type ElectionScheduleResult = ElectionScheduleSuccess | ToolError;

// ── Constituency Lookup Types ──

/** Constituency information mapped from a pincode */
export interface ConstituencyInfo {
  /** Parliamentary constituency name */
  constituency: string;
  /** State name */
  state: string;
  /** District name */
  district: string;
  /** Name of the current Member of Parliament */
  mpName: string;
  /** Name of the current Member of Legislative Assembly */
  mlaName: string;
}

/** Successful constituency lookup result */
export interface ConstituencySuccess {
  success: true;
  /** The pincode that was looked up */
  pincode: string;
  /** Constituency information */
  data: ConstituencyInfo;
  /** Data source attribution */
  source: string;
  /** ISO 8601 timestamp of when data was fetched */
  fetchedAt: string;
}

/** Union type for constituency lookup results */
export type ConstituencyResult = ConstituencySuccess | ToolError;

// ── Polling Booth Types ──

/** Polling booth information */
export interface PollingBoothInfo {
  /** Booth number */
  boothNumber: string;
  /** Booth name / building name */
  boothName: string;
  /** Full address of the booth */
  address: string;
  /** Assembly constituency */
  constituency: string;
  /** District */
  district: string;
  /** State */
  state: string;
  /** Google Maps static image URL for the booth */
  mapImageUrl?: string;
  /** Google Maps directions URL */
  directionsUrl?: string;
}

/** Successful polling booth search result */
export interface PollingBoothSuccess {
  success: true;
  /** EPIC number used for the search */
  epicNumber: string;
  /** Booth information */
  booth: PollingBoothInfo;
  /** Data source attribution */
  source: string;
  /** ISO 8601 timestamp of when data was fetched */
  fetchedAt: string;
}

/** Union type for polling booth results */
export type PollingBoothResult = PollingBoothSuccess | ToolError;

// ── Agent Types ──

/** Result of an agent tool execution */
export interface ToolExecutionResult {
  /** Name of the tool that was called */
  toolName: string;
  /** Result data returned by the tool */
  result:
    | VoterRollResult
    | ElectionScheduleResult
    | ConstituencyResult
    | PollingBoothResult
    | MultiSourceNewsResult
    | ClaimCheckResult;
}

// ─── News & Fact-Check Types ────────────────────────────────────────────────

/** Supported languages for news fetching */
export type NewsLanguage = 'en' | 'hi';

/** A single news article parsed from RSS */
export interface NewsArticle {
  /** Headline / title of the article */
  title: string;
  /** Source publication name (e.g., "NDTV", "The Hindu") */
  sourceName: string;
  /** Source domain (e.g., "ndtv.com") */
  sourceDomain: string;
  /** Full URL to the article */
  url: string;
  /** ISO 8601 publication timestamp */
  publishedAt: string;
  /** Short snippet / description (max ~200 chars) */
  snippet: string;
  /** Language of the article */
  language: NewsLanguage;
  /** Favicon URL for the source, derived from domain */
  faviconUrl: string;
  /** Fact-check verdicts attached to this article, if any */
  factCheckVerdicts?: FactCheckVerdict[];
}

/** Articles grouped by their source domain */
export interface NewsSource {
  /** The domain name of the source (e.g., "thehindu.com") */
  domain: string;
  /** Human-readable source name */
  name: string;
  /** Articles from this source */
  articles: NewsArticle[];
}

/** Successful multi-source news result */
export interface MultiSourceNewsSuccess {
  success: true;
  /** The topic that was searched */
  topic: string;
  /** Articles grouped by source domain (min 3 sources) */
  sources: NewsSource[];
  /** Total article count across all sources */
  totalArticles: number;
  /** ISO 8601 timestamp of when data was fetched */
  fetchedAt: string;
}

/** Union type for multi-source news results */
export type MultiSourceNewsResult = MultiSourceNewsSuccess | ToolError;

// ── Fact-Check Types ──

/** A single fact-check verdict from a publisher */
export interface FactCheckVerdict {
  /** Name of the fact-checking organization */
  publisher: string;
  /** The claim's rating (e.g., "True", "False", "Mostly True") */
  rating: string;
  /** Normalized rating for badge display */
  normalizedRating: 'TRUE' | 'FALSE' | 'MISSING_CONTEXT' | 'UNVERIFIED';
  /** URL to the full fact-check article */
  url: string;
}

/** Successful fact-check result for a single claim */
export interface ClaimCheckSuccess {
  success: true;
  /** The original claim text that was checked */
  claim: string;
  /** Array of verdicts from different fact-checkers */
  verdicts: FactCheckVerdict[];
  /** ISO 8601 timestamp of when the check was performed */
  checkedAt: string;
}

/** Union type for claim check results */
export type ClaimCheckResult = ClaimCheckSuccess | ToolError;

/** A news article annotated with fact-check information */
export interface AnnotatedArticle extends NewsArticle {
  /** Claims extracted from the article snippet */
  extractedClaims: string[];
  /** Fact-check results for each extracted claim */
  claimResults: ClaimCheckResult[];
}

/** Result of scanning multiple articles for claims */
export interface ScanResult {
  /** Total articles scanned */
  totalScanned: number;
  /** Articles with at least one fact-check verdict */
  articlesWithVerdicts: number;
  /** All annotated articles */
  annotatedArticles: AnnotatedArticle[];
  /** ISO 8601 timestamp */
  scannedAt: string;
}

// ─── Voice / Gemini Live API Types ──────────────────────────────────────────

/** Possible states of the voice chat session */
export type VoiceChatState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

/** Callbacks provided to the Gemini Live session */
export interface LiveSessionCallbacks {
  /** Called when a transcript chunk arrives (partial or final) */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Called when an audio response chunk is ready for playback */
  onAudioChunk: (audioData: ArrayBuffer) => void;
  /** Called when an error occurs in the session */
  onError: (error: Error) => void;
  /** Called when the session state changes */
  onStateChange?: (state: VoiceChatState) => void;
}

/** Return type of the useVoiceChat hook */
export interface VoiceChatReturn {
  /** Current state of the voice session */
  state: VoiceChatState;
  /** Start recording and streaming audio to Gemini */
  startListening: () => Promise<void>;
  /** Stop recording and end the current input turn */
  stopListening: () => void;
  /** Current transcript text (accumulated) */
  transcript: string;
  /** Error message if state is 'error' */
  error: string | null;
  /** Whether the browser supports the required APIs */
  isSupported: boolean;
}

/** Detected language preference based on user input */
export type DetectedLanguage = 'en' | 'hi';

/** Supported app UI languages */
export type AppLanguage = 'en' | 'hi';

/** Candidate card shown in the guide section */
export interface CandidateProfile {
  name: string;
  party: string;
  education: string;
  assets: string;
  criminalCases: string;
  source: string;
}
