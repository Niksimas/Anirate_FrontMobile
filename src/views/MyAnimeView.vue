<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Мои аниме</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="segment">
          <ion-segment-button value="all">Все</ion-segment-button>
          <ion-segment-button value="planned">В планах</ion-segment-button>
          <ion-segment-button value="watching">Смотрю</ion-segment-button>
          <ion-segment-button value="completed">Просмотрено</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Skeleton -->
      <div v-if="loading" class="anime-grid">
        <div v-for="i in 9" :key="i" class="anime-card-skeleton">
          <ion-skeleton-text animated class="skeleton-poster" />
          <ion-skeleton-text animated class="skeleton-title" />
        </div>
      </div>

      <!-- Grid -->
      <div v-else-if="filteredList.length" class="anime-grid">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="anime-card-wrap"
          @click="openActions(item)"
        >
          <div class="anime-card__poster">
            <img :src="item.anime_image_url" :alt="item.anime_title" loading="lazy" />
            <div class="anime-card__badge" :class="`badge--${item.status}`">
              {{ STATUS_LABELS[item.status] }}
            </div>
            <div v-if="item.score" class="anime-card__score">★ {{ item.score }}</div>
          </div>
          <p class="anime-card__title">{{ item.anime_title }}</p>
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
    <ion-modal
      ref="trackingModal"
      :initial-breakpoint="0.5"
      :breakpoints="[0, 0.5, 0.75]"
    >
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton,
  IonContent, IonRefresher, IonRefresherContent, IonSkeletonText, IonIcon,
  IonButton, IonModal, IonInfiniteScroll, IonInfiniteScrollContent, IonActionSheet,
} from '@ionic/vue';
import { listOutline } from 'ionicons/icons';
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

async function refresh(ev: RefresherCustomEvent) {
  await load();
  ev.detail.complete();
}

async function loadMore(ev: InfiniteScrollCustomEvent) {
  offset.value += LIMIT;
  const { data } = await trackingApi.getMyTracking({ limit: LIMIT, offset: offset.value });
  items.value = [...items.value, ...data];
  ev.target.complete();
}

function openActions(item: TrackingWithAnime) {
  selectedItem.value = item;
}

function onSaved(updated: TrackingResponse) {
  const idx = items.value.findIndex((i) => i.anime_id === updated.anime_id);
  if (idx !== -1) {
    items.value[idx] = { ...items.value[idx], status: updated.status, score: updated.score ?? null };
  }
  trackingModal.value?.$el.dismiss();
  editingItem.value = null;
}

function onRemoved() {
  if (editingItem.value) {
    items.value = items.value.filter((i) => i.anime_id !== editingItem.value!.anime_id);
  }
  trackingModal.value?.$el.dismiss();
  editingItem.value = null;
}
</script>

<style scoped>
.anime-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
}
.anime-card-wrap { cursor: pointer; display: flex; flex-direction: column; gap: 6px; }
.anime-card__poster {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 2/3;
  background: var(--ion-color-step-100);
}
.anime-card__poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.anime-card__badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.62rem;
  font-weight: 600;
  color: #fff;
}
.badge--planned { background: var(--ion-color-medium); }
.badge--watching { background: var(--ion-color-primary); }
.badge--completed { background: var(--ion-color-success); }
.anime-card__score {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(0,0,0,0.65);
  color: #ffd700;
}
.anime-card__title {
  font-size: 0.78rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.anime-card-skeleton .skeleton-poster { aspect-ratio: 2/3; border-radius: 10px; width: 100%; }
.anime-card-skeleton .skeleton-title { height: 14px; border-radius: 4px; margin-top: 4px; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  gap: 12px;
}
.empty-icon { font-size: 56px; color: var(--ion-color-medium); }
</style>
