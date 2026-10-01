/**
 * Authentication and User Storage Service
 * Matches Mongoose Database Schemas:
 * - user.js (name, email, password, role, institution, designation, phone)
 * - Student.js (userId, regNo, departmentId/department, batchId/batch, program)
 * - supervisor.js (userId, departmentId/department, designation, expertise)
 * - department.js (name, description)
 * - batch.js (batchName, academicYear)
 */

const USERS_STORAGE_KEY = 'researchhub_users_db';
const SESSION_STORAGE_KEY = 'researchhub_session';
const AUTH_EVENT_KEY = 'researchhub_auth_change';

// Standard university reference datasets matching Database Models
export const DEPARTMENTS = [
  'Physical Science ',
  'Biological Science',
];

export const BATCHES = [
  '2023/2024',
  '2022/2023',
  '2021/2022',
  '2020/2021',
  '2019/2020',
];

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

// Helper: purge any legacy demo / predefined student, supervisor, public accounts
const LEGACY_PREDEFINED_EMAILS = [
  '2022/ict/201@vau.ac.lk',
  'silva@vau.ac.lk',
];

function isPredefinedAccount(user) {
  if (!user) return false;
  const isDemoId = typeof user.id === 'string' && user.id.startsWith('usr_demo_');
  const isLegacyEmail = user.email && LEGACY_PREDEFINED_EMAILS.includes(user.email.toLowerCase().trim());
  return isDemoId || isLegacyEmail;
}

// Clean predefined accounts immediately from browser storage
try {
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.filter((u) => !isPredefinedAccount(u));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitized));
    }
  }
  const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (sessionRaw) {
    const sessionUser = JSON.parse(sessionRaw);
    if (isPredefinedAccount(sessionUser)) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
} catch {
  // safe fallback
}

// Local user store helper (stores newly registered users until backend API is connected)
export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const users = Array.isArray(parsed) ? parsed : [];
    // Ensure no predefined accounts are returned
    return users.filter((u) => !isPredefinedAccount(u));
  } catch (err) {
    console.error('Error reading stored users:', err);
    return [];
  }
}

// Helper: save users array to localStorage
export function saveStoredUsers(users) {
  try {
    const sanitized = (Array.isArray(users) ? users : []).filter((u) => !isPredefinedAccount(u));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitized));
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

// Check if student registration number already exists (unique: true in Student.js)
export function regNoExists(regNo) {
  if (!regNo) return false;
  const users = getStoredUsers();
  const normalized = regNo.trim().toUpperCase();
  return users.some((u) => u.role === 'student' && u.regNo && u.regNo.trim().toUpperCase() === normalized);
}

// Register user with schema-aligned attributes
export function registerUser(role, userData) {
  const users = getStoredUsers();
  const email = (userData.email || '').trim();
  const normalizedEmail = email.toLowerCase();

  // 1. Email format check
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address.'
    };
  }

  // 2. Duplicate email check (unique in user.js)
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

  // 4. Common validation: Name (required in user.js)
  if (!userData.name || !userData.name.trim()) {
    return { success: false, error: 'Full Name is required.' };
  }

  // 5. Role-specific validations matching Database Models
  const roleData = {};

  if (role === 'student') {
    // Student.js: regNo, departmentId/department, batchId/batch, program
    const regNo = (userData.regNo || '').trim().toUpperCase();
    if (!regNo) {
      return { success: false, error: 'Student Registration Number (e.g., 2020/ICT/042) is required.' };
    }
    if (regNoExists(regNo)) {
      return { success: false, error: `Student with Registration Number "${regNo}" is already registered.` };
    }
    if (!userData.department || !userData.department.trim()) {
      return { success: false, error: 'Academic Department is required for Students.' };
    }
    if (!userData.batch || !userData.batch.trim()) {
      return { success: false, error: 'Academic Batch / Year is required for Students.' };
    }
    if (!userData.program || !userData.program.trim()) {
      return { success: false, error: 'Degree Program is required for Students.' };
    }

    roleData.regNo = regNo;
    roleData.department = userData.department.trim();
    roleData.batch = userData.batch.trim();
    roleData.program = userData.program.trim();
  } else if (role === 'supervisor') {
    // supervisor.js: designation, departmentId/department, expertise
    if (!userData.designation || !userData.designation.trim()) {
      return { success: false, error: 'Academic Designation is required for Supervisors.' };
    }
    if (!userData.department || !userData.department.trim()) {
      return { success: false, error: 'Academic Department is required for Supervisors.' };
    }
    if (!userData.expertise || !userData.expertise.trim()) {
      return { success: false, error: 'Research Expertise / Specialization is required.' };
    }

    roleData.designation = userData.designation.trim();
    roleData.department = userData.department.trim();
    roleData.expertise = userData.expertise.trim();
  } else if (role === 'public') {
    // user.js extended: institution, designation, phone
    if (!userData.institution || !userData.institution.trim()) {
      return { success: false, error: 'Institution / Organization is required for Public Users.' };
    }
    if (!userData.designation || !userData.designation.trim()) {
      return { success: false, error: 'Designation / Job Title is required for Public Users.' };
    }
    if (!userData.phone || !userData.phone.trim()) {
      return { success: false, error: 'Contact Phone Number is required for Public Users.' };
    }

    roleData.institution = userData.institution.trim();
    roleData.designation = userData.designation.trim();
    roleData.phone = userData.phone.trim();
  }

  // Construct new user entity mirroring database models
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role, // 'student' | 'supervisor' | 'public'
    name: userData.name.trim(),
    email: normalizedEmail,
    password: userData.password,
    ...roleData,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStoredUsers(users);

  // Return sanitized user object without plaintext password
  const { password: _, ...sanitizedUser } = newUser;

  return {
    success: true,
    user: sanitizedUser
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
      error: 'No account found with this email. Please check your credentials or register.'
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
      supervisor: 'Supervisor',
      public: 'Public User'
    };
    return {
      success: false,
      error: `This account is registered as a "${roleLabels[foundUser.role] || foundUser.role}". Please switch to the ${roleLabels[foundUser.role] || 'appropriate'} tab above to login.`
    };
  }

  // Construct active session payload with full model profile
  const { password: _, ...sessionUser } = foundUser;
  sessionUser.loginTime = new Date().toISOString();

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
