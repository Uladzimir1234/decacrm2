import axios from 'axios';
import { getStoredToken, clearAuth, refreshAccessToken } from '../services/auth';

const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_API_KEY;
const apiConfigured = Boolean(apiUrl);

const isMixedContent =
  apiConfigured &&
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  apiUrl.startsWith('http://');

if (isMixedContent) {
  console.warn(
    '[DECA API] Mixed content detected: page is HTTPS but API is HTTP. Browser may block requests.'
  );
}

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
  },
});

// --- Offline detection with consecutive failure threshold ---
let _isOffline = !apiConfigured;
let _consecutiveFailures = 0;
const OFFLINE_THRESHOLD = 3; // Need 3 consecutive failures to go offline
let _retryTimer: ReturnType<typeof setTimeout> | null = null;
const RETRY_INTERVAL = 5000; // Retry every 5s (was 30s)
const offlineListeners = new Set<(offline: boolean) => void>();

export function isApiOffline() {
  return _isOffline;
}

export function isApiConfigured() {
  return apiConfigured;
}

export function isMixedContentBlocked() {
  return isMixedContent;
}

export function onOfflineChange(listener: (offline: boolean) => void) {
  offlineListeners.add(listener);
  return () => offlineListeners.delete(listener);
}

function setOffline(value: boolean) {
  if (_isOffline !== value) {
    _isOffline = value;
    offlineListeners.forEach((fn) => fn(value));
  }
  if (value && !_retryTimer) {
    startRetryLoop();
  }
  if (!value && _retryTimer) {
    clearTimeout(_retryTimer);
    _retryTimer = null;
  }
}

function startRetryLoop() {
  if (!apiConfigured) return;
  _retryTimer = setTimeout(async () => {
    _retryTimer = null;
    const online = await checkHealth();
    if (online) {
      _consecutiveFailures = 0;
      setOffline(false);
    } else {
      startRetryLoop();
    }
  }, RETRY_INTERVAL);
}

export async function checkHealth(): Promise<boolean> {
  if (!apiConfigured) return false;
  try {
    await api.get('/health', { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

export async function retryConnection(): Promise<boolean> {
  if (!apiConfigured) return false;
  const online = await checkHealth();
  if (online) {
    _consecutiveFailures = 0;
    setOffline(false);
  }
  return online;
}

// --- Auto-retry wrapper for GET requests ---
async function retryRequest(config: any, maxRetries = 1): Promise<any> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await axios.request({ ...config, baseURL: apiUrl });
      return response;
    } catch (err: any) {
      if (i < maxRetries && (!err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK')) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Success — reset failure counter, mark online
    _consecutiveFailures = 0;
    setOffline(false);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh before logging out
      const config = error.config;
      if (config && !config._refreshed) {
        config._refreshed = true;
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          config.headers.Authorization = `Bearer ${getStoredToken()}`;
          return axios.request(config);
        }
      }
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';

    if (isNetworkError) {
      _consecutiveFailures++;

      // Auto-retry GET requests once before giving up
      const config = error.config;
      if (config && config.method === 'get' && !config._retried) {
        config._retried = true;
        try {
          await new Promise(r => setTimeout(r, 1500));
          const resp = await axios.request(config);
          // Retry succeeded
          _consecutiveFailures = 0;
          setOffline(false);
          return resp;
        } catch {
          // Retry also failed
          _consecutiveFailures++;
        }
      }

      // Only go offline after threshold consecutive failures
      if (_consecutiveFailures >= OFFLINE_THRESHOLD) {
        setOffline(true);
      }
    }

    return Promise.reject(error);
  }
);
