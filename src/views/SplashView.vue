<template>
  <ion-page>
    <ion-content class="splash-content">
      <div class="splash-inner">
        <div class="splash-glow" />
        <div class="splash-logo">
          <img src="/logo.png" alt="Anirate" class="logo-img" />
        </div>
        <div class="splash-bottom">
          <p class="splash-text">Еще чуть-чуть...</p>
          <div class="splash-dots">
            <span class="dot" :class="{ active: activeDot === 0 }" />
            <span class="dot" :class="{ active: activeDot === 1 }" />
            <span class="dot" :class="{ active: activeDot === 2 }" />
            <span class="dot" :class="{ active: activeDot === 3 }" />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import { Preferences } from '@capacitor/preferences';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const activeDot = ref(1);
let dotInterval: ReturnType<typeof setInterval>;

onMounted(async () => {
  dotInterval = setInterval(() => {
    activeDot.value = (activeDot.value + 1) % 4;
  }, 500);

  const [{ value: onboardingSeen }, hasToken] = await Promise.all([
    Preferences.get({ key: 'onboarding_seen' }),
    authStore.loadTokens(),
  ]);

  clearInterval(dotInterval);

  if (!onboardingSeen) {
    await router.replace('/onboarding');
  } else if (hasToken) {
    try {
      await authStore.fetchMe();
      if (!authStore.user?.full_name) {
        await router.replace('/setup');
      } else {
        await router.replace('/tabs/');
      }
    } catch {
      await router.replace('/login');
    }
  } else {
    await router.replace('/login');
  }
});

onUnmounted(() => clearInterval(dotInterval));
</script>

<style scoped>
.splash-content {
  --background: #1E1E1E;
}

.splash-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.splash-glow {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(255, 158, 158, 0.4) 0%, rgba(167, 184, 217, 0.2) 50%, transparent 75%);
  border-radius: 50%;
  pointer-events: none;
}

.splash-logo {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  width: 240px;
  height: 240px;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

.splash-bottom {
  padding: 0 24px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.splash-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  margin: 0;
}

.splash-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: background 0.3s;
}

.dot.active {
  background: rgba(255, 255, 255, 0.8);
}
</style>
