<template>
  <ion-page>
    <ion-content class="rate-sheet-content">
      <!-- Drag handle -->
      <div class="drag-handle-row"><div class="drag-handle" /></div>

      <!-- Anime context header -->
      <div class="anime-context">
        <img :src="fixUrl(item.image_url)" :alt="item.title" class="anime-poster" />
        <div class="anime-info">
          <p class="anime-title">{{ item.title }}</p>
          <p v-if="item.season || item.year" class="anime-sub">
            {{ [item.season, item.year].filter(Boolean).join(' · ') }}
          </p>
        </div>
      </div>

      <!-- Section title -->
      <p class="section-label">{{ props.myRating ? 'Изменить оценку' : 'Оценить' }}</p>

      <!-- Score picker: 10 circles -->
      <div class="score-picker">
        <button
          v-for="n in 10"
          :key="n"
          class="score-circle"
          :class="{ 'score-circle--selected': n === localScore, 'score-circle--below': n < localScore }"
          @click="selectScore(n)"
        >
          {{ n }}
        </button>
      </div>

      <!-- Semantic label -->
      <Transition name="label-fade" mode="out-in">
        <p class="score-label" :class="scoreLabelClass" :key="localScore">
          {{ scoreLabel }}
        </p>
      </Transition>

      <!-- List average (social context) -->
      <p v-if="item.average_score != null" class="avg-line">
        Средняя в списке: {{ Math.round(item.average_score * 10) / 10 }}
        <span v-if="item.ratings?.length">&nbsp;({{ item.ratings.length }} {{ ratingsWord }})</span>
      </p>

      <!-- Comment -->
      <div class="comment-wrap">
        <textarea
          v-model="localComment"
          class="comment-field"
          placeholder="Что думаешь?"
          rows="2"
        />
      </div>

      <!-- Actions -->
      <div class="sheet-actions">
        <button class="save-btn" :disabled="saving" @click="save">
          {{ saving ? 'Сохраняю...' : 'Сохранить' }}
        </button>
        <button
          v-if="props.myRating"
          class="delete-btn"
          :disabled="saving"
          @click="confirmDelete = true"
        >
          Удалить оценку
        </button>
      </div>
    </ion-content>

    <!-- Delete confirmation -->
    <ion-alert
      :is-open="confirmDelete"
      header="Удалить оценку"
      message="Оценка будет удалена из списка."
      :buttons="deleteAlertButtons"
      @did-dismiss="confirmDelete = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonContent, IonAlert } from '@ionic/vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { fixUrl } from '@/composables/useImageUrl';
import { listsApi } from '@/api/lists';
import type { ListAnimeResponse } from '@/types';

const props = defineProps<{
  listId: number;
  item: ListAnimeResponse;
  myRating: { score: number; comment: string | null } | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const localScore = ref<number>(props.myRating?.score ?? 5);
const localComment = ref(props.myRating?.comment ?? '');
const saving = ref(false);
const confirmDelete = ref(false);

const scoreLabels: Record<number, string> = {
  1: 'Ужасно', 2: 'Ужасно',
  3: 'Плохо', 4: 'Плохо',
  5: 'Средне', 6: 'Средне',
  7: 'Хорошо', 8: 'Хорошо',
  9: 'Отлично',
  10: 'Шедевр',
};

const scoreLabel = computed(() => scoreLabels[localScore.value] ?? '');

const scoreLabelClass = computed(() => {
  const s = localScore.value;
  if (s <= 2) return 'score-label--bad';
  if (s <= 4) return 'score-label--poor';
  if (s <= 6) return 'score-label--mid';
  if (s <= 8) return 'score-label--good';
  if (s === 9) return 'score-label--great';
  return 'score-label--masterpiece';
});

const ratingsWord = computed(() => {
  const n = props.item.ratings?.length ?? 0;
  if (n % 10 === 1 && n % 100 !== 11) return 'оценка';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'оценки';
  return 'оценок';
});

function selectScore(n: number) {
  localScore.value = n;
  try { Haptics.impact({ style: ImpactStyle.Light }); } catch { /* no haptics on web */ }
}

async function save() {
  saving.value = true;
  try {
    await listsApi.rateAnime(props.listId, props.item.anime_id, {
      score: localScore.value,
      comment: localComment.value || null,
    });
    try { Haptics.notification({ type: 'SUCCESS' as never }); } catch { /* */ }
    emit('saved');
  } finally { saving.value = false; }
}

async function doDelete() {
  saving.value = true;
  try {
    await listsApi.deleteRating(props.listId, props.item.anime_id);
    emit('saved');
  } finally { saving.value = false; }
}

const deleteAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  { text: 'Удалить', role: 'destructive', handler: doDelete },
];
</script>

<style scoped>
.rate-sheet-content {
  --background: #1E1E1E;
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 0;
}

/* ── Drag handle ─────────────────────────────────────────────────────────── */
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

/* ── Anime context ───────────────────────────────────────────────────────── */
.anime-context {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0 16px;
}

.anime-poster {
  width: 48px;
  height: 68px;
  border-radius: 8px;
  object-fit: cover;
  background: #2D2D3A;
  flex-shrink: 0;
}

.anime-info {
  flex: 1;
  min-width: 0;
}

.anime-title {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.anime-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* ── Section label ───────────────────────────────────────────────────────── */
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

/* ── Score picker ────────────────────────────────────────────────────────── */
.score-picker {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  padding: 0 0 8px;
}

.score-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #2D2D3A;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.score-circle:active {
  transform: scale(0.9);
}

.score-circle--below {
  background: #383848;
  color: rgba(255, 255, 255, 0.6);
}

.score-circle--selected {
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-weight: 700;
  transform: scale(1.1);
  box-shadow: 0 0 14px rgba(255, 158, 158, 0.35);
}

.score-circle--selected:active {
  transform: scale(1.0);
}

/* ── Score label ─────────────────────────────────────────────────────────── */
.score-label {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 4px 0 0;
  min-height: 22px;
}

.score-label--bad { color: #E76F6F; }
.score-label--poor { color: #E7976F; }
.score-label--mid { color: rgba(255, 255, 255, 0.5); }
.score-label--good { color: #A7B8D9; }
.score-label--great { color: #FF9E9E; }

.score-label--masterpiece {
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Label transition */
.label-fade-enter-active,
.label-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.label-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.label-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Average line ────────────────────────────────────────────────────────── */
.avg-line {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
  margin: 8px 0 0;
}

/* ── Comment ─────────────────────────────────────────────────────────────── */
.comment-wrap {
  margin: 16px 0 0;
}

.comment-field {
  width: 100%;
  background: #2D2D3A;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  color: #FFFFFF;
  resize: none;
  outline: none;
  line-height: 1.4;
}

.comment-field::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.comment-field:focus {
  box-shadow: 0 0 0 1px rgba(167, 184, 217, 0.4);
}

/* ── Actions ─────────────────────────────────────────────────────────────── */
.sheet-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
}

.save-btn {
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
  transition: opacity 0.15s;
}

.save-btn:active {
  opacity: 0.85;
}

.save-btn:disabled {
  opacity: 0.5;
}

.delete-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #E76F6F;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
}

.delete-btn:active {
  opacity: 0.7;
}

.delete-btn:disabled {
  opacity: 0.4;
}
</style>
