/**
 * Additional validator tests for better coverage
 * @module tests/lib/validatorsExtra
 */

import { validateChatRequest, validateBoothRequest, validateVoterCheck, validateNewsQuery } from '@/lib/validators';

describe('Additional Validator Tests', () => {
  describe('validateChatRequest', () => {
    it('should accept valid message', () => {
      const result = validateChatRequest({ message: 'Hello world' });
      expect(result.message).toBe('Hello world');
    });

    it('should preserve message as is', () => {
      const result = validateChatRequest({ message: '  Hello  ' });
      expect(result.message).toBe('  Hello  ');
    });

    it('should reject non-string message', () => {
      expect(() => validateChatRequest({ message: 123 })).toThrow();
    });

    it('should reject array message', () => {
      expect(() => validateChatRequest({ message: [] })).toThrow();
    });

    it('should reject object message', () => {
      expect(() => validateChatRequest({ message: {} })).toThrow();
    });

    it('should accept valid history', () => {
      const result = validateChatRequest({
        message: 'Hello',
        history: [{ role: 'user', parts: [{ text: 'Hi' }] }]
      });
      expect(result.history).toHaveLength(1);
    });
  });

  describe('validateBoothRequest', () => {
    it('should accept EPIC with valid format', () => {
      const params = new URLSearchParams('epic=ABC1234567');
      const result = validateBoothRequest(params);
      expect(result.epic).toBe('ABC1234567');
    });

    it('should accept pincode with valid format', () => {
      const params = new URLSearchParams('pincode=560001');
      const result = validateBoothRequest(params);
      expect(result.pincode).toBe('560001');
    });

    it('should reject invalid pincode', () => {
      const params = new URLSearchParams('pincode=1234');
      expect(() => validateBoothRequest(params)).toThrow('Invalid pincode');
    });

    it('should reject pincode with letters', () => {
      const params = new URLSearchParams('pincode=abcde1');
      expect(() => validateBoothRequest(params)).toThrow('Invalid pincode');
    });
  });

  describe('validateVoterCheck', () => {
    it('should accept valid input', () => {
      const result = validateVoterCheck({
        name: 'John Doe',
        state: 'Karnataka',
        district: 'Bangalore',
      });
      expect(result.name).toBe('John Doe');
    });

    it('should reject short name', () => {
      expect(() => validateVoterCheck({
        name: 'J',
        state: 'Karnataka',
        district: 'Bangalore',
      })).toThrow();
    });

    it('should reject short state', () => {
      expect(() => validateVoterCheck({
        name: 'John',
        state: 'K',
        district: 'Bangalore',
      })).toThrow();
    });

    it('should reject short district', () => {
      expect(() => validateVoterCheck({
        name: 'John',
        state: 'Karnataka',
        district: 'B',
      })).toThrow();
    });
  });

  describe('validateNewsQuery', () => {
    it('should accept valid query', () => {
      const result = validateNewsQuery({ topic: 'election results' });
      expect(result.topic).toBe('election results');
    });

    it('should accept with language', () => {
      const result = validateNewsQuery({ topic: 'election', lang: 'hi' });
      expect(result.lang).toBe('hi');
    });

    it('should reject invalid language', () => {
      expect(() => validateNewsQuery({
        topic: 'election',
        lang: 'fr'
      })).toThrow();
    });

    it('should reject very long topic', () => {
      expect(() => validateNewsQuery({
        topic: 'a'.repeat(201)
      })).toThrow();
    });
  });
});