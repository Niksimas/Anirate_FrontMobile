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
          <ion-button expand="block" class="add-btn" @click="openTracking">
            {{ tracking ? STATUS_LABELS[tracking.status] : 'Добавить в список' }}
            <ion-icon slot="end" :icon="sparkles" />
          </ion-button>
        </div>

        <!-- My rating -->
        <div class="rating-section">
          <h3 class="rating-label">Моя оценка</h3>
          <div class="rating-dots">
            <button
              v-for="n in 10"
              :key="n"
              class="rating-dot"
              :class="{ active: tracking?.score != null && n <= tracking.score }"
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

    <ion-modal ref="trackingModal" :initial-breakpoint="0.5" :breakpoints="[0, 0.5, 0.75]">
      <TrackingSheet
        v-if="anime"
        :anime-id="anime.id"
        :tracking="tracking"
        @close="trackingModal?.$el.dismiss()"
        @saved="onTrackingSaved"
        @removed="onTrackingRemoved"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonSkeletonText, IonModal,
} from '@ionic/vue';
import { ellipsisHorizontal, sparkles, personOutline } from 'ionicons/icons';
import TrackingSheet from '@/components/TrackingSheet.vue';
import { animeApi } from '@/api/anime';
import { trackingApi } from '@/api/tracking';
import type { AnimeResponse, TrackingResponse } from '@/types';

const route = useRoute();
const anime = ref<AnimeResponse | null>(null);
const tracking = ref<TrackingResponse | null>(null);
const loading = ref(true);
const trackingModal = ref();
const friendsLists = ref<{ id: number; name: string; memberName: string; picture?: string }[]>([]);

const STATUS_LABELS: Record<string, string> = {
  planned: 'В планах',
  watching: 'Смотрю',
  completed: 'Просмотрено',
};

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

function openTracking() { trackingModal.value?.$el.present(); }

function onTrackingSaved(updated: TrackingResponse) {
  tracking.value = updated;
  trackingModal.value?.$el.dismiss();
}

function onTrackingRemoved() {
  tracking.value = null;
  trackingModal.value?.$el.dismiss();
}

async function setScore(score: number) {
  if (!anime.value) return;
  if (tracking.value) {
    const { data } = await trackingApi.update(tracking.value.id, { score });
    tracking.value = data;
  } else {
    const { data } = await trackingApi.add({ anime_id: anime.value.id, status: 'planned' });
    tracking.value = { ...data, score };
    await trackingApi.update(data.id, { score });
  }
}

async function setStatus(status: 'planned' | 'watching' | 'completed') {
  if (!anime.value) return;
  if (tracking.value) {
    const { data } = await trackingApi.update(tracking.value.id, { status });
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
</style>
