<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ tracking ? 'Изменить' : 'Добавить' }}</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Отмена</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="save">Сохранить</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list lines="none">
        <!-- Status -->
        <ion-item>
          <ion-select
            v-model="localStatus"
            label="Статус"
            label-placement="stacked"
            :interface-options="{ header: 'Статус' }"
          >
            <ion-select-option value="planned">В планах</ion-select-option>
            <ion-select-option value="watching">Смотрю</ion-select-option>
            <ion-select-option value="completed">Просмотрено</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Score (only when watching or completed) -->
        <ion-item v-if="localStatus !== 'planned'">
          <ion-label position="stacked">Оценка</ion-label>
          <div class="score-row">
            <span class="score-value">{{ localScore ?? '—' }}</span>
            <ion-range
              v-model="localScore"
              :min="1"
              :max="10"
              :step="1"
              :ticks="true"
              :snaps="true"
              :pin="true"
            />
          </div>
        </ion-item>
      </ion-list>

      <!-- Remove button -->
      <ion-button
        v-if="tracking"
        expand="block"
        fill="outline"
        color="danger"
        class="remove-btn"
        :disabled="saving"
        @click="remove"
      >
        Удалить из списка
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonSelect, IonSelectOption,
  IonLabel, IonRange,
} from '@ionic/vue';
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

async function save() {
  saving.value = true;
  try {
    let response;
    if (props.tracking) {
      const { data } = await trackingApi.update(props.animeId, {
        status: localStatus.value,
        score: localScore.value,
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
    emit('saved', response);
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function remove() {
  saving.value = true;
  try {
    await trackingApi.remove(props.animeId);
    emit('removed');
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.score-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-top: 4px;
}
.score-value {
  font-size: 1.4rem;
  font-weight: 700;
  min-width: 28px;
  text-align: center;
  color: var(--ion-color-primary);
}
.remove-btn { margin-top: 24px; }
</style>
