<template>
  <ion-page>
    <ion-content class="setup-content">
      <div class="setup-inner">
        <div class="setup-header">
          <ion-button fill="clear" class="skip-btn" @click="skip">Пропустить</ion-button>
        </div>

        <div class="avatar-section">
          <div class="avatar-circle">
            <img v-if="picture" :src="picture" alt="Avatar" class="avatar-img" />
            <ion-icon v-else :icon="cameraOutline" class="avatar-icon" />
          </div>
          <div class="username-input-wrap">
            <input v-model="displayUsername" placeholder="@никнейм" class="username-input" />
            <div class="username-line" />
          </div>
        </div>

        <div class="action-cards">
          <div class="action-card lavender">
            <p>Добавить<br>первые аниме</p>
            <ion-icon :icon="sparklesOutline" class="card-icon" />
          </div>
          <div class="action-card cream">
            <ion-icon :icon="sparklesOutline" class="card-icon top-right" />
            <p>Создать<br>первый список</p>
          </div>
        </div>

        <div class="setup-form">
          <ion-item lines="none" class="form-item">
            <ion-input
              v-model="fullName"
              placeholder="Имя"
              class="form-input"
            />
          </ion-item>
        </div>

        <ion-button
          expand="block"
          class="start-btn"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Сохраняем...' : 'Начать использование' }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonItem, IonInput, IonIcon } from '@ionic/vue';
import { cameraOutline, sparklesOutline } from 'ionicons/icons';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { UserUpdate } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const fullName = ref('');
const displayUsername = ref('');
const picture = ref('');
const saving = ref(false);

onMounted(() => {
  const user = authStore.user;
  if (user) {
    fullName.value = user.full_name ?? '';
    picture.value = user.picture ?? '';
    displayUsername.value = user.email?.split('@')[0] ? `@${user.email.split('@')[0]}` : '';
  }
});

async function save() {
  saving.value = true;
  try {
    const payload: UserUpdate = {
      full_name: fullName.value.trim() || displayUsername.value.replace('@', ''),
      is_public_profile: true,
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

function skip() {
  router.replace('/tabs/');
}
</script>

<style scoped>
.setup-content {
  --background: #1E1E1E;
}

.setup-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0 24px 48px;
}

.setup-header {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.skip-btn {
  --color: rgba(255,255,255,0.6);
  --padding-start: 0;
  --padding-end: 0;
  font-size: 15px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  margin-bottom: 40px;
}

.avatar-circle {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #A7B8D9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 36px;
  color: rgba(255,255,255,0.8);
}

.username-input-wrap {
  width: 200px;
}

.username-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  font-family: inherit;
  text-align: center;
  padding: 6px 0;
  box-sizing: border-box;
}

.username-input::placeholder { color: rgba(255,255,255,0.35); }

.username-line {
  height: 1px;
  background: rgba(255,255,255,0.2);
}

.action-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.action-card {
  border-radius: 20px;
  padding: 20px 16px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.action-card.lavender {
  background: #A7B8D9;
}

.action-card.cream {
  background: #FBF9F6;
}

.action-card p {
  font-size: 15px;
  font-weight: 600;
  color: #1E1E1E;
  margin: 0;
  line-height: 1.4;
}

.card-icon {
  font-size: 32px;
  color: rgba(30,30,30,0.4);
  align-self: flex-end;
}

.card-icon.top-right {
  position: absolute;
  top: 16px;
  right: 16px;
  align-self: unset;
}

.setup-form {
  margin-bottom: 24px;
}

.form-item {
  --background: #2D2D3A;
  --border-radius: 14px;
  --padding-start: 16px;
  --inner-padding-end: 16px;
  border-radius: 14px;
  margin-bottom: 8px;
}

.form-input {
  --color: #FFFFFF;
  --placeholder-color: rgba(255,255,255,0.4);
  font-size: 16px;
}

.start-btn {
  margin-top: auto;
  --background: #FF9E9E;
  --background-activated: #e08a8a;
  --color: #1E1E1E;
  --border-radius: 14px;
  --box-shadow: none;
  font-weight: 600;
  font-size: 15px;
  height: 52px;
}
</style>
