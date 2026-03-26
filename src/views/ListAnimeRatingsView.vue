<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Назад" :default-href="`/tabs/lists/${listId}`" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ratings-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Skeleton -->
      <div v-if="loading" class="skeleton-wrap">
        <div class="hero-skeleton">
          <ion-skeleton-text animated style="width:80px;height:112px;border-radius:10px;" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:20px;width:70%;margin-bottom:8px;" />
            <ion-skeleton-text animated style="height:14px;width:40%;margin-bottom:16px;" />
            <ion-skeleton-text animated style="height:32px;width:60%;border-radius:16px;" />
          </div>
        </div>
        <div v-for="i in 3" :key="i" class="card-skeleton">
          <ion-skeleton-text animated style="width:36px;height:36px;border-radius:50%;" />
          <div style="flex:1">
            <ion-skeleton-text animated style="height:16px;width:50%;margin-bottom:6px;" />
            <ion-skeleton-text animated style="height:13px;width:30%;" />
          </div>
          <ion-skeleton-text animated style="width:40px;height:40px;border-radius:10px;" />
        </div>
      </div>

      <template v-else>
        <!-- Hero: anime context -->
        <div v-if="animeItem" class="hero">
          <img :src="fixUrl(animeItem.image_url)" :alt="animeItem.title" class="hero-poster" />
          <div class="hero-info">
            <p class="hero-title">{{ animeItem.title }}</p>
            <p v-if="animeItem.season || animeItem.year" class="hero-sub">
              {{ [animeItem.season, animeItem.year].filter(Boolean).join(' · ') }}
            </p>
            <div v-if="animeItem.average_score != null" class="hero-avg">
              <span class="hero-avg-num">{{ Math.round(animeItem.average_score * 10) / 10 }}</span>
              <span class="hero-avg-label">средняя · {{ ratings.length }} {{ ratingsWord(ratings.length) }}</span>
            </div>
          </div>
        </div>

        <!-- Your rating section -->
        <div class="my-rating-section">
          <p class="section-title">Ваша оценка</p>

          <div v-if="myRating" class="my-rating-card">
            <div class="my-rating-top">
              <div class="score-badge" :style="{ background: scoreColor(myRating.score) }">
                {{ myRating.score }}
              </div>
              <div class="my-rating-meta">
                <span class="my-rating-label" :style="{ color: scoreColor(myRating.score) }">
                  {{ scoreLabel(myRating.score) }}
                </span>
                <span v-if="myRating.updated_at" class="my-rating-date">{{ relativeDate(myRating.updated_at) }}</span>
              </div>
              <button class="edit-btn" @click="openRating">Изменить</button>
            </div>
            <p v-if="myRating.comment" class="my-rating-comment">{{ myRating.comment }}</p>
          </div>

          <div v-else class="my-rating-empty">
            <p class="my-rating-empty-text">Вы ещё не оценили это аниме</p>
            <button class="rate-cta" @click="openRating">
              <ion-icon :icon="starOutline" />
              Оценить
            </button>
          </div>
        </div>

        <!-- Friends' ratings -->
        <div v-if="othersRatings.length" class="others-section">
          <p class="section-title">Оценки участников ({{ othersRatings.length }})</p>

          <div
            v-for="r in othersRatings"
            :key="r.user_id"
            class="rating-card"
          >
            <div class="rating-card-top">
              <img v-if="r.picture" :src="fixUrl(r.picture)" class="avatar" />
              <div v-else class="avatar avatar--placeholder">{{ (r.full_name ?? '?')[0] }}</div>

              <div class="rating-card-meta">
                <span class="rating-card-name">{{ r.full_name ?? `Пользователь #${r.user_id}` }}</span>
                <span v-if="r.updated_at" class="rating-card-date">{{ relativeDate(r.updated_at) }}</span>
              </div>

              <div class="score-badge" :style="{ background: scoreColor(r.score) }">
                {{ r.score }}
              </div>
            </div>

            <div v-if="r.comment" class="rating-card-comment-wrap">
              <p
                class="rating-card-comment"
                :class="{ 'rating-card-comment--clamped': !expandedComments.has(r.user_id) }"
              >
                {{ r.comment }}
              </p>
              <button
                v-if="r.comment.length > 80"
                class="expand-btn"
                @click="toggleExpand(r.user_id)"
              >
                {{ expandedComments.has(r.user_id) ? 'Свернуть' : 'Ещё' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state (no ratings at all) -->
        <div v-if="!ratings.length" class="empty-state">
          <ion-icon :icon="chatbubbleEllipsesOutline" class="empty-icon" />
          <p class="empty-title">Пока никто не оценил</p>
          <p class="empty-hint">Будьте первым!</p>
          <button class="rate-cta" @click="openRating">
            <ion-icon :icon="starOutline" />
            Оценить
          </button>
        </div>
      </template>
    </ion-content>

    <!-- Rate modal -->
    <ion-modal ref="rateModal" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.9]" @did-dismiss="ratingItem = null">
      <RateAnimeSheet
        v-if="ratingItem"
        :list-id="listId"
        :item="ratingItem"
        :my-rating="myRatingPayload"
        @close="rateModal?.$el.dismiss()"
        @saved="onRatingSaved"
      />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonSkeletonText, IonIcon,
  IonRefresher, IonRefresherContent, IonModal,
} from '@ionic/vue';
import { starOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { listsApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth';
import RateAnimeSheet from '@/components/RateAnimeSheet.vue';
import type { ListAnimeResponse, RatingResponse } from '@/types';
import type { RefresherCustomEvent } from '@ionic/vue';

const route = useRoute();
const authStore = useAuthStore();
const listId = Number(route.params.id);
const animeId = Number(route.params.animeId);
const myUserId = computed(() => authStore.user?.id ?? 0);

const animeItem = ref<ListAnimeResponse | null>(null);
const ratings = ref<RatingResponse[]>([]);
const loading = ref(true);
const expandedComments = ref(new Set<number>());
const rateModal = ref();
const ratingItem = ref<ListAnimeResponse | null>(null);

const myRating = computed(() => ratings.value.find(r => r.user_id === myUserId.value) ?? null);
const othersRatings = computed(() => ratings.value.filter(r => r.user_id !== myUserId.value));
const myRatingPayload = computed(() =>
  myRating.value ? { score: myRating.value.score, comment: myRating.value.comment ?? null } : null,
);

// ── Score helpers ────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score <= 3) return '#E76F6F';
  if (score <= 5) return '#FF9E9E';
  if (score <= 7) return '#A7B8D9';
  if (score <= 9) return '#66BB6A';
  return '#FFD54F';
}

function scoreLabel(score: number): string {
  if (score <= 2) return 'Ужасно';
  if (score <= 4) return 'Плохо';
  if (score <= 6) return 'Средне';
  if (score <= 8) return 'Хорошо';
  if (score === 9) return 'Отлично';
  return 'Шедевр';
}

function ratingsWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'оценка';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'оценки';
  return 'оценок';
}

// ── Relative date ────────────────────────────────────────────────────────────
function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед. назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ── Expand comments ──────────────────────────────────────────────────────────
function toggleExpand(userId: number) {
  if (expandedComments.value.has(userId)) {
    expandedComments.value.delete(userId);
  } else {
    expandedComments.value.add(userId);
  }
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function load() {
  const { data } = await listsApi.getAnimeList(listId);
  const item = data.find((a: ListAnimeResponse) => a.anime_id === animeId);
  animeItem.value = item ?? null;
  ratings.value = item?.ratings ?? [];
}

async function init() {
  loading.value = true;
  try { await load(); }
  finally { loading.value = false; }
}

init();

async function refresh(ev: RefresherCustomEvent) {
  await load();
  ev.detail.complete();
}

// ── Rating modal ─────────────────────────────────────────────────────────────
function openRating() {
  if (!animeItem.value) return;
  ratingItem.value = animeItem.value;
  rateModal.value?.$el.present();
}

async function onRatingSaved() {
  rateModal.value?.$el.dismiss();
  await load();
}
</script>

<style scoped>
ion-header ion-toolbar { --background: #1E1E1E; --border-width: 0; }
.ratings-content { --background: #1E1E1E; }

/* ── Skeleton ────────────────────────────────────────────────────────────── */
.skeleton-wrap { padding: 16px; }

.hero-skeleton {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.card-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.hero {
  display: flex;
  gap: 14px;
  padding: 16px 16px 12px;
}

.hero-poster {
  width: 80px;
  height: 112px;
  border-radius: 10px;
  object-fit: cover;
  background: #2D2D3A;
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hero-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 10px;
}

.hero-avg {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.hero-avg-num {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.hero-avg-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── Section title ───────────────────────────────────────────────────────── */
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px;
}

/* ── My rating section ───────────────────────────────────────────────────── */
.my-rating-section {
  padding: 8px 16px 0;
}

.my-rating-card {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 14px 16px;
  border-left: 3px solid;
  border-image: linear-gradient(180deg, #A7B8D9, #FF9E9E) 1;
}

.my-rating-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.my-rating-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.my-rating-label {
  font-size: 15px;
  font-weight: 700;
}

.my-rating-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.my-rating-comment {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  margin: 10px 0 0;
  line-height: 1.4;
}

.edit-btn {
  background: rgba(167, 184, 217, 0.15);
  color: #A7B8D9;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  min-height: 34px;
}

.edit-btn:active {
  background: rgba(167, 184, 217, 0.25);
}

/* ── My rating empty ─────────────────────────────────────────────────────── */
.my-rating-empty {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.my-rating-empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
}

/* ── Rate CTA ────────────────────────────────────────────────────────────── */
.rate-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.rate-cta:active { opacity: 0.85; }

.rate-cta ion-icon { font-size: 18px; }

/* ── Others section ──────────────────────────────────────────────────────── */
.others-section {
  padding: 18px 16px 0;
}

/* ── Rating card ─────────────────────────────────────────────────────────── */
.rating-card {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.rating-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar--placeholder {
  background: #697289;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.rating-card-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rating-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rating-card-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

/* ── Score badge ─────────────────────────────────────────────────────────── */
.score-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  flex-shrink: 0;
}

/* ── Comment ─────────────────────────────────────────────────────────────── */
.rating-card-comment-wrap {
  margin-top: 10px;
}

.rating-card-comment {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  line-height: 1.45;
}

.rating-card-comment--clamped {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.expand-btn {
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 500;
  color: #A7B8D9;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 52px;
  color: #697289;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #FBF9F6;
  margin: 0;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 8px;
}
</style>
