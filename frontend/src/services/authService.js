/**
 * Authentication service for the ResearchHub app.
 * Communicates with the backend JWT-based auth API.
 */

import { apiRequest } from './apiClient.js';
import { persistSession } from './session.js';
export { getCurrentUser, logoutUser, onAuthStateChanged } from './session.js';

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

export const getPortalRoute = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'supervisor') return '/supervisor/dashboard';
  return '/showcase';
};

export async function getRegistrationOptions() {
  return apiRequest('/auth/options');
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
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
      invitationToken: userData.invitationToken,
    };

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const { user, token } = response;
    persistSession(user, token);
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
