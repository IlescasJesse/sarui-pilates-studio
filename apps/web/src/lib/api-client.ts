import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15_000,
  });

  // ── Request interceptor: attach Bearer token ──────────────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("sarui_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // ── Response interceptor: handle 401 globally ─────────────────────────────
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("sarui_token");
        localStorage.removeItem("sarui_user");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const apiClient = createApiClient();

// ── Typed helper wrappers ────────────────────────────────────────────────────
export async function get<T>(url: string, params?: Record<string, unknown>) {
  const res = await apiClient.get<T>(url, { params });
  return res.data;
}

export async function post<T>(url: string, body?: unknown) {
  const res = await apiClient.post<T>(url, body);
  return res.data;
}

export async function put<T>(url: string, body?: unknown) {
  const res = await apiClient.put<T>(url, body);
  return res.data;
}

export async function patch<T>(url: string, body?: unknown) {
  const res = await apiClient.patch<T>(url, body);
  return res.data;
}

export async function del<T>(url: string) {
  const res = await apiClient.delete<T>(url);
  return res.data;
}
