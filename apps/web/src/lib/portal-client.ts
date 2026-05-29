import axios from "axios";
import { isClientLoggedIn, clearSession, getRefreshToken, setTokens } from "./auth-client";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const portalPublicClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

export const portalAuthClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Single in-flight refresh promise — prevents parallel refresh calls
let refreshPromise: Promise<string> | null = null;

async function tryRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const rt = getRefreshToken();
    if (!rt) throw new Error("no_refresh_token");
    const res = await axios.post<{ success: boolean; data: { accessToken: string } }>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken: rt }
    );
    const newToken = res.data.data.accessToken;
    setTokens(newToken);
    return newToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  clearSession();
  window.location.href = `/tienda/login?redirect=${encodeURIComponent(window.location.pathname)}`;
}

// Request: attach token, silently refresh if expired
portalAuthClient.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") return config;

  let token = localStorage.getItem("sarui_token");

  if (!isClientLoggedIn()) {
    try {
      token = await tryRefresh();
    } catch {
      redirectToLogin();
      throw new axios.Cancel("Sesión expirada");
    }
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: on 401 retry once with refreshed token, then redirect
portalAuthClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined" && !err.config._retry) {
      err.config._retry = true;
      try {
        const token = await tryRefresh();
        err.config.headers.Authorization = `Bearer ${token}`;
        return portalAuthClient(err.config);
      } catch {
        redirectToLogin();
      }
    }
    return Promise.reject(err);
  }
);
