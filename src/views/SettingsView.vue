<template>
  <ion-page>
    <ion-content class="settings-content" :fullscreen="true">
      <!-- Top bar: Отмена / Готово -->
      <div class="top-bar">
        <ion-button fill="clear" class="top-action-btn" @click="cancel">Отмена</ion-button>
        <ion-button fill="clear" class="top-action-btn done-btn" :disabled="saving" @click="save">
          {{ saving ? '...' : 'Готово' }}
        </ion-button>
      </div>

      <!-- Avatar + fields row -->
      <div class="avatar-fields-row">
        <div class="avatar-circle">
          <img v-if="picture" :src="fixUrl(picture)" class="avatar-img" />
          <ion-icon v-else :icon="cameraOutline" class="avatar-icon" />
        </div>
        <div class="fields-stack">
          <div class="field-wrap">
            <input v-model="firstName" placeholder="Имя" class="field-input" />
            <div class="field-line" />
          </div>
          <div class="field-wrap">
            <input v-model="lastName" placeholder="Фамилия" class="field-input" />
            <div class="field-line" />
          </div>
        </div>
      </div>

      <!-- Additional fields -->
      <div class="fields-section">
        <div class="field-wrap">
          <input v-model="bio" placeholder="Немного о себе..." class="field-input" />
          <div class="field-line" />
        </div>
        <div class="field-wrap">
          <input v-model="username" placeholder="@username" class="field-input" />
          <div class="field-line" />
        </div>
      </div>

      <!-- Toggle card -->
      <div class="toggle-card">
        <span class="toggle-label">Видимость личных оценок</span>
        <ion-toggle v-model="isPublic" class="compact-toggle" />
      </div>

      <div class="bottom-section">
        <ion-button expand="block" fill="clear" class="logout-btn" @click="logout">
          Выйти из аккаунта
        </ion-button>
      </div>

      <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2000" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonIcon, IonToggle, IonToast } from '@ionic/vue';
import { cameraOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { UserUpdate } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const firstName = ref('');
const lastName = ref('');
const bio = ref('');
const username = ref('');
const picture = ref('');
const isPublic = ref(false);
const saving = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');

onMounted(() => {
  const user = authStore.user;
  if (user) {
    const parts = (user.full_name ?? '').split(' ');
    firstName.value = parts[0] ?? '';
    lastName.value = parts.slice(1).join(' ');
    picture.value = user.picture ?? '';
    isPublic.value = user.is_public_profile ?? false;
    username.value = user.email?.split('@')[0] ?? '';
  }
});

function cancel() { router.back(); }

async function save() {
  saving.value = true;
  try {
    const fullName = [firstName.value.trim(), lastName.value.trim()].filter(Boolean).join(' ');
    const payload: UserUpdate = {
      full_name: fullName || null,
      is_public_profile: isPublic.value,
    };
    await api.put('/api/v1/users/me', payload);
    await authStore.fetchMe();
    toastMsg.value = 'Сохранено';
    toastOpen.value = true;
    setTimeout(() => router.back(), 1200);
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
</script>

<style scoped>
.settings-content {
  --background: #1E1E1E;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(env(safe-area-inset-top) + 12px) 8px 8px;
}

.top-action-btn {
  --color: rgba(255,255,255,0.7);
  font-size: 15px;
  --padding-start: 8px;
  --padding-end: 8px;
}

.done-btn { --color: #FFFFFF; font-weight: 600; }

/* Avatar + first field */
.avatar-fields-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 16px 8px;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #4A4A5A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-icon { font-size: 28px; color: rgba(255,255,255,0.5); }

.fields-stack {
  flex: 1;
  padding-top: 8px;
}

/* Fields */
.fields-section {
  padding: 0 16px;
}

.field-wrap {
  margin-bottom: 4px;
}

.field-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #FFFFFF;
  font-size: 15px;
  font-family: inherit;
  padding: 10px 0;
  box-sizing: border-box;
}

.field-input::placeholder { color: rgba(255,255,255,0.3); }

.field-line {
  height: 1px;
  background: rgba(255,255,255,0.12);
  margin-bottom: 4px;
}

/* Toggle card */
.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 14px 16px;
  margin: 16px 16px 0;
}

.toggle-label {
  font-size: 14px;
  color: #1E1E1E;
  font-weight: 500;
}

.compact-toggle {
  --track-background: rgba(255,255,255,0.15);
  --track-background-checked: #5cb85c;
  --handle-background: #FFFFFF;
  --handle-background-checked: #FFFFFF;
  --handle-width: 22px;
  --handle-height: 22px;
  --handle-border-radius: 50%;
  width: 48px;
  height: 28px;
}

/* Logout */
.bottom-section {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  left: 0;
  right: 0;
  padding: 0 16px;
}

.logout-btn {
  --background: #2D2D3A;
  --background-activated: #383848;
  --color: #FF9E9E;
  --border-radius: 14px;
  height: 52px;
  font-weight: 500;
  font-size: 15px;
}
</style>
