import { apiRequest as request, jsonBody } from './apiClient.js';

const apiRequest = (endpoint, options) => request(endpoint, options, true);

export const getStudentDashboard = () => apiRequest('/student/dashboard');

export const getStudentProfile = () => apiRequest('/student/me');

export const updateStudentProfile = (payload) =>
  apiRequest('/student/me', {
    method: 'PATCH',
    body: jsonBody(payload),
  });

export const getAvailableSupervisors = () => apiRequest('/student/supervisors');

export const createResearchProposal = (payload) =>
  apiRequest('/student/research', {
    method: 'POST',
    body: jsonBody(payload),
  });

export const updateResearchProposal = (researchId, payload) =>
  apiRequest(`/student/research/${researchId}`, {
    method: 'PATCH',
    body: jsonBody(payload),
  });

export const updateMilestoneProgress = (researchId, milestoneId, status) =>
  apiRequest(`/student/research/${researchId}/milestones/${milestoneId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const uploadResearchDocument = (researchId, payload) =>
  apiRequest(`/student/research/${researchId}/documents`, {
    method: 'POST',
    body: jsonBody(payload),
  });

export const requestSupervisorMeeting = (payload) =>
  apiRequest('/student/meetings/request', {
    method: 'POST',
    body: jsonBody(payload),
  });

export const getStudentDeadlines = () => apiRequest('/student/deadlines');

export const getStudentNotifications = () => apiRequest('/student/notifications');

export const markAllNotificationsAsRead = () =>
  apiRequest('/student/notifications/read-all', { method: 'PATCH' });

export const markNotificationAsRead = (notificationId) =>
  apiRequest(`/student/notifications/${notificationId}/read`, { method: 'PATCH' });
