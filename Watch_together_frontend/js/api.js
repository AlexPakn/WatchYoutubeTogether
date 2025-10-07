export const API_BASE = "https://localhost:7196";

export async function apiGet(path, auth = false) {
  const headers = {};
  if (auth) {
    const token = localStorage.getItem("accessToken");
    if (token) headers["Authorization"] = token;
  }
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export async function apiPost(path, data, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("accessToken");
    if (token) headers["Authorization"] = token;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}
