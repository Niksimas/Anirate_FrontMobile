<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/lists" />
        </ion-buttons>
        <ion-title>{{ list?.name ?? '' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="membersMenu?.$el.present()">
            <ion-icon slot="icon-only" :icon="peopleOutline" />
          </ion-button>
          <ion-button v-if="isOwner" @click="settingsAlert = true">
            <ion-icon slot="icon-only" :icon="settingsOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Add anime FAB -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="addAnimeModal?.$el.present()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <div v-if="loading" class="anime-grid">
        <div v-for="i in 9" :key="i">
          <ion-skeleton-text animated class="skeleton-poster" />
          <ion-skeleton-text animated style="height:12px;margin-top:4px;" />
        </div>
      </div>

      <div v-else-if="animeList.length" class="anime-grid">
        <div
          v-for="item in animeList"
          :key="item.anime_id"
          class="anime-card-wrap"
          @click="openRating(item)"
        >
          <div class="anime-card__poster">
            <img :src="item.image_url" :alt="item.title" loading="lazy" />
            <div v-if="item.average_score" class="score-badge">★ {{ item.average_score.toFixed(1) }}</div>
          </div>
          <p class="anime-card__title">{{ item.title }}</p>
          <p class="anime-card__ratings">{{ item.ratings?.length ?? 0 }} оценок</p>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="albumsOutline" class="empty-icon" />
        <p>Список пуст</p>
        <p class="hint">Добавь первое аниме</p>
      </div>
    </ion-content>

    <!-- Rate anime modal -->
    <ion-modal ref="rateModal" :initial-breakpoint="0.6" :breakpoints="[0, 0.6]">
      <RateAnimeSheet
        v-if="ratingItem"
        :list-id="listId"
        :item="ratingItem"
        :my-user-id="myUserId"
        @close="rateModal?.$el.dismiss()"
        @saved="onRatingSaved"
        @remove-anime="onAnimeRemoved"
      />
    </ion-modal>

    <!-- Add anime modal -->
    <ion-modal ref="addAnimeModal" :initial-breakpoint="0.9" :breakpoints="[0, 0.9, 1]">
      <AddAnimeSheet
        :list-id="listId"
        @close="addAnimeModal?.$el.dismiss()"
        @added="onAnimeAdded"
      />
    </ion-modal>

    <!-- Members sheet -->
    <ion-modal ref="membersMenu" :initial-breakpoint="0.75" :breakpoints="[0, 0.75, 1]">
      <ListMembersSheet
        :list-id="listId"
        :owner-id="list?.owner_id"
        :my-user-id="myUserId"
        @close="membersMenu?.$el.dismiss()"
      />
    </ion-modal>

    <!-- Settings action sheet (owner only) -->
    <ion-action-sheet
      :is-open="settingsAlert"
      header="Управление списком"
      :buttons="ownerButtons"
      @did-dismiss="settingsAlert = false"
    />

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2500" @did-dismiss="toastOpen=false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonSkeletonText, IonFab, IonFabButton,
  IonModal, IonActionSheet, IonToast,
} from '@ionic/vue';
import { addOutline, peopleOutline, settingsOutline, albumsOutline } from 'ionicons/icons';
import RateAnimeSheet from '@/components/RateAnimeSheet.vue';
import AddAnimeSheet from '@/components/AddAnimeSheet.vue';
import ListMembersSheet from '@/components/ListMembersSheet.vue';
import { listsApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth';
import type { SharedListResponse, ListAnimeResponse } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';
import { Clipboard } from '@capacitor/clipboard';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const listId = Number(route.params.id);
const myUserId = computed(() => authStore.user?.id ?? 0);
const list = ref<SharedListResponse | null>(null);
const animeList = ref<ListAnimeResponse[]>([]);
const loading = ref(true);
const rateModal = ref();
const addAnimeModal = ref();
const membersMenu = ref();
const ratingItem = ref<ListAnimeResponse | null>(null);
const settingsAlert = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');

const isOwner = computed(() => list.value?.owner_id === myUserId.value);

const ownerButtons = computed(() => [
  {
    text: 'Скопировать инвайт-код',
    handler: async () => {
      if (list.value?.invite_code) {
        await Clipboard.write({ string: list.value.invite_code });
        toastMsg.value = 'Код скопирован';
        toastOpen.value = true;
      }
    },
  },
  {
    text: 'Обновить инвайт-код',
    handler: async () => {
      await listsApi.regenerateInvite(listId);
      await loadList();
      toastMsg.value = 'Инвайт-код обновлён';
      toastOpen.value = true;
    },
  },
  {
    text: 'Удалить список',
    role: 'destructive',
    handler: async () => {
      await listsApi.delete(listId);
      router.replace('/lists');
    },
  },
  { text: 'Отмена', role: 'cancel' },
]);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    await Promise.all([loadList(), loadAnime()]);
  } finally {
    loading.value = false;
  }
}

async function loadList() {
  const { data } = await listsApi.getById(listId);
  list.value = data;
}

async function loadAnime() {
  const { data } = await listsApi.getAnimeList(listId);
  animeList.value = data;
}

async function refresh(ev: RefresherCustomEvent) { await load(); ev.detail.complete(); }

function openRating(item: ListAnimeResponse) {
  ratingItem.value = item;
  rateModal.value?.$el.present();
}

function onRatingSaved() {
  loadAnime();
  rateModal.value?.$el.dismiss();
}

function onAnimeRemoved(animeId: number) {
  animeList.value = animeList.value.filter((a) => a.anime_id !== animeId);
  rateModal.value?.$el.dismiss();
}

function onAnimeAdded(item: ListAnimeResponse) {
  animeList.value.push(item);
  addAnimeModal.value?.$el.dismiss();
}
</script>

<style scoped>
.anime-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; padding: 12px; }
.anime-card-wrap { cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
.anime-card__poster { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 2/3; background: var(--ion-color-step-100); }
.anime-card__poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.score-badge { position: absolute; bottom: 6px; right: 6px; padding: 2px 6px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(0,0,0,0.7); color: #ffd700; }
.anime-card__title { font-size: 0.78rem; font-weight: 600; margin: 0; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.anime-card__ratings { font-size: 0.7rem; color: var(--ion-color-medium); margin: 0; }
.skeleton-poster { aspect-ratio: 2/3; border-radius: 10px; width: 100%; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; gap: 8px; text-align: center; }
.empty-icon { font-size: 56px; color: var(--ion-color-medium); }
.hint { font-size: 0.85rem; color: var(--ion-color-medium); }
</style>
