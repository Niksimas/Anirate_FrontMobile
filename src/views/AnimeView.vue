<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/search" text="Назад" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding">
        <ion-skeleton-text animated style="height:260px;border-radius:16px;margin-bottom:16px;" />
        <ion-skeleton-text animated style="height:24px;width:70%;margin:0 auto 8px;" />
        <ion-skeleton-text animated style="height:16px;width:40%;margin:0 auto;" />
      </div>

      <template v-else-if="anime">
        <!-- Poster centered -->
        <div class="poster-wrap">
          <img :src="fixUrl(anime.image_url)" :alt="anime.title" class="poster-img" />
        </div>

        <!-- Title + year -->
        <div class="anime-info">
          <h1 class="anime-title">{{ anime.title }}</h1>
          <p class="anime-year">{{ [formatAnimeType(anime.anime_type), anime.year].filter(Boolean).join(' · ') }}</p>
        </div>

        <!-- Actions (moved up for visibility) -->
        <div ref="actionsRef" class="actions-group">
          <!-- Add to list button -->
          <div class="actions-section">
            <ion-button expand="block" class="add-btn" @click="openListPicker">
              Добавить в список
              <ion-icon slot="end" :icon="addOutline" />
            </ion-button>
          </div>

          <!-- Status buttons -->
          <div class="status-row">
            <button
              class="status-btn"
              :class="{ 'status-btn--active-white': tracking?.status === 'planned' }"
              @click="setStatus('planned')"
            >В планах</button>
            <button
              class="status-btn"
              :class="{ 'status-btn--active-white': tracking?.status === 'watching' }"
              @click="setStatus('watching')"
            >Смотрю</button>
            <button
              class="status-btn"
              :class="{ 'status-btn--active-salmon': tracking?.status === 'completed' }"
              @click="setStatus('completed')"
            >Просмотрено</button>
          </div>

          <!-- My rating (only when tracked) -->
          <div v-if="tracking" class="rating-section">
            <h3 class="rating-label">Моя оценка</h3>
            <div class="rating-dots">
              <button
                v-for="n in 10"
                :key="n"
                class="rating-dot"
                :class="{ active: tracking.score != null && n <= tracking.score }"
                @click="setScore(n)"
              >{{ n }}</button>
            </div>
          </div>
        </div>

        <!-- Genres -->
        <div v-if="anime.genres?.length" class="genre-wrap">
          <button
            v-for="g in visibleGenres"
            :key="g.id"
            class="genre-chip genre-chip--tappable"
            @click="router.push({ path: '/tabs/search', query: { genre_id: g.id } })"
          >{{ g.title }}</button>
          <button
            v-if="!genresExpanded && hiddenGenreCount > 0"
            class="genre-chip genre-chip--more"
            @click="genresExpanded = true"
          >ещё +{{ hiddenGenreCount }}</button>
          <button
            v-if="genresExpanded && hiddenGenreCount > 0"
            class="genre-chip genre-chip--more"
            @click="genresExpanded = false"
          >свернуть</button>
        </div>

        <!-- 3 stat cards -->
        <div class="stat-cards">
          <div class="stat-card">
            <span class="stat-card-label">Оценка<br>друзей</span>
            <span v-if="friendsAvgScore !== null" class="stat-card-value stat-card-value--gradient">
              {{ friendsAvgScore }}
            </span>
            <span v-else class="stat-card-value stat-card-value--muted">—</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-label">Оценка<br>пользователей</span>
            <span v-if="usersAvgScore !== null" class="stat-card-value stat-card-value--gradient">
              {{ usersAvgScore }}
            </span>
            <span v-else class="stat-card-value stat-card-value--muted">—</span>
          </div>
          <div class="stat-card stat-card--tappable" @click="friendsCount > 0 && friendsSheet?.$el.present()">
            <span class="stat-card-label">У друзей<br>в трекинге</span>
            <span v-if="friendsCount > 0" class="stat-card-value stat-card-value--gradient">
              {{ friendsCount }}
            </span>
            <span v-else class="stat-card-value stat-card-value--muted">—</span>
            <div v-if="friendsTracking.length" class="friends-avatars">
              <div
                v-for="(f, i) in friendsTracking.slice(0, 3)"
                :key="f.user_id"
                class="friends-avatar"
                :style="{ left: `${i * 14}px`, zIndex: 3 - i }"
              >
                <img v-if="f.picture" :src="fixUrl(f.picture)" />
                <ion-icon v-else :icon="personOutline" />
              </div>
            </div>
          </div>
        </div>

        <div style="height: 32px;" />
      </template>
    </ion-content>

    <!-- Scroll-aware sticky status bar -->
    <transition name="sticky-fade">
      <div v-if="showStickyBar" class="sticky-bar">
        <button
          class="sticky-btn"
          :class="{ 'sticky-btn--active-white': tracking?.status === 'planned' }"
          @click="setStatus('planned')"
        >В планах</button>
        <button
          class="sticky-btn"
          :class="{ 'sticky-btn--active-white': tracking?.status === 'watching' }"
          @click="setStatus('watching')"
        >Смотрю</button>
        <button
          class="sticky-btn"
          :class="{ 'sticky-btn--active-salmon': tracking?.status === 'completed' }"
          @click="setStatus('completed')"
        >Просмотрено</button>
      </div>
    </transition>

    <!-- List picker modal -->
    <ion-modal ref="listPickerModal" :initial-breakpoint="0.55" :breakpoints="[0, 0.55, 0.8]" @did-dismiss="onPickerDismiss">
      <div class="lp-sheet">
        <div class="lp-handle-row"><div class="lp-handle" /></div>
        <h2 class="lp-title">Добавить в список</h2>

        <div v-if="listsLoading" class="lp-loading">
          <ion-skeleton-text v-for="i in 3" :key="i" animated style="height:52px;border-radius:12px;margin-bottom:10px;--background:#383848;" />
        </div>

        <div v-else-if="!myLists.length" class="lp-empty">
          <ion-icon :icon="albumsOutline" class="lp-empty-icon" />
          <p class="lp-empty-text">У тебя пока нет списков</p>
          <button class="lp-create-btn" @click="showCreateInPicker = true">
            Создать список
          </button>
        </div>

        <div v-else class="lp-list">
          <!-- Create new list inline -->
          <button class="lp-item lp-item--create" @click="showCreateInPicker = true">
            <ion-icon :icon="addOutline" class="lp-create-icon" />
            <span class="lp-item-name">Создать новый список</span>
          </button>
          <button
            v-for="list in myLists"
            :key="list.id"
            class="lp-item"
            :class="{ 'lp-item--selected': selectedLists.has(list.id) }"
            @click="toggleList(list.id)"
          >
            <span class="lp-item-name">{{ list.name }}</span>
            <span class="lp-item-check">
              <ion-icon v-if="selectedLists.has(list.id)" :icon="checkmarkCircle" class="lp-check-on" />
              <span v-else class="lp-check-off" />
            </span>
          </button>
        </div>

        <div v-if="myLists.length && !listsLoading" class="lp-actions">
          <button
            class="lp-add-btn"
            :disabled="!selectedLists.size || adding"
            @click="addSelectedToLists"
          >
            {{ adding ? 'Добавляю...' : `Добавить${selectedLists.size ? ` (${selectedLists.size})` : ''}` }}
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- Create list modal (inline in picker) -->
    <ion-modal :is-open="showCreateInPicker" :initial-breakpoint="0.5" :breakpoints="[0, 0.5]" @did-dismiss="showCreateInPicker = false">
      <CreateListSheet
        @close="showCreateInPicker = false"
        @created="onListCreatedInPicker"
      />
    </ion-modal>

    <!-- Friends tracking sheet -->
    <ion-modal ref="friendsSheet" :initial-breakpoint="0.45" :breakpoints="[0, 0.45, 0.8]">
      <div class="fs-sheet">
        <div class="fs-handle-row"><div class="fs-handle" /></div>
        <p class="fs-title">У друзей в трекинге</p>

        <div v-if="!friendsTracking.length" class="fs-empty">
          <p>Ни один из друзей пока не добавил это аниме</p>
        </div>

        <div v-else class="fs-list">
          <div
            v-for="f in friendsTracking"
            :key="f.user_id"
            class="fs-row"
            @click="router.push(`/users/${f.user_id}`); friendsSheet?.$el.dismiss()"
          >
            <img v-if="f.picture" :src="fixUrl(f.picture)" class="fs-avatar" />
            <div v-else class="fs-avatar fs-avatar--placeholder">{{ (f.full_name ?? '?')[0] }}</div>
            <div class="fs-info">
              <span class="fs-name">{{ f.full_name ?? `#${f.user_id}` }}</span>
              <span class="fs-status">{{ STATUS_LABELS[f.status] ?? f.status }}{{ f.score != null ? ` · ${f.score}/10` : '' }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <ion-toast :is-open="!!toastMsg" :message="toastMsg" :duration="2000" @did-dismiss="toastMsg = ''" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonSkeletonText, IonModal, IonToast, toastController,
} from '@ionic/vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addOutline, personOutline, checkmarkCircle, albumsOutline } from 'ionicons/icons';
import { fixUrl } from '@/composables/useImageUrl';
import { formatAnimeType } from '@/composables/useFormatAnimeType';
import { animeApi } from '@/api/anime';
import { trackingApi } from '@/api/tracking';
import { listsApi } from '@/api/lists';
import CreateListSheet from '@/components/CreateListSheet.vue';
import { useRouter } from 'vue-router';
import type { AnimeResponse, TrackingResponse, SharedListBrief, SharedListResponse, FriendTracking } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  planned: 'В планах',
  watching: 'Смотрю',
  completed: 'Просмотрено',
};

const route = useRoute();
const router = useRouter();
const anime = ref<AnimeResponse | null>(null);
const tracking = ref<TrackingResponse | null>(null);
const loading = ref(true);
const listPickerModal = ref();
const friendsSheet = ref();
const actionsRef = ref<HTMLElement | null>(null);
const showStickyBar = ref(false);
let observer: IntersectionObserver | null = null;
const myLists = ref<SharedListBrief[]>([]);
const listsLoading = ref(false);
const selectedLists = ref<Set<number>>(new Set());
const adding = ref(false);
const showCreateInPicker = ref(false);
const toastMsg = ref('');

// Social data
const friendsTracking = ref<FriendTracking[]>([]);
const friendsAvgScore = ref<string | null>(null);
const usersAvgScore = ref<string | null>(null);
const friendsCount = computed(() => friendsTracking.value.length);

const VISIBLE_GENRES = 5;
const genresExpanded = ref(false);
const visibleGenres = computed(() =>
  genresExpanded.value ? anime.value?.genres ?? [] : (anime.value?.genres ?? []).slice(0, VISIBLE_GENRES)
);
const hiddenGenreCount = computed(() =>
  Math.max(0, (anime.value?.genres?.length ?? 0) - VISIBLE_GENRES)
);

onMounted(async () => {
  const id = Number(route.params.id);
  try {
    const [animeRes, trackingRes, socialRes] = await Promise.allSettled([
      animeApi.getById(id),
      trackingApi.getMyTracking(),
      animeApi.getSocial(id),
    ]);
    if (animeRes.status === 'fulfilled') anime.value = animeRes.value.data;
    if (trackingRes.status === 'fulfilled') {
      const found = trackingRes.value.data.find((t) => t.anime_id === id);
      if (found) {
        tracking.value = { id: found.id, anime_id: found.anime_id, status: found.status, score: found.score, created_at: found.created_at, updated_at: found.updated_at };
      }
    }
    if (socialRes.status === 'fulfilled') {
      const social = socialRes.value.data;
      usersAvgScore.value = social.avg_score != null ? social.avg_score.toFixed(1) : null;
      friendsAvgScore.value = social.friends_avg_score != null ? social.friends_avg_score.toFixed(1) : null;
      friendsTracking.value = social.friends_tracking;
    }
  } finally {
    loading.value = false;

    // Setup IntersectionObserver for sticky bar after content renders
    setTimeout(() => {
      if (actionsRef.value) {
        observer = new IntersectionObserver(
          ([entry]) => { showStickyBar.value = !entry.isIntersecting; },
          { threshold: 0.1 }
        );
        observer.observe(actionsRef.value);
      }
    }, 100);
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

async function openListPicker() {
  selectedLists.value = new Set();
  listPickerModal.value?.$el.present();
  listsLoading.value = true;
  try {
    const { data } = await listsApi.getMyLists();
    myLists.value = data;
  } finally {
    listsLoading.value = false;
  }
}

function onPickerDismiss() {
  selectedLists.value = new Set();
  myLists.value = [];
}

function onListCreatedInPicker(data: SharedListResponse) {
  showCreateInPicker.value = false;
  myLists.value.unshift({ id: data.id, name: data.name, owner_id: data.owner_id, member_count: 1, anime_count: 0 });
  // Auto-select the new list
  selectedLists.value = new Set([data.id]);
}

function toggleList(id: number) {
  const next = new Set(selectedLists.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedLists.value = next;
}

function selectAll() {
  selectedLists.value = new Set(myLists.value.map((l) => l.id));
}

async function addSelectedToLists() {
  if (!anime.value || !selectedLists.value.size) return;
  adding.value = true;
  try {
    const results = await Promise.allSettled(
      [...selectedLists.value].map(listId =>
        listsApi.addAnime(listId, { anime_id: anime.value!.id })
      )
    );
    const added = results.filter(r => r.status === 'fulfilled').length;
    listPickerModal.value?.$el.dismiss();
    toastMsg.value = added ? `Добавлено в ${added} ${added === 1 ? 'список' : 'списков'}` : 'Уже добавлено во все выбранные списки';
  } finally {
    adding.value = false;
  }
}

async function setScore(score: number) {
  if (!anime.value || !tracking.value) return;
  const { data } = await trackingApi.update(anime.value.id, { score });
  tracking.value = data;
}

const STATUS_NAMES: Record<string, string> = {
  planned: 'В планах',
  watching: 'Смотрю',
  completed: 'Просмотрено',
};

async function setStatus(status: 'planned' | 'watching' | 'completed') {
  if (!anime.value) return;
  const oldStatus = tracking.value?.status ?? null;
  const isFirstAdd = !tracking.value;

  if (tracking.value) {
    if (tracking.value.status === status) return;
    const { data } = await trackingApi.update(anime.value.id, { status });
    tracking.value = data;
  } else {
    const { data } = await trackingApi.add({ anime_id: anime.value.id, status });
    tracking.value = data;
  }

  // Haptic
  try {
    await Haptics.impact({ style: isFirstAdd ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch { /* */ }

  // Toast with undo
  const message = isFirstAdd
    ? `Добавлено в «${STATUS_NAMES[status]}»`
    : `Перенесено в «${STATUS_NAMES[status]}»`;

  const toast = await toastController.create({
    message,
    duration: 3500,
    position: 'bottom',
    buttons: [
      {
        text: 'Отменить',
        role: 'cancel',
        handler: async () => {
          if (!anime.value) return;
          if (oldStatus) {
            const { data } = await trackingApi.update(anime.value.id, { status: oldStatus });
            tracking.value = data;
          } else {
            await trackingApi.remove(anime.value.id);
            tracking.value = null;
          }
        },
      },
    ],
  });
  await toast.present();
}
</script>

<style scoped>
ion-header ion-toolbar {
  --background: #1E1E1E;
  --border-width: 0;
}

.poster-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 40px 12px;
}

.poster-img {
  width: 100%;
  max-width: 220px;
  border-radius: 16px;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.anime-info {
  text-align: center;
  padding: 0 24px 16px;
}

.anime-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
}

.anime-year {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

/* Genres */
.genre-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px 16px;
}

.genre-chip {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-family: inherit;
  white-space: nowrap;
}

.genre-chip--tappable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, border-color 0.15s;
}

.genre-chip--tappable:active {
  background: rgba(167, 184, 217, 0.15);
  border-color: rgba(167, 184, 217, 0.3);
}

.genre-chip--more {
  background: rgba(167, 184, 217, 0.15);
  color: #A7B8D9;
  border-color: rgba(167, 184, 217, 0.3);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-weight: 600;
}

.genre-chip--more:active {
  background: rgba(167, 184, 217, 0.25);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 16px;
}

.stat-card {
  background: #2D2D3A;
  border-radius: 14px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card-label {
  font-size: 10px;
  color: rgba(255,255,255,0.5);
  line-height: 1.4;
}

.stat-card--tappable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.stat-card--tappable:active {
  background: #383848;
}

.stat-card-value {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
}

.stat-card-value--gradient {
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card-value--muted {
  color: rgba(255, 255, 255, 0.25);
}

.friends-avatars {
  position: relative;
  height: 20px;
  min-width: 50px;
  margin-top: 2px;
}

.friends-avatar {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4A4A5A;
  overflow: hidden;
  border: 2px solid #2D2D3A;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.friends-avatar img { width: 100%; height: 100%; object-fit: cover; }
.friends-avatar ion-icon { font-size: 10px; color: rgba(255,255,255,0.5); }

/* Friends sheet */
.fs-sheet {
  background: #1E1E1E;
  padding: 0 20px 20px;
  height: 100%;
  overflow-y: auto;
}

.fs-handle-row {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.fs-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.fs-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 12px 0 16px;
}

.fs-empty {
  padding: 32px 0;
  text-align: center;
}

.fs-empty p {
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  font-size: 15px;
}

.fs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #2D2D3A;
  border-radius: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.fs-row:active {
  background: #383848;
}

.fs-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.fs-avatar--placeholder {
  background: #383848;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.fs-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.fs-name {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.actions-section { padding: 0 16px 16px; }

.add-btn {
  --background: #FF9E9E;
  --background-activated: #e08a8a;
  --color: #1E1E1E;
  --border-radius: 14px;
  --box-shadow: none;
  font-weight: 600;
  height: 52px;
  margin: 0;
}

.rating-section { padding: 0 16px 16px; }

.rating-label {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 12px;
}

.rating-dots {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.rating-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #2D2D3A;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}

.rating-dot.active {
  background: #FF9E9E;
  color: #1E1E1E;
}

.status-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 32px;
}

.status-btn {
  padding: 12px 8px;
  border-radius: 12px;
  border: none;
  background: #2D2D3A;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}

.status-btn--active-white { background: #FFFFFF; color: #1E1E1E; }
.status-btn--active-salmon { background: #FF9E9E; color: #1E1E1E; }

/* List picker sheet */
.lp-sheet {
  background: #1E1E1E;
  padding: 0 20px 20px;
  height: 100%;
  overflow-y: auto;
}

.lp-handle-row {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.lp-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.lp-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 12px 0 16px;
}

.lp-loading { padding: 4px 0; }

.lp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  gap: 8px;
  text-align: center;
}

.lp-empty-icon {
  font-size: 44px;
  color: #697289;
  margin-bottom: 4px;
}

.lp-empty-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
}

.lp-create-btn {
  margin-top: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.lp-create-btn:active { opacity: 0.85; }

.lp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.lp-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  background: #2D2D3A;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.lp-item:active { background: #383848; }

.lp-item--selected {
  background: rgba(167, 184, 217, 0.12);
}

.lp-item--create {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  background: transparent;
  gap: 10px;
}

.lp-item--create:active {
  background: rgba(167, 184, 217, 0.08);
}

.lp-create-icon {
  font-size: 20px;
  color: #A7B8D9;
}

.lp-item-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
}

.lp-item-check {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lp-check-off {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.lp-check-on {
  font-size: 24px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Actions */
.lp-actions {
  padding-bottom: env(safe-area-inset-bottom, 8px);
}

.lp-add-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.lp-add-btn:active { opacity: 0.85; }
.lp-add-btn:disabled { opacity: 0.4; }

/* ── Sticky status bar ───────────────────────────────────────────────────── */
.sticky-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px);
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 100;
}

.sticky-btn {
  padding: 10px 8px;
  border-radius: 10px;
  border: none;
  background: #2D2D3A;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: center;
}

.sticky-btn--active-white { background: #FFFFFF; color: #1E1E1E; font-weight: 600; }
.sticky-btn--active-salmon { background: #FF9E9E; color: #1E1E1E; font-weight: 600; }

/* Sticky bar transition */
.sticky-fade-enter-active,
.sticky-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sticky-fade-enter-from,
.sticky-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
