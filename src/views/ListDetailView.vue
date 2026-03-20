<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/lists" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="list-detail-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- List header -->
      <div v-if="list" class="list-header">
        <h1 class="list-title">{{ list.name }}</h1>
        <div class="list-meta-row">
          <button class="meta-link" @click="router.push(`/tabs/lists/${listId}/members?owner=${list.owner_id}`)">
            Участники&nbsp;&nbsp;{{ list.member_count }}
          </button>
          <button v-if="isOwner" class="meta-link meta-link--add" @click="router.push(`/tabs/lists/${listId}/add-members`)">
            Добавить участников
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 4" :key="i" class="anime-list-item">
          <ion-skeleton-text animated class="skeleton-thumb" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:18px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:14px;width:50%;margin-bottom:10px;" />
            <ion-skeleton-text animated style="height:13px;width:60%;" />
          </div>
        </div>
      </div>

      <!-- Anime list -->
      <div v-else-if="animeList.length">
        <div
          v-for="item in animeList"
          :key="item.anime_id"
          class="anime-list-item"
          @click="openRating(item)"
        >
          <img :src="item.image_url" :alt="item.title" class="anime-thumb" />
          <div class="anime-meta">
            <p class="anime-name">{{ item.title }}</p>
            <p class="anime-season">Весна / 2024</p>
            <p v-if="item.average_score" class="anime-avg">Средняя оценка участников: {{ item.average_score.toFixed(1) }}/10</p>
            <p v-else-if="getMyRating(item)" class="anime-avg">Оценка: {{ getMyRating(item) }}/10</p>
          </div>
          <button
            class="status-pill"
            :class="{ 'status-pill--active': hasMyRating(item) }"
            @click.stop
          >
            <ion-icon v-if="hasMyRating(item)" :icon="checkmarkCircle" class="status-check" />
            В планах
          </button>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <ion-icon :icon="albumsOutline" class="empty-icon" />
        <p>Список пуст</p>
        <p class="hint">Добавь первое аниме</p>
      </div>
    </ion-content>

    <!-- Rate anime modal -->
    <ion-modal ref="rateModal" :initial-breakpoint="0.6" :breakpoints="[0, 0.6]">
      <RateAnimeSheet
        v-if="ratingItem"
        :list-id="listId"
        :item="ratingItem"
        :my-user-id="myUserId"
        @close="rateModal?.$el.dismiss()"
        @saved="onRatingSaved"
        @remove-anime="onAnimeRemoved"
      />
    </ion-modal>

    <!-- Add anime modal -->
    <ion-modal ref="addAnimeModal" :initial-breakpoint="0.9" :breakpoints="[0, 0.9, 1]">
      <AddAnimeSheet
        :list-id="listId"
        @close="addAnimeModal?.$el.dismiss()"
        @added="onAnimeAdded"
      />
    </ion-modal>

    <!-- Settings action sheet -->
    <ion-action-sheet
      :is-open="settingsAlert"
      header="Управление списком"
      :buttons="ownerButtons"
      @did-dismiss="settingsAlert = false"
    />

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2500" @did-dismiss="toastOpen=false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonSkeletonText,
  IonModal, IonActionSheet, IonToast,
} from '@ionic/vue';
import { addOutline, ellipsisHorizontal, albumsOutline, checkmarkCircle } from 'ionicons/icons';
import RateAnimeSheet from '@/components/RateAnimeSheet.vue';
import AddAnimeSheet from '@/components/AddAnimeSheet.vue';
import { listsApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth';
import type { SharedListResponse, ListAnimeResponse } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';
import { Clipboard } from '@capacitor/clipboard';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const listId = Number(route.params.id);
const myUserId = computed(() => authStore.user?.id ?? 0);
const list = ref<SharedListResponse | null>(null);
const animeList = ref<ListAnimeResponse[]>([]);
const loading = ref(true);
const rateModal = ref();
const addAnimeModal = ref();
const ratingItem = ref<ListAnimeResponse | null>(null);
const settingsAlert = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');

const isOwner = computed(() => list.value?.owner_id === myUserId.value);

function hasMyRating(item: ListAnimeResponse): boolean {
  return (item.ratings?.some((r) => r.user_id === myUserId.value)) ?? false;
}

function getMyRating(item: ListAnimeResponse): number | null {
  const r = item.ratings?.find((r) => r.user_id === myUserId.value);
  return r?.score ?? null;
}

const ownerButtons = computed(() => [
  {
    text: 'Скопировать инвайт-код',
    handler: async () => {
      if (list.value?.invite_code) {
        await Clipboard.write({ string: list.value.invite_code });
        toastMsg.value = 'Код скопирован';
        toastOpen.value = true;
      }
    },
  },
  {
    text: 'Обновить инвайт-код',
    handler: async () => {
      await listsApi.regenerateInvite(listId);
      await loadList();
      toastMsg.value = 'Инвайт-код обновлён';
      toastOpen.value = true;
    },
  },
  {
    text: 'Удалить список',
    role: 'destructive' as const,
    handler: async () => {
      await listsApi.delete(listId);
      router.replace('/tabs/lists');
    },
  },
  { text: 'Отмена', role: 'cancel' as const },
]);

onMounted(load);

async function load() {
  loading.value = true;
  try { await Promise.all([loadList(), loadAnime()]); }
  finally { loading.value = false; }
}

async function loadList() {
  const { data } = await listsApi.getById(listId);
  list.value = data;
}

async function loadAnime() {
  const { data } = await listsApi.getAnimeList(listId);
  animeList.value = data;
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }

function openRating(item: ListAnimeResponse) {
  ratingItem.value = item;
  rateModal.value?.$el.present();
}

function onRatingSaved() { loadAnime(); rateModal.value?.$el.dismiss(); }
function onAnimeRemoved(animeId: number) {
  animeList.value = animeList.value.filter((a) => a.anime_id !== animeId);
  rateModal.value?.$el.dismiss();
}
function onAnimeAdded(item: ListAnimeResponse) {
  animeList.value.push(item);
  addAnimeModal.value?.$el.dismiss();
}
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }
.list-detail-content { --background: #111111; }

.list-header {
  padding: 8px 16px 16px;
}

.list-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.list-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
  cursor: pointer;
}

.meta-link--add {
  color: rgba(255, 255, 255, 0.5);
}

/* Anime list items */
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

.anime-avg {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* Status pill */
.status-pill {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: #697289;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.status-pill--active {
  background: #FFFFFF;
  color: #1A1A1A;
}

.status-check {
  font-size: 18px;
  color: #4CAF50;
}

/* Skeleton */
.skeleton-thumb {
  width: 100px;
  height: 130px;
  border-radius: 12px;
  flex-shrink: 0;
  --background: #2D2D3A;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 12px;
  text-align: center;
}

.empty-icon { font-size: 56px; color: #697289; }
.empty-state p { color: #FBF9F6; margin: 0; }
.hint { color: rgba(255, 255, 255, 0.4) !important; font-size: 0.85rem; }
</style>
