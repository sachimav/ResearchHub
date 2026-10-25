const SESSION_STORAGE_KEY = 'researchhub_session';
const AUTH_EVENT_KEY = 'researchhub_auth_change';

export function getCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    if (!user || typeof user.token !== 'string' || !user.role) return null;
    const payload = JSON.parse(atob(user.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return user;
  } catch {
    return null;
  }
}

export function persistSession(user, token) {
  const session = user && token ? { ...user, token } : null;
  if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_KEY, { detail: session }));
}

export function logoutUser() {
  persistSession(null);
}

export function onAuthStateChanged(callback) {
  const handler = () => callback(getCurrentUser());
  const storageHandler = (event) => {
    if (event.key === SESSION_STORAGE_KEY || event.key === null) handler();
  };
  window.addEventListener(AUTH_EVENT_KEY, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(AUTH_EVENT_KEY, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
