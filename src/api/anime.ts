import { api } from './axios';
import type { AnimeResponse, SearchRequest, SearchResponse } from '@/types';

export const animeApi = {
  getAll: (params?: { limit?: number; offset?: number; year?: number; season?: string }) =>
    api.get<AnimeResponse[]>('/api/v1/anime/', { params }),

  getById: (id: number) =>
    api.get<AnimeResponse>(`/api/v1/anime/${id}`),

  search: (payload: SearchRequest) =>
    api.post<SearchResponse>('/api/v1/anime/search', payload),

  suggest: (q: string, limit = 10) =>
    api.get<AnimeResponse[]>('/api/v1/anime/suggest', { params: { q, limit } }),

  stats: () =>
    api.get('/api/v1/anime/stats'),
};
