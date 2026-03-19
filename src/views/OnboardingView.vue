<template>
  <ion-page>
    <ion-content :fullscreen="true" class="onb-content">
      <swiper
        :modules="swiperModules"
        :autoplay="{ delay: 2500, disableOnInteraction: false }"
        class="onb-swiper"
        @swiper="onSwiper"
        @slideChange="onSlideChange"
      >
        <swiper-slide v-for="(slide, i) in slides" :key="i" class="onb-slide">
          <div class="slide-bg" :style="{ background: slide.bg }" />
          <div class="slide-overlay" />
          <div class="slide-logo">
            <img src="/logo.png" alt="Anirate" class="slide-logo-img" />
          </div>
          <div class="slide-bottom">
            <p class="slide-text">{{ slide.text }}</p>
          </div>
        </swiper-slide>
      </swiper>

      <div class="onb-footer">
        <div class="onb-dots">
          <span
            v-for="(_, i) in slides"
            :key="i"
            class="dot"
            :class="{ active: i === activeIndex }"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay } from 'swiper/modules';
import { Preferences } from '@capacitor/preferences';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';

const router = useRouter();
const swiperModules = [Autoplay];
const swiperInstance = ref<SwiperInstance | null>(null);
const activeIndex = ref(0);

const slides = [
  {
    bg: 'linear-gradient(180deg, #2D2D3A 0%, #1E1E1E 100%)',
    text: 'Открывай новые аниме и веди свой список',
  },
  {
    bg: 'linear-gradient(180deg, #3a3040 0%, #1E1E1E 100%)',
    text: 'Ставь оценки и следи за прогрессом',
  },
  {
    bg: 'linear-gradient(180deg, #2d3a40 0%, #1E1E1E 100%)',
    text: 'Делитесь с друзьями своими находками!',
  },
];

async function finishOnboarding() {
  await Preferences.set({ key: 'onboarding_seen', value: 'true' });
  await router.replace('/login');
}

function onSwiper(swiper: SwiperInstance) {
  swiperInstance.value = swiper;
  setTimeout(finishOnboarding, 3 * 2500 + 1500);
}

function onSlideChange() {
  if (swiperInstance.value) {
    activeIndex.value = swiperInstance.value.activeIndex;
    if (swiperInstance.value.isEnd) {
      setTimeout(finishOnboarding, 1500);
    }
  }
}
</script>

<style scoped>
.onb-content {
  --background: #1E1E1E;
}

.onb-swiper {
  width: 100%;
  height: 100%;
}

.onb-slide {
  position: relative;
  display: flex;
  flex-direction: column;
}

.slide-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.slide-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, transparent, #1E1E1E);
  z-index: 1;
}

.slide-logo {
  position: relative;
  z-index: 2;
  padding: calc(env(safe-area-inset-top) + 20px) 0 0 20px;
}

.slide-logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.slide-bottom {
  position: absolute;
  bottom: 100px;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 0 32px;
}

.slide-text {
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
  letter-spacing: -0.3px;
}

.onb-footer {
  position: absolute;
  bottom: 52px;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
}

.onb-dots {
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
