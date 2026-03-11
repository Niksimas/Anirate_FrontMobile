<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/friends/requests" />
        </ion-buttons>
        <ion-title>Отправленные заявки</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="empty-state ion-padding">
        <ion-icon :icon="sendOutline" class="empty-icon" />
        <p>Отправленные заявки отображаются здесь</p>
        <p class="hint">API не предоставляет список исходящих заявок</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon } from '@ionic/vue';
import { sendOutline } from 'ionicons/icons';
</script>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; gap: 12px; text-align: center; }
.empty-icon { font-size: 56px; color: var(--ion-color-medium); }
.hint { font-size: 0.8rem; color: var(--ion-color-medium); }
</style>
