/**
 * Tests for eciScraper tool.
 * Covers happy path, error handling, edge cases, and Hindi text.
 * @module tests/tools/eciScraper
 */

import { searchVoterRoll, getElectionSchedule } from '@/tools/eciScraper';

// Mock node-fetch global
global.fetch = jest.fn();

describe('eciScraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('searchVoterRoll', () => {
    it('returns voter roll results on happy path', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 1,
          data: [
            {
              name: 'Rahul Kumar',
              age: 35,
              gender: 'M',
              epic_no: 'ABC1234567',
              ps_name: 'PS 12',
              ac_name: 'Bangalore South',
            },
          ],
        }),
      });

      const result = await searchVoterRoll('Rahul', 'Karnataka', 'Bangalore Urban');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalResults).toBe(1);
        expect(result.records[0].epicNumber).toBe('ABC1234567');
      }
    });

    it('returns network error on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('timeout'));

      const resultPromise = searchVoterRoll('Anjali', 'Karnataka', 'Bangalore Urban');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NETWORK_ERROR');
      }
    });

    it('sanitizes input and rejects invalid names', async () => {
      const result = await searchVoterRoll('<script>a</script>', 'State', 'District');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_INPUT');
      }
    });

    it('handles Hindi text correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 1,
          data: [{ name: 'राहुल' }],
        }),
      });

      const resultPromise = searchVoterRoll('राहुल', 'Maharashtra', 'Pune');
      jest.runAllTimers();
      const result = await resultPromise;
      expect(result.success).toBe(true);
    });
  });

  describe('getElectionSchedule', () => {
    it('returns schedule results on happy path', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          elections: [
            { state: 'Bihar', polling_date: '2024-05-01', status: 'Scheduled' },
          ],
        }),
      });

      const resultPromise = getElectionSchedule('Bihar');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.events.length).toBe(1);
        expect(result.events[0].pollingDate).toBe('2024-05-01');
      }
    });

    it('handles missing state input', async () => {
      const result = await getElectionSchedule('');
      expect(result.success).toBe(false);
    });

    it('handles state only (no district) validation in searchVoterRoll', async () => {
      const result = await searchVoterRoll('Rahul', '', 'District');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_INPUT');
      }
    });

    it('handles district only (no state) validation in searchVoterRoll', async () => {
      const result = await searchVoterRoll('Rahul', 'Karnataka', '');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_INPUT');
      }
    });

    it('handles 429 rate limit response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });
      
      const resultPromise = searchVoterRoll('Rahul', 'Karnataka', 'Bangalore');
      jest.runAllTimers();
      const result = await resultPromise;
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('RATE_LIMITED');
      }
    });

    it('handles non-ok API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      const resultPromise = searchVoterRoll('Anjali', 'Karnataka', 'Bangalore');
      jest.runAllTimers();
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
    });

    it('handles empty response array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      
      const resultPromise = searchVoterRoll('NonExistentName', 'Karnataka', 'Bangalore');
      jest.runAllTimers();
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalResults).toBe(0);
      }
    });

    it('handles response with missing optional fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 1,
          data: [{ name: 'Test' }],
        }),
      });
      
      const resultPromise = searchVoterRoll('Test', 'Karnataka', 'Bangalore');
      jest.runAllTimers();
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
    });

    it('handles gender field variations', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 3,
          data: [
            { name: 'Male', gender: 'M' },
            { name: 'Female', gender: 'F' },
            { name: 'Other', gender: 'O' },
          ],
        }),
      });
      
      const resultPromise = searchVoterRoll('Test', 'Karnataka', 'Bangalore');
      jest.runAllTimers();
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
    });

    it('handles missing response fields gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      
      const resultPromise = searchVoterRoll('Test', 'Karnataka', 'Bangalore');
      jest.runAllTimers();
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
    });
  });
});
