import api from './api';

export async function fetchMyTask(id) {
  const { data } = await api.get(`/staff/tasks/${id}`);
  return data.complaint;
}

// List tasks assigned to this staff member (reuses /complaints with staff scoping on backend)
export async function fetchStaffTasks(params = {}) {
  const { data } = await api.get('/complaints', { params });
  return data; // { complaints, pagination }
}

export async function staffUpdateStatus(id, status_name, remarks = '') {
  const { data } = await api.patch(`/staff/tasks/${id}/status`, { status_name, remarks });
  return data;
}

export async function addWorkLog(id, work_note) {
  const { data } = await api.post(`/staff/tasks/${id}/worklogs`, { work_note });
  return data.workLog;
}

export async function uploadProgressImages(id, files) {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  const { data } = await api.post(`/staff/tasks/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.images;
}
