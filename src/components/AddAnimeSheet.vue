<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-searchbar v-model="query" placeholder="Найти аниме..." :debounce="400" autofocus @ion-input="search" />
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Закрыть</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text v-for="i in 5" :key="i" animated style="height:56px;border-radius:8px;margin-bottom:8px;" />
      </div>

      <ion-list v-else-if="results.length" lines="none" class="ion-padding-horizontal">
        <ion-item v-for="anime in results" :key="anime.id">
          <ion-thumbnail slot="start" class="anime-thumb">
            <img :src="anime.image_url" :alt="anime.title" />
          </ion-thumbnail>
          <ion-label>
            <h3>{{ anime.title }}</h3>
            <p>{{ anime.season }} {{ anime.year }}</p>
          </ion-label>
          <ion-button slot="end" size="small" :disabled="added.has(anime.id)" @click="addAnime(anime)">
            {{ added.has(anime.id) ? '✓' : 'Добавить' }}
          </ion-button>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonThumbnail, IonLabel, IonSkeletonText,
} from '@ionic/vue';
import { animeApi } from '@/api/anime';
import { listsApi } from '@/api/lists';
import type { AnimeResponse, ListAnimeResponse } from '@/types';

const props = defineProps<{ listId: number }>();
const emit = defineEmits<{ close: []; added: [ListAnimeResponse] }>();

const query = ref('');
const results = ref<AnimeResponse[]>([]);
const loading = ref(false);
const added = ref(new Set<number>());

async function search() {
  if (!query.value.trim()) { results.value = []; return; }
  loading.value = true;
  try {
    const { data } = await animeApi.search({ query: query.value.trim(), limit: 20 });
    results.value = data.items;
  } finally { loading.value = false; }
}

async function addAnime(anime: AnimeResponse) {
  try {
    const { data } = await listsApi.addAnime(props.listId, { anime_id: anime.id });
    added.value.add(anime.id);
    emit('added', data);
  } catch (e) { console.error(e); }
}
</script>

<style scoped>
.anime-thumb { --size: 44px; border-radius: 6px; overflow: hidden; }
</style>
