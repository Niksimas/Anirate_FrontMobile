<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile" />
        </ion-buttons>
        <ion-title>Настройки</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Avatar -->
      <div class="avatar-section">
        <ion-avatar class="settings-avatar">
          <img v-if="picture" :src="picture" />
          <ion-icon v-else :icon="personCircleOutline" />
        </ion-avatar>
      </div>

      <ion-list lines="none">
        <ion-item>
          <ion-input
            v-model="fullName"
            label="Имя"
            label-placement="stacked"
            placeholder="Твоё имя"
            clearInput
          />
        </ion-item>

        <ion-item>
          <ion-toggle v-model="isPublic">
            <div class="toggle-label">
              <span>Публичный профиль</span>
              <p>Друзья смогут видеть твой список аниме</p>
            </div>
          </ion-toggle>
        </ion-item>

        <!-- Dark mode -->
        <ion-item>
          <ion-toggle v-model="darkMode" @ion-change="toggleDarkMode">
            <div class="toggle-label">
              <span>Тёмная тема</span>
            </div>
          </ion-toggle>
        </ion-item>
      </ion-list>

      <ion-button
        expand="block"
        class="save-btn"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </ion-button>

      <ion-button
        expand="block"
        fill="outline"
        color="danger"
        class="logout-btn"
        @click="logout"
      >
        Выйти из аккаунта
      </ion-button>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMsg"
        :duration="2000"
        @did-dismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonList, IonItem, IonInput, IonToggle, IonButton, IonAvatar, IonIcon, IonToast,
} from '@ionic/vue';
import { personCircleOutline } from 'ionicons/icons';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { UserUpdate } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const fullName = ref('');
const picture = ref('');
const isPublic = ref(false);
const darkMode = ref(document.documentElement.classList.contains('ion-palette-dark'));
const saving = ref(false);
const toastOpen = ref(false);
const toastMsg = ref('');

onMounted(() => {
  const user = authStore.user;
  if (user) {
    fullName.value = user.full_name ?? '';
    picture.value = user.picture ?? '';
    isPublic.value = user.is_public_profile ?? false;
  }
});

function toggleDarkMode() {
  document.documentElement.classList.toggle('ion-palette-dark', darkMode.value);
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
</script>

<style scoped>
.avatar-section { display: flex; justify-content: center; margin: 16px 0 24px; }
.settings-avatar { width: 80px; height: 80px; font-size: 80px; color: var(--ion-color-medium); }
.toggle-label span { font-size: 1rem; }
.toggle-label p { font-size: 0.8rem; color: var(--ion-color-medium); margin: 2px 0 0; }
.save-btn { margin-top: 24px; }
.logout-btn { margin-top: 12px; }
</style>
