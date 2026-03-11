<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/lists/${listId}`" />
        </ion-buttons>
        <ion-title>Участники</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ListMembersSheet
        :list-id="listId"
        :owner-id="ownerId"
        :my-user-id="myUserId"
        @close="router.back()"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent } from '@ionic/vue';
import ListMembersSheet from '@/components/ListMembersSheet.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const listId = Number(route.params.id);
const ownerId = Number(route.query.owner) || undefined;
const myUserId = computed(() => authStore.user?.id ?? 0);
</script>
