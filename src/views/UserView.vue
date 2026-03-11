<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/friends" />
        </ion-buttons>
        <ion-title>{{ userProfile?.full_name ?? 'Профиль' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text animated style="height:80px;border-radius:50%;width:80px;margin:0 auto 12px;" />
        <ion-skeleton-text animated style="height:20px;width:50%;margin:0 auto 8px;" />
      </div>

      <template v-else-if="userProfile">
        <!-- Profile header -->
        <div class="profile-header">
          <ion-avatar class="profile-avatar">
            <img v-if="userProfile.picture" :src="userProfile.picture" />
            <ion-icon v-else :icon="personCircleOutline" />
          </ion-avatar>
          <h2>{{ userProfile.full_name ?? 'Без имени' }}</h2>
          <p class="profile-email">{{ userProfile.email }}</p>
        </div>

        <!-- Closed profile -->
        <div v-if="!userProfile.is_public_profile" class="closed-profile">
          <ion-icon :icon="lockClosedOutline" class="lock-icon" />
          <p>Профиль закрыт</p>
          <p class="hint">Пользователь не открыл свой список</p>
        </div>

        <!-- Open profile: tracking list -->
        <template v-else>
          <div class="segment-wrap">
            <ion-segment v-model="segment">
              <ion-segment-button value="all">Все</ion-segment-button>
              <ion-segment-button value="planned">В планах</ion-segment-button>
              <ion-segment-button value="watching">Смотрю</ion-segment-button>
              <ion-segment-button value="completed">Просмотрено</ion-segment-button>
            </ion-segment>
          </div>

          <div v-if="trackingLoading" class="anime-grid">
            <div v-for="i in 6" :key="i">
              <ion-skeleton-text animated class="skeleton-poster" />
            </div>
          </div>

          <div v-else-if="filteredTracking.length" class="anime-grid">
            <div
              v-for="item in filteredTracking"
              :key="item.id"
              class="anime-card-wrap"
              @click="router.push(`/anime/${item.anime_id}`)"
            >
              <div class="anime-card__poster">
                <img :src="item.anime_image_url" :alt="item.anime_title" />
                <div class="anime-card__badge" :class="`badge--${item.status}`">
                  {{ STATUS_LABELS[item.status] }}
                </div>
                <div v-if="item.score" class="anime-card__score">★ {{ item.score }}</div>
              </div>
              <p class="anime-card__title">{{ item.anime_title }}</p>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>Список пуст</p>
          </div>
        </template>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonAvatar, IonIcon, IonSkeletonText, IonSegment, IonSegmentButton,
} from '@ionic/vue';
import { personCircleOutline, lockClosedOutline } from 'ionicons/icons';
import { friendsApi } from '@/api/friends';
import { trackingApi } from '@/api/tracking';
import type { UserResponse, TrackingWithAnime, TrackingStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const userProfile = ref<UserResponse | null>(null);
const tracking = ref<TrackingWithAnime[]>([]);
const loading = ref(true);
const trackingLoading = ref(false);
const segment = ref<'all' | TrackingStatus>('all');

const STATUS_LABELS: Record<string, string> = {
  planned: 'В планах', watching: 'Смотрю', completed: 'Просмотрено',
};

const filteredTracking = computed(() =>
  segment.value === 'all' ? tracking.value : tracking.value.filter((t) => t.status === segment.value)
);

onMounted(async () => {
  const userId = Number(route.params.id);
  try {
    const { data } = await friendsApi.getUser(userId);
    userProfile.value = data;
    if (data.is_public_profile) {
      trackingLoading.value = true;
      const { data: trackData } = await trackingApi.getUserTracking(userId);
      tracking.value = trackData;
      trackingLoading.value = false;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.profile-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 16px 16px; text-align: center; gap: 8px;
}
.profile-avatar { width: 80px; height: 80px; font-size: 80px; color: var(--ion-color-medium); }
.profile-header h2 { font-size: 1.3rem; font-weight: 700; margin: 0; }
.profile-email { color: var(--ion-color-medium); font-size: 0.85rem; margin: 0; }
.closed-profile {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 24px; text-align: center; gap: 8px;
}
.lock-icon { font-size: 48px; color: var(--ion-color-medium); }
.hint { font-size: 0.8rem; color: var(--ion-color-medium); }
.segment-wrap { padding: 0 16px 8px; }
.anime-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; padding: 12px; }
.anime-card-wrap { cursor: pointer; display: flex; flex-direction: column; gap: 6px; }
.anime-card__poster {
  position: relative; border-radius: 10px; overflow: hidden;
  aspect-ratio: 2/3; background: var(--ion-color-step-100);
}
.anime-card__poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.anime-card__badge {
  position: absolute; bottom: 6px; left: 6px; padding: 2px 7px;
  border-radius: 6px; font-size: 0.62rem; font-weight: 600; color: #fff;
}
.badge--planned { background: var(--ion-color-medium); }
.badge--watching { background: var(--ion-color-primary); }
.badge--completed { background: var(--ion-color-success); }
.anime-card__score {
  position: absolute; top: 6px; right: 6px; padding: 2px 6px;
  border-radius: 6px; font-size: 0.72rem; font-weight: 700;
  background: rgba(0,0,0,0.65); color: #ffd700;
}
.anime-card__title {
  font-size: 0.78rem; font-weight: 600; margin: 0; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.skeleton-poster { aspect-ratio: 2/3; border-radius: 10px; width: 100%; }
.empty-state { display: flex; align-items: center; justify-content: center; padding: 40px; }
</style>
