<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/friends" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="search-content">
      <div class="searchbar-wrap">
        <ion-searchbar
          v-model="query"
          placeholder="Поиск"
          :debounce="400"
          autofocus
          show-clear-button="focus"
          class="main-searchbar"
          @ion-input="search"
          @ion-clear="results = []; searched = false"
        />
      </div>

      <div v-if="loading" class="skeleton-list">
        <div v-for="i in 4" :key="i" class="skeleton-row">
          <ion-skeleton-text animated class="skeleton-avatar" />
          <ion-skeleton-text animated class="skeleton-name" />
        </div>
      </div>

      <div v-else-if="results.length">
        <div v-for="user in results" :key="user.id" class="user-row">
          <div class="user-avatar">
            <img v-if="user.picture" :src="fixUrl(user.picture)" />
            <ion-icon v-else :icon="cameraOutline" />
          </div>
          <span class="user-name">{{ user.full_name || user.email }}</span>
          <button
            class="add-btn"
            :class="{ 'add-btn--sent': sent.has(user.id) }"
            :disabled="sent.has(user.id)"
            @click="sendRequest(user)"
          >
            <ion-icon :icon="sent.has(user.id) ? personOutline : personAddOutline" />
          </button>
        </div>
      </div>

      <div v-else-if="searched" class="empty-state">
        <p>Никого не найдено</p>
      </div>
    </ion-content>

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2000" @did-dismiss="toastOpen = false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar,
  IonContent, IonIcon, IonSkeletonText, IonToast,
} from '@ionic/vue';
import { cameraOutline, personAddOutline, personOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { friendsApi } from '@/api/friends';
import type { UserOut } from '@/types';

const query = ref('');
const results = ref<UserOut[]>([]);
const loading = ref(false);
const searched = ref(false);
const sent = ref(new Set<number>());
const toastOpen = ref(false);
const toastMsg = ref('');

async function search() {
  if (!query.value.trim() || query.value.trim().length < 2) { results.value = []; searched.value = false; return; }
  loading.value = true;
  searched.value = true;
  try {
    const { data } = await friendsApi.search(query.value.trim());
    results.value = data;
  } finally {
    loading.value = false;
  }
}

async function sendRequest(user: UserOut) {
  try {
    await friendsApi.sendRequest({ receiver_id: user.id });
    sent.value = new Set([...sent.value, user.id]);
    toastMsg.value = 'Заявка отправлена';
    toastOpen.value = true;
  } catch {
    toastMsg.value = 'Не удалось отправить заявку';
    toastOpen.value = true;
  }
}
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }

.search-content { --background: #1E1E1E; }

.searchbar-wrap { padding: 8px 12px 4px; }

.main-searchbar {
  --background: #2D2D3A;
  --color: #FFFFFF;
  --placeholder-color: rgba(255,255,255,0.4);
  --icon-color: rgba(255,255,255,0.4);
  --clear-button-color: rgba(255,255,255,0.4);
  --border-radius: 12px;
  --box-shadow: none;
  padding: 0;
  height: 44px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #4A4A5A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-avatar ion-icon { font-size: 22px; color: rgba(255,255,255,0.5); }

.user-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-btn {
  background: transparent;
  border: none;
  color: #5cb85c;
  font-size: 24px;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.add-btn--sent { color: rgba(255,255,255,0.3); }
.add-btn:disabled { cursor: default; }

.skeleton-list { padding: 8px 0; }
.skeleton-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
.skeleton-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; --background: #2D2D3A; }
.skeleton-name { flex: 1; height: 16px; border-radius: 8px; --background: #2D2D3A; }

.empty-state { display: flex; justify-content: center; padding: 48px 24px; }
.empty-state p { color: rgba(255,255,255,0.4); margin: 0; font-size: 15px; }
</style>
