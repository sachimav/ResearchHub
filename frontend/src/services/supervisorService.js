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

export const getSupervisorDashboard = () => apiRequest('/supervisor/dashboard');

export const getAssignedStudents = () => apiRequest('/supervisor/students');

export const getAssignedResearchList = (status) =>
  apiRequest(`/supervisor/research${status ? `?status=${status}` : ''}`);

export const getResearchDetails = (researchId) =>
  apiRequest(`/supervisor/research/${researchId}`);

export const reviewProposal = (researchId, { status, remarks }) =>
  apiRequest(`/supervisor/research/${researchId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, remarks }),
  });

export const updateResearchProgress = (researchId, payload) =>
  apiRequest(`/supervisor/research/${researchId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const manageMilestones = (researchId, payload) =>
  apiRequest(`/supervisor/research/${researchId}/milestones`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const reviewDocument = (documentId, { status, feedback }) =>
  apiRequest(`/supervisor/documents/${documentId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, feedback }),
  });

export const addProjectFeedback = (researchId, message) =>
  apiRequest(`/supervisor/research/${researchId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

export const scheduleMeeting = (payload) =>
  apiRequest('/supervisor/meetings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateMeeting = (meetingId, payload) =>
  apiRequest(`/supervisor/meetings/${meetingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const respondMeetingRequest = (meetingId, payload) =>
  apiRequest(`/supervisor/meetings/${meetingId}/respond`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getDeadlines = () => apiRequest('/supervisor/deadlines');

export const createDeadline = (payload) =>
  apiRequest('/supervisor/deadlines', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteDeadline = (deadlineId) =>
  apiRequest(`/supervisor/deadlines/${deadlineId}`, {
    method: 'DELETE',
  });

export const updateAvailabilitySchedule = (availability) =>
  apiRequest('/supervisor/availability', {
    method: 'PATCH',
    body: JSON.stringify({ availability }),
  });

export const updateSupervisorProfile = (payload) =>
  apiRequest('/supervisor/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getProgressReports = () => apiRequest('/supervisor/reports');

export const getSupervisorNotifications = () => apiRequest('/supervisor/notifications');

export const markAllSupervisorNotificationsRead = () =>
  apiRequest('/supervisor/notifications/read-all', { method: 'PATCH' });

export const markAllNotificationsAsRead = () =>
  apiRequest('/supervisor/notifications/read-all', { method: 'PATCH' });

export const markNotificationAsRead = (notificationId) =>
  apiRequest(`/supervisor/notifications/${notificationId}/read`, { method: 'PATCH' });
