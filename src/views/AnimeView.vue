<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/search" />
        </ion-buttons>
        <ion-title>{{ anime?.title ?? '' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading -->
      <div v-if="loading" class="anime-detail-skeleton">
        <ion-skeleton-text animated class="skeleton-hero" />
        <div class="ion-padding">
          <ion-skeleton-text animated style="height: 24px; width: 70%; margin-bottom: 8px;" />
          <ion-skeleton-text animated style="height: 16px; width: 40%;" />
        </div>
      </div>

      <!-- Content -->
      <template v-else-if="anime">
        <!-- Hero poster -->
        <div class="anime-hero">
          <img :src="anime.image_url" :alt="anime.title" class="anime-poster" />
          <div class="anime-hero-overlay">
            <h1 class="anime-title">{{ anime.title }}</h1>
            <p class="anime-meta">{{ anime.season }} {{ anime.year }}</p>
          </div>
        </div>

        <div class="ion-padding">
          <!-- Tracking button -->
          <ion-button
            expand="block"
            :color="tracking ? 'medium' : 'primary'"
            @click="openTracking"
          >
            <ion-icon slot="start" :icon="tracking ? checkmarkCircleOutline : addCircleOutline" />
            {{ trackingLabel }}
          </ion-button>

          <!-- In friends' lists (placeholder section) -->
          <div v-if="friendsLists.length" class="friends-lists-section">
            <h3 class="section-title">В списках у друзей</h3>
            <ion-list lines="none">
              <ion-item
                v-for="item in friendsLists"
                :key="item.id"
                button
                @click="router.push(`/lists/${item.id}`)"
              >
                <ion-avatar slot="start">
                  <img v-if="item.picture" :src="item.picture" />
                  <ion-icon v-else :icon="personOutline" />
                </ion-avatar>
                <ion-label>
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.memberName }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </div>
        </div>
      </template>
    </ion-content>

    <!-- Tracking sheet -->
    <ion-modal
      ref="trackingModal"
      :initial-breakpoint="0.5"
      :breakpoints="[0, 0.5, 0.75]"
    >
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonButton, IonIcon, IonSkeletonText, IonModal,
  IonList, IonItem, IonLabel, IonAvatar,
} from '@ionic/vue';
import { addCircleOutline, checkmarkCircleOutline, personOutline } from 'ionicons/icons';
import TrackingSheet from '@/components/TrackingSheet.vue';
import { animeApi } from '@/api/anime';
import { trackingApi } from '@/api/tracking';
import type { AnimeResponse, TrackingResponse } from '@/types';

const route = useRoute();
const router = useRouter();
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

const trackingLabel = computed(() =>
  tracking.value ? STATUS_LABELS[tracking.value.status] : 'Добавить в список'
);

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
        tracking.value = {
          id: found.id,
          anime_id: found.anime_id,
          status: found.status,
          score: found.score,
          created_at: found.created_at,
          updated_at: found.updated_at,
        };
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
</script>

<style scoped>
.anime-hero {
  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
}
.anime-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.anime-hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
}
.anime-title {
  color: #fff;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.3;
}
.anime-meta {
  color: rgba(255,255,255,0.75);
  font-size: 0.85rem;
  margin: 0;
  text-transform: capitalize;
}
.skeleton-hero { width: 100%; height: 320px; }
.section-title { font-size: 1rem; font-weight: 600; margin: 20px 0 8px; }
</style>
