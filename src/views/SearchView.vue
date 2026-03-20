<template>
  <ion-page>
    <ion-content class="search-content">
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
          :class="{ 'filter-pill--active': hasFilters || filtersOpen }"
          @click="filtersOpen = !filtersOpen"
        >
          Фильтры{{ activeFilterCount ? ` (${activeFilterCount})` : '' }}
        </button>
        <button v-if="hasFilters" class="reset-pill" @click="resetFilters">
          Сбросить фильтры
        </button>
      </div>

      <!-- Inline filter panel -->
      <transition name="filter-drop">
        <div v-if="filtersOpen" class="filter-panel">
          <h3 class="filter-panel__title">Фильтры</h3>

          <div class="filter-section">
            <p class="filter-section__label">Год выпуска</p>
            <div class="year-row">
              <div class="year-input-wrap">
                <input
                  v-model.number="draftYearFrom"
                  type="number"
                  placeholder="ГГГГ"
                  class="year-input"
                  min="1960"
                  :max="currentYear"
                />
                <ion-icon :icon="calendarOutline" class="year-input-icon" />
              </div>
              <div class="year-input-wrap">
                <input
                  v-model.number="draftYearTo"
                  type="number"
                  placeholder="ГГГГ"
                  class="year-input"
                  min="1960"
                  :max="currentYear"
                />
                <ion-icon :icon="calendarOutline" class="year-input-icon" />
              </div>
            </div>
          </div>

          <div class="filter-selector">
            <span class="filter-selector__label">Жанры</span>
            <ion-icon :icon="chevronDownOutline" class="filter-selector__arrow" />
          </div>
          <div class="filter-selector">
            <span class="filter-selector__label">Тип</span>
            <ion-icon :icon="chevronDownOutline" class="filter-selector__arrow" />
          </div>
          <div class="filter-selector">
            <span class="filter-selector__label">Статус</span>
            <ion-icon :icon="chevronDownOutline" class="filter-selector__arrow" />
          </div>
          <div class="filter-selector" style="margin-bottom: 16px">
            <span class="filter-selector__label">Количество серий</span>
            <ion-icon :icon="chevronDownOutline" class="filter-selector__arrow" />
          </div>

          <div class="filter-panel__actions">
            <button class="panel-btn panel-btn--apply" @click="applyFilters">Применить</button>
            <button class="panel-btn panel-btn--reset" @click="resetFilters">Очистить выбор</button>
          </div>
        </div>
      </transition>

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
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonIcon,
  IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText,
  IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/vue';
import { searchOutline, calendarOutline, chevronDownOutline } from 'ionicons/icons';
import AnimeCard from '@/components/AnimeCard.vue';
import { animeApi } from '@/api/anime';
import type { AnimeResponse } from '@/types';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const query = ref('');
const results = ref<AnimeResponse[]>([]);
const browse = ref<AnimeResponse[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const searched = ref(false);
const offset = ref(0);
const noMore = ref(false);
const LIMIT = 30;

// Filter state
const filtersOpen = ref(false);
const filterYear = ref<number | null>(null);
const draftYearFrom = ref<number | null>(null);
const draftYearTo = ref<number | null>(null);
const currentYear = new Date().getFullYear();

const hasFilters = computed(() => !!filterYear.value);
const activeFilterCount = computed(() => (filterYear.value ? 1 : 0));

onMounted(loadBrowse);

async function loadBrowse() {
  loading.value = true;
  noMore.value = false;
  try {
    const { data } = await animeApi.getAll({
      limit: LIMIT, offset: 0,
      year: filterYear.value ?? undefined,
    });
    browse.value = data;
    if (data.length < LIMIT) {
      noMore.value = true;
    }
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
      year: filterYear.value ?? undefined,
    });
    browse.value = [...browse.value, ...data];
    if (data.length < LIMIT) {
      noMore.value = true;
    }
  }
  ev.target.complete();
}

async function onRefresh(ev: RefresherCustomEvent) {
  await loadBrowse();
  ev.detail.complete();
}

async function applyFilters() {
  filterYear.value = draftYearFrom.value;
  filtersOpen.value = false;
  browse.value = [];
  offset.value = 0;
  await loadBrowse();
}

function resetFilters() {
  filterYear.value = null;
  draftYearFrom.value = null;
  draftYearTo.value = null;
  filtersOpen.value = false;
  browse.value = [];
  offset.value = 0;
  loadBrowse();
}

function goToAnime(id: number) { router.push(`/anime/${id}`); }
</script>

<style scoped>
.search-content {
  --background: #111111;
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

/* Filter panel */
.filter-panel {
  margin: 0 12px 12px;
  background: #2D2D3A;
  border-radius: 16px;
  padding: 20px 16px 16px;
}

.filter-panel__title {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 16px;
}

.filter-section__label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.year-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.year-input-wrap {
  flex: 1;
  position: relative;
}

.year-input {
  width: 100%;
  box-sizing: border-box;
  background: #3A3A4A;
  border: none;
  border-radius: 10px;
  padding: 12px 36px 12px 14px;
  color: #FFFFFF;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.year-input::placeholder { color: rgba(255,255,255,0.35); }

.year-input-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: rgba(255,255,255,0.4);
  pointer-events: none;
}

.filter-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #3A3A4A;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 8px;
  cursor: pointer;
}

.filter-selector__label {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.filter-selector__arrow {
  font-size: 16px;
  color: rgba(255,255,255,0.4);
}

.filter-panel__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.panel-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.panel-btn--apply {
  background: #5CB85C;
  color: #FFFFFF;
}

.panel-btn--reset {
  background: #FF9E9E;
  color: #1A1A1A;
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

/* Animation */
.filter-drop-enter-active,
.filter-drop-leave-active {
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top;
}

.filter-drop-enter-from,
.filter-drop-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
</style>
