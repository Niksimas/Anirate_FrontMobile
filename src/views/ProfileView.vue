<template>
  <ion-page>
    <ion-content class="profile-content" :fullscreen="true">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Top actions -->
      <div class="top-bar">
        <div />
        <ion-button fill="clear" class="more-btn" @click="router.push('/settings')">
          <ion-icon :icon="settingsOutline" />
        </ion-button>
      </div>

      <template v-if="loading">
        <div class="skeleton-header">
          <ion-skeleton-text animated style="width:80px;height:80px;border-radius:50%;margin:0 auto;" />
          <ion-skeleton-text animated style="width:140px;height:18px;margin:12px auto 0;" />
        </div>
      </template>

      <template v-else>
        <!-- Avatar + name -->
        <div class="profile-hero">
          <div class="avatar-circle">
            <img v-if="user?.picture" :src="fixUrl(user.picture)" class="avatar-img" />
            <ion-icon v-else :icon="cameraOutline" class="avatar-icon" />
          </div>
          <h2 class="profile-name">{{ user?.full_name ?? 'Без имени' }}</h2>
        </div>

        <!-- Просмотрено wide card -->
        <div class="wide-card lavender-card" @click="router.push('/tabs/my-anime')">
          <div class="wide-card-text">
            <span class="wide-card-label">Всего</span>
            <span class="wide-card-value">{{ stats?.total ?? 0 }}</span>
          </div>
          <ion-icon :icon="sparkles" class="sparkle-icon" />
        </div>

        <!-- 3 stat mini-cards -->
        <div class="stat-row" @click="router.push('/tabs/my-anime')">
          <div class="stat-mini">
            <span class="stat-mini-label">В планах</span>
            <span class="stat-mini-value">{{ stats?.planned ?? 0 }}</span>
          </div>
          <div class="stat-mini stat-mini--white">
            <span class="stat-mini-label dark">Смотрю</span>
            <span class="stat-mini-value dark">{{ stats?.watching ?? 0 }}</span>
          </div>
          <div class="stat-mini stat-mini--salmon">
            <span class="stat-mini-label">Просмотрено</span>
            <span class="stat-mini-value">{{ stats?.completed ?? 0 }}</span>
          </div>
        </div>

        <!-- Recent anime card -->
        <div class="wide-card salmon-card" @click="router.push('/tabs/my-anime')">
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

        <!-- Ваши списки -->
        <div class="section-header">
          <h3 class="section-title">Ваши списки</h3>
        </div>

        <div v-if="listsLoading" class="lists-grid">
          <ion-skeleton-text v-for="i in 4" :key="i" animated style="height:140px;border-radius:16px;" />
        </div>

        <div v-else class="lists-grid">
          <!-- Create new list card -->
          <div class="list-card list-card--create" @click="openCreateList">
            <span class="create-list-text">Создать<br>новый список</span>
            <ion-icon :icon="sparkles" class="create-sparkle" />
          </div>

          <!-- Existing lists -->
          <div
            v-for="list in lists"
            :key="list.id"
            class="list-card list-card--cover"
            @click="router.push(`/tabs/lists/${list.id}`)"
          >
            <div class="list-collage" :class="`list-collage--${Math.min(list.preview_images?.length ?? 0, 4)}`">
              <img
                v-for="(img, i) in (list.preview_images ?? []).slice(0, 4)"
                :key="i"
                :src="fixUrl(img)"
                class="collage-img"
              />
              <div v-if="!list.preview_images?.length" class="collage-empty">
                <ion-icon :icon="sparkles" />
              </div>
            </div>
            <div class="list-card-footer">
              <span class="list-card-name">{{ list.name }}</span>
            </div>
          </div>
        </div>
      </template>

      <div style="height: 32px" />
    </ion-content>

    <!-- Create list modal -->
    <ion-modal ref="createModal" :initial-breakpoint="0.5" :breakpoints="[0, 0.5]">
      <CreateListSheet
        @close="createModal?.$el.dismiss()"
        @created="onListCreated"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonButton, IonIcon, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonModal,
} from '@ionic/vue';
import { settingsOutline, cameraOutline, sparkles } from 'ionicons/icons';
import CreateListSheet from '@/components/CreateListSheet.vue';
import { fixUrl } from '@/composables/useImageUrl';
import { useAuthStore } from '@/stores/auth';
import { trackingApi } from '@/api/tracking';
import { listsApi } from '@/api/lists';
import type { TrackingStats, TrackingWithAnime, SharedListBrief, SharedListResponse } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const authStore = useAuthStore();

const user = ref(authStore.user);
const stats = ref<TrackingStats | null>(null);
const recentAnime = ref<TrackingWithAnime[]>([]);
const lists = ref<SharedListBrief[]>([]);
const loading = ref(true);
const listsLoading = ref(true);
const createModal = ref();

onIonViewWillEnter(load);

async function load() {
  loading.value = true;
  listsLoading.value = true;
  try {
    const [userRes, statsRes, recentRes, listsRes] = await Promise.allSettled([
      authStore.fetchMe(),
      trackingApi.getMyStats(),
      trackingApi.getMyTracking({ limit: 5, offset: 0 }),
      listsApi.getMyLists(),
    ]);
    if (userRes.status === 'fulfilled') user.value = userRes.value;
    if (statsRes.status === 'fulfilled') stats.value = statsRes.value.data;
    if (recentRes.status === 'fulfilled') recentAnime.value = recentRes.value.data;
    if (listsRes.status === 'fulfilled') lists.value = listsRes.value.data;
  } finally {
    loading.value = false;
    listsLoading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) {
  await load();
  ev.detail.complete();
}

function openCreateList() {
  createModal.value?.$el.present();
}

function onListCreated(data: SharedListResponse) {
  lists.value.unshift({ id: data.id, name: data.name, owner_id: data.owner_id, member_count: 1, anime_count: 0 });
  createModal.value?.$el.dismiss();
  router.push(`/tabs/lists/${data.id}`);
}
</script>

<style scoped>
.profile-content {
  --background: #1E1E1E;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 8px 0;
  padding-top: calc(env(safe-area-inset-top) + 8px);
}

.more-btn {
  --color: rgba(255,255,255,0.7);
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 22px;
}

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
  background: #4A4A5A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 32px;
  color: rgba(255,255,255,0.6);
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.3px;
}

.wide-card {
  margin: 0 16px 10px;
  border-radius: 18px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  min-height: 76px;
}

.lavender-card { background: #A7B8D9; }
.salmon-card { background: #FF9E9E; }

.wide-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wide-card-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(30,30,30,0.7);
}

.wide-card-value {
  font-size: 32px;
  font-weight: 700;
  color: #1E1E1E;
  line-height: 1;
}

.sparkle-icon {
  font-size: 26px;
  color: rgba(30,30,30,0.45);
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0 16px 10px;
  cursor: pointer;
}

.stat-mini {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-mini--white { background: #FFFFFF; }
.stat-mini--salmon { background: #FF9E9E; }

.stat-mini-label {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  line-height: 1.3;
}

.stat-mini-label.dark { color: rgba(30,30,30,0.6); }

.stat-mini-value {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1;
}

.stat-mini-value.dark { color: #1E1E1E; }

.recent-thumbs {
  position: relative;
  height: 40px;
  width: 90px;
  flex-shrink: 0;
}

.recent-thumb {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #FF9E9E;
  top: 0;
}

.wide-card-right-label {
  font-size: 13px;
  font-weight: 600;
  color: #1E1E1E;
  text-align: right;
  line-height: 1.4;
}

.section-header {
  padding: 8px 16px 4px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.3px;
}

.lists-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 16px;
}

.list-card {
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.list-card--create {
  background: #FBF9F6;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.create-list-text {
  font-size: 14px;
  font-weight: 600;
  color: #1E1E1E;
  line-height: 1.4;
}

.create-sparkle {
  font-size: 28px;
  color: rgba(30,30,30,0.35);
  align-self: flex-end;
}

.list-card--cover { background: #2D2D3A; }

/* ── Collage ─────────────────────────────────────────────────────────────── */
.list-collage {
  position: absolute;
  inset: 0;
  display: grid;
  overflow: hidden;
}

.list-collage--0 {
  grid-template-columns: 1fr;
}

.list-collage--1 {
  grid-template-columns: 1fr;
}

.list-collage--2 {
  grid-template-columns: 1fr 1fr;
}

.list-collage--3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.list-collage--3 .collage-img:first-child {
  grid-row: 1 / 3;
}

.list-collage--4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.collage-img {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  object-fit: cover;
  display: block;
}

.collage-empty {
  width: 100%;
  height: 100%;
  background: #383848;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.15);
  font-size: 28px;
}

.list-card-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
}

.list-card-name {
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
}

.skeleton-header { padding: 16px 24px 24px; }

ion-popover {
  --background: #2D2D3A;
  --border-radius: 12px;
}

ion-popover ion-item {
  --background: transparent;
  --color: #FFFFFF;
  --inner-border-width: 0;
}
</style>
