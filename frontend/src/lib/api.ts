const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://anarva-clinic.onrender.com').replace(/\/$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
  });
}
