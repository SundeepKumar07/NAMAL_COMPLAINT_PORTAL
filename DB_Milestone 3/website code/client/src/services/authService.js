import api from './api';

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function fetchUsers(params) {
  const { data } = await api.get('/admin/users', { params });
  return data.users;
}

export async function fetchLookupData() {
  const { data } = await api.get('/admin/lookup');
  return data; // { departments, categories }
}

export async function createFiler(payload) {
  const { data } = await api.post('/admin/users/filers', payload);
  return data;
}

export async function createStaff(payload) {
  const { data } = await api.post('/admin/users/staff', payload);
  return data;
}

export async function updateUserStatus(userId, account_status) {
  const { data } = await api.patch(`/admin/users/${userId}/status`, { account_status });
  return data;
}
