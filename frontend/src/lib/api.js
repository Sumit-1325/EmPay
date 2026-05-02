const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken  = () => localStorage.getItem("accessToken");
const getRefresh = () => localStorage.getItem("refreshToken");

let isRefreshing = false;
let pendingQueue = []; // [{ resolve, reject }]

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = getRefresh();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Refresh failed");

  localStorage.setItem("accessToken",  data.data.accessToken);
  localStorage.setItem("refreshToken", data.data.refreshToken);
  return data.data.accessToken;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  const skipRefresh = ["/auth/login", "/auth/register", "/auth/refresh-token"];
  if (res.status === 401 && !skipRefresh.includes(path)) {
    if (isRefreshing) {
      const newToken = await new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      });
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const queuedRes  = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
      const queuedData = await queuedRes.json().catch(() => ({}));
      if (!queuedRes.ok) {
        const err = new Error(queuedData?.message || "Request failed");
        err.status = queuedRes.status;
        err.errors = queuedData?.errors ?? [];
        throw err;
      }
      return queuedData;
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      flushQueue(null, newToken);
      isRefreshing = false;

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };
      const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
      const retryData = await retryRes.json().catch(() => ({}));

      if (!retryRes.ok) {
        const err = new Error(retryData.message || "Request failed");
        err.status = retryRes.status;
        err.errors = retryData.errors ?? [];
        throw err;
      }
      return retryData;
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      isRefreshing = false;
      // Signal logout to the app — AuthContext listens for this event
      window.dispatchEvent(new Event("auth:logout"));
      throw refreshErr;
    }
  }

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    err.errors = data.errors ?? [];
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)       => request(path, { method: "GET" }),
  post:   (path, body) => request(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: "DELETE" }),
};
