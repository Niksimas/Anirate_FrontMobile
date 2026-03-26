<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div v-if="!checking" class="login-inner">
        <div class="login-hero">
          <div class="login-glow" />
          <img src="/logo.png" alt="Anirate" class="logo-img" />
        </div>

        <div class="login-bottom">
          <h1 class="login-title">Добро<br>пожаловать!</h1>

          <div class="google-btn-wrapper">
            <ion-button
              expand="block"
              class="google-btn"
              :disabled="loading"
              @click="isNative ? signInWithGoogle() : undefined"
            >
              {{ loading ? 'Входим...' : 'Войти через Google' }}
            </ion-button>
            <div v-if="!isNative" ref="googleBtnRef" class="google-btn-overlay" />
          </div>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonToast } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@southdevs/capacitor-google-auth';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isNative = Capacitor.isNativePlatform();

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const checking = ref(true);
const error = ref('');
const googleBtnRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  // Check existing session first
  try {
    const hasToken = await authStore.loadTokens();
    if (hasToken) {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
      await Promise.race([authStore.fetchMe(), timeout]);
      if (!authStore.user?.full_name) {
        await router.replace('/setup');
      } else {
        await router.replace('/tabs/');
      }
      return;
    }
  } catch {
    // Token missing, expired, or network timeout — stay on login
  }
  checking.value = false;

  if (!isNative) {
    await loadGisScript();
    const google = (window as any).google;
    google.accounts.id.initialize({
      client_id: WEB_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    if (googleBtnRef.value) {
      google.accounts.id.renderButton(googleBtnRef.value, {
        type: 'standard',
        size: 'large',
        width: googleBtnRef.value.offsetWidth || 320,
      });
    }
  }
});

async function handleGoogleCredential(response: { credential: string }) {
  loading.value = true;
  error.value = '';
  try {
    const { data: tokens } = await authApi.googleAuth({ token: response.credential });
    await authStore.setTokens(tokens);
    await authStore.fetchMe();
    await redirectAfterLogin();
  } catch (e: unknown) {
    error.value = 'Не удалось войти. Попробуй ещё раз.';
    console.error('SIGN_IN_ERROR:', JSON.stringify(e));
  } finally {
    loading.value = false;
  }
}

async function signInWithGoogle() {
  loading.value = true;
  error.value = '';
  try {
    await GoogleAuth.initialize({
      clientId: WEB_CLIENT_ID,
      scopes: ['email', 'profile'],
    });
    const googleUser = await GoogleAuth.signIn({
      scopes: ['email', 'profile'],
      serverClientId: WEB_CLIENT_ID,
    });
    const { data: tokens } = await authApi.googleAuth({ token: googleUser.authentication.idToken });
    await authStore.setTokens(tokens);
    await authStore.fetchMe();
    await redirectAfterLogin();
  } catch (e: unknown) {
    error.value = 'Не удалось войти. Попробуй ещё раз.';
    console.error('SIGN_IN_ERROR:', JSON.stringify(e));
  } finally {
    loading.value = false;
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function redirectAfterLogin() {
  const user = authStore.user;
  if (!user?.full_name) {
    await router.replace('/setup');
  } else {
    await router.replace('/tabs/');
  }
}
</script>

<style scoped>
.login-content {
  --background: #111111;
}

.login-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.login-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(255, 140, 140, 0.45) 0%, rgba(180, 160, 220, 0.2) 45%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.logo-img {
  width: 230px;
  height: 230px;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

.login-bottom {
  padding: 0 28px 56px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-title {
  font-size: 42px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.5px;
  text-align: center;
}

.google-btn-wrapper {
  position: relative;
}

.google-btn {
  --background: #FFADAD;
  --background-activated: #e09898;
  --background-focused: #e09898;
  --color: #1A1A1A;
  --border-radius: 14px;
  --box-shadow: none;
  font-weight: 500;
  font-size: 15px;
  height: 48px;
  margin: 0;
  letter-spacing: 0;
}

.google-btn-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.01;
  display: flex;
  align-items: center;
  justify-content: center;
}

.google-btn-overlay > div,
.google-btn-overlay iframe {
  width: 100% !important;
  height: 100% !important;
  min-height: 48px;
}
</style>
