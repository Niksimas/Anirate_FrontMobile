<template>
  <ion-page>
    <ion-content ref="contentRef" class="search-content">
      <ion-refresher slot="fixed" @ion-refresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Search bar -->
      <div class="searchbar-wrap">
        <ion-searchbar
          v-model="query"
          placeholder="Поиск"
          :debounce="400"
          show-clear-button="always"
          class="main-searchbar"
          @ion-input="onInput"
          @ion-clear="onClear"
        />
      </div>

      <!-- Filter row -->
      <div class="filter-row">
        <button
          class="filter-pill"
          :class="{ 'filter-pill--active': hasFilters }"
          @click="openFiltersModal"
        >
          Фильтры{{ activeFilterCount ? ` (${activeFilterCount})` : '' }}
        </button>
        <button v-if="hasFilters" class="reset-pill" @click="resetFilters">
          Сбросить фильтры
        </button>
      </div>

      <!-- Section title when filters active -->
      <p v-if="hasFilters && !loading" class="section-title">Результат поиска</p>

      <!-- Loading skeleton -->
      <div v-if="loading" class="anime-grid">
        <div v-for="i in 10" :key="i" class="skeleton-card">
          <ion-skeleton-text animated class="skeleton-poster" />
          <ion-skeleton-text animated class="skeleton-title" />
        </div>
      </div>

      <!-- Results -->
      <div v-else-if="results.length" class="anime-grid">
        <AnimeCard
          v-for="anime in results"
          :key="anime.id"
          :anime="anime"
          @click="goToAnime(anime.id)"
        />
      </div>

      <!-- Empty search state -->
      <div v-else-if="searched" class="empty-state">
        <ion-icon :icon="searchOutline" class="empty-icon" />
        <p>Ничего не найдено</p>
        <p class="empty-hint">Попробуй другой запрос или убери фильтры</p>
      </div>

      <!-- Browse / default -->
      <div v-else class="anime-grid">
        <AnimeCard
          v-for="anime in browse"
          :key="anime.id"
          :anime="anime"
          @click="goToAnime(anime.id)"
        />
      </div>

      <ion-infinite-scroll ref="infiniteScrollRef" :disabled="noMore" @ion-infinite="loadMore">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>

    <!-- Filters modal -->
    <ion-modal ref="filtersModal" :initial-breakpoint="0.85" :breakpoints="[0, 0.85, 1]">
      <SearchFiltersModal
        :filters="availableFilters"
        :current="currentFilterValues"
        @apply="onFiltersApply"
        @close="filtersModal?.$el.dismiss()"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { onIonViewDidEnter } from '@ionic/vue';
import {
  IonPage, IonContent, IonIcon, IonModal,
  IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText,
  IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/vue';
import { searchOutline } from 'ionicons/icons';
import AnimeCard from '@/components/AnimeCard.vue';
import SearchFiltersModal from '@/components/SearchFiltersModal.vue';
import type { FilterValues } from '@/components/SearchFiltersModal.vue';
import { animeApi } from '@/api/anime';
import type { AnimeFilterParams } from '@/api/anime';
import type { AnimeResponse, FiltersResponse } from '@/types';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const route = useRoute();
const contentRef = ref();
const query = ref('');
let isFirstEnter = true;
const results = ref<AnimeResponse[]>([]);
const browse = ref<AnimeResponse[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const searched = ref(false);
const offset = ref(0);
const noMore = ref(false);
const LIMIT = 30;

// Filter modal
const filtersModal = ref();
const availableFilters = ref<FiltersResponse | null>(null);

// Applied filters
const appliedYearFrom = ref<number | null>(null);
const appliedYearTo = ref<number | null>(null);
const appliedGenreIds = ref<number[]>([]);
const appliedType = ref<string | null>(null);
const appliedStatus = ref<string | null>(null);
const appliedEpisodesFrom = ref<number | null>(null);
const appliedEpisodesTo = ref<number | null>(null);

const currentFilterValues = computed<FilterValues>(() => ({
  yearFrom: appliedYearFrom.value,
  yearTo: appliedYearTo.value,
  genreIds: appliedGenreIds.value,
  type: appliedType.value,
  status: appliedStatus.value,
  episodesFrom: appliedEpisodesFrom.value,
  episodesTo: appliedEpisodesTo.value,
}));

const hasFilters = computed(() =>
  !!(appliedYearFrom.value || appliedYearTo.value || appliedGenreIds.value.length ||
     appliedType.value || appliedStatus.value || appliedEpisodesFrom.value || appliedEpisodesTo.value)
);

const activeFilterCount = computed(() => {
  let count = 0;
  if (appliedYearFrom.value || appliedYearTo.value) count++;
  if (appliedGenreIds.value.length) count++;
  if (appliedType.value) count++;
  if (appliedStatus.value) count++;
  if (appliedEpisodesFrom.value || appliedEpisodesTo.value) count++;
  return count;
});

function buildFilterParams(): AnimeFilterParams {
  return {
    year_from: appliedYearFrom.value ?? undefined,
    year_to: appliedYearTo.value ?? undefined,
    genre_ids: appliedGenreIds.value.length ? appliedGenreIds.value : undefined,
    anime_type: appliedType.value ?? undefined,
    status: appliedStatus.value ?? undefined,
    episodes_from: appliedEpisodesFrom.value ?? undefined,
    episodes_to: appliedEpisodesTo.value ?? undefined,
  };
}

onMounted(async () => {
  loadBrowse();
  try {
    const { data } = await animeApi.getFilters();
    availableFilters.value = data;
  } catch { /* filters will be empty */ }
});

function scrollToTop() {
  contentRef.value?.$el?.scrollToTop(0);
}

onIonViewDidEnter(() => {
  // Check genre filter from query param (e.g., from AnimeView genre tap)
  const genreId = route.query.genre_id ? Number(route.query.genre_id) : null;
  if (genreId) {
    router.replace({ path: '/tabs/search' });
    onClear();
    resetFilters();
    appliedGenreIds.value = [genreId];
    browse.value = [];
    offset.value = 0;
    scrollToTop();
    loadBrowse().then(scrollToTop);
    return;
  }

  if (isFirstEnter) {
    isFirstEnter = false;
    return;
  }
});

// Listen for re-tap on search tab button
function onSearchTabReset() {
  // Always scroll to top
  scrollToTop();
  // If there's active search, clear it (keep filters)
  if (query.value.trim() || searched.value) {
    query.value = '';
    results.value = [];
    searched.value = false;
    offset.value = 0;
    noMore.value = false;
    loadBrowse().then(scrollToTop);
  }
}

onMounted(() => window.addEventListener('search-tab-reset', onSearchTabReset));
onUnmounted(() => window.removeEventListener('search-tab-reset', onSearchTabReset));

async function openFiltersModal() {
  if (!availableFilters.value) {
    try {
      const { data } = await animeApi.getFilters();
      availableFilters.value = data;
    } catch { /* ignore */ }
  }
  filtersModal.value?.$el.present();
}

async function onFiltersApply(values: FilterValues) {
  appliedYearFrom.value = values.yearFrom;
  appliedYearTo.value = values.yearTo;
  appliedGenreIds.value = values.genreIds;
  appliedType.value = values.type;
  appliedStatus.value = values.status;
  appliedEpisodesFrom.value = values.episodesFrom;
  appliedEpisodesTo.value = values.episodesTo;
  filtersModal.value?.$el.dismiss();
  browse.value = [];
  offset.value = 0;
  await loadBrowse();
}

async function loadBrowse() {
  loading.value = true;
  noMore.value = false;
  try {
    const { data } = await animeApi.getAll({
      limit: LIMIT, offset: 0,
      ...buildFilterParams(),
    });
    browse.value = data;
    if (data.length < LIMIT) noMore.value = true;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function onInput() {
  if (!query.value.trim()) { onClear(); return; }
  await runSearch(true);
}

function onClear() {
  results.value = [];
  searched.value = false;
  query.value = '';
  offset.value = 0;
  noMore.value = false;
}

async function runSearch(reset = false) {
  if (reset) {
    offset.value = 0;
    results.value = [];
    noMore.value = false;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  searched.value = true;
  try {
    const { data } = await animeApi.search({
      query: query.value.trim(),
      limit: LIMIT,
      offset: offset.value,
    });
    results.value = reset ? data.items : [...results.value, ...data.items];
    if (data.items.length < LIMIT || results.value.length >= data.total) {
      noMore.value = true;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

async function loadMore(ev: InfiniteScrollCustomEvent) {
  offset.value += LIMIT;
  if (query.value.trim()) {
    await runSearch(false);
  } else {
    const { data } = await animeApi.getAll({
      limit: LIMIT, offset: offset.value,
      ...buildFilterParams(),
    });
    browse.value = [...browse.value, ...data];
    if (data.length < LIMIT) noMore.value = true;
  }
  ev.target.complete();
}

async function onRefresh(ev: RefresherCustomEvent) {
  await loadBrowse();
  ev.detail.complete();
}

function resetFilters() {
  appliedYearFrom.value = null;
  appliedYearTo.value = null;
  appliedGenreIds.value = [];
  appliedType.value = null;
  appliedStatus.value = null;
  appliedEpisodesFrom.value = null;
  appliedEpisodesTo.value = null;
  browse.value = [];
  offset.value = 0;
  loadBrowse();
}

function goToAnime(id: number) { router.push(`/anime/${id}`); }
</script>

<style scoped>
.search-content {
  --background: #1E1E1E;
}

/* Search bar */
.searchbar-wrap {
  padding: calc(var(--ion-safe-area-top, 0px) + 8px) 12px 4px;
}

.main-searchbar {
  --background: #2A2A2A;
  --color: #FFFFFF;
  --placeholder-color: rgba(255,255,255,0.4);
  --icon-color: rgba(255,255,255,0.4);
  --clear-button-color: rgba(255,255,255,0.4);
  --border-radius: 12px;
  --box-shadow: none;
  padding: 0;
  height: 44px;
}

/* Filter row */
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 8px;
}

.filter-pill {
  padding: 7px 18px;
  border-radius: 20px;
  border: none;
  background: #FF9E9E;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.filter-pill--active {
  background: #FF9E9E;
}

.reset-pill {
  padding: 7px 16px;
  border-radius: 20px;
  border: none;
  background: #A7B8D9;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* Section title */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 4px 16px 12px;
  letter-spacing: -0.3px;
}

/* Grid */
.anime-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 16px 16px;
}

.skeleton-card .skeleton-poster {
  aspect-ratio: 2/3;
  border-radius: 12px;
  width: 100%;
  --background: #2D2D3A;
}

.skeleton-card .skeleton-title {
  height: 14px;
  border-radius: 4px;
  margin-top: 6px;
  --background: #2D2D3A;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  gap: 8px;
}

.empty-icon { font-size: 56px; color: rgba(255,255,255,0.3); }
.empty-state p { color: #FFFFFF; margin: 0; }
.empty-hint { font-size: 0.85rem; color: rgba(255,255,255,0.4) !important; }

</style>
