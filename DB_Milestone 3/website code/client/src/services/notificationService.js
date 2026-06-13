import api from './api';

export async function fetchNotifications() {
  const { data } = await api.get('/notifications');
  return data; // { notifications, unreadCount }
}

export async function markAllRead() {
  await api.patch('/notifications/read-all');
}

export async function markOneRead(id) {
  await api.patch(`/notifications/${id}/read`);
}
