<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" default-href="/tabs/profile" />
        </ion-buttons>
        <ion-title>Мои списки</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createModal?.$el.present()">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text v-for="i in 4" :key="i" animated style="height:72px;border-radius:10px;margin-bottom:10px;" />
      </div>

      <ion-list v-else-if="lists.length" lines="none" class="ion-padding">
        <ion-item
          v-for="list in lists"
          :key="list.id"
          button
          class="list-item"
          @click="router.push(`/tabs/lists/${list.id}`)"
        >
          <div slot="start" class="list-icon-wrap">
            <ion-icon :icon="albumsOutline" />
          </div>
          <ion-label>
            <h3>{{ list.name }}</h3>
            <p>{{ list.member_count }} участников · {{ list.anime_count }} аниме</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForwardOutline" />
        </ion-item>
      </ion-list>

      <div v-else class="empty-state">
        <ion-icon :icon="albumsOutline" class="empty-icon" />
        <p>Нет совместных списков</p>
        <ion-button fill="outline" size="small" @click="createModal?.$el.present()">
          Создать список
        </ion-button>
      </div>

      <!-- Join by invite -->
      <div class="join-section">
        <ion-item lines="none">
          <ion-input
            v-model="inviteCode"
            label="Инвайт-код"
            label-placement="stacked"
            placeholder="Введи код приглашения"
            clearInput
          />
          <ion-button slot="end" :disabled="!inviteCode.trim()" @click="joinByCode">
            Войти
          </ion-button>
        </ion-item>
      </div>
    </ion-content>

    <!-- Create list modal -->
    <ion-modal ref="createModal" :initial-breakpoint="0.5" :breakpoints="[0, 0.5]">
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-title>Новый список</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="createModal?.$el.dismiss()">Отмена</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list lines="none">
            <ion-item>
              <ion-input v-model="newName" label="Название" label-placement="stacked" placeholder="Название списка" clearInput />
            </ion-item>
            <ion-item>
              <ion-input v-model="newDesc" label="Описание" label-placement="stacked" placeholder="Необязательно" clearInput />
            </ion-item>
          </ion-list>
          <ion-button expand="block" :disabled="!newName.trim() || creating" style="margin-top:16px;" @click="createList">
            {{ creating ? 'Создаём...' : 'Создать' }}
          </ion-button>
        </ion-content>
      </ion-page>
    </ion-modal>

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2500" @did-dismiss="toastOpen=false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel,
  IonSkeletonText, IonModal, IonInput, IonToast,
} from '@ionic/vue';
import { addOutline, albumsOutline, chevronForwardOutline } from 'ionicons/icons';
import { listsApi } from '@/api/lists';
import type { SharedListBrief } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const lists = ref<SharedListBrief[]>([]);
const loading = ref(true);
const createModal = ref();
const newName = ref('');
const newDesc = ref('');
const creating = ref(false);
const inviteCode = ref('');
const toastOpen = ref(false);
const toastMsg = ref('');

onMounted(load);

async function load() {
  loading.value = true;
  try { const { data } = await listsApi.getMyLists(); lists.value = data; }
  finally { loading.value = false; }
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }

async function createList() {
  creating.value = true;
  try {
    const { data } = await listsApi.create({ name: newName.value.trim(), description: newDesc.value || null });
    lists.value.unshift({ id: data.id, name: data.name, owner_id: data.owner_id, member_count: 1, anime_count: 0 });
    newName.value = '';
    newDesc.value = '';
    createModal.value?.$el.dismiss();
    router.push(`/tabs/lists/${data.id}`);
  } finally { creating.value = false; }
}

async function joinByCode() {
  try {
    const { data } = await listsApi.joinByInvite(inviteCode.value.trim());
    inviteCode.value = '';
    toastMsg.value = `Ты вступил в список «${data.name}»`;
    toastOpen.value = true;
    await load();
  } catch {
    toastMsg.value = 'Неверный или устаревший код';
    toastOpen.value = true;
  }
}
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }
ion-content { --background: #1E1E1E; }
ion-list { background: transparent; padding: 8px 16px; }
ion-item {
  --background: #2D2D3A;
  --border-radius: 12px;
  --inner-border-width: 0;
  margin-bottom: 8px;
  border-radius: 12px;
  --color: #FBF9F6;
}
ion-item ion-label h3 { font-weight: 600; color: #FBF9F6; }
ion-item ion-label p { color: #697289; }
ion-fab-button {
  --background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  --color: #1E1E1E;
  --box-shadow: none;
}
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 24px; gap: 12px; text-align: center;
}
.empty-icon { font-size: 56px; color: #697289; }
.empty-state p { color: #FBF9F6; margin: 0; }
</style>
