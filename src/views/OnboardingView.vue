<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <swiper
        :modules="swiperModules"
        :pagination="{ clickable: true }"
        class="onboarding-swiper"
        @swiper="onSwiper"
      >
        <swiper-slide v-for="(slide, i) in slides" :key="i" class="onboarding-slide">
          <div class="slide-inner">
            <ion-icon :icon="slide.icon" class="slide-icon" />
            <h2>{{ slide.title }}</h2>
            <p>{{ slide.description }}</p>
          </div>
        </swiper-slide>
      </swiper>

      <div class="onboarding-footer">
        <ion-button expand="block" @click="handleContinue">
          {{ isLastSlide ? 'Начать' : 'Далее' }}
        </ion-button>
        <ion-button fill="clear" size="small" @click="skip">Пропустить</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import { searchOutline, listOutline, peopleOutline } from 'ionicons/icons';
import 'swiper/css';
import 'swiper/css/pagination';

const router = useRouter();
const swiperModules = [Pagination];
const swiperInstance = ref<SwiperInstance | null>(null);
const isLastSlide = ref(false);

const slides = [
  {
    icon: searchOutline,
    title: 'Открывай аниме',
    description: 'Ищи аниме по названию, фильтруй по году и сезону.',
  },
  {
    icon: listOutline,
    title: 'Веди список',
    description: 'Отмечай что смотришь, планируешь или уже посмотрел. Ставь оценки.',
  },
  {
    icon: peopleOutline,
    title: 'Смотри вместе',
    description: 'Создавай совместные списки с друзьями и обсуждай оценки.',
  },
];

function onSwiper(swiper: SwiperInstance) {
  swiperInstance.value = swiper;
  swiper.on('slideChange', () => {
    isLastSlide.value = swiper.isEnd;
  });
}

function handleContinue() {
  if (isLastSlide.value) {
    skip();
  } else {
    swiperInstance.value?.slideNext();
  }
}

function skip() {
  router.replace('/login');
}
</script>

<style scoped>
.onboarding-swiper {
  height: calc(100% - 130px);
}
.onboarding-slide {
  display: flex;
  align-items: center;
  justify-content: center;
}
.slide-inner {
  text-align: center;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.slide-icon {
  font-size: 80px;
  color: var(--ion-color-primary);
}
.slide-inner h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
}
.slide-inner p {
  font-size: 1rem;
  color: var(--ion-color-medium);
  margin: 0;
  max-width: 280px;
}
.onboarding-footer {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
