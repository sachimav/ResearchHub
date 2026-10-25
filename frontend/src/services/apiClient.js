import { getCurrentUser, logoutUser } from './session.js';

const API_BASE_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

export function jsonBody(payload) {
  const normalized = { ...payload };
  for (const field of ['meetingDate', 'dueDate']) {
    if (normalized[field] && Number.isFinite(new Date(normalized[field]).getTime())) normalized[field] = new Date(normalized[field]).toISOString();
  }
  return JSON.stringify(normalized);
}

export async function apiRequest(endpoint, options = {}, authenticated = false) {
  const user = authenticated ? getCurrentUser() : null;
  if (authenticated && !user) {
    logoutUser();
    throw new Error('Your session has expired. Please sign in again.');
  }
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to reach ResearchHub. Check your connection and try again.', { cause: error });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (authenticated && response.status === 401 && getCurrentUser()?.token === user.token) logoutUser();
    const error = new Error(data?.message || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  if (data === null) throw new Error('The server returned an invalid response. Check the API configuration.');
  return data;
}
