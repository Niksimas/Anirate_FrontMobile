<template>
  <ion-page>
    <ion-content class="ion-text-center splash-content">
      <div class="splash-inner">
        <div class="splash-logo">
          <img src="/favicon.png" alt="Anirate" width="96" height="96" />
          <h1>Anirate</h1>
        </div>
        <ion-spinner name="crescent" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonSpinner } from '@ionic/vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  const hasToken = await authStore.loadTokens();
  if (hasToken) {
    try {
      await authStore.fetchMe();
      await router.replace('/tabs/');
    } catch {
      await router.replace('/login');
    }
  } else {
    await router.replace('/onboarding');
  }
});
</script>

<style scoped>
.splash-content {
  --background: var(--ion-background-color);
}
.splash-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 32px;
}
.splash-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.splash-logo h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
</style>
