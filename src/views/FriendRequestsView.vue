<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/friends" />
        </ion-buttons>
        <ion-title>Входящие заявки</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/friends/sent">Отправленные</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <ion-list v-if="requests.length" lines="none" class="ion-padding-horizontal ion-padding-top">
        <ion-item v-for="req in requests" :key="req.id">
          <ion-avatar slot="start">
            <img v-if="req.picture" :src="req.picture" />
            <ion-icon v-else :icon="personCircleOutline" style="font-size:40px;" />
          </ion-avatar>
          <ion-label>
            <h3>{{ req.full_name || req.email }}</h3>
            <p>{{ req.email }}</p>
          </ion-label>
          <div slot="end" class="req-actions">
            <ion-button size="small" color="success" @click="accept(req)">✓</ion-button>
            <ion-button size="small" color="danger" fill="outline" @click="decline(req)">✕</ion-button>
          </div>
        </ion-item>
      </ion-list>

      <div v-else-if="!loading" class="empty-state">
        <ion-icon :icon="checkmarkCircleOutline" class="empty-icon" />
        <p>Новых заявок нет</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton,
  IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonAvatar, IonLabel, IonIcon,
} from '@ionic/vue';
import { personCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { friendsApi } from '@/api/friends';
import type { RefresherCustomEvent } from '@ionic/vue';

interface FriendRequest { id: number; full_name: string; email: string; picture?: string; }

const requests = ref<FriendRequest[]>([]);
const loading = ref(true);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const { data } = await friendsApi.incoming();
    requests.value = data as FriendRequest[];
  } finally {
    loading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }

async function accept(req: FriendRequest) {
  await friendsApi.accept(req.id);
  requests.value = requests.value.filter((r) => r.id !== req.id);
}

async function decline(req: FriendRequest) {
  await friendsApi.decline(req.id);
  requests.value = requests.value.filter((r) => r.id !== req.id);
}
</script>

<style scoped>
.req-actions { display: flex; gap: 4px; }
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 24px; gap: 12px; text-align: center;
}
.empty-icon { font-size: 56px; color: var(--ion-color-success); }
</style>
