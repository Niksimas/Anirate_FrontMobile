<template>
  <ion-page>
    <ion-content class="tracking-sheet-content">
      <div class="drag-handle-row"><div class="drag-handle" /></div>

      <p class="sheet-title">{{ tracking ? 'Изменить' : 'Добавить в список' }}</p>

      <!-- Status pills -->
      <div class="status-section">
        <label class="section-label">Статус</label>
        <div class="status-row">
          <button
            v-for="s in statuses"
            :key="s.value"
            class="status-pill"
            :class="{ 'status-pill--active': localStatus === s.value }"
            @click="localStatus = s.value"
          >{{ s.label }}</button>
        </div>
      </div>

      <!-- Score picker (not for planned) -->
      <div v-if="localStatus !== 'planned'" class="score-section">
        <label class="section-label">Оценка</label>
        <div class="score-picker">
          <button
            v-for="n in 10"
            :key="n"
            class="score-circle"
            :class="{ 'score-circle--selected': n === localScore, 'score-circle--below': n < localScore }"
            @click="selectScore(n)"
          >{{ n }}</button>
        </div>
        <Transition name="label-fade" mode="out-in">
          <p class="score-label" :class="scoreLabelClass" :key="localScore">{{ scoreLabelText }}</p>
        </Transition>
      </div>

      <!-- Actions -->
      <div class="sheet-actions">
        <button class="save-btn" :disabled="saving" @click="save">
          {{ saving ? 'Сохраняю...' : 'Сохранить' }}
        </button>
        <button v-if="tracking" class="delete-btn" :disabled="saving" @click="confirmRemove = true">
          Удалить из списка
        </button>
      </div>
    </ion-content>

    <ion-alert
      :is-open="confirmRemove"
      header="Удалить из списка"
      message="Аниме будет удалено из вашего списка отслеживания."
      :buttons="removeAlertButtons"
      @did-dismiss="confirmRemove = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonContent, IonAlert } from '@ionic/vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { trackingApi } from '@/api/tracking';
import type { TrackingResponse, TrackingStatus } from '@/types';

const props = defineProps<{
  animeId: number;
  tracking?: TrackingResponse | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [TrackingResponse];
  removed: [];
}>();

const localStatus = ref<TrackingStatus>(props.tracking?.status ?? 'planned');
const localScore = ref<number>(props.tracking?.score ?? 5);
const saving = ref(false);
const confirmRemove = ref(false);

const statuses: { value: TrackingStatus; label: string }[] = [
  { value: 'planned', label: 'В планах' },
  { value: 'watching', label: 'Смотрю' },
  { value: 'completed', label: 'Просмотрено' },
];

const scoreLabels: Record<number, string> = {
  1: 'Ужасно', 2: 'Ужасно', 3: 'Плохо', 4: 'Плохо',
  5: 'Средне', 6: 'Средне', 7: 'Хорошо', 8: 'Хорошо',
  9: 'Отлично', 10: 'Шедевр',
};

const scoreLabelText = computed(() => scoreLabels[localScore.value] ?? '');

const scoreLabelClass = computed(() => {
  const s = localScore.value;
  if (s <= 2) return 'score-label--bad';
  if (s <= 4) return 'score-label--poor';
  if (s <= 6) return 'score-label--mid';
  if (s <= 8) return 'score-label--good';
  if (s === 9) return 'score-label--great';
  return 'score-label--masterpiece';
});

function selectScore(n: number) {
  localScore.value = n;
  try { Haptics.impact({ style: ImpactStyle.Light }); } catch { /* */ }
}

async function save() {
  saving.value = true;
  try {
    let response: TrackingResponse;
    if (props.tracking) {
      const { data } = await trackingApi.update(props.animeId, {
        status: localStatus.value,
        score: localStatus.value !== 'planned' ? localScore.value : null,
      });
      response = data;
    } else {
      const { data } = await trackingApi.add({
        anime_id: props.animeId,
        status: localStatus.value,
      });
      if (localStatus.value !== 'planned') {
        const { data: updated } = await trackingApi.update(props.animeId, {
          score: localScore.value,
        });
        response = updated;
      } else {
        response = data;
      }
    }
    try { Haptics.impact({ style: ImpactStyle.Light }); } catch { /* */ }
    emit('saved', response);
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

const removeAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Удалить',
    role: 'destructive',
    handler: async () => {
      saving.value = true;
      try {
        await trackingApi.remove(props.animeId);
        emit('removed');
      } finally { saving.value = false; }
    },
  },
];
</script>

<style scoped>
.tracking-sheet-content {
  --background: #1E1E1E;
  --padding-start: 20px;
  --padding-end: 20px;
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

.section-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

/* ── Status pills ────────────────────────────────────────────────────────── */
.status-section {
  margin-bottom: 24px;
}

.status-row {
  display: flex;
  gap: 8px;
}

.status-pill {
  flex: 1;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  background: #2D2D3A;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: center;
  min-height: 42px;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}

.status-pill:active { transform: scale(0.97); }

.status-pill--active {
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-weight: 700;
}

/* ── Score picker ────────────────────────────────────────────────────────── */
.score-section {
  margin-bottom: 16px;
}

.score-picker {
  display: flex;
  justify-content: space-between;
  gap: 4px;
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

.score-circle:active { transform: scale(0.9); }
.score-circle--below { background: #383848; color: rgba(255, 255, 255, 0.6); }

.score-circle--selected {
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-weight: 700;
  transform: scale(1.1);
  box-shadow: 0 0 14px rgba(255, 158, 158, 0.35);
}

.score-circle--selected:active { transform: scale(1.0); }

/* ── Score label ─────────────────────────────────────────────────────────── */
.score-label {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 8px 0 0;
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

.label-fade-enter-active,
.label-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.label-fade-enter-from { opacity: 0; transform: translateY(4px); }
.label-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Actions ─────────────────────────────────────────────────────────────── */
.sheet-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
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

.save-btn:active { opacity: 0.85; }
.save-btn:disabled { opacity: 0.5; }

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

.delete-btn:active { opacity: 0.7; }
.delete-btn:disabled { opacity: 0.4; }
</style>
