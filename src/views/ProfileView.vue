<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Профиль</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/settings">
            <ion-icon slot="icon-only" :icon="settingsOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="profile-header">
        <ion-skeleton-text animated style="height:80px;width:80px;border-radius:50%;" />
        <ion-skeleton-text animated style="height:20px;width:140px;margin-top:12px;" />
      </div>

      <template v-else>
        <div class="profile-header">
          <ion-avatar class="profile-avatar">
            <img v-if="user?.picture" :src="user.picture" />
            <ion-icon v-else :icon="personCircleOutline" />
          </ion-avatar>
          <h2>{{ user?.full_name ?? 'Без имени' }}</h2>
          <p class="profile-email">{{ user?.email }}</p>
          <ion-chip :color="user?.is_public_profile ? 'success' : 'medium'" outline>
            <ion-label>{{ user?.is_public_profile ? 'Публичный' : 'Закрытый' }}</ion-label>
          </ion-chip>
        </div>

        <!-- Stats -->
        <div v-if="stats" class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Всего</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.watching }}</span>
            <span class="stat-label">Смотрю</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.completed }}</span>
            <span class="stat-label">Просмотрено</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.planned }}</span>
            <span class="stat-label">В планах</span>
          </div>
          <div class="stat-item" v-if="stats.average_score">
            <span class="stat-value">{{ stats.average_score?.toFixed(1) }}</span>
            <span class="stat-label">Ср. оценка</span>
          </div>
        </div>

        <!-- Navigation -->
        <ion-list lines="none" class="ion-margin-top">
          <ion-item button router-link="/tabs/my-anime">
            <ion-icon slot="start" :icon="listOutline" />
            <ion-label>Мои аниме</ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
          <ion-item button router-link="/lists">
            <ion-icon slot="start" :icon="albumsOutline" />
            <ion-label>Мои списки</ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
          <ion-item button router-link="/tabs/friends">
            <ion-icon slot="start" :icon="peopleOutline" />
            <ion-label>Друзья</ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonAvatar, IonChip, IonLabel,
  IonList, IonItem, IonSkeletonText,
} from '@ionic/vue';
import {
  settingsOutline, personCircleOutline, listOutline, albumsOutline,
  peopleOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { trackingApi } from '@/api/tracking';
import type { TrackingStats } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

const authStore = useAuthStore();
const user = ref(authStore.user);
const stats = ref<TrackingStats | null>(null);
const loading = ref(true);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const [userRes, statsRes] = await Promise.allSettled([
      authStore.fetchMe(),
      trackingApi.getMyStats(),
    ]);
    if (userRes.status === 'fulfilled') user.value = userRes.value;
    if (statsRes.status === 'fulfilled') stats.value = statsRes.value.data;
  } finally {
    loading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }
</script>

<style scoped>
.profile-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 16px 16px; text-align: center; gap: 8px;
}
.profile-avatar { width: 80px; height: 80px; font-size: 80px; color: var(--ion-color-medium); }
.profile-header h2 { font-size: 1.4rem; font-weight: 700; margin: 0; }
.profile-email { color: var(--ion-color-medium); font-size: 0.85rem; margin: 0; }
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 1px; background: var(--ion-color-step-150); margin: 16px;
  border-radius: 12px; overflow: hidden;
}
.stat-item {
  display: flex; flex-direction: column; align-items: center; padding: 16px 8px;
  background: var(--ion-background-color); gap: 4px;
}
.stat-value { font-size: 1.4rem; font-weight: 700; }
.stat-label { font-size: 0.72rem; color: var(--ion-color-medium); }
</style>
