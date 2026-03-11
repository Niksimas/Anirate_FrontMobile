<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="search" href="/tabs/search">
          <ion-icon :icon="searchOutline" />
          <ion-label>Поиск</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="my-anime" href="/tabs/my-anime">
          <ion-icon :icon="listOutline" />
          <ion-label>Мои аниме</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="friends" href="/tabs/friends">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Друзья</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personOutline" />
          <ion-label>Профиль</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { searchOutline, listOutline, peopleOutline, personOutline } from 'ionicons/icons';
</script>
