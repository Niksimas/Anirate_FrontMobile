<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Друзья</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/friends/search">
            <ion-icon slot="icon-only" :icon="personAddOutline" />
          </ion-button>
          <ion-button router-link="/friends/requests">
            <ion-icon slot="icon-only" :icon="notificationsOutline" />
            <ion-badge v-if="incomingCount" color="danger" class="badge-overlay">
              {{ incomingCount }}
            </ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text v-for="i in 5" :key="i" animated style="height:56px; border-radius:8px; margin-bottom:8px;" />
      </div>

      <ion-list v-else-if="friends.length" lines="none" class="friends-list">
        <ion-item
          v-for="friend in friends"
          :key="friend.id"
          button
          @click="router.push(`/users/${friend.id}`)"
        >
          <ion-avatar slot="start">
            <img v-if="friend.picture" :src="friend.picture" />
            <ion-icon v-else :icon="personCircleOutline" style="font-size:40px;color:var(--ion-color-medium)" />
          </ion-avatar>
          <ion-label>
            <h3>{{ friend.full_name || friend.email }}</h3>
            <p>{{ friend.email }}</p>
          </ion-label>
          <ion-button
            slot="end"
            fill="outline"
            color="danger"
            size="small"
            @click.stop="confirmRemove(friend)"
          >
            Удалить
          </ion-button>
        </ion-item>
      </ion-list>

      <div v-else class="empty-state">
        <ion-icon :icon="peopleOutline" class="empty-icon" />
        <p>Пока нет друзей</p>
        <ion-button fill="outline" size="small" router-link="/friends/search">
          Найти друзей
        </ion-button>
      </div>
    </ion-content>

    <ion-alert
      :is-open="!!removingFriend"
      header="Удалить из друзей?"
      :message="`${removingFriend?.full_name ?? removingFriend?.email} будет удалён из твоего списка друзей.`"
      :buttons="alertButtons"
      @did-dismiss="removingFriend = null"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBadge,
  IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonAvatar, IonLabel,
  IonSkeletonText, IonAlert,
} from '@ionic/vue';
import { personAddOutline, notificationsOutline, peopleOutline, personCircleOutline } from 'ionicons/icons';
import { friendsApi } from '@/api/friends';
import type { UserOut } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

const router = useRouter();
const friends = ref<UserOut[]>([]);
const loading = ref(true);
const incomingCount = ref(0);
const removingFriend = ref<UserOut | null>(null);

const alertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Удалить',
    role: 'destructive',
    handler: async () => {
      if (removingFriend.value) {
        await friendsApi.remove(removingFriend.value.id);
        friends.value = friends.value.filter((f) => f.id !== removingFriend.value!.id);
      }
    },
  },
];

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const [friendsRes, incomingRes] = await Promise.allSettled([
      friendsApi.list(),
      friendsApi.incoming(),
    ]);
    if (friendsRes.status === 'fulfilled') friends.value = friendsRes.value.data as UserOut[];
    if (incomingRes.status === 'fulfilled') incomingCount.value = (incomingRes.value.data as unknown[]).length;
  } finally {
    loading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) {
  await load();
  ev.detail.complete();
}

function confirmRemove(friend: UserOut) {
  removingFriend.value = friend;
}
</script>

<style scoped>
.badge-overlay { position: absolute; top: 4px; right: 4px; font-size: 0.6rem; }
.friends-list { padding: 8px; }
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 24px; gap: 12px; text-align: center;
}
.empty-icon { font-size: 56px; color: var(--ion-color-medium); }
</style>
