<template>
  <ion-page>
    <ion-content class="friends-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Header row -->
      <div class="page-header">
        <h1 class="page-title">Друзья</h1>
        <ion-button fill="clear" class="search-link" router-link="/friends/search">
          <ion-icon slot="start" :icon="searchOutline" />
          Найти друзей
        </ion-button>
      </div>

      <!-- Segment -->
      <div class="segment-wrap">
        <ion-segment v-model="segment">
          <ion-segment-button value="friends">Друзья</ion-segment-button>
          <ion-segment-button value="sent">Отправленные<br>заявки</ion-segment-button>
          <ion-segment-button value="incoming">Ваши<br>запросы</ion-segment-button>
        </ion-segment>
      </div>

      <!-- FRIENDS tab -->
      <template v-if="segment === 'friends'">
        <div v-if="loading" class="ion-padding">
          <ion-skeleton-text v-for="i in 4" :key="i" animated style="height:56px;border-radius:50px;margin-bottom:8px;" />
        </div>

        <div v-else-if="friends.length">
          <div
            v-for="friend in friends"
            :key="friend.id"
            class="user-row"
            @click="router.push(`/users/${friend.id}`)"
          >
            <div class="user-avatar">
              <img v-if="friend.picture" :src="friend.picture" />
              <ion-icon v-else :icon="cameraOutline" />
            </div>
            <span class="user-name">{{ friend.full_name || friend.email }}</span>
            <button class="remove-btn" @click.stop="confirmRemove(friend)">
              <ion-icon :icon="personRemoveOutline" />
            </button>
          </div>
        </div>

        <div v-else class="empty-state">
          <ion-icon :icon="peopleOutline" class="empty-icon" />
          <p>Пока нет друзей</p>
        </div>
      </template>

      <!-- SENT REQUESTS tab -->
      <template v-else-if="segment === 'sent'">
        <div v-if="sentLoading" class="ion-padding">
          <ion-skeleton-text v-for="i in 3" :key="i" animated style="height:56px;border-radius:50px;margin-bottom:8px;" />
        </div>

        <div v-else-if="sentRequests.length">
          <div v-for="req in sentRequests" :key="req.id" class="user-row">
            <div class="user-avatar">
              <img v-if="req.picture" :src="req.picture" />
              <ion-icon v-else :icon="cameraOutline" />
            </div>
            <span class="user-name">{{ req.full_name || req.email }}</span>
            <span class="user-badge">Отправлено</span>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Нет отправленных заявок</p>
        </div>
      </template>

      <!-- INCOMING REQUESTS tab -->
      <template v-else>
        <div v-if="incomingLoading" class="ion-padding">
          <ion-skeleton-text v-for="i in 3" :key="i" animated style="height:56px;border-radius:50px;margin-bottom:8px;" />
        </div>

        <div v-else-if="incomingRequests.length">
          <div v-for="req in incomingRequests" :key="req.id" class="user-row">
            <div class="user-avatar">
              <img v-if="req.picture" :src="req.picture" />
              <ion-icon v-else :icon="cameraOutline" />
            </div>
            <span class="user-name">{{ req.full_name || req.email }}</span>
            <div class="req-actions">
              <button class="accept-btn" @click="accept(req)">
                <ion-icon :icon="checkmarkOutline" />
              </button>
              <button class="decline-btn" @click="decline(req)">
                <ion-icon :icon="closeOutline" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Новых заявок нет</p>
        </div>
      </template>
    </ion-content>

    <ion-alert
      :is-open="!!removingFriend"
      header="Удалить из друзей?"
      :message="`${removingFriend?.full_name ?? removingFriend?.email} будет удалён из твоего списка.`"
      :buttons="alertButtons"
      @did-dismiss="removingFriend = null"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonButton, IonIcon, IonSegment, IonSegmentButton,
  IonRefresher, IonRefresherContent, IonSkeletonText, IonAlert,
} from '@ionic/vue';
import {
  searchOutline, cameraOutline, personRemoveOutline, peopleOutline,
  checkmarkOutline, closeOutline,
} from 'ionicons/icons';
import { friendsApi } from '@/api/friends';
import type { UserOut } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

interface FriendRequest { id: number; full_name: string; email: string; picture?: string; }

const router = useRouter();
const segment = ref<'friends' | 'sent' | 'incoming'>('friends');

const friends = ref<UserOut[]>([]);
const loading = ref(false);
const removingFriend = ref<UserOut | null>(null);

const sentRequests = ref<FriendRequest[]>([]);
const sentLoading = ref(false);

const incomingRequests = ref<FriendRequest[]>([]);
const incomingLoading = ref(false);

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

onMounted(loadFriends);

watch(segment, (val) => {
  if (val === 'sent' && !sentRequests.value.length) loadSent();
  if (val === 'incoming' && !incomingRequests.value.length) loadIncoming();
});

async function loadFriends() {
  loading.value = true;
  try {
    const { data } = await friendsApi.list();
    friends.value = data as UserOut[];
  } finally {
    loading.value = false;
  }
}

async function loadSent() {
  sentLoading.value = false;
  sentRequests.value = [];
}

async function loadIncoming() {
  incomingLoading.value = true;
  try {
    const { data } = await friendsApi.incoming();
    incomingRequests.value = data as FriendRequest[];
  } finally {
    incomingLoading.value = false;
  }
}

async function refresh(ev: RefresherCustomEvent) {
  if (segment.value === 'friends') await loadFriends();
  else if (segment.value === 'sent') await loadSent();
  else await loadIncoming();
  ev.detail.complete();
}

function confirmRemove(friend: UserOut) { removingFriend.value = friend; }

async function accept(req: FriendRequest) {
  await friendsApi.accept(req.id);
  incomingRequests.value = incomingRequests.value.filter((r) => r.id !== req.id);
  await loadFriends();
}

async function decline(req: FriendRequest) {
  await friendsApi.decline(req.id);
  incomingRequests.value = incomingRequests.value.filter((r) => r.id !== req.id);
}
</script>

<style scoped>
.friends-content {
  --background: #1E1E1E;
  padding-top: env(safe-area-inset-top);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 16px) 16px 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.5px;
}

.search-link {
  --color: rgba(255,255,255,0.7);
  --padding-start: 0;
  font-size: 13px;
}

.segment-wrap {
  padding: 0 16px 12px;
}

ion-segment {
  --background: #2D2D3A;
  border-radius: 12px;
  padding: 3px;
}

ion-segment-button {
  --color: rgba(255,255,255,0.5);
  --color-checked: #1E1E1E;
  --background-checked: #FFFFFF;
  --border-radius: 10px;
  --indicator-color: transparent;
  font-size: 11px;
  font-weight: 500;
  min-height: 36px;
  white-space: normal;
  line-height: 1.3;
}

/* User rows */
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
}

.user-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #4A4A5A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-avatar ion-icon { font-size: 22px; color: rgba(255,255,255,0.5); }

.user-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #FF9E9E;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
}

.user-badge {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
}

.req-actions {
  display: flex;
  gap: 8px;
}

.accept-btn, .decline-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.accept-btn { background: #5cb85c; color: white; }
.decline-btn { background: #2D2D3A; color: rgba(255,255,255,0.5); }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 24px; gap: 12px; text-align: center;
}
.empty-icon { font-size: 56px; color: #697289; }
.empty-state p { color: rgba(255,255,255,0.5); margin: 0; }
</style>
