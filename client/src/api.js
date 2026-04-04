const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || response.statusText || "Request failed");
  }
  return data;
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

export async function register(username, email, password) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(response);
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
}

export async function resetPassword(token, password) {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ token, password }),
  });
  return handleResponse(response);
}

export async function fetchProfile(token) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}
