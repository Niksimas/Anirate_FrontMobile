<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Настройка профиля</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="setup-subtitle">Расскажи немного о себе, чтобы друзья могли тебя найти.</p>

      <div class="avatar-section">
        <ion-avatar class="setup-avatar">
          <img v-if="picture" :src="picture" alt="Avatar" />
          <ion-icon v-else :icon="personCircleOutline" />
        </ion-avatar>
      </div>

      <ion-list lines="none" class="setup-form">
        <ion-item>
          <ion-input
            v-model="fullName"
            label="Имя"
            label-placement="stacked"
            placeholder="Как тебя зовут?"
            :maxlength="100"
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
      </ion-list>

      <ion-button
        expand="block"
        class="setup-btn"
        :disabled="!fullName.trim() || saving"
        @click="save"
      >
        {{ saving ? 'Сохраняем...' : 'Продолжить' }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonInput, IonToggle, IonButton, IonAvatar, IonIcon,
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
const saving = ref(false);

onMounted(() => {
  const user = authStore.user;
  if (user) {
    fullName.value = user.full_name ?? '';
    picture.value = user.picture ?? '';
    isPublic.value = user.is_public_profile ?? false;
  }
});

async function save() {
  if (!fullName.value.trim()) return;
  saving.value = true;
  try {
    const payload: UserUpdate = {
      full_name: fullName.value.trim(),
      is_public_profile: isPublic.value,
    };
    await api.put('/api/v1/users/me', payload);
    await authStore.fetchMe();
    await router.replace('/tabs/');
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.setup-subtitle {
  color: var(--ion-color-medium);
  margin-bottom: 24px;
}
.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}
.setup-avatar {
  width: 88px;
  height: 88px;
  font-size: 88px;
  color: var(--ion-color-medium);
}
.toggle-label span {
  font-size: 1rem;
}
.toggle-label p {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin: 2px 0 0;
}
.setup-btn {
  margin-top: 32px;
}
</style>
