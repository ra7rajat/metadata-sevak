/**
 * Tests for appData module
 * @module tests/lib/appDataTests
 */

import { INDIA_STATES, GUIDE_CANDIDATES } from '@/lib/appData';

describe('appData', () => {
  describe('INDIA_STATES', () => {
    it('should have state data', () => {
      expect(INDIA_STATES.length).toBeGreaterThan(0);
    });

    it('should have valid state objects with value and districts', () => {
      INDIA_STATES.forEach(state => {
        expect(state.value).toBeDefined();
        expect(state.districts).toBeDefined();
        expect(Array.isArray(state.districts)).toBe(true);
      });
    });

    it('should have multiple states', () => {
      expect(INDIA_STATES.length).toBeGreaterThan(5);
    });
  });

  describe('GUIDE_CANDIDATES', () => {
    it('should have candidate data', () => {
      expect(GUIDE_CANDIDATES.length).toBeGreaterThan(0);
    });

    it('should have valid candidate objects', () => {
      GUIDE_CANDIDATES.forEach(candidate => {
        expect(candidate.name).toBeDefined();
        expect(candidate.party).toBeDefined();
        expect(candidate.education).toBeDefined();
        expect(candidate.assets).toBeDefined();
        expect(candidate.criminalCases).toBeDefined();
      });
    });
  });
});