const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://anarva-clinic.onrender.com').replace(/\/$/, '');
const TOKEN_KEY = 'anarva_doctor_token';
let inMemoryAuthToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryAuthToken = token;
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Keep the token in memory if browser storage is unavailable.
  }
}

export function getAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || inMemoryAuthToken;
  } catch {
    return inMemoryAuthToken;
  }
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const isLoginRequest = path.split('?')[0] === '/api/doctor/login';
  const token = isLoginRequest ? null : getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });
}
