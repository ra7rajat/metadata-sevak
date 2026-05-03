/**
 * Tests for Logger utility
 * @module tests/lib/logger
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('logger', () => {
  let logger: typeof import('@/lib/logger').logger;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    logger = require('@/lib/logger').logger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logger.info', () => {
    it('logs info message without metadata', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('Test message');
      await logger.flush();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] INFO: Test message'),
        ''
      );
      consoleSpy.mockRestore();
    });

    it('logs info message with metadata', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('Test message', { userId: '123' });
      await logger.flush();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] INFO: Test message'),
        { userId: '123' }
      );
      consoleSpy.mockRestore();
    });
  });

  describe('logger.warn', () => {
    it('logs warning message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.warn('Warning message');
      await logger.flush();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] WARNING: Warning message'),
        ''
      );
      consoleSpy.mockRestore();
    });
  });

  describe('logger.error', () => {
    it('logs error message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.error('Error message');
      await logger.flush();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] ERROR: Error message'),
        ''
      );
      consoleSpy.mockRestore();
    });
  });

  describe('logger.debug', () => {
    it('logs debug message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.debug('Debug message');
      await logger.flush();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] DEBUG: Debug message'),
        ''
      );
      consoleSpy.mockRestore();
    });
  });

  describe('logger.flush', () => {
    it('flushes queued logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('Message 1');
      logger.info('Message 2');
      await logger.flush();
      // Should have logged both messages
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});