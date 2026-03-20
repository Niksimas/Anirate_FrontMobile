<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" :default-href="`/tabs/lists/${listId}`" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="members-content">
      <div class="members-header">
        <h1 class="members-title">Участники</h1>
        <span class="members-count">Участники&nbsp;&nbsp;{{ members.length }}</span>
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 4" :key="i" class="member-row">
          <ion-skeleton-text animated class="skeleton-avatar" />
          <ion-skeleton-text animated style="height:18px;width:50%;" />
        </div>
      </div>

      <!-- Members list -->
      <div v-else>
        <div v-for="member in members" :key="member.user_id" class="member-row">
          <div class="member-avatar">
            <img v-if="member.picture" :src="member.picture" />
            <ion-icon v-else :icon="cameraOutline" class="avatar-placeholder-icon" />
          </div>
          <span class="member-name">{{ member.full_name ?? `#${member.user_id}` }}</span>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonIcon, IonSkeletonText } from '@ionic/vue';
import { cameraOutline } from 'ionicons/icons';
import { listsApi } from '@/api/lists';
import type { MemberResponse } from '@/types';

const route = useRoute();
const listId = Number(route.params.id);
const members = ref<MemberResponse[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await listsApi.getMembers(listId);
    members.value = data;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
ion-header ion-toolbar {
  --background: #111111;
  --border-width: 0;
}

.members-content {
  --background: #111111;
}

.members-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 16px 24px;
}

.members-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.5px;
}

.members-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.member-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
}

.member-avatar {
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

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
}

.member-name {
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
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
