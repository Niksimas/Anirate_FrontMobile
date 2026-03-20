<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Участники</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Закрыть</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text v-for="i in 4" :key="i" animated style="height:56px;border-radius:8px;margin-bottom:8px;" />
      </div>

      <ion-list v-else lines="none" class="ion-padding-horizontal ion-padding-top">
        <ion-item v-for="member in members" :key="member.user_id">
          <ion-avatar slot="start">
            <img v-if="member.picture" :src="member.picture" />
            <ion-icon v-else :icon="personCircleOutline" style="font-size:40px;" />
          </ion-avatar>
          <ion-label>
            <h3>
              {{ member.full_name ?? `#${member.user_id}` }}
              <ion-badge v-if="member.user_id === ownerId" color="primary">Владелец</ion-badge>
            </h3>
            <p>С {{ formatDate(member.joined_at) }}</p>
          </ion-label>
          <ion-button
            v-if="isOwner && member.user_id !== myUserId"
            slot="end"
            fill="outline"
            color="danger"
            size="small"
            @click="kick(member.user_id)"
          >
            Кик
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- Leave list (non-owner) -->
      <div v-if="!isOwner" class="ion-padding">
        <ion-button expand="block" fill="outline" color="danger" @click="leaveList">
          Покинуть список
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonAvatar, IonLabel, IonBadge, IonIcon, IonSkeletonText,
} from '@ionic/vue';
import { personCircleOutline } from 'ionicons/icons';
import { listsApi } from '@/api/lists';
import type { MemberResponse } from '@/types';

const props = defineProps<{ listId: number; ownerId?: number; myUserId: number }>();
const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const members = ref<MemberResponse[]>([]);
const loading = ref(true);
const isOwner = computed(() => props.ownerId === props.myUserId);

onMounted(async () => {
  try { const { data } = await listsApi.getMembers(props.listId); members.value = data; }
  finally { loading.value = false; }
});

async function kick(userId: number) {
  await listsApi.kickMember(props.listId, userId);
  members.value = members.value.filter((m) => m.user_id !== userId);
}

async function leaveList() {
  await listsApi.leaveList(props.listId);
  emit('close');
  router.replace('/tabs/lists');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
</script>
