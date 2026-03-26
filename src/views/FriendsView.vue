<template>
  <ion-page>
    <ion-content class="friends-content" :fullscreen="true">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Header row -->
      <div class="page-header">
        <h1 class="page-title">Друзья</h1>
        <button class="search-link" @click="router.push('/friends/search')">
          <ion-icon :icon="searchOutline" />
          <span>Найти друзей</span>
        </button>
      </div>

      <!-- Segment -->
      <div class="segment-wrap">
        <div class="custom-segment">
          <button
            v-for="(tab, i) in tabs"
            :key="tab.value"
            class="seg-btn"
            :class="{ active: activeIndex === i }"
            @click="slideTo(i)"
          >{{ tab.label }}</button>
        </div>
      </div>

      <!-- Swiper -->
      <swiper-container
        ref="swiperRef"
        :initial-slide="0"
        :speed="250"
        @swiperslidechange="onSlideChange"
        class="friends-swiper"
      >
        <!-- FRIENDS slide -->
        <swiper-slide class="friends-slide">
          <div v-if="loading" class="ion-padding">
            <div v-for="i in 4" :key="i" class="skeleton-row">
              <ion-skeleton-text animated class="skeleton-avatar" />
              <ion-skeleton-text animated class="skeleton-name" />
            </div>
          </div>

          <div v-else-if="friends.length">
            <div
              v-for="friend in friends"
              :key="friend.id"
              class="user-row"
              @click="router.push(`/users/${friend.id}`)"
            >
              <div class="user-avatar">
                <img v-if="friend.picture" :src="fixUrl(friend.picture)" />
                <ion-icon v-else :icon="cameraOutline" />
              </div>
              <span class="user-name">{{ friend.full_name || friend.email }}</span>
              <button class="action-btn action-btn--remove" @click.stop="confirmRemove(friend)">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M17.5 10.5C17.5 12.433 15.933 14 14 14C12.067 14 10.5 12.433 10.5 10.5C10.5 8.567 12.067 7 14 7C15.933 7 17.5 8.567 17.5 10.5Z" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M7 22C7 18.686 10.134 16 14 16C17.866 16 21 18.686 21 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <line x1="20" y1="10.5" x2="25" y2="10.5" stroke="#FF6B6B" stroke-width="2.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-else class="empty-state">
            <ion-icon :icon="peopleOutline" class="empty-icon" />
            <p class="empty-text">Добавьте первых друзей</p>
          </div>
        </swiper-slide>

        <!-- SENT REQUESTS slide -->
        <swiper-slide class="friends-slide">
          <div v-if="sentLoading" class="ion-padding">
            <div v-for="i in 3" :key="i" class="skeleton-row">
              <ion-skeleton-text animated class="skeleton-avatar" />
              <ion-skeleton-text animated class="skeleton-name" />
            </div>
          </div>

          <div v-else-if="sentItems.length">
            <div v-for="item in sentItems" :key="item.requestId" class="user-row">
              <div class="user-avatar">
                <img v-if="item.picture" :src="fixUrl(item.picture)" />
                <ion-icon v-else :icon="cameraOutline" />
              </div>
              <span class="user-name">{{ item.full_name || item.email || `ID ${item.userId}` }}</span>
              <span class="action-dash">
                <svg width="28" height="4" viewBox="0 0 28 4" fill="none">
                  <line x1="2" y1="2" x2="26" y2="2" stroke="#FF9E6B" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
          </div>

          <div v-else class="empty-state">
            <ion-icon :icon="sendOutline" class="empty-icon" />
            <p class="empty-text">Нет отправленных заявок</p>
          </div>
        </swiper-slide>

        <!-- INCOMING REQUESTS slide -->
        <swiper-slide class="friends-slide">
          <div v-if="incomingLoading" class="ion-padding">
            <div v-for="i in 3" :key="i" class="skeleton-row">
              <ion-skeleton-text animated class="skeleton-avatar" />
              <ion-skeleton-text animated class="skeleton-name" />
            </div>
          </div>

          <div v-else-if="incomingItems.length">
            <div v-for="item in incomingItems" :key="item.requestId" class="user-row">
              <div class="user-avatar">
                <img v-if="item.picture" :src="fixUrl(item.picture)" />
                <ion-icon v-else :icon="cameraOutline" />
              </div>
              <span class="user-name">{{ item.full_name || item.email || `ID ${item.userId}` }}</span>
              <div class="req-actions">
                <button class="action-btn action-btn--accept" @click.stop="accept(item)">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M17.5 10.5C17.5 12.433 15.933 14 14 14C12.067 14 10.5 12.433 10.5 10.5C10.5 8.567 12.067 7 14 7C15.933 7 17.5 8.567 17.5 10.5Z" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M7 22C7 18.686 10.134 16 14 16C17.866 16 21 18.686 21 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <line x1="22.5" y1="8" x2="22.5" y2="13" stroke="#4ADE80" stroke-width="2.2" stroke-linecap="round"/>
                    <line x1="20" y1="10.5" x2="25" y2="10.5" stroke="#4ADE80" stroke-width="2.2" stroke-linecap="round"/>
                  </svg>
                </button>
                <button class="action-btn action-btn--decline" @click.stop="decline(item)">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M17.5 10.5C17.5 12.433 15.933 14 14 14C12.067 14 10.5 12.433 10.5 10.5C10.5 8.567 12.067 7 14 7C15.933 7 17.5 8.567 17.5 10.5Z" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M7 22C7 18.686 10.134 16 14 16C17.866 16 21 18.686 21 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <line x1="20" y1="10.5" x2="25" y2="10.5" stroke="#FF6B6B" stroke-width="2.2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <ion-icon :icon="mailOpenOutline" class="empty-icon" />
            <p class="empty-text">Новых заявок нет</p>
          </div>
        </swiper-slide>
      </swiper-container>
    </ion-content>

    <ion-alert
      :is-open="!!removingFriend"
      header="Удалить из друзей?"
      :message="`${removingFriend?.full_name ?? removingFriend?.email} будет удалён из твоего списка.`"
      :buttons="alertButtons"
      @did-dismiss="removingFriend = null"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonIcon, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonAlert,
} from '@ionic/vue';
import {
  searchOutline, cameraOutline, peopleOutline, sendOutline, mailOpenOutline,
} from 'ionicons/icons';
import { register } from 'swiper/element/bundle';
import { fixUrl } from '@/composables/useImageUrl';
import { friendsApi } from '@/api/friends';
import type { FriendResponse, FriendRequestResponse } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

register();

interface ResolvedRequest {
  requestId: number;
  userId: number;
  full_name?: string | null;
  email?: string;
  picture?: string | null;
}

const router = useRouter();
const swiperRef = ref();
const activeIndex = ref(0);

const tabs = [
  { value: 'friends', label: 'Друзья' },
  { value: 'sent', label: 'Отправленные' },
  { value: 'incoming', label: 'Входящие' },
];

const friends = ref<FriendResponse[]>([]);
const loading = ref(false);
const removingFriend = ref<FriendResponse | null>(null);

const sentItems = ref<ResolvedRequest[]>([]);
const sentLoading = ref(false);
const sentLoaded = ref(false);

const incomingItems = ref<ResolvedRequest[]>([]);
const incomingLoading = ref(false);
const incomingLoaded = ref(false);

const alertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Удалить',
    role: 'destructive',
    handler: async () => {
      if (removingFriend.value) {
        await friendsApi.remove(removingFriend.value.id);
        friends.value = friends.value.filter((f) => f.id !== removingFriend.value!.id);
      }
    },
  },
];

function slideTo(index: number) {
  activeIndex.value = index;
  swiperRef.value?.swiper?.slideTo(index);
}

function onSlideChange(e: CustomEvent) {
  const swiper = (e.target as any)?.swiper;
  if (swiper) {
    activeIndex.value = swiper.activeIndex;
    // Lazy load tab data
    if (swiper.activeIndex === 1 && !sentLoaded.value) loadSent();
    if (swiper.activeIndex === 2 && !incomingLoaded.value) loadIncoming();
  }
}

onIonViewWillEnter(loadFriends);

async function loadFriends() {
  loading.value = true;
  try {
    const { data } = await friendsApi.list();
    friends.value = data;
  } finally {
    loading.value = false;
  }
}

async function resolveRequests(raw: FriendRequestResponse[], userIdKey: 'sender_id' | 'receiver_id'): Promise<ResolvedRequest[]> {
  const results = await Promise.allSettled(
    raw.map(async (req) => {
      const userId = req[userIdKey];
      const { data: user } = await friendsApi.getUser(userId);
      return {
        requestId: req.id,
        userId,
        full_name: user.full_name,
        email: user.email,
        picture: user.picture,
      } as ResolvedRequest;
    }),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ResolvedRequest> => r.status === 'fulfilled')
    .map((r) => r.value);
}

async function loadSent() {
  sentLoading.value = true;
  try {
    const { data } = await friendsApi.outgoing();
    sentItems.value = await resolveRequests(data, 'receiver_id');
    sentLoaded.value = true;
  } finally {
    sentLoading.value = false;
  }
}

async function loadIncoming() {
  incomingLoading.value = true;
  try {
    const { data } = await friendsApi.incoming();
    incomingItems.value = await resolveRequests(data, 'sender_id');
    incomingLoaded.value = true;
  } finally {
    incomingLoading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) {
  const idx = activeIndex.value;
  if (idx === 0) await loadFriends();
  else if (idx === 1) await loadSent();
  else await loadIncoming();
  ev.detail.complete();
}

function confirmRemove(friend: FriendResponse) { removingFriend.value = friend; }

async function accept(item: ResolvedRequest) {
  await friendsApi.accept(item.requestId);
  incomingItems.value = incomingItems.value.filter((r) => r.requestId !== item.requestId);
  await loadFriends();
}

async function decline(item: ResolvedRequest) {
  await friendsApi.decline(item.requestId);
  incomingItems.value = incomingItems.value.filter((r) => r.requestId !== item.requestId);
}
</script>

<style scoped>
.friends-content {
  --background: #1E1E1E;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 16px) 16px 12px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.5px;
}

.search-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.search-link ion-icon {
  font-size: 16px;
}

/* Segment */
.segment-wrap {
  padding: 0 16px 12px;
}

.custom-segment {
  display: flex;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 3px;
}

.seg-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  padding: 8px 4px;
  border-radius: 10px;
  cursor: pointer;
  line-height: 1.3;
  transition: background 0.2s, color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.seg-btn.active {
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
  font-weight: 600;
}

/* ── Swiper ──────────────────────────────────────────────────────────────── */
.friends-swiper {
  height: calc(100% - 120px);
}

.friends-slide {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: 100%;
}

/* User rows */
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.user-row:active {
  opacity: 0.8;
}

.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #4A4A5A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar ion-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
}

.user-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action buttons */
.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.action-btn--remove { color: #FF9E9E; }
.action-btn--accept { color: #4ADE80; }
.action-btn--decline { color: #FF9E9E; }

.action-dash {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 4px;
}

.req-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 12px;
}

.empty-icon {
  font-size: 64px;
  color: rgba(255, 255, 255, 0.2);
}

.empty-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  margin: 0;
  text-align: center;
}

/* Skeletons */
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.skeleton-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
  --background: #2D2D3A;
}

.skeleton-name {
  flex: 1;
  height: 16px;
  border-radius: 8px;
  --background: #2D2D3A;
}
</style>
