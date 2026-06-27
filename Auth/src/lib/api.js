const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ── CSRF Token Cache ──────────────────────────────────────────────────────────
let csrfToken = null;
let csrfPromise = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    } catch {
      csrfToken = null;
      return null;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}


// Invalidate cached CSRF token (e.g., after login/logout)
export function clearCsrfToken() {
  csrfToken = null;
}

const buildHeaders = async (extraHeaders = {}, method = 'GET') => {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  // Attach CSRF token for mutating requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) headers['X-CSRF-Token'] = token;
  }
  return headers;
};

// ── Retry Logic ───────────────────────────────────────────────────────────────
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

async function fetchWithRetry(url, opts, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, opts);
      // Only retry on transient server errors, not client errors
      if (!res.ok && RETRYABLE_STATUSES.has(res.status) && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); // exponential backoff
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') throw err; // never retry on abort
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

// ── Main API Request ──────────────────────────────────────────────────────────
export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isOtpEndpoint = path.includes('/send-otp');
  const timeoutMs = isOtpEndpoint ? 15000 : 8000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await buildHeaders(options.headers, method);
    const response = await fetchWithRetry(
      `${API_BASE_URL}${path}`,
      {
        method,
        credentials: 'include',
        ...options,
        headers,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok || payload.success === false) {
      // Invalidate CSRF token on 403 so it gets re-fetched next time
      if (response.status === 403) clearCsrfToken();

      const error = new Error(payload.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Server connection timed out. Please try again later.');
    }
    throw error;
  }
}
