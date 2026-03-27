<template>
  <ion-page>
    <ion-content class="settings-content" :fullscreen="true">
      <!-- Top bar -->
      <div class="top-bar">
        <button class="top-btn" @click="cancel">Отмена</button>
        <button
          class="top-btn top-btn--done"
          :disabled="!fullName.trim() || saving"
          @click="save"
        >{{ saving ? '...' : 'Готово' }}</button>
      </div>

      <!-- Avatar -->
      <div class="avatar-section">
        <div class="avatar-circle">
          <img v-if="picture" :src="fixUrl(picture)" class="avatar-img" />
          <ion-icon v-else :icon="personOutline" class="avatar-icon" />
        </div>
      </div>

      <!-- Name field -->
      <div class="field-section">
        <label class="field-label">Имя</label>
        <input
          v-model="fullName"
          class="field-input"
          placeholder="Имя Фамилия"
          maxlength="60"
        />
      </div>

      <!-- Privacy toggle -->
      <div class="toggle-card">
        <div class="toggle-info">
          <span class="toggle-label">Видимость личных оценок</span>
          <span class="toggle-hint">Друзья смогут видеть ваш трекинг</span>
        </div>
        <ion-toggle v-model="isPublic" class="compact-toggle" />
      </div>

      <!-- Danger zone -->
      <div class="danger-section">
        <button class="danger-btn" @click="confirmLogout = true">
          Выйти из аккаунта
        </button>
        <!-- <button class="danger-btn danger-btn--delete" @click="confirmDelete = true">
          Удалить аккаунт
        </button> -->
      </div>

      <p class="version-text">АниРейт v1.0.0</p>
    </ion-content>

    <!-- Logout confirmation -->
    <ion-alert
      :is-open="confirmLogout"
      header="Выйти из аккаунта"
      message="Вы уверены, что хотите выйти?"
      :buttons="logoutAlertButtons"
      @did-dismiss="confirmLogout = false"
    />

    <!-- Delete account confirmation -->
    <ion-alert
      :is-open="confirmDelete"
      header="Удалить аккаунт"
      message="Все данные будут удалены безвозвратно. Это действие нельзя отменить."
      :buttons="deleteAlertButtons"
      @did-dismiss="confirmDelete = false"
    />

    <!-- Unsaved changes alert -->
    <ion-alert
      :is-open="showUnsavedAlert"
      header="Несохранённые изменения"
      message="Вы уверены, что хотите выйти без сохранения?"
      :buttons="unsavedAlertButtons"
      @did-dismiss="showUnsavedAlert = false"
    />

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2000" @did-dismiss="toastOpen = false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonToggle, IonToast, IonAlert } from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { UserUpdate } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const fullName = ref('');
const picture = ref('');
const isPublic = ref(false);
const saving = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');
const confirmLogout = ref(false);
const confirmDelete = ref(false);
const showUnsavedAlert = ref(false);

// Store initial values for dirty check
let initialName = '';
let initialPublic = false;

onMounted(() => {
  const user = authStore.user;
  if (user) {
    fullName.value = user.full_name ?? '';
    picture.value = user.picture ?? '';
    isPublic.value = user.is_public_profile ?? false;
    initialName = fullName.value;
    initialPublic = isPublic.value;
  }
});

const isDirty = computed(() =>
  fullName.value !== initialName || isPublic.value !== initialPublic
);

function cancel() {
  if (isDirty.value) {
    showUnsavedAlert.value = true;
  } else {
    router.back();
  }
}

async function save() {
  saving.value = true;
  try {
    const payload: UserUpdate = {
      full_name: fullName.value.trim() || null,
      is_public_profile: isPublic.value,
    };
    await api.put('/api/v1/users/me', payload);
    await authStore.fetchMe();
    initialName = fullName.value;
    initialPublic = isPublic.value;
    toastMsg.value = 'Сохранено';
    toastOpen.value = true;
  } catch {
    toastMsg.value = 'Ошибка сохранения';
    toastOpen.value = true;
  } finally {
    saving.value = false;
  }
}

async function logout() {
  await authStore.logout();
  await router.replace('/login');
}

async function deleteAccount() {
  try {
    await api.delete('/api/v1/users/me');
    await authStore.logout();
    await router.replace('/login');
  } catch {
    toastMsg.value = 'Ошибка удаления';
    toastOpen.value = true;
  }
}

const logoutAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  { text: 'Выйти', role: 'destructive', handler: logout },
];

const deleteAlertButtons = [
  { text: 'Отмена', role: 'cancel' },
  { text: 'Удалить', role: 'destructive', handler: deleteAccount },
];

const unsavedAlertButtons = [
  { text: 'Остаться', role: 'cancel' },
  { text: 'Выйти без сохранения', role: 'destructive', handler: () => router.back() },
];
</script>

<style scoped>
.settings-content {
  --background: #1E1E1E;
}

/* ── Top bar ─────────────────────────────────────────────────────────────── */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(env(safe-area-inset-top) + 12px) 16px 8px;
}

.top-btn {
  background: none;
  border: none;
  font-size: 15px;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 8px 4px;
  -webkit-tap-highlight-color: transparent;
}

.top-btn--done {
  color: #FF9E9E;
  font-weight: 600;
}

.top-btn--done:disabled {
  opacity: 0.4;
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */
.avatar-section {
  display: flex;
  justify-content: center;
  padding: 16px 0 24px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #2D2D3A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-icon { font-size: 32px; color: rgba(255, 255, 255, 0.5); }

/* ── Fields ──────────────────────────────────────────────────────────────── */
.field-section {
  padding: 0 16px 16px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  background: #2D2D3A;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  color: #FFFFFF;
  outline: none;
  box-sizing: border-box;
}

.field-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.field-input:focus {
  box-shadow: 0 0 0 1px rgba(167, 184, 217, 0.4);
}

/* ── Toggle card ─────────────────────────────────────────────────────────── */
.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2D2D3A;
  border-radius: 14px;
  padding: 14px 16px;
  margin: 0 16px;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  font-size: 14px;
  color: #FFFFFF;
  font-weight: 500;
}

.toggle-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.compact-toggle {
  --track-background: rgba(255, 255, 255, 0.15);
  --track-background-checked: #5cb85c;
  --handle-background: #FFFFFF;
  --handle-background-checked: #FFFFFF;
  --handle-width: 22px;
  --handle-height: 22px;
  --handle-border-radius: 50%;
  width: 48px;
  height: 28px;
}

/* ── Danger section ──────────────────────────────────────────────────────── */
.danger-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 24px 16px 0;
  background: #2D2D3A;
  border-radius: 14px;
  overflow: hidden;
}

.danger-btn {
  width: 100%;
  background: none;
  border: none;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  color: #E76F6F;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.danger-btn:active {
  background: rgba(231, 111, 111, 0.08);
}

.danger-btn + .danger-btn {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.danger-btn--delete {
  color: rgba(231, 111, 111, 0.6);
}

/* ── Version ─────────────────────────────────────────────────────────────── */
.version-text {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
  margin: 24px 0;
}
</style>
