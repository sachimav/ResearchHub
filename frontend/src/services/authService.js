/**
 * Authentication service for the ResearchHub app.
 * Communicates with the backend JWT-based auth API.
 */

const USERS_STORAGE_KEY = 'researchhub_users_db';
const SESSION_STORAGE_KEY = 'researchhub_session';
const AUTH_EVENT_KEY = 'researchhub_auth_change';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DEGREE_PROGRAMS = [
  'BSc (Hons) in Information & Technology',
  'Bachelor of Science in Applied Mathematics & Computing',
  'BSc in Biological Science',
];

export const SUPERVISOR_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Senior Lecturer (Grade I)',
  'Senior Lecturer (Grade II)',
  'Lecturer',
  'Visiting Research Fellow',
];

const persistSession = (user, token) => {
  const sessionUser = user ? { ...user, token } : null;

  try {
    if (sessionUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_KEY, { detail: sessionUser }));
  } catch (error) {
    console.error('Error saving auth session:', error);
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
};

export async function getRegistrationOptions() {
  return apiRequest('/auth/options');
}

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading stored users:', error);
    return [];
  }
}

export function saveStoredUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.isArray(users) ? users : []));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

export function emailExists(email) {
  const users = getStoredUsers();
  const normalized = (email || '').trim().toLowerCase();
  return users.some((user) => (user.email || '').toLowerCase() === normalized);
}

export function regNoExists(regNo) {
  if (!regNo) return false;
  const users = getStoredUsers();
  const normalized = regNo.trim().toUpperCase();
  return users.some((user) => user.role === 'student' && (user.regNo || '').trim().toUpperCase() === normalized);
}

export async function registerUser(role, userData) {
  try {
    const payload = {
      role,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      regNo: userData.regNo,
      department: userData.department,
      batch: userData.batch,
      program: userData.program,
      designation: userData.designation,
      expertise: userData.expertise,
      institution: userData.institution,
      phone: userData.phone,
    };

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const { user, token } = response;
    persistSession(user, token);
    const users = getStoredUsers();
    const existing = users.some((entry) => entry.email && entry.email.toLowerCase() === String(user.email).toLowerCase());
    if (!existing) {
      saveStoredUsers([...users, { ...user, password: '' }]);
    }

    return {
      success: true,
      user,
      token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function loginUser(role, email, password) {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, email, password }),
    });

    const { user, profile, token } = response;
    const normalizedUser = {
      ...(user || {}),
      ...(profile || {}),
    };

    persistSession(normalizedUser, token);

    return {
      success: true,
      user: normalizedUser,
      profile: profile || {},
      token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutUser() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_KEY, { detail: null }));
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

export function onAuthStateChanged(callback) {
  const handler = (event) => callback(event.detail);
  window.addEventListener(AUTH_EVENT_KEY, handler);
  return () => window.removeEventListener(AUTH_EVENT_KEY, handler);
}
