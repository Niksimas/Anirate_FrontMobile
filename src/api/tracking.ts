import { api } from './axios';
import type {
  TrackingCreate,
  TrackingUpdate,
  TrackingResponse,
  TrackingWithAnime,
  TrackingStats,
  TrackingStatus,
} from '@/types';

export const trackingApi = {
  add: (payload: TrackingCreate) =>
    api.post<TrackingResponse>('/api/v1/tracking/', payload),

  update: (animeId: number, payload: TrackingUpdate) =>
    api.put<TrackingResponse>(`/api/v1/tracking/${animeId}`, payload),

  remove: (animeId: number) =>
    api.delete(`/api/v1/tracking/${animeId}`),

  getMyTracking: (params?: { status?: TrackingStatus; limit?: number; offset?: number }) =>
    api.get<TrackingWithAnime[]>('/api/v1/tracking/', { params }),

  getMyStats: () =>
    api.get<TrackingStats>('/api/v1/tracking/stats'),

  getUserTracking: (
    userId: number,
    params?: { status?: TrackingStatus; limit?: number; offset?: number }
  ) => api.get<TrackingWithAnime[]>(`/api/v1/tracking/user/${userId}`, { params }),
};
