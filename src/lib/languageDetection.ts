/**
 * Language detection utility using Google Cloud Translation API
 * Falls back to regex-based detection if API unavailable
 * @module lib/languageDetection
 */

const TRANSLATION_API_URL = 'https://translation.googleapis.com/language/translate/v2/detect';

const INDIAN_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'as', 'or', 'ur'] as const;
export type DetectedLanguage = typeof INDIAN_LANGUAGES[number];

/**
 * Detect language using Google Cloud Translation API
 * Falls back to regex-based detection on API failure
 */
export async function detectLanguage(text: string): Promise<DetectedLanguage> {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey || !text.trim()) {
    return detectLanguageRegex(text);
  }

  try {
    const url = `${TRANSLATION_API_URL}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text.slice(0, 500) }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn('[LanguageDetection] API failed, using regex fallback');
      return detectLanguageRegex(text);
    }

    const data = await response.json();
    const detectedLang = data.data?.detections?.[0]?.[0]?.language;
    
    if (detectedLang && INDIAN_LANGUAGES.includes(detectedLang as DetectedLanguage)) {
      console.log(`[LanguageDetection] API detected: ${detectedLang}`);
      return detectedLang as DetectedLanguage;
    }
    
    return detectLanguageRegex(text);
  } catch (error) {
    console.warn('[LanguageDetection] Error, using regex fallback:', error instanceof Error ? error.message : 'unknown');
    return detectLanguageRegex(text);
  }
}

/**
 * Regex-based fallback language detection
 */
function detectLanguageRegex(text: string): DetectedLanguage {
  // Devanagari (Hindi, Marathi, etc.) range: 0900–097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // Bengali range: 0980–097F
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  // Telugu range: 0C00–0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  // Tamil range: 0B80–0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  // Kannada range: 0C80–0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Malayalam range: 0D00–0D7F
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  // Gujarati range: 0A80–0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  // Punjabi range: 0A00–0A7F
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  // Oriya range: 0B00–0B7F
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
  // Urdu range: 0600–06FF
  if (/[\u0600-\u06FF]/.test(text)) return 'ur';
  // Assamese range: 0980–09FF (shares with Bengali)
  
  return 'en';
}

/**
 * Get language display name
 */
export function getLanguageName(code: DetectedLanguage): string {
  const names: Record<DetectedLanguage, string> = {
    en: 'English',
    hi: 'हिंदी',
    bn: 'বাংলা',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    pa: 'ਪੰਜਾਬੀ',
    as: 'অসমীয়া',
    or: 'ଓଡିଆ',
    ur: 'اردو',
  };
  return names[code] || 'English';
}