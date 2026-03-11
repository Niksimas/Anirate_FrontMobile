<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-searchbar
          v-model="query"
          placeholder="Поиск аниме..."
          :debounce="400"
          show-clear-button="focus"
          @ion-input="onInput"
          @ion-clear="onClear"
        />
        <ion-buttons slot="end">
          <ion-button @click="openFilters">
            <ion-icon slot="icon-only" :icon="optionsOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <!-- Active filters chips -->
      <ion-toolbar v-if="activeFilters" class="filters-bar">
        <div class="filter-chips">
          <ion-chip v-if="filterYear" @click="openFilters">
            <ion-label>{{ filterYear }}</ion-label>
            <ion-icon :icon="closeCircle" @click.stop="clearYear" />
          </ion-chip>
          <ion-chip v-if="filterSeason" @click="openFilters">
            <ion-label>{{ seasonLabel(filterSeason) }}</ion-label>
            <ion-icon :icon="closeCircle" @click.stop="clearSeason" />
          </ion-chip>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading skeleton -->
      <div v-if="loading" class="anime-grid">
        <div v-for="i in 12" :key="i" class="anime-card-skeleton">
          <ion-skeleton-text animated class="skeleton-poster" />
          <ion-skeleton-text animated class="skeleton-title" />
        </div>
      </div>

      <!-- Results grid -->
      <div v-else-if="results.length" class="anime-grid">
        <AnimeCard
          v-for="anime in results"
          :key="anime.id"
          :anime="anime"
          @click="goToAnime(anime.id)"
        />
      </div>

      <!-- Empty state -->
      <div v-else-if="searched" class="empty-state">
        <ion-icon :icon="searchOutline" class="empty-icon" />
        <p>Ничего не найдено</p>
        <p class="empty-hint">Попробуй другой запрос или убери фильтры</p>
      </div>

      <!-- Default state: initial browse -->
      <div v-else class="anime-grid">
        <AnimeCard
          v-for="anime in browse"
          :key="anime.id"
          :anime="anime"
          @click="goToAnime(anime.id)"
        />
      </div>

      <ion-infinite-scroll @ion-infinite="loadMore">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>

    <!-- Filters modal -->
    <ion-modal ref="filtersModal" :initial-breakpoint="0.5" :breakpoints="[0, 0.5, 1]">
      <SearchFiltersModal
        :year="filterYear"
        :season="filterSeason"
        @apply="applyFilters"
        @close="filtersModal?.$el.dismiss()"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonButton, IonIcon,
  IonContent, IonChip, IonLabel, IonSkeletonText, IonModal,
  IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/vue';
import { optionsOutline, searchOutline, closeCircle } from 'ionicons/icons';
import AnimeCard from '@/components/AnimeCard.vue';
import SearchFiltersModal from '@/components/SearchFiltersModal.vue';
import { animeApi } from '@/api/anime';
import type { AnimeResponse } from '@/types';
import type { InfiniteScrollCustomEvent } from '@ionic/vue';

const router = useRouter();
const query = ref('');
const results = ref<AnimeResponse[]>([]);
const browse = ref<AnimeResponse[]>([]);
const loading = ref(false);
const searched = ref(false);
const filterYear = ref<number | null>(null);
const filterSeason = ref<string | null>(null);
const filtersModal = ref();
const offset = ref(0);
const LIMIT = 30;

const activeFilters = computed(() => filterYear.value || filterSeason.value);

const SEASON_LABELS: Record<string, string> = {
  winter: 'Зима', spring: 'Весна', summer: 'Лето', fall: 'Осень',
};
function seasonLabel(s: string) { return SEASON_LABELS[s] ?? s; }

onMounted(loadBrowse);

async function loadBrowse() {
  try {
    const { data } = await animeApi.getAll({ limit: LIMIT, offset: 0 });
    browse.value = data;
  } catch (e) {
    console.error(e);
  }
}

async function onInput() {
  if (!query.value.trim()) {
    onClear();
    return;
  }
  await runSearch(true);
}

function onClear() {
  results.value = [];
  searched.value = false;
  query.value = '';
  offset.value = 0;
}

async function runSearch(reset = false) {
  if (reset) {
    offset.value = 0;
    results.value = [];
  }
  loading.value = true;
  searched.value = true;
  try {
    const { data } = await animeApi.search({
      query: query.value.trim(),
      limit: LIMIT,
      offset: offset.value,
    });
    results.value = reset ? data.items : [...results.value, ...data.items];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function loadMore(ev: InfiniteScrollCustomEvent) {
  offset.value += LIMIT;
  if (query.value.trim()) {
    await runSearch(false);
  } else {
    const { data } = await animeApi.getAll({
      limit: LIMIT, offset: offset.value,
      year: filterYear.value ?? undefined,
      season: filterSeason.value ?? undefined,
    });
    browse.value = [...browse.value, ...data];
  }
  ev.target.complete();
}

function openFilters() { filtersModal.value?.$el.present(); }
function clearYear() { filterYear.value = null; applyFilters({ year: null, season: filterSeason.value }); }
function clearSeason() { filterSeason.value = null; applyFilters({ year: filterYear.value, season: null }); }

async function applyFilters({ year, season }: { year: number | null; season: string | null }) {
  filterYear.value = year;
  filterSeason.value = season;
  filtersModal.value?.$el.dismiss();
  browse.value = [];
  offset.value = 0;
  const { data } = await animeApi.getAll({
    limit: LIMIT, offset: 0,
    year: year ?? undefined,
    season: season ?? undefined,
  });
  browse.value = data;
}

function goToAnime(id: number) { router.push(`/anime/${id}`); }
</script>

<style scoped>
.anime-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
}
.anime-card-skeleton .skeleton-poster {
  aspect-ratio: 2/3;
  border-radius: 10px;
  width: 100%;
}
.anime-card-skeleton .skeleton-title {
  height: 14px;
  border-radius: 4px;
  margin-top: 4px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  gap: 8px;
}
.empty-icon { font-size: 56px; color: var(--ion-color-medium); }
.empty-hint { font-size: 0.85rem; color: var(--ion-color-medium); margin: 0; }
.filters-bar { --min-height: 44px; }
.filter-chips { display: flex; gap: 8px; padding: 4px 12px; }
</style>
