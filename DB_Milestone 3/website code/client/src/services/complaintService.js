import api from './api';

// ─── Lookups ──────────────────────────────────────────────────────────────────

export async function fetchComplaintLookups() {
  const { data } = await api.get('/complaints/lookups');
  return data; // { categories, priorities, buildings }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchMyStats() {
  const { data } = await api.get('/complaints/stats');
  return data.stats;
}

export async function fetchAdminStats() {
  const { data } = await api.get('/admin/stats');
  return data; // { stats, byCategory, byPriority }
}

// ─── Complaint CRUD ───────────────────────────────────────────────────────────

export async function fetchComplaints(params = {}) {
  const { data } = await api.get('/complaints', { params });
  return data; // { complaints, pagination }
}

export async function fetchAdminComplaints(params = {}) {
  const { data } = await api.get('/admin/complaints', { params });
  return data;
}

export async function fetchComplaint(id) {
  const { data } = await api.get(`/complaints/${id}`);
  return data.complaint;
}

export async function submitComplaint(payload, images = []) {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('category_id', payload.category_id);
  form.append('priority_id', payload.priority_id);
  form.append('location_id', payload.location_id);
  if (payload.expected_resolution_date) {
    form.append('expected_resolution_date', payload.expected_resolution_date);
  }
  images.forEach((file) => form.append('images', file));

  const { data } = await api.post('/complaints', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.complaint;
}

export async function editComplaint(id, payload) {
  const { data } = await api.put(`/complaints/${id}`, payload);
  return data.complaint;
}

export async function cancelComplaint(id) {
  const { data } = await api.delete(`/complaints/${id}`);
  return data;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(id, content) {
  const { data } = await api.post(`/complaints/${id}/comments`, { content });
  return data.comment;
}

export async function addAdminComment(id, content) {
  const { data } = await api.post(`/admin/complaints/${id}/comments`, { content });
  return data.comment;
}

// ─── Admin complaint management ───────────────────────────────────────────────

export async function fetchAvailableStaff() {
  const { data } = await api.get('/admin/staff/available');
  return data.staff;
}

export async function assignComplaint(id, staff_id) {
  const { data } = await api.post(`/admin/complaints/${id}/assign`, { staff_id });
  return data.complaint;
}

export async function updateComplaintStatus(id, status_name, remarks = '') {
  const { data } = await api.patch(`/admin/complaints/${id}/status`, { status_name, remarks });
  return data.complaint;
}
