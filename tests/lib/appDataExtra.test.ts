/**
 * Tests for app data constants
 * @module tests/lib/appDataExtra
 */

import { INDIA_STATES, GUIDE_CANDIDATES, ACCEPTED_IDS } from '@/lib/appData';

describe('appData', () => {
  describe('INDIA_STATES', () => {
    it('has at least one state', () => {
      expect(INDIA_STATES.length).toBeGreaterThan(0);
    });

    it('each state has required fields', () => {
      INDIA_STATES.forEach(state => {
        expect(state).toHaveProperty('value');
        expect(state).toHaveProperty('label');
        expect(state).toHaveProperty('districts');
        expect(Array.isArray(state.districts)).toBe(true);
        expect(state.districts.length).toBeGreaterThan(0);
      });
    });

    it('contains expected major states', () => {
      const stateValues = INDIA_STATES.map(s => s.value);
      expect(stateValues).toContain('Uttar Pradesh');
      expect(stateValues).toContain('Delhi');
      expect(stateValues).toContain('Maharashtra');
    });

    it('has correct state count', () => {
      expect(INDIA_STATES).toHaveLength(6);
    });
  });

  describe('GUIDE_CANDIDATES', () => {
    it('has candidate profiles', () => {
      expect(GUIDE_CANDIDATES.length).toBeGreaterThan(0);
    });

    it('each candidate has required fields', () => {
      GUIDE_CANDIDATES.forEach(candidate => {
        expect(candidate).toHaveProperty('name');
        expect(candidate).toHaveProperty('party');
        expect(candidate).toHaveProperty('education');
        expect(candidate).toHaveProperty('assets');
        expect(candidate).toHaveProperty('criminalCases');
        expect(candidate).toHaveProperty('source');
      });
    });

    it('has correct number of candidates', () => {
      expect(GUIDE_CANDIDATES).toHaveLength(3);
    });

    it('sources reference ECI', () => {
      GUIDE_CANDIDATES.forEach(candidate => {
        expect(candidate.source).toContain('ECI');
      });
    });
  });

  describe('ACCEPTED_IDS', () => {
    it('has accepted ID types', () => {
      expect(ACCEPTED_IDS.length).toBeGreaterThan(0);
    });

    it('contains common ID types', () => {
      expect(ACCEPTED_IDS).toContain('EPIC / Voter ID');
      expect(ACCEPTED_IDS).toContain('Aadhaar');
      expect(ACCEPTED_IDS).toContain('Passport');
    });

    it('has correct count', () => {
      expect(ACCEPTED_IDS).toHaveLength(6);
    });
  });
});