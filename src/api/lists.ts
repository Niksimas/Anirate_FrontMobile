import { api } from './axios';
import type {
  SharedListCreate,
  SharedListUpdate,
  SharedListBrief,
  SharedListResponse,
  MemberResponse,
  ListAnimeAdd,
  ListAnimeResponse,
  RateRequest,
  RatingResponse,
} from '@/types';

export const listsApi = {
  // Lists CRUD
  getMyLists: () =>
    api.get<SharedListBrief[]>('/api/v1/lists/'),

  create: (payload: SharedListCreate) =>
    api.post<SharedListResponse>('/api/v1/lists/', payload),

  getById: (listId: number) =>
    api.get<SharedListResponse>(`/api/v1/lists/${listId}`),

  update: (listId: number, payload: SharedListUpdate) =>
    api.put<SharedListResponse>(`/api/v1/lists/${listId}`, payload),

  delete: (listId: number) =>
    api.delete(`/api/v1/lists/${listId}`),

  // Join / invite
  joinByInvite: (inviteCode: string) =>
    api.post<SharedListResponse>(`/api/v1/lists/join/${inviteCode}`),

  regenerateInvite: (listId: number) =>
    api.post(`/api/v1/lists/${listId}/invite`),

  // Members
  getMembers: (listId: number) =>
    api.get<MemberResponse[]>(`/api/v1/lists/${listId}/members`),

  kickMember: (listId: number, userId: number) =>
    api.delete(`/api/v1/lists/${listId}/members/${userId}`),

  leaveList: (listId: number) =>
    api.delete(`/api/v1/lists/${listId}/leave`),

  // Anime in list
  addAnime: (listId: number, payload: ListAnimeAdd) =>
    api.post<ListAnimeResponse>(`/api/v1/lists/${listId}/anime`, payload),

  getAnimeList: (listId: number) =>
    api.get<ListAnimeResponse[]>(`/api/v1/lists/${listId}/anime`),

  removeAnime: (listId: number, animeId: number) =>
    api.delete(`/api/v1/lists/${listId}/anime/${animeId}`),

  // Ratings
  rateAnime: (listId: number, animeId: number, payload: RateRequest) =>
    api.put<RatingResponse>(`/api/v1/lists/${listId}/anime/${animeId}/rate`, payload),

  deleteRating: (listId: number, animeId: number) =>
    api.delete(`/api/v1/lists/${listId}/anime/${animeId}/rate`),
};
