<template>
  <ion-page class="tabs-page">
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="search" href="/tabs/search" @click="onSearchTab">
          <ion-icon :icon="searchOutline" />
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="homeOutline" />
        </ion-tab-button>

        <ion-tab-button tab="friends" href="/tabs/friends">
          <ion-icon :icon="peopleOutline" />
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { searchOutline, homeOutline, peopleOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();

function onSearchTab() {
  // If already on search tab, emit reset event
  if (router.currentRoute.value.path === '/tabs/search') {
    window.dispatchEvent(new CustomEvent('search-tab-reset'));
  }
}
</script>

<style scoped>
/* Tab bar styling moved to variables.css for shadow DOM compatibility */
</style>
