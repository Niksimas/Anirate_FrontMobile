import { api } from './axios';
import type { FriendRequestCreate, UserOut, UserResponse } from '@/types';

export const friendsApi = {
  sendRequest: (payload: FriendRequestCreate) =>
    api.post('/api/v1/friends/request', payload),

  incoming: () =>
    api.get('/api/v1/friends/incoming'),

  accept: (requestId: number) =>
    api.post(`/api/v1/friends/${requestId}/accept`),

  decline: (requestId: number) =>
    api.delete(`/api/v1/friends/${requestId}/decline`),

  list: () =>
    api.get('/api/v1/friends/'),

  remove: (friendId: number) =>
    api.delete(`/api/v1/friends/${friendId}`),

  search: (q: string) =>
    api.get<UserOut[]>('/api/v1/users/search', { params: { q } }),

  getUser: (userId: number) =>
    api.get<UserResponse>(`/api/v1/users/${userId}`),
};
