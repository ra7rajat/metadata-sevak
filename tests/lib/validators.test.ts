/**
 * Tests for input validators
 * @module tests/lib/validators
 */

import { validateChatRequest, validateBoothRequest, validateVoterCheck, validateNewsQuery } from '@/lib/validators';

describe('lib/validators', () => {
  describe('validateChatRequest', () => {
    it('should throw for invalid data', () => {
      expect(() => validateChatRequest({})).toThrow('message is required');
    });

    it('should return valid data', () => {
      const result = validateChatRequest({ message: 'Hello' });
      expect(result.message).toBe('Hello');
    });

    it('should reject empty message', () => {
      expect(() => validateChatRequest({ message: '' })).toThrow('non-empty string');
    });

    it('should reject message over 2000 chars', () => {
      expect(() => validateChatRequest({ message: 'a'.repeat(2001) })).toThrow('2000 characters');
    });

    it('should accept valid history', () => {
      const result = validateChatRequest({
        message: 'Test',
        history: [{ role: 'user', parts: [{ text: 'Hi' }] }]
      });
      expect(result.message).toBe('Test');
      expect(result.history).toHaveLength(1);
    });
  });

  describe('validateBoothRequest', () => {
    it('should validate EPIC format', () => {
      const params = new URLSearchParams('epic=ABC1234567');
      const result = validateBoothRequest(params);
      expect(result.epic).toBe('ABC1234567');
    });

    it('should validate pincode format', () => {
      const params = new URLSearchParams('pincode=560001');
      const result = validateBoothRequest(params);
      expect(result.pincode).toBe('560001');
    });

    it('should reject invalid EPIC', () => {
      const params = new URLSearchParams('epic=INVALID');
      expect(() => validateBoothRequest(params)).toThrow('Invalid EPIC format');
    });

    it('should require either EPIC or pincode', () => {
      const params = new URLSearchParams('');
      expect(() => validateBoothRequest(params)).toThrow('Either EPIC or pincode is required');
    });
  });

  describe('validateVoterCheck', () => {
    it('should validate valid voter check request', () => {
      const result = validateVoterCheck({ name: 'John', state: 'Karnataka', district: 'Bangalore' });
      expect(result.name).toBe('John');
    });

    it('should reject short name', () => {
      expect(() => validateVoterCheck({ name: 'A', state: 'Karnataka', district: 'Bangalore' })).toThrow();
    });
  });

  describe('validateNewsQuery', () => {
    it('should validate valid news query', () => {
      const result = validateNewsQuery({ topic: 'election results' });
      expect(result.topic).toBe('election results');
    });

    it('should accept language parameter', () => {
      const result = validateNewsQuery({ topic: 'election', lang: 'hi' });
      expect(result.lang).toBe('hi');
    });

    it('should reject short topic', () => {
      expect(() => validateNewsQuery({ topic: 'ab' })).toThrow('at least 3 characters');
    });
  });
});