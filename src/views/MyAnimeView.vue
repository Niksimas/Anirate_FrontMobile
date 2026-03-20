<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/profile" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content @click="expandedItemId = null">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div class="page-title-wrap">
        <h1 class="page-title">Мои аниме</h1>
      </div>

      <!-- Custom segment -->
      <div class="segment-wrap">
        <div class="custom-segment">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="seg-btn"
            :class="{
              'seg-btn--active': segment === tab.value,
              [`seg-btn--${tab.value}`]: segment === tab.value,
            }"
            @click="onSegmentChange(tab.value)"
          >{{ tab.label }}</button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 5" :key="i" class="anime-list-item">
          <ion-skeleton-text animated class="skeleton-thumb" />
          <div class="skeleton-text">
            <ion-skeleton-text animated style="height:18px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:14px;width:50%;margin-bottom:10px;" />
            <ion-skeleton-text animated style="height:13px;width:40%;" />
          </div>
        </div>
      </div>

      <!-- List -->
      <div v-else-if="filteredList.length">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="anime-list-item"
          @click="router.push(`/anime/${item.anime_id}`)"
        >
          <img :src="item.anime_image_url" :alt="item.anime_title" class="anime-thumb" />
          <div class="anime-meta">
            <p class="anime-name">{{ item.anime_title }}</p>
            <p class="anime-season">{{ STATUS_LABELS[item.status] }}</p>
            <p v-if="item.score" class="anime-score">Оценка: {{ item.score }}/10</p>
          </div>

          <!-- Three dots (only on filtered tabs) -->
          <button
            v-if="segment !== 'all' && expandedItemId !== item.id"
            class="more-btn"
            @click.stop="expandedItemId = item.id"
          >
            <ion-icon :icon="ellipsisHorizontal" />
          </button>

          <!-- Inline status popup -->
          <transition name="popup-fade">
            <div
              v-if="expandedItemId === item.id"
              class="status-popup"
              @click.stop
            >
              <button
                v-if="prevStatus(item.status)"
                class="popup-btn popup-btn--prev"
                @click.stop="changeStatus(item, prevStatus(item.status)!)"
              >
                <ion-icon :icon="chevronBackOutline" class="popup-chevron" />
                {{ STATUS_LABELS[prevStatus(item.status)!] }}
              </button>
              <button
                v-if="nextStatus(item.status)"
                class="popup-btn"
                :class="nextStatus(item.status) === 'completed' ? 'popup-btn--salmon' : 'popup-btn--next'"
                @click.stop="changeStatus(item, nextStatus(item.status)!)"
              >
                {{ STATUS_LABELS[nextStatus(item.status)!] }}
                <ion-icon :icon="chevronForwardOutline" class="popup-chevron" />
              </button>
              <button class="popup-close" @click.stop="expandedItemId = null">
                <ion-icon :icon="closeOutline" />
              </button>
            </div>
          </transition>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <ion-icon :icon="listOutline" class="empty-icon" />
        <p>Список пуст</p>
        <ion-button fill="outline" size="small" @click="router.push('/tabs/search')">
          Найти аниме
        </ion-button>
      </div>

      <ion-infinite-scroll :disabled="noMore" @ion-infinite="loadMore">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonIcon, IonButton,
  IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/vue';
import {
  listOutline, ellipsisHorizontal,
  chevronBackOutline, chevronForwardOutline, closeOutline,
} from 'ionicons/icons';
import { trackingApi } from '@/api/tracking';
import type { TrackingWithAnime, TrackingStatus } from '@/types';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const segment = ref<'all' | TrackingStatus>('all');
const items = ref<TrackingWithAnime[]>([]);
const loading = ref(true);
const noMore = ref(false);
const expandedItemId = ref<number | null>(null);
const offset = ref(0);
const LIMIT = 30;

const tabs = [
  { value: 'all' as const, label: 'Все' },
  { value: 'planned' as const, label: 'В планах' },
  { value: 'watching' as const, label: 'Смотрю' },
  { value: 'completed' as const, label: 'Просмотрено' },
];

const STATUS_LABELS: Record<string, string> = {
  planned: 'В планах',
  watching: 'Смотрю',
  completed: 'Просмотрено',
};

const filteredList = computed(() =>
  segment.value === 'all' ? items.value : items.value.filter((i) => i.status === segment.value)
);

function prevStatus(status: TrackingStatus): TrackingStatus | null {
  if (status === 'watching') return 'planned';
  if (status === 'completed') return 'watching';
  return null;
}

function nextStatus(status: TrackingStatus): TrackingStatus | null {
  if (status === 'planned') return 'watching';
  if (status === 'watching') return 'completed';
  return null;
}

function onSegmentChange(value: 'all' | TrackingStatus) {
  segment.value = value;
  expandedItemId.value = null;
}

onMounted(load);

async function load() {
  loading.value = true;
  offset.value = 0;
  noMore.value = false;
  try {
    const { data } = await trackingApi.getMyTracking({ limit: LIMIT, offset: 0 });
    items.value = data;
    if (data.length < LIMIT) noMore.value = true;
  } finally {
    loading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }

async function loadMore(ev: InfiniteScrollCustomEvent) {
  offset.value += LIMIT;
  const { data } = await trackingApi.getMyTracking({ limit: LIMIT, offset: offset.value });
  items.value = [...items.value, ...data];
  if (data.length < LIMIT) noMore.value = true;
  ev.target.complete();
}

async function changeStatus(item: TrackingWithAnime, newStatus: TrackingStatus) {
  expandedItemId.value = null;
  try {
    const { data } = await trackingApi.update(item.anime_id, { status: newStatus });
    const idx = items.value.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], status: data.status, score: data.score ?? null };
    }
  } catch (e) {
    console.error(e);
  }
}
</script>

<style scoped>
ion-header ion-toolbar {
  --background: #1E1E1E;
  --border-width: 0;
}

.page-title-wrap {
  padding: 8px 16px 12px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.5px;
}

/* Custom segment */
.segment-wrap {
  padding: 0 16px 16px;
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
  letter-spacing: -0.2px;
  transition: background 0.2s, color 0.2s;
}

.seg-btn--all {
  background: #2D2D3A;
  color: #FFFFFF;
  font-weight: 600;
}

.seg-btn--planned {
  background: #697289;
  color: #FFFFFF;
  font-weight: 600;
}

.seg-btn--watching {
  background: #FFFFFF;
  color: #1A1A1A;
  font-weight: 600;
}

.seg-btn--completed {
  background: #FF9E9E;
  color: #1A1A1A;
  font-weight: 600;
}

/* List items */
.anime-list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
}

.anime-thumb {
  width: 100px;
  height: 130px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
  background: #2D2D3A;
}

.anime-meta {
  flex: 1;
  min-width: 0;
}

.anime-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.anime-season {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 8px;
}

.anime-score {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.more-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 22px;
  padding: 8px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Status popup */
.status-popup {
  position: absolute;
  right: 16px;
  top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  background: rgba(55, 55, 65, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 14px;
  padding: 12px;
  z-index: 10;
  max-width: 220px;
}

.popup-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.popup-btn--prev {
  background: #4A4A5A;
  color: #FFFFFF;
}

.popup-btn--next {
  background: #F0EDE8;
  color: #1A1A1A;
}

.popup-btn--salmon {
  background: #FF9E9E;
  color: #1A1A1A;
}

.popup-chevron {
  font-size: 14px;
}

.popup-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: #4A4A5A;
  color: #FFFFFF;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

/* Popup animation */
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Skeleton */
.skeleton-thumb {
  width: 100px;
  height: 130px;
  border-radius: 12px;
  flex-shrink: 0;
  --background: #2D2D3A;
}

.skeleton-text {
  flex: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  gap: 12px;
}

.empty-icon {
  font-size: 56px;
  color: #697289;
}

.empty-state p {
  color: #FFFFFF;
  margin: 0;
}
</style>
