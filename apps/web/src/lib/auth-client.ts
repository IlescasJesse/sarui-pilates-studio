const TOKEN_KEY = "sarui_token";
const USER_KEY = "sarui_user";

function parseToken(token: string): { id: string; role: string; email: string; exp: number } | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function isClientLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  const payload = parseToken(token);
  if (!payload) return false;
  if (payload.exp * 1000 < Date.now()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
  if (payload.role !== "CLIENT") return false;
  return true;
}

export function hasValidToken(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  const payload = parseToken(token);
  if (!payload) return false;
  if (payload.exp * 1000 < Date.now()) {
    clearSession();
    return false;
  }
  return true;
}

const REFRESH_KEY = "sarui_refresh_token";

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function dispatchAuthChange(): void {
  window.dispatchEvent(new Event("auth-change"));
}
