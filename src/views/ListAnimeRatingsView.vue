<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" :default-href="`/tabs/lists/${listId}`" />
        </ion-buttons>
        <ion-title>Оценки</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ratings-content">
      <div v-if="loading" class="loading-state">
        <div v-for="i in 4" :key="i" class="rating-row">
          <ion-skeleton-text animated style="width:36px;height:36px;border-radius:50%;" />
          <ion-skeleton-text animated style="height:16px;width:40%;flex:1;" />
          <ion-skeleton-text animated style="height:16px;width:50px;" />
        </div>
      </div>

      <div v-else-if="ratings.length">
        <div v-for="r in ratings" :key="r.user_id" class="rating-row">
          <img v-if="r.picture" :src="r.picture" class="avatar" />
          <div v-else class="avatar avatar--placeholder">{{ (r.full_name ?? '?')[0] }}</div>
          <span class="user-name">{{ r.full_name ?? `Пользователь #${r.user_id}` }}</span>
          <span class="user-score">{{ r.score }}/10</span>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>Пока нет оценок</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonSkeletonText,
} from '@ionic/vue';
import { listsApi } from '@/api/lists';
import type { ListAnimeResponse, RatingResponse } from '@/types';

interface RatingWithPicture extends RatingResponse {
  picture?: string | null;
}

const route = useRoute();
const listId = Number(route.params.id);
const animeId = Number(route.params.animeId);
const ratings = ref<RatingWithPicture[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await listsApi.getAnimeList(listId);
    const item = data.find((a: ListAnimeResponse) => a.anime_id === animeId);
    ratings.value = item?.ratings ?? [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }
.ratings-content { --background: #111111; }

.rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar--placeholder {
  background: #697289;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.user-name {
  flex: 1;
  font-size: 15px;
  color: #FFFFFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-score {
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.loading-state,
.empty-state {
  padding: 24px 16px;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}
</style>
