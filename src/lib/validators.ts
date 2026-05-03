/**
 * Simple validators for API request validation
 * Uses basic JavaScript checks instead of Zod for compatibility
 */

/**
 * Chat request validation
 */
export function validateChatRequest(body: unknown): { message: string; history?: unknown[] } {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }
  
  const obj = body as Record<string, unknown>;
  
  if (typeof obj.message !== 'string' || obj.message.trim().length === 0) {
    throw new Error('message is required and must be a non-empty string');
  }
  
  if (obj.message.length > 2000) {
    throw new Error('message must be at most 2000 characters');
  }
  
  return {
    message: obj.message,
    history: Array.isArray(obj.history) ? obj.history : undefined,
  };
}

/**
 * Booth lookup validation
 */
export function validateBoothRequest(params: URLSearchParams): { epic?: string; pincode?: string } {
  const epic = params.get('epic');
  const pincode = params.get('pincode');
  
  if (epic && !/^[A-Z]{3}\d{7}$/.test(epic)) {
    throw new Error('Invalid EPIC format');
  }
  
  if (pincode && !/^\d{6}$/.test(pincode)) {
    throw new Error('Invalid pincode format');
  }
  
  if (!epic && !pincode) {
    throw new Error('Either EPIC or pincode is required');
  }
  
  return { epic: epic || undefined, pincode: pincode || undefined };
}

/**
 * Voter check validation
 */
export function validateVoterCheck(body: unknown): { name: string; state: string; district: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }
  
  const obj = body as Record<string, unknown>;
  const name = String(obj.name || '');
  const state = String(obj.state || '');
  const district = String(obj.district || '');
  
  if (name.length < 2) throw new Error('name must be at least 2 characters');
  if (state.length < 2) throw new Error('state must be at least 2 characters');
  if (district.length < 2) throw new Error('district must be at least 2 characters');
  
  return { name, state, district };
}

/**
 * News query validation
 */
export function validateNewsQuery(body: unknown): { topic: string; lang?: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }
  
  const obj = body as Record<string, unknown>;
  const topic = String(obj.topic || '');
  
  if (topic.length < 3) {
    throw new Error('topic must be at least 3 characters');
  }
  
  if (topic.length > 200) {
    throw new Error('topic must be at most 200 characters');
  }
  
  const lang = obj.lang;
  if (lang && lang !== 'en' && lang !== 'hi') {
    throw new Error('lang must be either en or hi');
  }
  
  return { topic, lang: lang as 'en' | 'hi' | undefined };
}