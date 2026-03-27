<template>
  <div class="anime-card" @click="$emit('click')">
    <div class="anime-card__poster">
      <img :src="fixUrl(anime.image_url)" :alt="anime.title" loading="lazy" />
      <span class="anime-card__score">
        {{ anime.avg_score != null ? anime.avg_score.toFixed(1) : '—' }}
      </span>
      <span v-if="anime.year" class="anime-card__year">{{ anime.year }}</span>
      <div v-if="trackingStatus" class="anime-card__badge" :class="`badge--${trackingStatus}`">
        {{ statusLabel }}
      </div>
    </div>
    <p class="anime-card__title">{{ anime.title }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { fixUrl } from '@/composables/useImageUrl';
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
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 2/3;
  background: #2D2D3A;
}

.anime-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.anime-card__score {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: 0.72rem;
  font-weight: 700;
  color: #FFFFFF;
}

.anime-card__year {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.anime-card__badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.6rem;
  font-weight: 600;
  color: #1E1E1E;
}

.badge--planned { background: rgba(105,114,137,0.9); color: #FBF9F6; }
.badge--watching { background: #A7B8D9; }
.badge--completed { background: rgba(92,184,92,0.9); color: #FBF9F6; }

.anime-card__title {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  color: #FFFFFF;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
