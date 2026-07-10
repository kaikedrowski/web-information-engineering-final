const DEFAULT_API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:3000";

export function buildApiUrl(path = "") {
  if (!path) {
    return DEFAULT_API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${DEFAULT_API_BASE_URL}${normalizedPath}`;
}

export function resolveAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return buildApiUrl(path);
}

export async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiClient(url, options = {}) {
  const token = window.sessionStorage.getItem("apple_tree_token");

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(url), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.sessionStorage.removeItem("apple_tree_token");
    window.sessionStorage.removeItem("apple_tree_user");
    window.dispatchEvent(new Event("unauthorized"));
  }

  return response;
}
