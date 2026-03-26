<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" :default-href="`/tabs/lists/${listId}`" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="members-content">
      <div class="members-header">
        <h1 class="members-title">Участники</h1>
        <span class="members-count">{{ members.length }}</span>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="members-list">
        <div v-for="i in 4" :key="i" class="member-card">
          <ion-skeleton-text animated style="width:48px;height:48px;border-radius:50%;" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:16px;width:50%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:13px;width:30%;" />
          </div>
        </div>
      </div>

      <!-- Members list -->
      <div v-else class="members-list">
        <div
          v-for="member in members"
          :key="member.user_id"
          class="member-card"
          :class="{ 'member-card--owner': member.user_id === ownerId }"
        >
          <div class="member-avatar">
            <img v-if="member.picture" :src="fixUrl(member.picture)" />
            <span v-else class="avatar-initial">{{ (member.full_name ?? '?')[0] }}</span>
          </div>

          <div class="member-info">
            <div class="member-name-row">
              <span class="member-name">{{ member.full_name ?? `#${member.user_id}` }}</span>
              <span v-if="member.user_id === ownerId" class="owner-badge">Владелец</span>
            </div>
            <span class="member-date">С {{ formatDate(member.joined_at) }}</span>
          </div>

          <button
            v-if="isOwner && member.user_id !== myUserId"
            class="kick-btn"
            @click="kickTarget = member"
          >
            Кик
          </button>
        </div>
      </div>

      <!-- Leave (non-owner) -->
      <div v-if="!loading && !isOwner" class="leave-wrap">
        <button class="leave-btn" @click="confirmLeave = true">
          Покинуть список
        </button>
      </div>
    </ion-content>

    <!-- Kick confirmation -->
    <ion-alert
      :is-open="!!kickTarget"
      header="Кикнуть участника"
      :message="`${kickTarget?.full_name ?? 'Участник'} будет удалён из списка.`"
      :buttons="kickAlertButtons"
      @did-dismiss="kickTarget = null"
    />

    <!-- Leave confirmation -->
    <ion-alert
      :is-open="confirmLeave"
      header="Покинуть список"
      message="Вы больше не будете видеть этот список."
      :buttons="leaveAlertButtons"
      @did-dismiss="confirmLeave = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonSkeletonText, IonAlert,
} from '@ionic/vue';
import { fixUrl } from '@/composables/useImageUrl';
import { listsApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth';
import type { MemberResponse } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const listId = Number(route.params.id);
const ownerId = Number(route.query.owner) || 0;
const myUserId = computed(() => authStore.user?.id ?? 0);
const isOwner = computed(() => ownerId === myUserId.value);

const members = ref<MemberResponse[]>([]);
const loading = ref(true);
const kickTarget = ref<MemberResponse | null>(null);
const confirmLeave = ref(false);

onMounted(async () => {
  try {
    const { data } = await listsApi.getMembers(listId);
    members.value = data;
  } finally { loading.value = false; }
});

const kickAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Кикнуть',
    role: 'destructive',
    handler: async () => {
      if (!kickTarget.value) return;
      await listsApi.kickMember(listId, kickTarget.value.user_id);
      members.value = members.value.filter(m => m.user_id !== kickTarget.value!.user_id);
    },
  },
];

const leaveAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Покинуть',
    role: 'destructive',
    handler: async () => {
      await listsApi.leaveList(listId);
      router.replace('/tabs/lists');
    },
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
</script>

<style scoped>
ion-header ion-toolbar {
  --background: #1E1E1E;
  --border-width: 0;
}

.members-content {
  --background: #1E1E1E;
}

.members-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 16px 16px;
}

.members-title {
  font-size: 26px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.5px;
}

.members-count {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

/* ── Members list ────────────────────────────────────────────────────────── */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #2D2D3A;
  border-radius: 14px;
}

.member-card--owner {
  border-left: 3px solid;
  border-image: linear-gradient(180deg, #A7B8D9, #FF9E9E) 1;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #383848;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-name {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(167, 184, 217, 0.2);
  color: #A7B8D9;
  white-space: nowrap;
}

.member-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

/* ── Kick button ─────────────────────────────────────────────────────────── */
.kick-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: rgba(231, 111, 111, 0.12);
  color: #E76F6F;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 34px;
  flex-shrink: 0;
}

.kick-btn:active {
  background: rgba(231, 111, 111, 0.25);
}

/* ── Leave button ────────────────────────────────────────────────────────── */
.leave-wrap {
  padding: 20px 16px;
}

.leave-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: rgba(231, 111, 111, 0.12);
  color: #E76F6F;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.leave-btn:active {
  background: rgba(231, 111, 111, 0.25);
}
</style>
