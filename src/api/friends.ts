import { api } from './axios';
import type { FriendRequestCreate, FriendRequestResponse, FriendResponse, StatusResponse, UserOut, UserResponse } from '@/types';

export const friendsApi = {
  sendRequest: (payload: FriendRequestCreate) =>
    api.post<FriendRequestResponse>('/api/v1/friends/request', payload),

  incoming: () =>
    api.get<FriendRequestResponse[]>('/api/v1/friends/incoming'),

  outgoing: () =>
    api.get<FriendRequestResponse[]>('/api/v1/friends/outgoing'),

  accept: (requestId: number) =>
    api.post<FriendRequestResponse>(`/api/v1/friends/${requestId}/accept`),

  decline: (requestId: number) =>
    api.delete<StatusResponse>(`/api/v1/friends/${requestId}/decline`),

  list: () =>
    api.get<FriendResponse[]>('/api/v1/friends/'),

  remove: (friendId: number) =>
    api.delete<StatusResponse>(`/api/v1/friends/${friendId}`),

  search: (q: string) =>
    api.get<UserOut[]>('/api/v1/users/search', { params: { q } }),

  getUser: (userId: number) =>
    api.get<UserResponse>(`/api/v1/users/${userId}`),
};
