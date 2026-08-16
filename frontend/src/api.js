/**
 * api.js
 *
 * Small wrapper around fetch so components don't each need to remember
 * to attach the auth header. Not using axios or anything heavier here
 * on purpose, fetch is enough for a project this size.
 */

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getProblems: () => request("/problems"),

  getProblem: (id) => request(`/problems/${id}`),

  submitCode: (problemId, code) =>
    request(`/problems/${problemId}/submit`, { method: "POST", body: JSON.stringify({ code }) }),

  getProgress: () => request("/progress"),
};
