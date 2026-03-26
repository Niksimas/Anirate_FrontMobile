<template>
  <ion-page>
    <ion-content class="add-sheet-content">
      <div class="drag-handle-row"><div class="drag-handle" /></div>

      <!-- Search bar -->
      <div class="search-wrap">
        <input
          v-model="query"
          class="search-input"
          placeholder="Найди аниме по названию..."
          @input="search"
        />
      </div>

      <!-- Loading -->
      <div v-if="searchLoading" class="results-wrap">
        <div v-for="i in 5" :key="i" class="result-item">
          <ion-skeleton-text animated class="result-thumb-skeleton" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:16px;width:70%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:13px;width:40%;" />
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-else-if="results.length" class="results-wrap">
        <div
          v-for="anime in results"
          :key="anime.id"
          class="result-item"
        >
          <img :src="fixUrl(anime.image_url)" :alt="anime.title" class="result-thumb" />
          <div class="result-meta">
            <p class="result-title">{{ anime.title }}</p>
            <p class="result-sub">{{ [anime.season, anime.year].filter(Boolean).join(' · ') }}</p>
          </div>
          <button
            class="add-btn"
            :class="{ 'add-btn--done': added.has(anime.id) }"
            :disabled="added.has(anime.id)"
            @click="addAnime(anime)"
          >
            <ion-icon :icon="added.has(anime.id) ? checkmarkCircle : addCircleOutline" class="add-btn-icon" />
            {{ added.has(anime.id) ? 'Готово' : 'Добавить' }}
          </button>
        </div>
      </div>

      <!-- No results -->
      <div v-else-if="query.trim() && searched" class="empty-state">
        <ion-icon :icon="searchOutline" class="empty-icon" />
        <p class="empty-text">Ничего не найдено</p>
        <p class="empty-hint">Попробуй другой запрос</p>
      </div>

      <!-- Initial state -->
      <div v-else class="empty-state">
        <ion-icon :icon="searchOutline" class="empty-icon" />
        <p class="empty-text">Найди аниме по названию</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonContent, IonSkeletonText, IonIcon } from '@ionic/vue';
import { addCircleOutline, checkmarkCircle, searchOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { fixUrl } from '@/composables/useImageUrl';
import { animeApi } from '@/api/anime';
import { listsApi } from '@/api/lists';
import type { AnimeResponse, ListAnimeResponse } from '@/types';

const props = defineProps<{ listId: number }>();
const emit = defineEmits<{ close: []; added: [ListAnimeResponse] }>();

const query = ref('');
const results = ref<AnimeResponse[]>([]);
const searchLoading = ref(false);
const searched = ref(false);
const added = ref(new Set<number>());

let debounceTimer: ReturnType<typeof setTimeout>;

function search() {
  searched.value = false;
  clearTimeout(debounceTimer);
  if (!query.value.trim()) {
    results.value = [];
    return;
  }
  debounceTimer = setTimeout(doSearch, 400);
}

async function doSearch() {
  searchLoading.value = true;
  try {
    const { data } = await animeApi.search({ query: query.value.trim(), limit: 20 });
    results.value = data.items;
  } finally {
    searchLoading.value = false;
    searched.value = true;
  }
}

async function addAnime(anime: AnimeResponse) {
  try {
    const { data } = await listsApi.addAnime(props.listId, { anime_id: anime.id });
    added.value.add(anime.id);
    try { Haptics.impact({ style: ImpactStyle.Light }); } catch { /* */ }
    emit('added', data);
  } catch { /* already in list or error */ }
}
</script>

<style scoped>
.add-sheet-content {
  --background: #1E1E1E;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 0;
}

.drag-handle-row {
  display: flex;
  justify-content: center;
  padding: 10px 0 8px;
}

.drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

/* ── Search ──────────────────────────────────────────────────────────────── */
.search-wrap {
  padding-bottom: 12px;
}

.search-input {
  width: 100%;
  background: #2D2D3A;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  color: #FFFFFF;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-input:focus {
  box-shadow: 0 0 0 1px rgba(167, 184, 217, 0.4);
}

/* ── Results ─────────────────────────────────────────────────────────────── */
.results-wrap {
  padding-bottom: env(safe-area-inset-bottom, 8px);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.result-item + .result-item {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.result-thumb {
  width: 52px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  background: #2D2D3A;
  flex-shrink: 0;
}

.result-thumb-skeleton {
  width: 52px;
  height: 72px;
  border-radius: 8px;
  flex-shrink: 0;
  --background: #2D2D3A;
}

.result-meta {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* ── Add button ──────────────────────────────────────────────────────────── */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: rgba(167, 184, 217, 0.15);
  color: #A7B8D9;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  min-height: 36px;
  flex-shrink: 0;
  transition: transform 0.1s;
}

.add-btn:active {
  transform: scale(0.96);
}

.add-btn--done {
  background: rgba(76, 175, 80, 0.15);
  color: #66BB6A;
}

.add-btn-icon {
  font-size: 16px;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 6px;
  text-align: center;
}

.empty-icon {
  font-size: 44px;
  color: #697289;
  margin-bottom: 4px;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}
</style>
