<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/search" text="Назад" />
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button fill="clear">
            <ion-icon slot="icon-only" :icon="ellipsisHorizontal" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text animated style="height:260px;border-radius:16px;margin-bottom:16px;" />
        <ion-skeleton-text animated style="height:24px;width:70%;margin:0 auto 8px;" />
        <ion-skeleton-text animated style="height:16px;width:40%;margin:0 auto;" />
      </div>

      <template v-else-if="anime">
        <!-- Poster centered -->
        <div class="poster-wrap">
          <img :src="anime.image_url" :alt="anime.title" class="poster-img" />
        </div>

        <!-- Title + year -->
        <div class="anime-info">
          <h1 class="anime-title">{{ anime.title }}</h1>
          <p class="anime-year">{{ anime.year }}</p>
        </div>

        <!-- 3 stat cards -->
        <div class="stat-cards">
          <div class="stat-card">
            <span class="stat-card-label">Оценка<br>друзей</span>
            <span class="stat-card-value">—</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-label">Оценка<br>пользователей</span>
            <span class="stat-card-value">—</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-label">В списках<br>у друзей</span>
            <div class="friends-avatars">
              <div
                v-for="(item, i) in friendsLists.slice(0, 3)"
                :key="item.id"
                class="friends-avatar"
                :style="{ left: `${i * 14}px`, zIndex: 3 - i }"
              >
                <img v-if="item.picture" :src="item.picture" />
                <ion-icon v-else :icon="personOutline" />
              </div>
              <span v-if="friendsLists.length > 3" class="friends-more">+{{ friendsLists.length - 3 }}</span>
              <span v-if="!friendsLists.length" class="stat-card-value" style="position:static;">—</span>
            </div>
          </div>
        </div>

        <!-- Add to list button -->
        <div class="actions-section">
          <ion-button expand="block" class="add-btn" @click="openListPicker">
            Добавить в список
            <ion-icon slot="end" :icon="addOutline" />
          </ion-button>
        </div>

        <!-- My rating (only when tracked) -->
        <div v-if="tracking" class="rating-section">
          <h3 class="rating-label">Моя оценка</h3>
          <div class="rating-dots">
            <button
              v-for="n in 10"
              :key="n"
              class="rating-dot"
              :class="{ active: tracking.score != null && n <= tracking.score }"
              @click="setScore(n)"
            >{{ n }}</button>
          </div>
        </div>

        <!-- Status buttons -->
        <div class="status-row">
          <button
            class="status-btn"
            :class="{ 'status-btn--active-white': tracking?.status === 'planned' }"
            @click="setStatus('planned')"
          >В планах</button>
          <button
            class="status-btn"
            :class="{ 'status-btn--active-white': tracking?.status === 'watching' }"
            @click="setStatus('watching')"
          >Смотрю</button>
          <button
            class="status-btn"
            :class="{ 'status-btn--active-salmon': tracking?.status === 'completed' }"
            @click="setStatus('completed')"
          >Просмотрено</button>
        </div>
      </template>
    </ion-content>

    <!-- List picker modal -->
    <ion-modal ref="listPickerModal" :initial-breakpoint="0.55" :breakpoints="[0, 0.55, 0.8]" @did-dismiss="onPickerDismiss">
      <div class="lp-sheet">
        <h2 class="lp-title">Списки</h2>

        <div v-if="listsLoading" class="lp-loading">
          <ion-skeleton-text v-for="i in 3" :key="i" animated style="height:52px;border-radius:12px;margin-bottom:12px;" />
        </div>

        <div v-else-if="!myLists.length" class="lp-empty">
          <p>У тебя пока нет списков</p>
        </div>

        <div v-else class="lp-list">
          <button
            v-for="list in myLists"
            :key="list.id"
            class="lp-item"
            :class="{ 'lp-item--selected': selectedLists.has(list.id) }"
            @click="toggleList(list.id)"
          >
            <span class="lp-item-name">{{ list.name }}</span>
            <span class="lp-item-check">
              <ion-icon v-if="selectedLists.has(list.id)" :icon="checkmarkCircle" class="lp-check-on" />
              <span v-else class="lp-check-off" />
            </span>
          </button>
        </div>

        <div v-if="myLists.length && !listsLoading" class="lp-actions">
          <button class="lp-btn lp-btn--add" @click="addSelectedToLists">Добавить</button>
          <button class="lp-btn lp-btn--all" @click="selectAll">Выбрать все</button>
          <button class="lp-btn lp-btn--clear" @click="selectedLists = new Set()">Очистить</button>
        </div>
      </div>
    </ion-modal>

    <ion-toast :is-open="!!toastMsg" :message="toastMsg" :duration="2000" @did-dismiss="toastMsg = ''" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonSkeletonText, IonModal, IonToast,
} from '@ionic/vue';
import { ellipsisHorizontal, addOutline, personOutline, checkmarkCircle } from 'ionicons/icons';
import { animeApi } from '@/api/anime';
import { trackingApi } from '@/api/tracking';
import { listsApi } from '@/api/lists';
import type { AnimeResponse, TrackingResponse, SharedListBrief } from '@/types';

const route = useRoute();
const anime = ref<AnimeResponse | null>(null);
const tracking = ref<TrackingResponse | null>(null);
const loading = ref(true);
const listPickerModal = ref();
const myLists = ref<SharedListBrief[]>([]);
const listsLoading = ref(false);
const selectedLists = ref<Set<number>>(new Set());
const toastMsg = ref('');
const friendsLists = ref<{ id: number; name: string; memberName: string; picture?: string }[]>([]);

onMounted(async () => {
  const id = Number(route.params.id);
  try {
    const [animeRes, trackingRes] = await Promise.allSettled([
      animeApi.getById(id),
      trackingApi.getMyTracking(),
    ]);
    if (animeRes.status === 'fulfilled') anime.value = animeRes.value.data;
    if (trackingRes.status === 'fulfilled') {
      const found = trackingRes.value.data.find((t) => t.anime_id === id);
      if (found) {
        tracking.value = { id: found.id, anime_id: found.anime_id, status: found.status, score: found.score, created_at: found.created_at, updated_at: found.updated_at };
      }
    }
  } finally {
    loading.value = false;
  }
});

async function openListPicker() {
  selectedLists.value = new Set();
  listPickerModal.value?.$el.present();
  listsLoading.value = true;
  try {
    const { data } = await listsApi.getMyLists();
    myLists.value = data;
  } finally {
    listsLoading.value = false;
  }
}

function onPickerDismiss() {
  selectedLists.value = new Set();
  myLists.value = [];
}

function toggleList(id: number) {
  const next = new Set(selectedLists.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedLists.value = next;
}

function selectAll() {
  selectedLists.value = new Set(myLists.value.map((l) => l.id));
}

async function addSelectedToLists() {
  if (!anime.value || !selectedLists.value.size) return;
  let added = 0;
  for (const listId of selectedLists.value) {
    try {
      await listsApi.addAnime(listId, { anime_id: anime.value.id });
      added++;
    } catch { /* already added or error */ }
  }
  listPickerModal.value?.$el.dismiss();
  toastMsg.value = added ? `Добавлено в ${added} ${added === 1 ? 'список' : 'списков'}` : 'Уже добавлено во все выбранные списки';
}

async function setScore(score: number) {
  if (!anime.value || !tracking.value) return;
  const { data } = await trackingApi.update(anime.value.id, { score });
  tracking.value = data;
}

async function setStatus(status: 'planned' | 'watching' | 'completed') {
  if (!anime.value) return;
  if (tracking.value) {
    const { data } = await trackingApi.update(anime.value.id, { status });
    tracking.value = data;
  } else {
    const { data } = await trackingApi.add({ anime_id: anime.value.id, status });
    tracking.value = data;
  }
}
</script>

<style scoped>
ion-header ion-toolbar {
  --background: #1E1E1E;
  --border-width: 0;
}

.poster-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 40px 12px;
}

.poster-img {
  width: 100%;
  max-width: 220px;
  border-radius: 16px;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.anime-info {
  text-align: center;
  padding: 0 24px 16px;
}

.anime-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
}

.anime-year {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 16px;
}

.stat-card {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card-label {
  font-size: 10px;
  color: rgba(255,255,255,0.5);
  line-height: 1.4;
}

.stat-card-value {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
}

.friends-avatars {
  position: relative;
  height: 28px;
  min-width: 60px;
}

.friends-avatar {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #4A4A5A;
  overflow: hidden;
  border: 2px solid #2D2D3A;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.friends-avatar img { width: 100%; height: 100%; object-fit: cover; }
.friends-avatar ion-icon { font-size: 14px; color: rgba(255,255,255,0.5); }

.friends-more {
  position: absolute;
  left: 46px;
  top: 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
}

.actions-section { padding: 0 16px 16px; }

.add-btn {
  --background: #FF9E9E;
  --background-activated: #e08a8a;
  --color: #1E1E1E;
  --border-radius: 14px;
  --box-shadow: none;
  font-weight: 600;
  height: 52px;
  margin: 0;
}

.rating-section { padding: 0 16px 16px; }

.rating-label {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 12px;
}

.rating-dots {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.rating-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #2D2D3A;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}

.rating-dot.active {
  background: #FF9E9E;
  color: #1E1E1E;
}

.status-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 32px;
}

.status-btn {
  padding: 12px 8px;
  border-radius: 12px;
  border: none;
  background: #2D2D3A;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}

.status-btn--active-white { background: #FFFFFF; color: #1E1E1E; }
.status-btn--active-salmon { background: #FF9E9E; color: #1E1E1E; }

/* List picker sheet */
.lp-sheet {
  background: #2D2D3A;
  padding: 24px 20px 20px;
  height: 100%;
  overflow-y: auto;
}

.lp-title {
  font-size: 22px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 18px;
}

.lp-loading { padding: 4px 0; }

.lp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.lp-empty p {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.lp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.lp-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 18px;
  border: none;
  border-radius: 12px;
  background: #3A3A4A;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.lp-item-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
}

.lp-item-check {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lp-check-off {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.lp-check-on {
  font-size: 26px;
  color: #4CAF50;
}

/* Action buttons */
.lp-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
  flex-wrap: wrap;
}

.lp-btn {
  flex: 1;
  min-width: 0;
  padding: 12px 8px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
}

.lp-btn--add {
  background: #5CB85C;
  color: #FFFFFF;
}

.lp-btn--all {
  background: #F0AD4E;
  color: #FFFFFF;
}

.lp-btn--clear {
  background: #E86B6B;
  color: #FFFFFF;
}
</style>
