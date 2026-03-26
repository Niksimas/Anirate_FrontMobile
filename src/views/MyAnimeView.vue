<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/profile" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div class="page-title-wrap">
        <h1 class="page-title">Мои аниме</h1>
      </div>

      <!-- Segment tabs -->
      <div class="segment-wrap">
        <div class="custom-segment">
          <button
            v-for="(tab, i) in tabs"
            :key="tab.value"
            class="seg-btn"
            :class="{
              'seg-btn--active': activeIndex === i,
              [`seg-btn--${tab.value}`]: activeIndex === i,
            }"
            @click="slideTo(i)"
          >{{ tab.label }}</button>
        </div>
      </div>

      <!-- Skeleton (initial load) -->
      <div v-if="loading" class="anime-list">
        <div v-for="i in 6" :key="i" class="anime-item">
          <ion-skeleton-text animated class="skeleton-thumb" />
          <div class="skeleton-text">
            <ion-skeleton-text animated style="height:16px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:24px;width:50%;border-radius:12px;" />
          </div>
        </div>
      </div>

      <!-- Swiper slides -->
      <swiper-container
        v-show="!loading"
        ref="swiperRef"
        :initial-slide="0"
        :speed="250"
        @swiperslidechange="onSlideChange"
        class="tracking-swiper"
      >
        <swiper-slide v-for="(tab, i) in tabs" :key="tab.value" class="tracking-slide">
          <div v-if="getSlideItems(tab.value).length" class="anime-list">
            <div
              v-for="item in getSlideItems(tab.value)"
              :key="item.id"
              class="anime-item"
              @click="openSheet(item)"
            >
              <img :src="fixUrl(item.anime_image_url)" :alt="item.anime_title" class="anime-thumb" />
              <div class="anime-body">
                <p class="anime-name">{{ item.anime_title }}</p>
                <div class="anime-meta-row">
                  <span class="status-badge" :class="`status-badge--${item.status}`">
                    {{ STATUS_LABELS[item.status] }}
                  </span>
                  <span v-if="item.score" class="anime-score">★ {{ item.score }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <ion-icon :icon="listOutline" class="empty-icon" />
            <p class="empty-title">Список пуст</p>
            <button v-if="i === 0" class="empty-btn" @click="router.push('/tabs/search')">
              Найти аниме
            </button>
          </div>
        </swiper-slide>
      </swiper-container>
    </ion-content>

    <!-- Tracking sheet -->
    <ion-modal ref="trackingModal" :initial-breakpoint="0.55" :breakpoints="[0, 0.55, 0.85]" @did-dismiss="activeItem = null">
      <TrackingSheet
        v-if="activeItem"
        :anime-id="activeItem.anime_id"
        :tracking="itemToTracking(activeItem)"
        :anime-title="activeItem.anime_title"
        :anime-image-url="fixUrl(activeItem.anime_image_url)"
        :show-navigate="true"
        @close="trackingModal?.$el.dismiss()"
        @saved="onSaved"
        @removed="onRemoved"
        @navigate="onNavigate"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonIcon, IonModal,
} from '@ionic/vue';
import { register } from 'swiper/element/bundle';
import { listOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { trackingApi } from '@/api/tracking';
import TrackingSheet from '@/components/TrackingSheet.vue';
import type { TrackingWithAnime, TrackingResponse, TrackingStatus } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

register();

const router = useRouter();
const items = ref<TrackingWithAnime[]>([]);
const loading = ref(true);
const swiperRef = ref();
const activeIndex = ref(0);

const trackingModal = ref();
const activeItem = ref<TrackingWithAnime | null>(null);

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

function getSlideItems(tabValue: string): TrackingWithAnime[] {
  return tabValue === 'all' ? items.value : items.value.filter(i => i.status === tabValue);
}

function slideTo(index: number) {
  activeIndex.value = index;
  swiperRef.value?.swiper?.slideTo(index);
}

function onSlideChange(e: CustomEvent) {
  const swiper = (e.target as any)?.swiper;
  if (swiper) activeIndex.value = swiper.activeIndex;
}

function itemToTracking(item: TrackingWithAnime): TrackingResponse {
  return {
    id: item.id,
    anime_id: item.anime_id,
    status: item.status,
    score: item.score,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function openSheet(item: TrackingWithAnime) {
  activeItem.value = item;
  trackingModal.value?.$el.present();
}

function onSaved(response: TrackingResponse) {
  trackingModal.value?.$el.dismiss();
  const idx = items.value.findIndex(i => i.anime_id === response.anime_id);
  if (idx !== -1) {
    items.value[idx] = { ...items.value[idx], status: response.status, score: response.score ?? null };
  }
}

function onRemoved() {
  trackingModal.value?.$el.dismiss();
  if (activeItem.value) {
    items.value = items.value.filter(i => i.id !== activeItem.value!.id);
  }
}

function onNavigate() {
  trackingModal.value?.$el.dismiss();
  if (activeItem.value) {
    router.push(`/anime/${activeItem.value.anime_id}`);
  }
}

// ── Data loading ─────────────────────────────────────────────────────────────
onIonViewWillEnter(load);

async function load() {
  loading.value = true;
  try {
    const { data } = await trackingApi.getMyTracking();
    items.value = data;
  } finally {
    loading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }
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

/* Segment */
.segment-wrap {
  padding: 0 16px 12px;
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

.seg-btn--all { background: #2D2D3A; color: #FFFFFF; font-weight: 600; }
.seg-btn--planned { background: #697289; color: #FFFFFF; font-weight: 600; }
.seg-btn--watching { background: #FFFFFF; color: #1A1A1A; font-weight: 600; }
.seg-btn--completed { background: #FF9E9E; color: #1A1A1A; font-weight: 600; }

/* ── Swiper ──────────────────────────────────────────────────────────────── */
.tracking-swiper {
  height: calc(100% - 110px);
}

.tracking-slide {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: 100%;
}

/* ── Anime list ──────────────────────────────────────────────────────────── */
.anime-list {
  padding: 0 16px;
}

.anime-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.anime-item + .anime-item {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.anime-item:active {
  opacity: 0.8;
}

.anime-thumb {
  width: 64px;
  height: 90px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #2D2D3A;
}

.anime-body {
  flex: 1;
  min-width: 0;
}

.anime-name {
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

.anime-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Status badge ────────────────────────────────────────────────────────── */
.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.status-badge--planned {
  background: rgba(105, 114, 137, 0.25);
  color: #697289;
}

.status-badge--watching {
  background: rgba(167, 184, 217, 0.2);
  color: #A7B8D9;
}

.status-badge--completed {
  background: rgba(255, 158, 158, 0.2);
  color: #FF9E9E;
}

/* ── Score ────────────────────────────────────────────────────────────────── */
.anime-score {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
.skeleton-thumb {
  width: 64px;
  height: 90px;
  border-radius: 10px;
  flex-shrink: 0;
  --background: #2D2D3A;
}

.skeleton-text {
  flex: 1;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
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

.empty-title {
  color: #FFFFFF;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.empty-btn:active { opacity: 0.85; }
</style>
