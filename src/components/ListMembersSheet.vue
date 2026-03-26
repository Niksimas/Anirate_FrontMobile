<template>
  <ion-page>
    <ion-content class="members-sheet-content">
      <div class="drag-handle-row"><div class="drag-handle" /></div>

      <p class="sheet-title">Участники<span v-if="members.length" class="member-count"> · {{ members.length }}</span></p>

      <!-- Loading -->
      <div v-if="loading" class="members-list">
        <div v-for="i in 4" :key="i" class="member-card">
          <ion-skeleton-text animated style="width:44px;height:44px;border-radius:50%;" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:16px;width:50%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:13px;width:30%;" />
          </div>
        </div>
      </div>

      <!-- Members -->
      <div v-else class="members-list">
        <div
          v-for="member in members"
          :key="member.user_id"
          class="member-card"
          :class="{ 'member-card--owner': member.user_id === ownerId }"
        >
          <img v-if="member.picture" :src="fixUrl(member.picture)" class="member-avatar" />
          <div v-else class="member-avatar member-avatar--placeholder">
            {{ (member.full_name ?? '?')[0] }}
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
            @click="confirmKick(member)"
          >
            Кик
          </button>
        </div>
      </div>

      <!-- Leave button (non-owner) -->
      <div v-if="!loading && !isOwner" class="leave-wrap">
        <button class="leave-btn" @click="confirmLeaveOpen = true">
          Покинуть список
        </button>
      </div>
    </ion-content>

    <!-- Kick confirmation -->
    <ion-alert
      :is-open="!!kickingMember"
      header="Кикнуть участника"
      :message="`${kickingMember?.full_name ?? 'Участник'} будет удалён из списка.`"
      :buttons="kickAlertButtons"
      @did-dismiss="kickingMember = null"
    />

    <!-- Leave confirmation -->
    <ion-alert
      :is-open="confirmLeaveOpen"
      header="Покинуть список"
      message="Вы больше не будете видеть этот список."
      :buttons="leaveAlertButtons"
      @did-dismiss="confirmLeaveOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonSkeletonText, IonAlert } from '@ionic/vue';
import { fixUrl } from '@/composables/useImageUrl';
import { listsApi } from '@/api/lists';
import type { MemberResponse } from '@/types';

const props = defineProps<{ listId: number; ownerId?: number; myUserId: number }>();
const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const members = ref<MemberResponse[]>([]);
const loading = ref(true);
const kickingMember = ref<MemberResponse | null>(null);
const confirmLeaveOpen = ref(false);
const isOwner = computed(() => props.ownerId === props.myUserId);

onMounted(async () => {
  try {
    const { data } = await listsApi.getMembers(props.listId);
    members.value = data;
  } finally { loading.value = false; }
});

function confirmKick(member: MemberResponse) {
  kickingMember.value = member;
}

const kickAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Кикнуть',
    role: 'destructive',
    handler: async () => {
      if (!kickingMember.value) return;
      await listsApi.kickMember(props.listId, kickingMember.value.user_id);
      members.value = members.value.filter(m => m.user_id !== kickingMember.value!.user_id);
    },
  },
];

const leaveAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  {
    text: 'Покинуть',
    role: 'destructive',
    handler: async () => {
      await listsApi.leaveList(props.listId);
      emit('close');
      router.replace('/tabs/profile');
    },
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
</script>

<style scoped>
.members-sheet-content {
  --background: #1E1E1E;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 0;
}

.drag-handle-row {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.sheet-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 12px 0 16px;
}

.member-count {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

/* ── Members list ────────────────────────────────────────────────────────── */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-avatar--placeholder {
  background: #383848;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
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
  padding: 20px 0;
  padding-bottom: env(safe-area-inset-bottom, 8px);
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
