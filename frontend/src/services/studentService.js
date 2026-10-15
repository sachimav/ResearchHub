import { getCurrentUser } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const authHeaders = () => {
  const user = getCurrentUser();
  return {
    'Content-Type': 'application/json',
    Authorization: user?.token ? `Bearer ${user.token}` : '',
  };
};

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
};

export const getStudentDashboard = () => apiRequest('/student/dashboard');

export const getStudentProfile = () => apiRequest('/student/me');

export const updateStudentProfile = (payload) =>
  apiRequest('/student/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getAvailableSupervisors = () => apiRequest('/student/supervisors');

export const createResearchProposal = (payload) =>
  apiRequest('/student/research', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateResearchProposal = (researchId, payload) =>
  apiRequest(`/student/research/${researchId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const updateMilestoneProgress = (researchId, milestoneId, status) =>
  apiRequest(`/student/research/${researchId}/milestones/${milestoneId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const uploadResearchDocument = (researchId, payload) =>
  apiRequest(`/student/research/${researchId}/documents`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestSupervisorMeeting = (payload) =>
  apiRequest('/student/meetings/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getStudentDeadlines = () => apiRequest('/student/deadlines');

export const getStudentNotifications = () => apiRequest('/student/notifications');

export const markAllNotificationsAsRead = () =>
  apiRequest('/student/notifications/read-all', { method: 'PATCH' });

export const markNotificationAsRead = (notificationId) =>
  apiRequest(`/student/notifications/${notificationId}/read`, { method: 'PATCH' });
