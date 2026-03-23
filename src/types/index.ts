// ─── Auth ────────────────────────────────────────────────────────────────────

export interface GoogleAuthRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: number;
  email: string;
  full_name?: string | null;
  picture?: string | null;
  is_active: boolean;
  is_public_profile?: boolean;
}

export interface UserOut {
  id: number;
  email: string;
  full_name: string;
  picture?: string | null;
}

export interface UserUpdate {
  full_name?: string | null;
  picture?: string | null;
  is_public_profile?: boolean | null;
}

// ─── Anime ───────────────────────────────────────────────────────────────────

export interface AnimeResponse {
  id: number;
  title: string;
  image_url: string;
  anime_url?: string | null;
  year: number;
  season: string;
  created_at: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  total: number;
  items: AnimeResponse[];
  took_ms?: number | null;
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export type TrackingStatus = 'planned' | 'watching' | 'completed';

export interface TrackingCreate {
  anime_id: number;
  status: TrackingStatus;
}

export interface TrackingUpdate {
  status?: TrackingStatus | null;
  score?: number | null;
}

export interface TrackingResponse {
  id: number;
  anime_id: number;
  status: TrackingStatus;
  score?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface TrackingWithAnime {
  id: number;
  anime_id: number;
  status: TrackingStatus;
  score?: number | null;
  created_at: string;
  updated_at?: string | null;
  anime_title: string;
  anime_image_url: string;
}

export interface TrackingStats {
  total: number;
  planned: number;
  watching: number;
  completed: number;
  average_score?: number | null;
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export interface FriendRequestCreate {
  receiver_id: number;
}

export interface FriendRequestResponse {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: string;
}

export interface FriendResponse {
  id: number;
  email: string;
  full_name?: string | null;
  picture?: string | null;
}

export interface StatusResponse {
  status: string;
}

export interface AddableFriendResponse {
  user_id: number;
  full_name?: string | null;
  picture?: string | null;
}

export interface InviteCodeResponse {
  invite_code: string;
}

// ─── Shared Lists ─────────────────────────────────────────────────────────────

export interface SharedListCreate {
  name: string;
  description?: string | null;
}

export interface SharedListUpdate {
  name?: string | null;
  description?: string | null;
}

export interface SharedListBrief {
  id: number;
  name: string;
  owner_id: number;
  member_count?: number;
  anime_count?: number;
}

export interface SharedListResponse {
  id: number;
  name: string;
  description?: string | null;
  owner_id: number;
  invite_code: string;
  member_count?: number;
  anime_count?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface MemberResponse {
  user_id: number;
  full_name?: string | null;
  picture?: string | null;
  joined_at: string;
}

export interface ListAnimeAdd {
  anime_id: number;
}

export interface RatingResponse {
  user_id: number;
  full_name?: string | null;
  score: number;
  comment?: string | null;
  updated_at?: string | null;
}

export interface ListAnimeResponse {
  anime_id: number;
  title: string;
  image_url: string;
  season: string;
  year: number;
  added_by: number;
  added_at: string;
  ratings?: RatingResponse[];
  average_score?: number | null;
}

export interface RateRequest {
  score: number;
  comment?: string | null;
}
