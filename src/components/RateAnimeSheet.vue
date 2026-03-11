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
      <!-- Ratings from all members -->
      <div v-if="item.ratings?.length" class="ratings-list">
        <h4 class="section-title">Оценки участников</h4>
        <div v-for="r in item.ratings" :key="r.user_id" class="rating-row">
          <span class="rating-name">{{ r.full_name ?? `#${r.user_id}` }}</span>
          <span class="rating-score">★ {{ r.score }}</span>
          <span v-if="r.comment" class="rating-comment">{{ r.comment }}</span>
        </div>
      </div>

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

      <div class="sheet-actions">
        <ion-button v-if="myRating" expand="block" fill="outline" color="danger" :disabled="saving" @click="deleteRating">
          Удалить оценку
        </ion-button>
        <ion-button expand="block" fill="outline" color="danger" :disabled="saving" @click="removeAnime">
          Убрать из списка
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonInput, IonRange,
} from '@ionic/vue';
import { listsApi } from '@/api/lists';
import type { ListAnimeResponse, RatingResponse } from '@/types';

const props = defineProps<{
  listId: number;
  item: ListAnimeResponse;
  myUserId: number;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
  removeAnime: [number];
}>();

const myRating = computed<RatingResponse | undefined>(() =>
  props.item.ratings?.find((r) => r.user_id === props.myUserId)
);

const localScore = ref<number>(myRating.value?.score ?? 7);
const localComment = ref(myRating.value?.comment ?? '');
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

async function removeAnime() {
  saving.value = true;
  try {
    await listsApi.removeAnime(props.listId, props.item.anime_id);
    emit('removeAnime', props.item.anime_id);
  } finally { saving.value = false; }
}
</script>

<style scoped>
.section-title { font-size: 0.9rem; font-weight: 600; margin: 0 0 8px; }
.ratings-list { margin-bottom: 16px; }
.rating-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--ion-color-step-100); }
.rating-name { flex: 1; font-size: 0.9rem; }
.rating-score { font-weight: 700; color: #ffd700; }
.rating-comment { font-size: 0.8rem; color: var(--ion-color-medium); }
.score-row { display: flex; align-items: center; gap: 12px; width: 100%; padding-top: 4px; }
.score-value { font-size: 1.4rem; font-weight: 700; min-width: 28px; text-align: center; color: var(--ion-color-primary); }
.sheet-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
</style>
