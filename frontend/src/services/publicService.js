import { apiRequest } from './apiClient.js';

export const getPublicResearch = async ({ query = '', status = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (status) params.set('status', status);
  params.set('page', String(page));

  const queryString = params.toString();
  return apiRequest(`/public/research${queryString ? `?${queryString}` : ''}`);
};

export const getPublicResearchDetails = (researchId) =>
  apiRequest(`/public/research/${researchId}`);
