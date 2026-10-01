/**
 * Authentication and User Storage Service
 * Handles role-based authentication, user persistence via localStorage,
 * session management, and validation.
 */

const USERS_STORAGE_KEY = 'researchhub_users_db';
const SESSION_STORAGE_KEY = 'researchhub_session';
const AUTH_EVENT_KEY = 'researchhub_auth_change';

// Pre-seeded demo accounts for quick testing
const INITIAL_DEMO_USERS = [
  {
    id: 'user_std_01',
    role: 'student',
    name: 'S. Mithun',
    email: 'student@vau.ac.lk',
    password: 'password123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_pub_01',
    role: 'public',
    name: 'Dr. Anura Perera',
    institution: 'AgriTech Lanka PLC',
    designation: 'Lead Research Scientist',
    email: 'anura.perera@agritech.lk',
    phone: '+94 77 123 4567',
    password: 'password123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_sup_01',
    role: 'supervisor',
    name: 'Dr. T. Kartheepan',
    email: 'supervisor@vau.ac.lk',
    password: 'password123',
    createdAt: new Date().toISOString()
  }
];

// Helper: load stored users from localStorage or initialize with defaults
export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS));
      return INITIAL_DEMO_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS));
      return INITIAL_DEMO_USERS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading stored users:', err);
    return INITIAL_DEMO_USERS;
  }
}

// Helper: save users array to localStorage
export function saveStoredUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// Email format validator
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

// Check if email already exists
export function emailExists(email) {
  const users = getStoredUsers();
  const normalized = email.trim().toLowerCase();
  return users.some((u) => u.email.toLowerCase() === normalized);
}

// Register user with role-based attributes
export function registerUser(role, userData) {
  const users = getStoredUsers();
  const email = (userData.email || '').trim();
  const normalizedEmail = email.toLowerCase();

  // 1. Email format check
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address (e.g., name@domain.com).'
    };
  }

  // 2. Duplicate email check
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please login or use a different email.'
    };
  }

  // 3. Password match check
  if (!userData.password || userData.password !== userData.confirmPassword) {
    return {
      success: false,
      error: 'Password and Confirm Password do not match.'
    };
  }

  if (userData.password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters in length.'
    };
  }

  // 4. Role-specific validation
  if (!userData.name || !userData.name.trim()) {
    return { success: false, error: 'Name is required.' };
  }

  if (role === 'public') {
    if (!userData.institution || !userData.institution.trim()) {
      return { success: false, error: 'Institution is required for Public Users.' };
    }
    if (!userData.designation || !userData.designation.trim()) {
      return { success: false, error: 'Designation is required for Public Users.' };
    }
    if (!userData.phone || !userData.phone.trim()) {
      return { success: false, error: 'Phone Number is required for Public Users.' };
    }
  }

  // Construct new user entity
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role, // 'student' | 'public' | 'supervisor'
    name: userData.name.trim(),
    email: normalizedEmail,
    password: userData.password,
    ...(role === 'public'
      ? {
        institution: userData.institution.trim(),
        designation: userData.designation.trim(),
        phone: userData.phone.trim()
      }
      : {}),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStoredUsers(users);

  return {
    success: true,
    user: {
      id: newUser.id,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      institution: newUser.institution,
      designation: newUser.designation,
      phone: newUser.phone
    }
  };
}

// Login user with role verification
export function loginUser(role, email, password) {
  const users = getStoredUsers();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return { success: false, error: 'User Email is required.' };
  }

  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!foundUser) {
    return {
      success: false,
      error: 'No account found with this email. Please check your email or register.'
    };
  }

  if (foundUser.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.'
    };
  }

  // Check if role matches
  if (foundUser.role !== role) {
    const roleLabels = {
      student: 'Student',
      public: 'Public User',
      supervisor: 'Supervisor'
    };
    return {
      success: false,
      error: `This account is registered as a "${roleLabels[foundUser.role] || foundUser.role}". Please select the correct role above to proceed.`
    };
  }

  // Set session
  const sessionUser = {
    id: foundUser.id,
    role: foundUser.role,
    name: foundUser.name,
    email: foundUser.email,
    institution: foundUser.institution,
    designation: foundUser.designation,
    phone: foundUser.phone,
    loginTime: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_KEY, { detail: sessionUser }));
  } catch (err) {
    console.error('Error saving session:', err);
  }

  return {
    success: true,
    user: sessionUser
  };
}

// Retrieve currently active session
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Log out active user
export function logoutUser() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_KEY, { detail: null }));
  } catch (err) {
    console.error('Error logging out:', err);
  }
}

// Subscribe to auth state changes
export function onAuthStateChanged(callback) {
  const handler = (e) => {
    callback(e.detail);
  };
  window.addEventListener(AUTH_EVENT_KEY, handler);
  return () => window.removeEventListener(AUTH_EVENT_KEY, handler);
}
