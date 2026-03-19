<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/lists" />
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="addAnimeModal?.$el.present()">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
          <ion-button v-if="isOwner" @click="settingsAlert = true">
            <ion-icon slot="icon-only" :icon="ellipsisHorizontal" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="list-detail-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- List header -->
      <div class="list-header" v-if="list">
        <h1 class="list-title">{{ list.name }}</h1>
        <p class="list-meta">
          <span>Участники {{ list.member_count }}</span>
          <span class="meta-sep">·</span>
          <span>Аниме {{ animeList.length }}</span>
        </p>
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 4" :key="i" class="anime-list-item skeleton-item">
          <ion-skeleton-text animated class="skeleton-thumb" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:14px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:12px;width:50%;" />
          </div>
        </div>
      </div>

      <!-- List -->
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
            <p class="anime-season">Добавлено в список</p>
            <p v-if="item.average_score" class="anime-avg">Средняя оценка участников: {{ item.average_score.toFixed(1) }}/10</p>
          </div>
          <button class="status-pill" :class="{ 'status-pill--active': hasMyRating(item) }">
            <ion-icon v-if="hasMyRating(item)" :icon="checkmarkOutline" />
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

    <!-- Members sheet -->
    <ion-modal ref="membersMenu" :initial-breakpoint="0.75" :breakpoints="[0, 0.75, 1]">
      <ListMembersSheet
        :list-id="listId"
        :owner-id="list?.owner_id"
        :my-user-id="myUserId"
        @close="membersMenu?.$el.dismiss()"
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
import { addOutline, ellipsisHorizontal, albumsOutline, checkmarkOutline } from 'ionicons/icons';
import RateAnimeSheet from '@/components/RateAnimeSheet.vue';
import AddAnimeSheet from '@/components/AddAnimeSheet.vue';
import ListMembersSheet from '@/components/ListMembersSheet.vue';
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
const membersMenu = ref();
const ratingItem = ref<ListAnimeResponse | null>(null);
const settingsAlert = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');

const isOwner = computed(() => list.value?.owner_id === myUserId.value);

function hasMyRating(item: ListAnimeResponse): boolean {
  return (item.ratings?.some((r) => r.user_id === myUserId.value)) ?? false;
}

const ownerButtons = computed(() => [
  {
    text: 'Участники',
    handler: () => membersMenu.value?.$el.present(),
  },
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
    role: 'destructive',
    handler: async () => {
      await listsApi.delete(listId);
      router.replace('/tabs/profile');
    },
  },
  { text: 'Отмена', role: 'cancel' },
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
.list-detail-content { --background: #1E1E1E; }

.list-header {
  padding: 8px 16px 16px;
}

.list-title {
  font-size: 26px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 4px;
  letter-spacing: -0.4px;
}

.list-meta {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin: 0;
  display: flex;
  gap: 6px;
}

.meta-sep { color: rgba(255,255,255,0.25); }

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

.anime-meta { flex: 1; min-width: 0; }

.anime-name {
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anime-season {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin: 0 0 2px;
  text-transform: capitalize;
}

.anime-avg {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  margin: 0;
}

.status-pill {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  background: #2D2D3A;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-pill--active {
  background: #3D5C3D;
  color: #5cb85c;
}

/* Skeleton */
.skeleton-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
.skeleton-thumb { width: 60px; height: 60px; border-radius: 10px; flex-shrink: 0; --background: #2D2D3A; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 24px; gap: 12px; text-align: center;
}
.empty-icon { font-size: 56px; color: #697289; }
.empty-state p { color: #FBF9F6; margin: 0; }
.hint { color: rgba(255,255,255,0.4) !important; font-size: 0.85rem; }
</style>
