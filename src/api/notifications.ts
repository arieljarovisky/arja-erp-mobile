import apiClient from './client';

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export const notificationsAPI = {
  list: async (unreadOnly = false): Promise<NotificationItem[]> => {
    const res = await apiClient.get('/api/notifications', {
      params: { unreadOnly },
    });
    // backend responde { ok, data }
    if (res.data?.data) return res.data.data;
    return Array.isArray(res.data) ? res.data : [];
  },
  countUnread: async (): Promise<number> => {
    const res = await apiClient.get('/api/notifications/count');
    if (typeof res.data?.count === 'number') return res.data.count;
    return 0;
  },
  markRead: async (id: number): Promise<void> => {
    await apiClient.put(`/api/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await apiClient.put('/api/notifications/read-all');
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/notifications/${id}`);
  },
};

