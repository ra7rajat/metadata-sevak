/**
 * Google Cloud Logging utility
 * Sends errors and structured logs to GCP Cloud Logging
 * @module lib/logger
 */

interface LogEntry {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const LOG_QUEUE: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Send a log entry to Cloud Logging
 */
async function sendToCloudLogging(entry: LogEntry): Promise<void> {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    console.log(`[Logger] ${entry.severity}: ${entry.message}`, entry.metadata || '');
    return;
  }

  try {
    // Use logging.googleapis.com v2 API
    const url = `https://logging.googleapis.com/v2/projects/${projectId}/logs:write?logName=matadata-election-assistant`;
    
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In production, use OAuth2 or ADC with service account
      },
      body: JSON.stringify({
        entries: [{
          logName: `projects/${projectId}/logs/matadata-election-assistant`,
          resource: {
            type: 'global',
          },
          severity: entry.severity,
          timestamp: entry.timestamp,
          jsonPayload: {
            message: entry.message,
            ...entry.metadata,
          },
        }],
      }),
    });
  } catch {
    // Fallback to console
    console.log(`[Logger] ${entry.severity}: ${entry.message}`, entry.metadata || '');
  }
}

/**
 * Queue a log entry for batch sending
 */
function queueLog(severity: LogEntry['severity'], message: string, metadata?: Record<string, unknown>): void {
  const entry: LogEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  };

  LOG_QUEUE.push(entry);

  // Flush immediately for errors, debounce for others
  if (severity === 'ERROR') {
    flushLogs();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, 5000);
  }
}

/**
 * Flush all queued logs
 */
async function flushLogs(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (LOG_QUEUE.length === 0) return;

  const entries = LOG_QUEUE.splice(0);
  await Promise.all(entries.map(sendToCloudLogging));
}

// Public API
export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => queueLog('INFO', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => queueLog('WARNING', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => queueLog('ERROR', message, metadata),
  debug: (message: string, metadata?: Record<string, unknown>) => queueLog('DEBUG', message, metadata),
  flush: flushLogs,
};

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => flushLogs());
}