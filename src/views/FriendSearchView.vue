<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/friends" />
        </ion-buttons>
        <ion-searchbar
          v-model="query"
          placeholder="Поиск по имени..."
          :debounce="400"
          autofocus
          @ion-input="search"
          @ion-clear="results = []"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text v-for="i in 4" :key="i" animated style="height:56px;border-radius:8px;margin-bottom:8px;" />
      </div>

      <ion-list v-else-if="results.length" lines="none" class="ion-padding-horizontal">
        <ion-item v-for="user in results" :key="user.id">
          <ion-avatar slot="start">
            <img v-if="user.picture" :src="user.picture" />
            <ion-icon v-else :icon="personCircleOutline" style="font-size:40px;color:var(--ion-color-medium)" />
          </ion-avatar>
          <ion-label>
            <h3>{{ user.full_name }}</h3>
            <p>{{ user.email }}</p>
          </ion-label>
          <ion-button
            slot="end"
            fill="solid"
            size="small"
            :disabled="sent.has(user.id)"
            @click="sendRequest(user)"
          >
            {{ sent.has(user.id) ? 'Отправлено' : 'Добавить' }}
          </ion-button>
        </ion-item>
      </ion-list>

      <div v-else-if="searched" class="empty-state">
        <ion-icon :icon="searchOutline" class="empty-icon" />
        <p>Никого не найдено</p>
      </div>
    </ion-content>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="2000"
      @did-dismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar,
  IonContent, IonList, IonItem, IonAvatar, IonLabel, IonButton, IonIcon,
  IonSkeletonText, IonToast,
} from '@ionic/vue';
import { personCircleOutline, searchOutline } from 'ionicons/icons';
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
  if (!query.value.trim() || query.value.trim().length < 2) { results.value = []; return; }
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
    sent.value.add(user.id);
    toastMsg.value = `Заявка отправлена ${user.full_name}`;
    toastOpen.value = true;
  } catch {
    toastMsg.value = 'Не удалось отправить заявку';
    toastOpen.value = true;
  }
}
</script>

<style scoped>
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 24px; gap: 12px; text-align: center;
}
.empty-icon { font-size: 56px; color: var(--ion-color-medium); }
</style>
