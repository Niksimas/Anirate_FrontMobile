<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/profile" />
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="settingsAlert = true">
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
      <div v-if="list" class="list-header">
        <h1 class="list-title">{{ list.name }}</h1>
        <p v-if="list.description" class="list-description">{{ list.description }}</p>

        <!-- Average score -->
        <div v-if="averageScore !== null" class="hero-score">
          <span class="hero-score-value">{{ averageScore }}</span>
          <span class="hero-score-label">средняя оценка</span>
        </div>
        <div v-else-if="!loading && animeList.length" class="hero-score">
          <span class="hero-score-value hero-score-value--muted">—</span>
          <span class="hero-score-label">пока нет оценок</span>
        </div>

        <div class="list-meta-row">
          <button class="meta-chip" @click="router.push(`/tabs/lists/${listId}/members?owner=${list.owner_id}`)">
            <ion-icon :icon="peopleOutline" class="meta-chip-icon" />
            <span>{{ list.member_count }} участн.</span>
          </button>
          <button class="meta-chip" @click="router.push(`/tabs/lists/${listId}/members?owner=${list.owner_id}`)">
            <ion-icon :icon="filmOutline" class="meta-chip-icon" />
            <span>{{ animeList.length }} аниме</span>
          </button>
          <button
            v-if="isOwner"
            class="meta-chip meta-chip--accent"
            @click="router.push(`/tabs/lists/${listId}/add-members`)"
          >
            <ion-icon :icon="personAddOutline" class="meta-chip-icon" />
            <span>Пригласить</span>
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="anime-list-wrap">
        <div v-for="i in 4" :key="i" class="anime-list-item">
          <ion-skeleton-text animated class="skeleton-thumb" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:18px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:14px;width:50%;margin-bottom:10px;" />
            <ion-skeleton-text animated style="height:32px;width:80%;border-radius:10px;" />
          </div>
        </div>
      </div>

      <!-- Anime list -->
      <div v-else-if="animeList.length" class="anime-list-wrap">
        <div
          v-for="item in animeList"
          :key="item.anime_id"
          class="anime-list-item"
          @click="router.push(`/tabs/lists/${listId}/anime/${item.anime_id}/ratings`)"
        >
          <div class="thumb-wrapper">
            <img :src="fixUrl(item.image_url)" :alt="item.title" class="anime-thumb" />
            <span v-if="item.average_score != null" class="score-badge">
              {{ Math.round(item.average_score) }}
            </span>
          </div>

          <div class="anime-body">
            <div class="anime-meta">
              <p class="anime-name">{{ item.title }}</p>
              <p v-if="item.anime_type || item.season || item.year" class="anime-season">
                {{ [formatAnimeType(item.anime_type), item.season, item.year].filter(Boolean).join(' · ') }}
              </p>
            </div>

            <div class="item-actions">
              <button
                class="action-btn"
                :class="{ 'action-btn--done': isTracked(item) }"
                @click.stop="togglePlan(item)"
              >
                <ion-icon :icon="isTracked(item) ? checkmarkCircle : addCircleOutline" class="action-btn-icon" />
                {{ isTracked(item) ? 'В плане' : 'В план' }}
              </button>
              <button
                class="action-btn"
                :class="myRatingFor(item) != null ? 'action-btn--rated' : 'action-btn--rate'"
                @click.stop="openRating(item)"
              >
                <ion-icon :icon="myRatingFor(item) != null ? star : starOutline" class="action-btn-icon" />
                {{ myRatingFor(item) != null ? myRatingFor(item) : 'Оценить' }}
              </button>
              <button
                v-if="isOwner"
                class="action-btn action-btn--remove"
                @click.stop="confirmRemoveAnime(item)"
              >
                <ion-icon :icon="trashOutline" class="action-btn-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <ion-icon :icon="albumsOutline" class="empty-icon" />
        <p class="empty-title">Список пуст</p>
        <p class="empty-hint">Добавь первое аниме в список</p>
        <button class="empty-add-btn" @click="addAnimeModal?.$el.present()">
          <ion-icon :icon="addOutline" />
          Добавить аниме
        </button>
      </div>

      <!-- Bottom spacer for FAB -->
      <div v-if="animeList.length" style="height: 80px;" />
    </ion-content>

    <!-- FAB: add anime -->
    <ion-fab v-if="!loading" vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="addAnimeModal?.$el.present()">
        <ion-icon :icon="addOutline" />
      </ion-fab-button>
    </ion-fab>

    <!-- Rate anime modal -->
    <ion-modal ref="rateModal" :initial-breakpoint="0.6" :breakpoints="[0, 0.6]" @did-dismiss="ratingItem = null">
      <RateAnimeSheet
        v-if="ratingItem"
        :list-id="listId"
        :item="ratingItem"
        :my-rating="currentMyRating"
        @close="rateModal?.$el.dismiss()"
        @saved="onRatingSaved"
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

    <!-- Action sheet: context menu -->
    <ion-action-sheet
      :is-open="settingsAlert"
      header="Управление списком"
      :buttons="actionButtons"
      @did-dismiss="settingsAlert = false"
    />

    <!-- Confirm remove anime -->
    <ion-alert
      :is-open="!!removingItem"
      header="Удалить аниме"
      :message="`Убрать «${removingItem?.title}» из списка?`"
      :buttons="removeAlertButtons"
      @did-dismiss="removingItem = null"
    />

    <!-- Confirm delete list -->
    <ion-alert
      :is-open="confirmDeleteList"
      header="Удалить список"
      message="Список будет удалён для всех участников. Это действие нельзя отменить."
      :buttons="deleteListAlertButtons"
      @did-dismiss="confirmDeleteList = false"
    />

    <!-- Confirm leave list -->
    <ion-alert
      :is-open="confirmLeave"
      header="Покинуть список"
      message="Ты больше не будешь видеть этот список и его содержимое."
      :buttons="leaveAlertButtons"
      @did-dismiss="confirmLeave = false"
    />

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2500" @did-dismiss="toastOpen=false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonSkeletonText,
  IonModal, IonActionSheet, IonAlert, IonToast, IonFab, IonFabButton,
} from '@ionic/vue';
import {
  addOutline, ellipsisHorizontal, albumsOutline, checkmarkCircle,
  addCircleOutline, star, starOutline, trashOutline, peopleOutline,
  filmOutline, personAddOutline, exitOutline,
} from 'ionicons/icons';
import RateAnimeSheet from '@/components/RateAnimeSheet.vue';
import AddAnimeSheet from '@/components/AddAnimeSheet.vue';
import { fixUrl } from '@/composables/useImageUrl';
import { formatAnimeType } from '@/composables/useFormatAnimeType';
import { listsApi } from '@/api/lists';
import { trackingApi } from '@/api/tracking';
import { useAuthStore } from '@/stores/auth';
import type { SharedListResponse, ListAnimeResponse } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';


const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const listId = Number(route.params.id);
const myUserId = computed(() => authStore.user?.id ?? 0);
const list = ref<SharedListResponse | null>(null);
const animeList = ref<ListAnimeResponse[]>([]);
const trackedAnimeIds = ref<Set<number>>(new Set());
const loading = ref(true);       // only true on first load
const refreshing = ref(false);   // true during pull-to-refresh
const rateModal = ref();
const currentMyRating = ref<{ score: number; comment: string | null } | null>(null);
const addAnimeModal = ref();
const ratingItem = ref<ListAnimeResponse | null>(null);
const settingsAlert = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');
const removingItem = ref<ListAnimeResponse | null>(null);
const confirmDeleteList = ref(false);
const confirmLeave = ref(false);

const isOwner = computed(() => list.value?.owner_id === myUserId.value);

const averageScore = computed(() => {
  const scores = animeList.value
    .map(a => a.average_score)
    .filter((s): s is number => s != null);
  if (!scores.length) return null;
  return (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1);
});

function showToast(msg: string) {
  toastMsg.value = msg;
  toastOpen.value = true;
}

function myRatingFor(item: ListAnimeResponse): number | null {
  const r = item.ratings?.find(r => r.user_id === myUserId.value);
  return r ? r.score : null;
}

function isTracked(item: ListAnimeResponse): boolean {
  return trackedAnimeIds.value.has(item.anime_id);
}

async function togglePlan(item: ListAnimeResponse) {
  if (isTracked(item)) return;
  try {
    await trackingApi.add({ anime_id: item.anime_id, status: 'planned' });
    trackedAnimeIds.value.add(item.anime_id);
    showToast('Добавлено в план');
  } catch { /* already tracked */ }
}

// ── Action sheet buttons (different for owner / member) ──────────────────────
const actionButtons = computed(() => {
  if (isOwner.value) {
    return [
      {
        text: 'Удалить список',
        role: 'destructive' as const,
        icon: trashOutline,
        handler: () => { confirmDeleteList.value = true; },
      },
      { text: 'Отмена', role: 'cancel' as const },
    ];
  }

  return [
    {
      text: 'Покинуть список',
      role: 'destructive' as const,
      icon: exitOutline,
      handler: () => { confirmLeave.value = true; },
    },
    { text: 'Отмена', role: 'cancel' as const },
  ];
});

// ── Confirm alerts ───────────────────────────────────────────────────────────
const removeAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Удалить',
    role: 'destructive',
    handler: async () => {
      if (!removingItem.value) return;
      await listsApi.removeAnime(listId, removingItem.value.anime_id);
      animeList.value = animeList.value.filter(a => a.anime_id !== removingItem.value!.anime_id);
      showToast('Аниме удалено из списка');
    },
  },
];

const deleteListAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Удалить',
    role: 'destructive',
    handler: async () => {
      await listsApi.delete(listId);
      router.replace('/tabs/profile');
    },
  },
];

const leaveAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Покинуть',
    role: 'destructive',
    handler: async () => {
      await listsApi.leaveList(listId);
      router.replace('/tabs/profile');
    },
  },
];

function confirmRemoveAnime(item: ListAnimeResponse) {
  removingItem.value = item;
}

// ── Data loading ─────────────────────────────────────────────────────────────
onIonViewWillEnter(load);

async function load(isRefresh = false) {
  if (!isRefresh) loading.value = true;
  try { await Promise.all([loadList(), loadAnime(), loadTracking()]); }
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

async function loadTracking() {
  const { data } = await trackingApi.getMyTracking();
  trackedAnimeIds.value = new Set(data.map(t => t.anime_id));
}

async function refresh(ev: RefresherCustomEvent) { await load(true); ev.detail.complete(); }

function openRating(item: ListAnimeResponse) {
  ratingItem.value = item;
  const my = item.ratings?.find(r => r.user_id === myUserId.value);
  currentMyRating.value = my ? { score: my.score, comment: my.comment ?? null } : null;
  rateModal.value?.$el.present();
}

async function onRatingSaved() {
  rateModal.value?.$el.dismiss();
  await loadAnime();
}

function onAnimeAdded(item: ListAnimeResponse) {
  animeList.value.push(item);
  addAnimeModal.value?.$el.dismiss();
}
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────────────────────── */
ion-header ion-toolbar {
  --background: #1E1E1E;
  --border-width: 0;
  --color: #FBF9F6;
}

ion-title {
  font-size: 17px;
  font-weight: 600;
}

.list-detail-content { --background: #1E1E1E; }

/* ── List header ─────────────────────────────────────────────────────────── */
.list-header {
  padding: 12px 16px 8px;
}

.list-title {
  font-size: 26px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.list-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 12px;
  line-height: 1.4;
}

/* ── Hero score ──────────────────────────────────────────────────────────── */
.hero-score {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 0 12px;
}

.hero-score-value {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.hero-score-value--muted {
  background: none;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.25);
}

.hero-score-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

/* ── Meta chips ──────────────────────────────────────────────────────────── */
.list-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 4px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  background: #2D2D3A;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.meta-chip:active {
  background: #383848;
}

.meta-chip-icon {
  font-size: 15px;
}

.meta-chip--accent {
  background: rgba(167, 184, 217, 0.2);
  color: #A7B8D9;
}

.meta-chip--accent:active {
  background: rgba(167, 184, 217, 0.3);
}

/* ── Anime list ──────────────────────────────────────────────────────────── */
.anime-list-wrap {
  padding: 4px 0;
}

.anime-list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.anime-list-item:active {
  background: rgba(255, 255, 255, 0.04);
}

/* Divider between items */
.anime-list-item + .anime-list-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 128px;  /* thumb width + gap + padding */
  right: 16px;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.thumb-wrapper {
  position: relative;
  flex-shrink: 0;
}

.anime-thumb {
  width: 80px;
  height: 110px;
  border-radius: 10px;
  object-fit: cover;
  background: #2D2D3A;
  display: block;
}

.score-badge {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A7B8D9, #FF9E9E);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

/* ── Body (meta + actions) ───────────────────────────────────────────────── */
.anime-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

.anime-meta {
  min-width: 0;
}

.anime-name {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 2px;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.anime-season {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* ── Action buttons row ──────────────────────────────────────────────────── */
.item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #2D2D3A;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.1s;
  min-height: 32px;
}

.action-btn:active {
  transform: scale(0.96);
  background: #383848;
}

.action-btn-icon {
  font-size: 15px;
}

.action-btn--done {
  background: rgba(76, 175, 80, 0.15);
  color: #66BB6A;
}

.action-btn--rate {
  background: rgba(255, 158, 158, 0.15);
  color: #FF9E9E;
}

.action-btn--rated {
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-weight: 700;
  min-width: 56px;
}

.action-btn--rated .action-btn-icon {
  color: #1E1E1E;
}

.action-btn--remove {
  background: rgba(231, 111, 111, 0.12);
  color: #E76F6F;
  padding: 6px 10px;
  min-height: 34px;
}

.action-btn--remove .action-btn-icon {
  font-size: 17px;
}

.action-btn--remove:active {
  background: rgba(231, 111, 111, 0.25);
}

/* ── FAB ─────────────────────────────────────────────────────────────────── */
ion-fab-button {
  --background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  --color: #1E1E1E;
  --box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
.skeleton-thumb {
  width: 80px;
  height: 110px;
  border-radius: 10px;
  flex-shrink: 0;
  --background: #2D2D3A;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  color: #697289;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #FBF9F6;
  margin: 0;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.empty-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.empty-add-btn:active {
  opacity: 0.85;
}

.empty-add-btn ion-icon {
  font-size: 18px;
}
</style>
