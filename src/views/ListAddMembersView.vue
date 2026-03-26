<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" :default-href="`/tabs/lists/${listId}`" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="add-members-content">
      <div class="add-header">
        <h1 class="add-title">Добавить</h1>
        <span class="add-count">Друзья&nbsp;&nbsp;{{ friends.length }}</span>
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 4" :key="i" class="friend-row">
          <ion-skeleton-text animated class="skeleton-avatar" />
          <ion-skeleton-text animated style="height:18px;width:50%;" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!friends.length" class="empty-state">
        <p>Все друзья уже в списке</p>
      </div>

      <!-- Friends list -->
      <div v-else>
        <div v-for="friend in friends" :key="friend.user_id" class="friend-row">
          <div class="friend-avatar">
            <img v-if="friend.picture" :src="fixUrl(friend.picture)" />
            <ion-icon v-else :icon="cameraOutline" class="avatar-placeholder-icon" />
          </div>
          <span class="friend-name">{{ friend.full_name || `Пользователь #${friend.user_id}` }}</span>
          <button class="add-btn" @click="addMember(friend)" :disabled="addedIds.has(friend.user_id)">
            <ion-icon :icon="addedIds.has(friend.user_id) ? checkmarkOutline : personAddOutline" />
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonIcon, IonSkeletonText } from '@ionic/vue';
import { cameraOutline, personAddOutline, checkmarkOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { listsApi } from '@/api/lists';
import type { AddableFriendResponse } from '@/types';

const route = useRoute();
const listId = Number(route.params.id);
const friends = ref<AddableFriendResponse[]>([]);
const addedIds = ref<Set<number>>(new Set());
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await listsApi.getSuggestions(listId);
    friends.value = data;
  } finally {
    loading.value = false;
  }
});

async function addMember(friend: AddableFriendResponse) {
  try {
    await listsApi.addMemberDirectly(listId, friend.user_id);
    addedIds.value = new Set([...addedIds.value, friend.user_id]);
  } catch (e) {
    console.error(e);
  }
}
</script>

<style scoped>
ion-header ion-toolbar {
  --background: #1E1E1E;
  --border-width: 0;
}

.add-members-content {
  --background: #1E1E1E;
}

.add-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 16px 24px;
}

.add-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.5px;
}

.add-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.friend-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
}

.friend-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #697289;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
}

.friend-name {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
}

.add-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn ion-icon {
  font-size: 28px;
  color: #4CD9A0;
}

.add-btn:disabled ion-icon {
  color: rgba(255, 255, 255, 0.3);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Skeleton */
.skeleton-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  --background: #2D2D3A;
}
</style>
