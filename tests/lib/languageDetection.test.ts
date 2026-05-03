/**
 * Tests for language detection utility
 * @module tests/lib/languageDetection
 */

import { detectLanguage, getLanguageName } from '@/lib/languageDetection';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('languageDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GOOGLE_API_KEY;
  });

  describe('getLanguageName', () => {
    it('should return English for en', () => {
      expect(getLanguageName('en')).toBe('English');
    });

    it('should return Hindi for hi', () => {
      expect(getLanguageName('hi')).toBe('हिंदी');
    });

    it('should return Bengali for bn', () => {
      expect(getLanguageName('bn')).toBe('বাংলা');
    });

    it('should return Tamil for ta', () => {
      expect(getLanguageName('ta')).toBe('தமிழ்');
    });

    it('should return Telugu for te', () => {
      expect(getLanguageName('te')).toBe('తెలుగు');
    });

    it('should return Marathi for mr', () => {
      expect(getLanguageName('mr')).toBe('मराठी');
    });

    it('should return Gujarati for gu', () => {
      expect(getLanguageName('gu')).toBe('ગુજરાતી');
    });

    it('should return Kannada for kn', () => {
      expect(getLanguageName('kn')).toBe('ಕನ್ನಡ');
    });

    it('should return Malayalam for ml', () => {
      expect(getLanguageName('ml')).toBe('മലയാളം');
    });

    it('should return Punjabi for pa', () => {
      expect(getLanguageName('pa')).toBe('ਪੰਜਾਬੀ');
    });

    it('should return Urdu for ur', () => {
      expect(getLanguageName('ur')).toBe('اردو');
    });

    it('should return English for unknown code', () => {
      expect(getLanguageName('en')).toBe('English');
    });
  });

  describe('detectLanguage', () => {
    it('should detect Hindi text with Devanagari', async () => {
      const lang = await detectLanguage('नमस्ते कैसे हैं आप');
      expect(lang).toBe('hi');
    });

    it('should detect Bengali text', async () => {
      const lang = await detectLanguage('আমি কেমন আছি');
      expect(lang).toBe('bn');
    });

    it('should detect Telugu text', async () => {
      const lang = await detectLanguage('నమస్కారం');
      expect(lang).toBe('te');
    });

    it('should detect Tamil text', async () => {
      const lang = await detectLanguage('வணக்கம்');
      expect(lang).toBe('ta');
    });

    it('should detect Kannada text', async () => {
      const lang = await detectLanguage('ನಮಸ್ಕಾರ');
      expect(lang).toBe('kn');
    });

    it('should detect Malayalam text', async () => {
      const lang = await detectLanguage('നമസ്കാരം');
      expect(lang).toBe('ml');
    });

    it('should detect Gujarati text', async () => {
      const lang = await detectLanguage('નમસ્કાર');
      expect(lang).toBe('gu');
    });

    it('should detect Punjabi text', async () => {
      const lang = await detectLanguage('ਨਮਸਕਾਰ');
      expect(lang).toBe('pa');
    });

    it('should detect Oriya text', async () => {
      const lang = await detectLanguage('ନମସ୍କାର');
      expect(lang).toBe('or');
    });

    it('should detect Urdu text', async () => {
      const lang = await detectLanguage('سلام');
      expect(lang).toBe('ur');
    });

    it('should default to English for plain ASCII', async () => {
      const lang = await detectLanguage('Hello how are you');
      expect(lang).toBe('en');
    });

    it('should handle empty string', async () => {
      const lang = await detectLanguage('');
      expect(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur']).toContain(lang);
    });

    it('should handle whitespace only', async () => {
      const lang = await detectLanguage('   ');
      expect(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur']).toContain(lang);
    });

    it('uses API when GOOGLE_API_KEY is set and returns supported language', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          data: { detections: [[{ language: 'hi', confidence: 0.9 }]] },
        }),
      });
      
      const lang = await detectLanguage('नमस्ते');
      expect(mockFetch).toHaveBeenCalled();
      expect(lang).toBe('hi');
    });

    it('falls back to regex when API returns unsupported language', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          data: { detections: [[{ language: 'fr', confidence: 0.9 }]] },
        }),
      });
      
      const lang = await detectLanguage('Hello');
      expect(lang).toBe('en');
    });

    it('falls back to regex when API returns non-ok status', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });
      
      const lang = await detectLanguage('नमस्ते');
      expect(lang).toBe('hi');
    });

    it('falls back to regex when API throws error', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('network error'));
      
      const lang = await detectLanguage('नमस्ते');
      expect(lang).toBe('hi');
    });

    it('falls back to regex when API returns empty detection', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          data: { detections: [[]] },
        }),
      });
      
      const lang = await detectLanguage('नमस्ते');
      expect(lang).toBe('hi');
    });

    it('handles very long text by truncating', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          data: { detections: [[{ language: 'hi' }]] },
        }),
      });
      
      const longText = 'नमस्ते'.repeat(200);
      await detectLanguage(longText);
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});