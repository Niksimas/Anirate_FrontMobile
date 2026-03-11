<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-inner">
        <div class="login-hero">
          <img src="/favicon.png" alt="Anirate" width="80" height="80" />
          <h1>Anirate</h1>
          <p>Твой трекер аниме</p>
        </div>

        <div class="login-actions">
          <ion-button
            expand="block"
            class="google-btn"
            :disabled="loading"
            @click="signInWithGoogle"
          >
            <ion-icon slot="start" :icon="logoGoogle" />
            {{ loading ? 'Входим...' : 'Войти через Google' }}
          </ion-button>
        </div>

        <ion-toast
          :is-open="!!error"
          :message="error"
          :duration="3000"
          color="danger"
          @did-dismiss="error = ''"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonIcon, IonToast } from '@ionic/vue';
import { logoGoogle } from 'ionicons/icons';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');

async function signInWithGoogle() {
  loading.value = true;
  error.value = '';
  try {
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication.idToken;
    const { data: tokens } = await authApi.googleAuth({ token: idToken });
    await authStore.setTokens(tokens);
    await authStore.fetchMe();

    const user = authStore.user;
    if (!user?.full_name) {
      await router.replace('/setup');
    } else {
      await router.replace('/tabs/');
    }
  } catch (e: unknown) {
    error.value = 'Не удалось войти. Попробуй ещё раз.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-content {
  --background: var(--ion-background-color);
}
.login-inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 60px 24px 48px;
}
.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.login-hero h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
}
.login-hero p {
  font-size: 1rem;
  color: var(--ion-color-medium);
  margin: 0;
}
.google-btn {
  --background: #fff;
  --color: #333;
  --border-radius: 12px;
  font-weight: 600;
}
</style>
