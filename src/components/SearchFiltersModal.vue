<template>
  <ion-page>
    <ion-content class="filters-content">
      <div class="drag-handle-row"><div class="drag-handle" /></div>

      <p class="sheet-title">Фильтры</p>

      <!-- Year range -->
      <div class="filter-group">
        <label class="filter-label">Год выпуска</label>
        <div class="range-row">
          <input v-model.number="draft.yearFrom" type="number" placeholder="От" class="range-input" min="1960" :max="currentYear" />
          <input v-model.number="draft.yearTo" type="number" placeholder="До" class="range-input" min="1960" :max="currentYear" />
        </div>
      </div>

      <!-- Genres -->
      <div v-if="filters?.genres?.length" class="filter-group">
        <label class="filter-label">Жанры</label>
        <div class="chip-list">
          <button
            v-for="g in visibleGenres"
            :key="g.id"
            class="chip"
            :class="{ 'chip--active': selectedGenreIds.has(g.id) }"
            @click="toggleGenre(g.id)"
          >{{ g.title }}</button>
          <button
            v-if="!genresExpanded && hiddenGenreCount > 0"
            class="chip chip--more"
            @click="showMoreGenres"
          >ещё +{{ Math.min(GENRES_STEP, hiddenGenreCount) }}</button>
          <button
            v-if="genresShowCount > GENRES_STEP"
            class="chip chip--more"
            @click="collapseGenres"
          >свернуть</button>
        </div>
      </div>

      <!-- Type -->
      <div v-if="filters?.types?.length" class="filter-group">
        <label class="filter-label">Тип</label>
        <div class="chip-list">
          <button
            v-for="t in filters.types"
            :key="t"
            class="chip"
            :class="{ 'chip--active': draft.type === t }"
            @click="draft.type = draft.type === t ? null : t"
          >{{ t }}</button>
        </div>
      </div>

      <!-- Status -->
      <div v-if="filters?.statuses?.length" class="filter-group">
        <label class="filter-label">Статус</label>
        <div class="chip-list">
          <button
            v-for="s in filters.statuses"
            :key="s"
            class="chip"
            :class="{ 'chip--active': draft.status === s }"
            @click="draft.status = draft.status === s ? null : s"
          >{{ s }}</button>
        </div>
      </div>

      <!-- Episodes range -->
      <div class="filter-group">
        <label class="filter-label">Количество серий</label>
        <div class="range-row">
          <input v-model.number="draft.episodesFrom" type="number" placeholder="От" class="range-input" min="1" />
          <input v-model.number="draft.episodesTo" type="number" placeholder="До" class="range-input" min="1" />
        </div>
      </div>

      <!-- Actions -->
      <div class="filter-actions">
        <button class="apply-btn" @click="apply">Применить</button>
        <button class="reset-btn" @click="reset">Сбросить</button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import type { FiltersResponse } from '@/types';

export interface FilterValues {
  yearFrom: number | null;
  yearTo: number | null;
  genreIds: number[];
  type: string | null;
  status: string | null;
  episodesFrom: number | null;
  episodesTo: number | null;
}

const props = defineProps<{
  filters?: FiltersResponse | null;
  current: FilterValues;
}>();

const emit = defineEmits<{
  apply: [FilterValues];
  close: [];
}>();

const currentYear = new Date().getFullYear();

const draft = reactive({
  yearFrom: props.current.yearFrom,
  yearTo: props.current.yearTo,
  type: props.current.type,
  status: props.current.status,
  episodesFrom: props.current.episodesFrom,
  episodesTo: props.current.episodesTo,
});

const selectedGenreIds = ref(new Set(props.current.genreIds));

const GENRES_STEP = 10;
const genresShowCount = ref(GENRES_STEP);
const allGenres = computed(() => props.filters?.genres ?? []);
const visibleGenres = computed(() => allGenres.value.slice(0, genresShowCount.value));
const hiddenGenreCount = computed(() => Math.max(0, allGenres.value.length - genresShowCount.value));
const genresExpanded = computed(() => genresShowCount.value >= allGenres.value.length);

function showMoreGenres() {
  genresShowCount.value = Math.min(genresShowCount.value + GENRES_STEP, allGenres.value.length);
}

function collapseGenres() {
  genresShowCount.value = GENRES_STEP;
}

function toggleGenre(id: number) {
  if (selectedGenreIds.value.has(id)) {
    selectedGenreIds.value.delete(id);
  } else {
    selectedGenreIds.value.add(id);
  }
}

function apply() {
  emit('apply', {
    yearFrom: draft.yearFrom,
    yearTo: draft.yearTo,
    genreIds: [...selectedGenreIds.value],
    type: draft.type,
    status: draft.status,
    episodesFrom: draft.episodesFrom,
    episodesTo: draft.episodesTo,
  });
}

function reset() {
  draft.yearFrom = null;
  draft.yearTo = null;
  draft.type = null;
  draft.status = null;
  draft.episodesFrom = null;
  draft.episodesTo = null;
  selectedGenreIds.value.clear();
  emit('apply', {
    yearFrom: null, yearTo: null, genreIds: [],
    type: null, status: null, episodesFrom: null, episodesTo: null,
  });
}
</script>

<style scoped>
.filters-content {
  --background: #1E1E1E;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 0;
}

.drag-handle-row {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.sheet-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 12px 0 20px;
}

/* ── Filter group ────────────────────────────────────────────────────────── */
.filter-group {
  margin-bottom: 18px;
}

.filter-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

/* ── Range inputs ────────────────────────────────────────────────────────── */
.range-row {
  display: flex;
  gap: 10px;
  overflow: hidden;
}

.range-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  background: #2D2D3A;
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  color: #FFFFFF;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.range-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.range-input:focus {
  box-shadow: 0 0 0 1px rgba(167, 184, 217, 0.4);
}

/* ── Chips ────────────────────────────────────────────────────────────────── */
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 7px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.chip:active { transform: scale(0.97); }

.chip--more {
  background: rgba(167, 184, 217, 0.15);
  color: #A7B8D9;
  border-color: rgba(167, 184, 217, 0.3);
  font-weight: 600;
}

.chip--active {
  background: #FF9E9E;
  color: #1A1A1A;
  border-color: #FF9E9E;
  font-weight: 600;
}

/* ── Actions ─────────────────────────────────────────────────────────────── */
.filter-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
}

.apply-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.apply-btn:active { opacity: 0.85; }

.reset-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
}

.reset-btn:active { color: #FFFFFF; }
</style>
