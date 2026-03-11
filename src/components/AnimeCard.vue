<template>
  <div class="anime-card" @click="$emit('click')">
    <div class="anime-card__poster">
      <img :src="anime.image_url" :alt="anime.title" loading="lazy" />
      <div v-if="trackingStatus" class="anime-card__badge" :class="`badge--${trackingStatus}`">
        {{ statusLabel }}
      </div>
    </div>
    <div class="anime-card__info">
      <p class="anime-card__title">{{ anime.title }}</p>
      <p class="anime-card__meta">{{ anime.season }} {{ anime.year }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AnimeResponse, TrackingStatus } from '@/types';

const props = defineProps<{
  anime: AnimeResponse;
  trackingStatus?: TrackingStatus | null;
}>();

defineEmits<{ click: [] }>();

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    planned: 'В планах',
    watching: 'Смотрю',
    completed: 'Просмотрено',
  };
  return props.trackingStatus ? labels[props.trackingStatus] : '';
});
</script>

<style scoped>
.anime-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.anime-card__poster {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 2/3;
  background: var(--ion-color-step-100);
}
.anime-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.anime-card__badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
}
.badge--planned { background: var(--ion-color-medium); }
.badge--watching { background: var(--ion-color-primary); }
.badge--completed { background: var(--ion-color-success); }
.anime-card__title {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.anime-card__meta {
  font-size: 0.72rem;
  color: var(--ion-color-medium);
  margin: 0;
  text-transform: capitalize;
}
</style>
