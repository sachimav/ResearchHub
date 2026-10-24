const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiRequest = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load research.');
  }

  return data;
};

export const getPublicResearch = async ({ query = '', status = '' } = {}) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (status) params.set('status', status);

  const queryString = params.toString();
  return apiRequest(`/public/research${queryString ? `?${queryString}` : ''}`);
};

export const getPublicResearchDetails = (researchId) =>
  apiRequest(`/public/research/${researchId}`);
