<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/friends" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="user-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Skeleton -->
      <div v-if="loading" class="skeleton-wrap">
        <div class="skeleton-header">
          <ion-skeleton-text animated style="width:80px;height:80px;border-radius:50%;margin:0 auto;" />
          <ion-skeleton-text animated style="width:140px;height:18px;margin:12px auto 0;" />
        </div>
        <ion-skeleton-text animated style="height:76px;border-radius:18px;margin:0 16px 10px;" />
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 16px 10px;">
          <ion-skeleton-text v-for="i in 3" :key="i" animated style="height:70px;border-radius:14px;" />
        </div>
      </div>

      <template v-else-if="userProfile">
        <!-- Avatar + name -->
        <div class="profile-hero">
          <div class="avatar-circle">
            <img v-if="userProfile.picture" :src="fixUrl(userProfile.picture)" class="avatar-img" />
            <ion-icon v-else :icon="personOutline" class="avatar-icon" />
          </div>
          <h2 class="profile-name">{{ userProfile.full_name ?? 'Без имени' }}</h2>
        </div>

        <!-- Stats (visible when public profile OR always for friends — backend handles access) -->
        <template v-if="stats">
          <!-- Total wide card -->
          <div class="wide-card lavender-card" @click="openTracking()">
            <div class="wide-card-text">
              <span class="wide-card-label">Всего</span>
              <span class="wide-card-value">{{ stats.total }}</span>
            </div>
            <ion-icon :icon="sparkles" class="sparkle-icon" />
          </div>

          <!-- 3 stat mini-cards -->
          <div class="stat-row">
            <div class="stat-mini" @click="openTracking('planned')">
              <span class="stat-mini-label">В планах</span>
              <span class="stat-mini-value">{{ stats.planned }}</span>
            </div>
            <div class="stat-mini stat-mini--white" @click="openTracking('watching')">
              <span class="stat-mini-label dark">Смотрю</span>
              <span class="stat-mini-value dark">{{ stats.watching }}</span>
            </div>
            <div class="stat-mini stat-mini--salmon" @click="openTracking('completed')">
              <span class="stat-mini-label">Просмотрено</span>
              <span class="stat-mini-value">{{ stats.completed }}</span>
            </div>
          </div>

          <!-- Recent anime -->
          <div v-if="recentAnime.length" class="wide-card salmon-card" @click="openTracking()">
            <div class="recent-thumbs">
              <img
                v-for="(item, i) in recentAnime.slice(0, 3)"
                :key="item.id"
                :src="fixUrl(item.anime_image_url)"
                class="recent-thumb"
                :style="{ left: `${i * 28}px`, zIndex: 3 - i }"
              />
            </div>
            <span class="wide-card-right-label">Последние<br>оценённые аниме</span>
          </div>
        </template>

        <!-- Common shared lists (always visible for friends) -->
        <div class="section-header">
          <h3 class="section-title">Общие списки</h3>
        </div>

        <div v-if="commonListsLoading" class="lists-grid">
          <ion-skeleton-text v-for="i in 2" :key="i" animated style="height:100px;border-radius:14px;" />
        </div>

        <div v-else-if="commonLists.length" class="lists-grid">
          <div
            v-for="list in commonLists"
            :key="list.id"
            class="list-card"
            @click="router.push(`/tabs/lists/${list.id}`)"
          >
            <span class="list-card-name">{{ list.name }}</span>
            <span class="list-card-meta">{{ list.member_count }} участн. · {{ list.anime_count }} аниме</span>
          </div>
        </div>

        <div v-else class="empty-section">
          <p>Нет общих списков</p>
        </div>
      </template>

      <div style="height: 32px;" />
    </ion-content>

    <!-- Friend's tracking modal (full-screen page) -->
    <ion-modal ref="trackingModal" :is-open="trackingOpen" @did-dismiss="trackingOpen = false">
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="trackingOpen = false">Закрыть</ion-button>
            </ion-buttons>
            <ion-title>{{ userProfile?.full_name ?? 'Аниме' }}</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="tracking-content">
          <!-- Segment -->
          <div class="segment-wrap">
            <div class="custom-segment">
              <button
                v-for="(tab, i) in trackingTabs"
                :key="tab.value"
                class="seg-btn"
                :class="{
                  'seg-btn--active': trackingSlideIndex === i,
                  [`seg-btn--${tab.value}`]: trackingSlideIndex === i,
                }"
                @click="slideTrackingTo(i)"
              >{{ tab.label }}</button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="trackingLoading" class="tracking-list">
            <div v-for="i in 6" :key="i" class="tracking-item">
              <ion-skeleton-text animated style="width:64px;height:90px;border-radius:10px;" />
              <div style="flex:1">
                <ion-skeleton-text animated style="height:16px;width:70%;margin-bottom:6px;" />
                <ion-skeleton-text animated style="height:24px;width:50%;border-radius:12px;" />
              </div>
            </div>
          </div>

          <!-- Swiper -->
          <swiper-container
            v-show="!trackingLoading"
            ref="trackingSwiperRef"
            :initial-slide="0"
            :speed="250"
            @swiperslidechange="onTrackingSlideChange"
            class="tracking-swiper"
          >
            <swiper-slide v-for="tab in trackingTabs" :key="tab.value" class="tracking-slide">
              <div v-if="getTrackingSlideItems(tab.value).length" class="tracking-list">
                <div
                  v-for="item in getTrackingSlideItems(tab.value)"
                  :key="item.id"
                  class="tracking-item"
                  @click="trackingOpen = false; router.push(`/anime/${item.anime_id}`)"
                >
                  <img :src="fixUrl(item.anime_image_url)" :alt="item.anime_title" class="tracking-thumb" />
                  <div class="tracking-body">
                    <p class="tracking-name">{{ item.anime_title }}</p>
                    <div class="tracking-meta-row">
                      <span class="status-badge" :class="`status-badge--${item.status}`">
                        {{ STATUS_LABELS[item.status] }}
                      </span>
                      <span v-if="item.score" class="tracking-score">★ {{ item.score }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-section" style="padding-top:48px;">
                <p>Пусто</p>
              </div>
            </swiper-slide>
          </swiper-container>
        </ion-content>
      </ion-page>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { register } from 'swiper/element/bundle';

register();
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonSkeletonText, IonModal,
} from '@ionic/vue';
import { personOutline, sparkles } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { friendsApi } from '@/api/friends';
import { trackingApi } from '@/api/tracking';
import { listsApi } from '@/api/lists';
import type { UserResponse, TrackingWithAnime, TrackingStats, TrackingStatus, SharedListBrief } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

const route = useRoute();
const router = useRouter();
const userId = Number(route.params.id);

const userProfile = ref<UserResponse | null>(null);
const stats = ref<TrackingStats | null>(null);
const recentAnime = ref<TrackingWithAnime[]>([]);
const commonLists = ref<SharedListBrief[]>([]);
const commonListsLoading = ref(true);
const loading = ref(true);

// Tracking modal state
const trackingOpen = ref(false);
const trackingModal = ref();
const trackingSwiperRef = ref();
const trackingSlideIndex = ref(0);
const trackingItems = ref<TrackingWithAnime[]>([]);
const trackingLoading = ref(false);

const STATUS_LABELS: Record<string, string> = {
  planned: 'В планах',
  watching: 'Смотрю',
  completed: 'Просмотрено',
};

const trackingTabs = [
  { value: 'all' as const, label: 'Все' },
  { value: 'planned' as const, label: 'В планах' },
  { value: 'watching' as const, label: 'Смотрю' },
  { value: 'completed' as const, label: 'Просмотрено' },
];

function getTrackingSlideItems(tabValue: string): TrackingWithAnime[] {
  return tabValue === 'all' ? trackingItems.value : trackingItems.value.filter(i => i.status === tabValue);
}

function slideTrackingTo(index: number) {
  trackingSlideIndex.value = index;
  trackingSwiperRef.value?.swiper?.slideTo(index);
}

function onTrackingSlideChange(e: CustomEvent) {
  const swiper = (e.target as any)?.swiper;
  if (swiper) trackingSlideIndex.value = swiper.activeIndex;
}

// ── Load data ────────────────────────────────────────────────────────────────
onIonViewWillEnter(load);

async function load() {
  loading.value = true;
  commonListsLoading.value = true;
  try {
    const { data: user } = await friendsApi.getUser(userId);
    userProfile.value = user;

    // Load stats + recent + common lists in parallel
    const [statsRes, recentRes, listsRes] = await Promise.allSettled([
      trackingApi.getUserStats(userId),
      trackingApi.getUserTracking(userId, { limit: 5 }),
      listsApi.getSharedWith(userId),
    ]);

    if (statsRes.status === 'fulfilled') stats.value = statsRes.value.data;
    if (recentRes.status === 'fulfilled') recentAnime.value = recentRes.value.data;
    if (listsRes.status === 'fulfilled') commonLists.value = listsRes.value.data;
  } finally {
    loading.value = false;
    commonListsLoading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) {
  await load();
  ev.detail.complete();
}

// ── Tracking modal ───────────────────────────────────────────────────────────
async function openTracking(status?: TrackingStatus) {
  const tabIndex = status ? trackingTabs.findIndex(t => t.value === status) : 0;
  trackingSlideIndex.value = tabIndex >= 0 ? tabIndex : 0;
  trackingItems.value = [];
  trackingOpen.value = true;
  trackingLoading.value = true;
  try {
    const { data } = await trackingApi.getUserTracking(userId);
    trackingItems.value = data;
    // Slide to correct tab after data loads
    setTimeout(() => trackingSwiperRef.value?.swiper?.slideTo(trackingSlideIndex.value, 0), 50);
  } finally {
    trackingLoading.value = false;
  }
}
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }
.user-content { --background: #1E1E1E; }
.tracking-content { --background: #1E1E1E; }

/* ── Skeleton ────────────────────────────────────────────────────────────── */
.skeleton-wrap { }
.skeleton-header { padding: 16px 24px 24px; }

/* ── Profile hero ────────────────────────────────────────────────────────── */
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 24px 24px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #2D2D3A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-icon { font-size: 32px; color: rgba(255, 255, 255, 0.5); }

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
}

/* ── Wide cards ──────────────────────────────────────────────────────────── */
.wide-card {
  margin: 0 16px 10px;
  border-radius: 18px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.wide-card:active { opacity: 0.9; }

.lavender-card { background: #A7B8D9; }
.salmon-card { background: #FF9E9E; }

.wide-card-text { display: flex; flex-direction: column; gap: 2px; }
.wide-card-label { font-size: 13px; font-weight: 500; color: rgba(30, 30, 30, 0.7); }
.wide-card-value { font-size: 32px; font-weight: 700; color: #1E1E1E; line-height: 1; }
.sparkle-icon { font-size: 26px; color: rgba(30, 30, 30, 0.45); }

.wide-card-right-label { font-size: 13px; font-weight: 600; color: #1E1E1E; text-align: right; line-height: 1.4; }

/* ── Stat row ────────────────────────────────────────────────────────────── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0 16px 10px;
}

.stat-mini {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.stat-mini:active { opacity: 0.9; }
.stat-mini--white { background: #FFFFFF; }
.stat-mini--salmon { background: #FF9E9E; }

.stat-mini-label { font-size: 10px; font-weight: 500; color: rgba(255, 255, 255, 0.6); line-height: 1.3; }
.stat-mini-label.dark { color: rgba(30, 30, 30, 0.6); }
.stat-mini-value { font-size: 20px; font-weight: 700; color: #FFFFFF; line-height: 1; }
.stat-mini-value.dark { color: #1E1E1E; }

/* ── Recent thumbs ───────────────────────────────────────────────────────── */
.recent-thumbs { position: relative; height: 40px; width: 90px; flex-shrink: 0; }
.recent-thumb {
  position: absolute;
  width: 40px; height: 40px;
  border-radius: 8px; object-fit: cover;
  border: 2px solid #FF9E9E; top: 0;
}

/* ── Section ─────────────────────────────────────────────────────────────── */
.section-header { padding: 12px 16px 8px; }
.section-title { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0; }

/* ── Lists grid ──────────────────────────────────────────────────────────── */
.lists-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.list-card {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-card:active { background: #383848; }

.list-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
}

.list-card-meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── Empty ────────────────────────────────────────────────────────────────── */
.empty-section {
  padding: 24px 16px;
  text-align: center;
}

.empty-section p {
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  font-size: 14px;
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Tracking modal                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */

.segment-wrap {
  padding: 12px 16px 16px;
}

.custom-segment {
  display: flex;
  gap: 0;
  background: rgba(251, 249, 246, 0.5);
  border-radius: 12px;
  padding: 3px;
}

.seg-btn {
  flex: 1;
  padding: 8px 4px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}

.seg-btn--all { background: #2D2D3A; color: #FFFFFF; font-weight: 600; }
.seg-btn--planned { background: #697289; color: #FFFFFF; font-weight: 600; }
.seg-btn--watching { background: #FFFFFF; color: #1A1A1A; font-weight: 600; }
.seg-btn--completed { background: #FF9E9E; color: #1A1A1A; font-weight: 600; }

/* ── Tracking list ───────────────────────────────────────────────────────── */
.tracking-list {
  padding: 0 16px;
}

.tracking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tracking-item + .tracking-item {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.tracking-item:active { opacity: 0.8; }

.tracking-thumb {
  width: 64px;
  height: 90px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #2D2D3A;
}

.tracking-body {
  flex: 1;
  min-width: 0;
}

.tracking-name {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tracking-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.status-badge--planned { background: rgba(105, 114, 137, 0.25); color: #697289; }
.status-badge--watching { background: rgba(167, 184, 217, 0.2); color: #A7B8D9; }
.status-badge--completed { background: rgba(255, 158, 158, 0.2); color: #FF9E9E; }

.tracking-score {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

/* ── Swiper ──────────────────────────────────────────────────────────────── */
.tracking-swiper {
  height: calc(100% - 60px);
}

.tracking-slide {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: 100%;
}
</style>
