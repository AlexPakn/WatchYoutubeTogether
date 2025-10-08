export const API_BASE = "https://localhost:7196";

// === Helper: decode JWT without verification ===
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// === Refresh Token ===
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken),
    });
    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    console.log("%c[Token refreshed]", "color: #0f0");
    return true;
  } catch (err) {
    console.warn("Token refresh failed:", err.message);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    location.hash = "/auth";
    return false;
  }
}

// === Check and refresh if token near expiry ===
export async function refreshTokenIfNeeded() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;

  const payload = parseJwt(token);
  if (!payload?.exp) return false;

  const expiresAt = payload.exp * 1000;
  const now = Date.now();

  // Refresh if less than 1 minute left
  if (expiresAt - now < 60_000) {
    return await refreshAccessToken();
  }
  return false;
}

// === General GET helper ===
export async function apiGet(path, auth = false) {
  const headers = {};
  if (auth) {
    await refreshTokenIfNeeded();
    const token = localStorage.getItem("accessToken");
    if (token) headers["Authorization"] = token;
  }

  let res = await fetch(`${API_BASE}${path}`, { headers });

  // If unauthorized → try refreshing once
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = localStorage.getItem("accessToken");
      headers["Authorization"] = newToken;
      res = await fetch(`${API_BASE}${path}`, { headers });
    }
  }

  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

// === General POST helper ===
export async function apiPost(path, data, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    await refreshTokenIfNeeded();
    const token = localStorage.getItem("accessToken");
    if (token) headers["Authorization"] = token;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = localStorage.getItem("accessToken");
      headers["Authorization"] = newToken;
      res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    }
  }

  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}
