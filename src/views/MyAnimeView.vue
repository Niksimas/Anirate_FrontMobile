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

      <div class="segment-wrap">
        <ion-segment v-model="segment">
          <ion-segment-button value="all">Все</ion-segment-button>
          <ion-segment-button value="planned">В планах</ion-segment-button>
          <ion-segment-button value="watching">Смотрю</ion-segment-button>
          <ion-segment-button value="completed">Просмотрено</ion-segment-button>
        </ion-segment>
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 5" :key="i" class="anime-list-item skeleton-item">
          <ion-skeleton-text animated class="skeleton-thumb" />
          <div class="skeleton-text">
            <ion-skeleton-text animated style="height:16px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:12px;width:50%;" />
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
            <p class="anime-score" v-if="item.score">Оценка: {{ item.score }}/10</p>
          </div>
          <button class="more-btn" @click.stop="openActions(item)">
            <ion-icon :icon="ellipsisHorizontal" />
          </button>
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

      <ion-infinite-scroll @ion-infinite="loadMore">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>

    <!-- Quick actions sheet -->
    <ion-action-sheet
      :is-open="!!selectedItem"
      :header="selectedItem?.anime_title"
      :buttons="actionButtons"
      @did-dismiss="selectedItem = null"
    />

    <!-- Tracking edit modal -->
    <ion-modal ref="trackingModal" :initial-breakpoint="0.5" :breakpoints="[0, 0.5, 0.75]">
      <TrackingSheet
        v-if="editingItem"
        :anime-id="editingItem.anime_id"
        :tracking="editingTracking"
        @close="trackingModal?.$el.dismiss()"
        @saved="onSaved"
        @removed="onRemoved"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
  IonSkeletonText, IonIcon, IonButton, IonModal,
  IonInfiniteScroll, IonInfiniteScrollContent, IonActionSheet,
} from '@ionic/vue';
import { listOutline, ellipsisHorizontal } from 'ionicons/icons';
import TrackingSheet from '@/components/TrackingSheet.vue';
import { trackingApi } from '@/api/tracking';
import type { TrackingWithAnime, TrackingStatus, TrackingResponse } from '@/types';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const segment = ref<'all' | TrackingStatus>('all');
const items = ref<TrackingWithAnime[]>([]);
const loading = ref(true);
const selectedItem = ref<TrackingWithAnime | null>(null);
const editingItem = ref<TrackingWithAnime | null>(null);
const trackingModal = ref();
const offset = ref(0);
const LIMIT = 30;

const STATUS_LABELS: Record<string, string> = {
  planned: 'В планах',
  watching: 'Смотрю',
  completed: 'Просмотрено',
};

const filteredList = computed(() =>
  segment.value === 'all' ? items.value : items.value.filter((i) => i.status === segment.value)
);

const editingTracking = computed((): TrackingResponse | null => {
  if (!editingItem.value) return null;
  const i = editingItem.value;
  return { id: i.id, anime_id: i.anime_id, status: i.status, score: i.score, created_at: i.created_at, updated_at: i.updated_at };
});

const actionButtons = computed(() => [
  {
    text: 'Изменить',
    handler: () => {
      editingItem.value = selectedItem.value;
      selectedItem.value = null;
      trackingModal.value?.$el.present();
    },
  },
  {
    text: 'Открыть аниме',
    handler: () => {
      if (selectedItem.value) router.push(`/anime/${selectedItem.value.anime_id}`);
    },
  },
  { text: 'Отмена', role: 'cancel' },
]);

onMounted(load);

async function load() {
  loading.value = true;
  offset.value = 0;
  try {
    const { data } = await trackingApi.getMyTracking({ limit: LIMIT, offset: 0 });
    items.value = data;
  } finally {
    loading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }

async function loadMore(ev: InfiniteScrollCustomEvent) {
  offset.value += LIMIT;
  const { data } = await trackingApi.getMyTracking({ limit: LIMIT, offset: offset.value });
  items.value = [...items.value, ...data];
  ev.target.complete();
}

function openActions(item: TrackingWithAnime) { selectedItem.value = item; }

function onSaved(updated: TrackingResponse) {
  const idx = items.value.findIndex((i) => i.anime_id === updated.anime_id);
  if (idx !== -1) items.value[idx] = { ...items.value[idx], status: updated.status, score: updated.score ?? null };
  trackingModal.value?.$el.dismiss();
  editingItem.value = null;
}

function onRemoved() {
  if (editingItem.value) items.value = items.value.filter((i) => i.anime_id !== editingItem.value!.anime_id);
  trackingModal.value?.$el.dismiss();
  editingItem.value = null;
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

.segment-wrap {
  padding: 0 16px 12px;
}

ion-segment {
  --background: #2D2D3A;
  border-radius: 12px;
  padding: 3px;
}

ion-segment-button {
  --color: rgba(255,255,255,0.5);
  --color-checked: #1E1E1E;
  --background-checked: #FFFFFF;
  --border-radius: 10px;
  --indicator-color: transparent;
  font-size: 12px;
  font-weight: 500;
  min-height: 32px;
}

/* List items */
.anime-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
}

.anime-thumb {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #2D2D3A;
}

.anime-meta {
  flex: 1;
  min-width: 0;
}

.anime-name {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anime-season {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 2px;
  text-transform: capitalize;
}

.anime-score {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

.more-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 20px;
  padding: 8px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Skeleton */
.skeleton-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
.skeleton-thumb { width: 60px; height: 60px; border-radius: 10px; flex-shrink: 0; --background: #2D2D3A; }
.skeleton-text { flex: 1; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 24px; text-align: center; gap: 12px;
}
.empty-icon { font-size: 56px; color: #697289; }
.empty-state p { color: #FFFFFF; margin: 0; }
</style>
