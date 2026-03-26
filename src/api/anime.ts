import { api } from './axios';
import type { AnimeResponse, SearchRequest, SearchResponse, SuggestResponse, FiltersResponse, AnimeSocialResponse } from '@/types';

export interface AnimeFilterParams {
  limit?: number;
  offset?: number;
  year?: number;
  year_from?: number;
  year_to?: number;
  season?: string;
  genre_ids?: number[];
  anime_type?: string;
  status?: string;
  episodes_from?: number;
  episodes_to?: number;
}

export const animeApi = {
  getAll: (params?: AnimeFilterParams) =>
    api.get<AnimeResponse[]>('/api/v1/anime/', { params }),

  getById: (id: number) =>
    api.get<AnimeResponse>(`/api/v1/anime/${id}`),

  search: (payload: SearchRequest) =>
    api.post<SearchResponse>('/api/v1/anime/search', payload),

  suggest: (q: string, limit = 10) =>
    api.get<SuggestResponse>('/api/v1/anime/suggest', { params: { q, limit } }),

  stats: () =>
    api.get('/api/v1/anime/stats'),

  getFilters: () =>
    api.get<FiltersResponse>('/api/v1/anime/filters'),

  getSocial: (animeId: number) =>
    api.get<AnimeSocialResponse>(`/api/v1/anime/${animeId}/social`),
};
