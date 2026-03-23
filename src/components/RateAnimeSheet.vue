<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ item.title }}</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Закрыть</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="save">Сохранить</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- My rating -->
      <h4 class="section-title">Моя оценка</h4>
      <ion-list lines="none">
        <ion-item>
          <div class="score-row">
            <span class="score-value">{{ localScore }}</span>
            <ion-range v-model="localScore" :min="1" :max="10" :step="1" :ticks="true" :snaps="true" :pin="true" />
          </div>
        </ion-item>
        <ion-item>
          <ion-input v-model="localComment" label="Комментарий" label-placement="stacked" placeholder="Необязательно" clearInput />
        </ion-item>
      </ion-list>

      <div v-if="props.myRating" class="sheet-actions">
        <ion-button expand="block" fill="outline" color="danger" :disabled="saving" @click="deleteRating">
          Удалить оценку
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonInput, IonRange,
} from '@ionic/vue';
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

async function save() {
  saving.value = true;
  try {
    await listsApi.rateAnime(props.listId, props.item.anime_id, {
      score: localScore.value,
      comment: localComment.value || null,
    });
    emit('saved');
  } finally { saving.value = false; }
}

async function deleteRating() {
  saving.value = true;
  try {
    await listsApi.deleteRating(props.listId, props.item.anime_id);
    emit('saved');
  } finally { saving.value = false; }
}

</script>

<style scoped>
.section-title { font-size: 0.9rem; font-weight: 600; margin: 0 0 8px; }
.score-row { display: flex; align-items: center; gap: 12px; width: 100%; padding-top: 4px; }
.score-value { font-size: 1.4rem; font-weight: 700; min-width: 28px; text-align: center; color: var(--ion-color-primary); }
.sheet-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
</style>
