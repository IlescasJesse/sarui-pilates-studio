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

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function dispatchAuthChange(): void {
  window.dispatchEvent(new Event("auth-change"));
}
