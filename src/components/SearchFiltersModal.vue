<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Фильтры</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Закрыть</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list lines="none">
        <!-- Year -->
        <ion-item>
          <ion-select
            v-model="localYear"
            label="Год"
            label-placement="stacked"
            placeholder="Любой год"
            :interface-options="{ header: 'Год' }"
          >
            <ion-select-option :value="null">Любой</ion-select-option>
            <ion-select-option v-for="y in years" :key="y" :value="y">{{ y }}</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Season -->
        <ion-item>
          <ion-select
            v-model="localSeason"
            label="Сезон"
            label-placement="stacked"
            placeholder="Любой сезон"
            :interface-options="{ header: 'Сезон' }"
          >
            <ion-select-option :value="null">Любой</ion-select-option>
            <ion-select-option value="winter">Зима</ion-select-option>
            <ion-select-option value="spring">Весна</ion-select-option>
            <ion-select-option value="summer">Лето</ion-select-option>
            <ion-select-option value="fall">Осень</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <div class="filter-actions">
        <ion-button expand="block" @click="apply">Применить</ion-button>
        <ion-button expand="block" fill="outline" @click="reset">Сбросить</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonSelect, IonSelectOption,
} from '@ionic/vue';

const props = defineProps<{
  year?: number | null;
  season?: string | null;
}>();

const emit = defineEmits<{
  apply: [{ year: number | null; season: string | null }];
  close: [];
}>();

const localYear = ref<number | null>(props.year ?? null);
const localSeason = ref<string | null>(props.season ?? null);

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

function apply() {
  emit('apply', { year: localYear.value, season: localSeason.value });
}

function reset() {
  localYear.value = null;
  localSeason.value = null;
  emit('apply', { year: null, season: null });
}
</script>

<style scoped>
.filter-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
}
</style>
