# Anirate — Мобильное приложение (Ionic + Vue 3 + TypeScript)

## Контекст проекта

- **Стек:** Ionic 8, Vue 3, TypeScript, Composition API, Pinia, Vue Router, Axios, Capacitor
- **Платформы:** iOS + Android (Capacitor)
- **Google Auth:** `@codetrix-studio/capacitor-google-auth`
- **Хранение токенов:** `@capacitor/preferences`
- **Бэкенд:** openapi.json в корне репозитория
- **Дизайн:** Figma файл `YIJvxiL1pPstIu6G2RzLiC` (токен в `.env`)
- **Базовый URL API:** задать в `src/api/axios.ts`

## Соглашения

- Коммит после каждой выполненной задачи
- Один файл = один экран во `src/views/`
- Переиспользуемые компоненты → `src/components/`
- API клиенты → `src/api/` (по одному файлу на ресурс)
- Pinia stores → `src/stores/`
- TypeScript типы → `src/types/`
- Vue composables → `src/composables/`

---

## Фаза 1 — Инициализация проекта

- [x] **1.1** `ionic create anirate --type vue` в текущей папке, выбрать tabs template
- [x] **1.2** Установить зависимости: `axios`, `pinia`, `@codetrix-studio/capacitor-google-auth`, `@capacitor/preferences`
- [x] **1.3** Добавить платформы: `npx cap add ios`, `npx cap add android`
- [x] **1.4** Настроить `capacitor.config.ts` (appId: `com.anirate.app`, appName: `Anirate`)
- [x] **1.5** Создать структуру папок: `src/api`, `src/stores`, `src/types`, `src/composables`

## Фаза 2 — API + Auth Layer

- [x] **2.1** Создать TypeScript типы `src/types/index.ts` на основе `openapi.json`
- [x] **2.2** Создать Axios instance `src/api/axios.ts` с baseURL и Bearer interceptor
- [x] **2.3** Добавить interceptor для автообновления токена (refresh + retry 401)
- [x] **2.4** Создать `src/stores/auth.ts` (Pinia): login, logout, хранение токенов, me()
- [x] **2.5** Создать `src/api/auth.ts` — googleAuth, refresh, me, logout
- [x] **2.6** Создать `src/api/anime.ts` — getAll, getById, search, suggest, stats
- [x] **2.7** Создать `src/api/tracking.ts` — add, update, remove, getMyTracking, getMyStats, getUserTracking
- [x] **2.8** Создать `src/api/friends.ts` — request, incoming, accept, decline, list, remove
- [x] **2.9** Создать `src/api/lists.ts` — все CRUD операции + members + anime + ratings

## Фаза 3 — Auth Flow

- [x] **3.1** Экран **Загрузка** (`SplashView.vue`) — лого, проверка токена → редирект
- [x] **3.2** Экран **Онбординг** (`OnboardingView.vue`) — слайды Swiper с презентацией
- [x] **3.3** Экран **Вход** (`LoginView.vue`) — кнопка Google Sign In через Capacitor Google Auth
- [x] **3.4** Экран **Первичная настройка** (`SetupView.vue`) — имя, фото, публичность профиля
- [x] **3.5** Navigation guards в `src/router/index.ts` — защита роутов по токену

## Фаза 4 — Поиск аниме

- [x] **4.1** Экран **Поиск** (`SearchView.vue`) — поле поиска, автодополнение, сетка результатов
- [x] **4.2** Компонент `AnimeCard.vue` — постер, название, сезон/год
- [x] **4.3** Sheet-модал **Фильтры** (`SearchFiltersModal.vue`) — год, сезон, применить
- [x] **4.4** Состояние «Не найдено» в SearchView

## Фаза 5 — Экран аниме

- [x] **5.1** Экран **Аниме** (`AnimeView.vue`) — постер, название, кнопки трекинга
- [x] **5.2** Sheet **Трекинг** (`TrackingSheet.vue`) — статус planned/watching/completed, оценка 1–10
- [x] **5.3** Блок **В списках у друзей** на странице аниме

## Фаза 6 — Мои аниме

- [x] **6.1** Экран **Мои аниме** (`MyAnimeView.vue`) — сегменты: Все / В планах / Смотрю / Просмотрено
- [x] **6.2** Быстрые действия на карточке — изменить статус, удалить трекинг
- [x] **6.3** Pull-to-refresh и бесконечный скролл (pagination)

## Фаза 7 — Друзья

- [x] **7.1** Экран **Друзья** (`FriendsView.vue`) — список + пустое состояние
- [x] **7.2** Экран **Поиск друзей** (`FriendSearchView.vue`) — поиск по имени, отправка заявки
- [x] **7.3** Экран **Входящие заявки** (`FriendRequestsView.vue`) — принять / отклонить
- [x] **7.4** Экран **Отправленные заявки** (`FriendSentView.vue`)
- [x] **7.5** Экран **Профиль друга** (`UserView.vue`) — открытый (с трекингом) и закрытый

## Фаза 8 — Профиль и настройки

- [x] **8.1** Экран **Мой профиль** (`ProfileView.vue`) — аватар, имя, статистика
- [x] **8.2** Экран **Настройки** (`SettingsView.vue`) — имя, фото, публичность, выход

## Фаза 9 — Совместные списки

- [x] **9.1** Экран **Мои списки** (`ListsView.vue`) — список всех совместных списков
- [x] **9.2** Экран **Создать список** — встроенный модал в ListsView (название, описание)
- [x] **9.3** Экран **Совместный список** (`ListDetailView.vue`) — аниме с оценками участников
- [x] **9.4** Экран **Участники** (`ListMembersView.vue`) — профили + кик для владельца
- [x] **9.5** Sheet **Добавить аниме в список** (`AddAnimeSheet.vue`) — поиск + добавление
- [x] **9.6** Sheet **Оценить аниме** (`RateAnimeSheet.vue`) — оценка + комментарий
- [x] **9.7** Инвайт-код — скопировать в буфер, перегенерировать (через @capacitor/clipboard)

## Фаза 10 — Полировка

- [ ] **10.1** Тёмная / светлая тема — Ionic CSS переменные + переключатель в настройках
- [ ] **10.2** Глобальный toast-сервис для ошибок и успешных действий
- [ ] **10.3** Skeleton-загрузки (`IonSkeletonText`) вместо спиннеров
- [ ] **10.4** Pull-to-refresh на всех списках (где не добавлено в фазах выше)
- [ ] **10.5** Бесконечный скролл на поиске (где не добавлено выше)
- [ ] **10.6** Обработка офлайн-состояния

---

## Прогресс

| Фаза | Статус |
|------|--------|
| 1 — Инициализация | ✅ Выполнена |
| 2 — API Layer | ✅ Выполнена |
| 3 — Auth Flow | ✅ Выполнена |
| 4 — Поиск | ✅ Выполнена |
| 5 — Экран аниме | ✅ Выполнена |
| 6 — Мои аниме | ✅ Выполнена |
| 7 — Друзья | ✅ Выполнена |
| 8 — Профиль | ✅ Выполнена |
| 9 — Совместные списки | ✅ Выполнена |
| 10 — Полировка | ⬜ Не начата |
