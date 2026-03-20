<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/friends" />
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button fill="clear">
            <ion-icon slot="icon-only" :icon="ellipsisHorizontal" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="user-content">
      <div v-if="loading" class="skeleton-header">
        <ion-skeleton-text animated style="width:80px;height:80px;border-radius:50%;margin:0 auto;" />
        <ion-skeleton-text animated style="width:140px;height:18px;margin:12px auto 0;" />
      </div>

      <template v-else-if="userProfile">
        <!-- Avatar + name -->
        <div class="profile-hero">
          <div class="avatar-circle">
            <img v-if="userProfile.picture" :src="userProfile.picture" class="avatar-img" />
            <ion-icon v-else :icon="cameraOutline" class="avatar-icon" />
          </div>
          <h2 class="profile-name">{{ userProfile.full_name ?? 'Без имени' }}</h2>
        </div>

        <!-- Closed profile -->
        <template v-if="!userProfile.is_public_profile">
          <div class="section-header">
            <h3 class="section-title">Ваши общие списки</h3>
          </div>
          <div class="closed-hint">
            <ion-icon :icon="lockClosedOutline" class="lock-icon" />
            <p>Профиль закрыт</p>
          </div>
        </template>

        <!-- Open profile -->
        <template v-else>
          <!-- Просмотрено wide card -->
          <div class="wide-card lavender-card">
            <div class="wide-card-text">
              <span class="wide-card-label">Просмотрено</span>
              <span class="wide-card-value">{{ completedCount }}</span>
            </div>
            <ion-icon :icon="sparkles" class="sparkle-icon" />
          </div>

          <!-- 3 stat mini-cards -->
          <div class="stat-row">
            <div class="stat-mini">
              <span class="stat-mini-label">В планах</span>
              <span class="stat-mini-value">{{ plannedCount }}</span>
            </div>
            <div class="stat-mini stat-mini--white">
              <span class="stat-mini-label dark">Смотрю</span>
              <span class="stat-mini-value dark">{{ watchingCount }}</span>
            </div>
            <div class="stat-mini stat-mini--salmon">
              <span class="stat-mini-label">Просмотрено</span>
              <span class="stat-mini-value">{{ completedCount }}</span>
            </div>
          </div>

          <!-- Recent anime -->
          <div class="wide-card salmon-card">
            <div class="recent-thumbs">
              <img
                v-for="(item, i) in tracking.slice(0, 3)"
                :key="item.id"
                :src="item.anime_image_url"
                class="recent-thumb"
                :style="{ left: `${i * 28}px`, zIndex: 3 - i }"
              />
            </div>
            <span class="wide-card-right-label">Последние<br>оценённые аниме</span>
          </div>

          <!-- Common lists -->
          <div class="section-header">
            <h3 class="section-title">Ваши общие списки</h3>
          </div>

          <div v-if="!commonLists.length" class="empty-lists">
            <p>Общих списков нет</p>
          </div>

          <div v-else class="lists-grid">
            <div
              v-for="list in commonLists"
              :key="list.id"
              class="list-card list-card--cover"
              @click="router.push(`/tabs/lists/${list.id}`)"
            >
              <div class="list-cover-placeholder" />
              <div class="list-card-footer">
                <span class="list-card-name">{{ list.name }}</span>
              </div>
            </div>
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
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonSkeletonText,
} from '@ionic/vue';
import { ellipsisHorizontal, cameraOutline, sparkles, lockClosedOutline } from 'ionicons/icons';
import { friendsApi } from '@/api/friends';
import { trackingApi } from '@/api/tracking';
import { listsApi } from '@/api/lists';
import type { UserResponse, TrackingWithAnime, SharedListBrief } from '@/types';

const route = useRoute();
const router = useRouter();
const userProfile = ref<UserResponse | null>(null);
const tracking = ref<TrackingWithAnime[]>([]);
const commonLists = ref<SharedListBrief[]>([]);
const loading = ref(true);

const completedCount = computed(() => tracking.value.filter((t) => t.status === 'completed').length);
const plannedCount = computed(() => tracking.value.filter((t) => t.status === 'planned').length);
const watchingCount = computed(() => tracking.value.filter((t) => t.status === 'watching').length);

onMounted(async () => {
  const userId = Number(route.params.id);
  try {
    const { data } = await friendsApi.getUser(userId);
    userProfile.value = data;
    if (data.is_public_profile) {
      const [trackRes, listsRes] = await Promise.allSettled([
        trackingApi.getUserTracking(userId),
        listsApi.getMyLists(),
      ]);
      if (trackRes.status === 'fulfilled') tracking.value = trackRes.value.data;
      if (listsRes.status === 'fulfilled') {
        // Show lists that might be shared (all user's lists for now)
        commonLists.value = listsRes.value.data;
      }
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }

.user-content { --background: #1E1E1E; }

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

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-icon { font-size: 32px; color: rgba(255,255,255,0.6); }

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
  min-height: 76px;
}

.lavender-card { background: #A7B8D9; }
.salmon-card { background: #FF9E9E; }
.disabled-card { opacity: 0.4; pointer-events: none; }

.wide-card-text { display: flex; flex-direction: column; gap: 2px; }
.wide-card-label { font-size: 13px; font-weight: 500; color: rgba(30,30,30,0.7); }
.wide-card-value { font-size: 32px; font-weight: 700; color: #1E1E1E; line-height: 1; }
.sparkle-icon { font-size: 26px; color: rgba(30,30,30,0.45); }

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0 16px 10px;
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

.stat-mini-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.6); line-height: 1.3; }
.stat-mini-label.dark { color: rgba(30,30,30,0.6); }
.stat-mini-value { font-size: 20px; font-weight: 700; color: #FFFFFF; line-height: 1; }
.stat-mini-value.dark { color: #1E1E1E; }

.recent-thumbs { position: relative; height: 40px; width: 90px; flex-shrink: 0; }
.recent-thumb {
  position: absolute;
  width: 40px; height: 40px;
  border-radius: 8px; object-fit: cover;
  border: 2px solid #FF9E9E; top: 0;
}

.wide-card-right-label { font-size: 13px; font-weight: 600; color: #1E1E1E; text-align: right; line-height: 1.4; }

.section-header { padding: 8px 16px 4px; }
.section-title { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0; letter-spacing: -0.3px; }

.closed-hint {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 24px; gap: 8px; text-align: center;
}
.lock-icon { font-size: 40px; color: rgba(255,255,255,0.3); }
.closed-hint p { color: rgba(255,255,255,0.4); margin: 0; }

.lists-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 16px;
}

.list-card {
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: pointer;
  position: relative;
}

.list-card--cover { background: #2D2D3A; }
.list-cover-placeholder { width: 100%; height: 100%; background: #383848; }
.list-card-footer {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 8px 12px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
}
.list-card-name { font-size: 13px; font-weight: 600; color: #FFFFFF; }

.empty-lists { padding: 20px 16px; }
.empty-lists p { color: rgba(255,255,255,0.4); font-size: 14px; margin: 0; }

.skeleton-header { padding: 16px 24px 24px; }
</style>
