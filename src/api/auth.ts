import { api } from './axios';
import type { GoogleAuthRequest, Token, UserResponse } from '@/types';

export const authApi = {
  googleAuth: (payload: GoogleAuthRequest) =>
    api.post<Token>('/api/v1/auth/google', payload),

  refresh: (refresh_token: string) =>
    api.post<Token>('/api/v1/auth/refresh', { refresh_token }),

  me: () =>
    api.get<UserResponse>('/api/v1/auth/me'),

  logout: () =>
    api.post('/api/v1/auth/logout'),
};
