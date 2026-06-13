import api from './api';

export async function fetchAnalytics(params = {}) {
  const { data } = await api.get('/reports/analytics', { params });
  return data;
}

export async function fetchResolvedComplaints(params = {}) {
  const { data } = await api.get('/reports/resolved', { params });
  return data;
}

export async function fetchResolutionReport(id) {
  const { data } = await api.get(`/reports/complaint/${id}`);
  return data.report;
}

export async function createResolution(id, resolution_summary) {
  const { data } = await api.post(`/reports/complaint/${id}/resolution`, { resolution_summary });
  return data;
}

export async function submitFeedback(id, rating, feedback_text = '') {
  const { data } = await api.post(`/complaints/${id}/feedback`, { rating, feedback_text });
  return data;
}

export async function getFeedback(id) {
  const { data } = await api.get(`/complaints/${id}/feedback`);
  return data.feedback;
}
