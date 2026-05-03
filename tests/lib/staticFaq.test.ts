/**
 * Tests for static FAQ fallback
 * @module tests/lib/staticFaq
 */

import { STATIC_FAQ, getStaticFaq } from '@/lib/staticFaq';

describe('staticFaq', () => {
  describe('STATIC_FAQ', () => {
    it('has English FAQs', () => {
      expect(STATIC_FAQ.en).toBeDefined();
      expect(STATIC_FAQ.en.faqs).toHaveLength(4);
    });

    it('has Hindi FAQs', () => {
      expect(STATIC_FAQ.hi).toBeDefined();
      expect(STATIC_FAQ.hi.faqs).toHaveLength(4);
    });

    it('English FAQ has required fields', () => {
      const faq = STATIC_FAQ.en.faqs[0];
      expect(faq).toHaveProperty('q');
      expect(faq).toHaveProperty('a');
      expect(typeof faq.q).toBe('string');
      expect(typeof faq.a).toBe('string');
    });

    it('Hindi FAQ has required fields', () => {
      const faq = STATIC_FAQ.hi.faqs[0];
      expect(faq).toHaveProperty('q');
      expect(faq).toHaveProperty('a');
      expect(typeof faq.q).toBe('string');
      expect(typeof faq.a).toBe('string');
    });

    it('has greeting for both languages', () => {
      expect(STATIC_FAQ.en.greeting).toBeTruthy();
      expect(STATIC_FAQ.hi.greeting).toBeTruthy();
    });

    it('has fallback message for both languages', () => {
      expect(STATIC_FAQ.en.fallback).toBeTruthy();
      expect(STATIC_FAQ.hi.fallback).toBeTruthy();
    });
  });

  describe('getStaticFaq', () => {
    it('returns English FAQ by default', () => {
      const result = getStaticFaq('en');
      expect(result).toContain('Hello!');
      expect(result).toContain('Q:');
      expect(result).toContain('A:');
    });

    it('returns Hindi FAQ when specified', () => {
      const result = getStaticFaq('hi');
      expect(result).toContain('नमस्ते!');
      expect(result).toContain('Q:');
      expect(result).toContain('A:');
    });

    it('includes all FAQ items', () => {
      const result = getStaticFaq('en');
      expect(result).toContain('How do I register to vote?');
      expect(result).toContain('How do I find my polling booth?');
      expect(result).toContain('What is ECI?');
      expect(result).toContain('What is NVSP?');
    });

    it('includes fallback message', () => {
      const result = getStaticFaq('en');
      expect(result).toContain('For more help');
    });

    it('handles default parameter', () => {
      const result = getStaticFaq();
      expect(result).toContain('Hello!');
    });
  });
});