# Spark Project Memory

## Project
Twitter/X clone: Laravel 12 + React 19 + Inertia.js + Laravel Reverb (WebSockets). Docker-based dev. Bilingual (EN/UA).

## Key Files
- `app/Helpers/PostHelper.php` — `formatPostForFrontend()` and `postBaseQuery()` used by all controllers
- `app/Helpers/StorageHelper.php` — storage utilities
- `app/Http/Middleware/HandleInertiaRequests.php` — passes `translations` (from `lang/*/common.php`) to all pages
- `lang/en/common.php`, `lang/ua/common.php`, `lang/de/common.php` — all UI strings, ~312 keys each
- `resources/js/layouts/app/app-sidebar-layout.jsx` — main layout with sidebar + mobile nav + Toaster

## Implementation Status
Clusters 1-8 from IMPLEMENTATION_PLAN.md are complete (as of 2026-03-08):
- Posts, comments, likes, reposts, favorites, follows, notifications, chat
- Search, hashtags, trending
- Profile enhancements: pinned posts, polls, badges
- Mobile: bottom nav, pull-to-refresh, swipe actions on notifications
- Group chats (basic)
- Quote posts

## Patterns & Conventions
- All eager-loading must include `poll.options`, `poll.votes` (added in cluster 7)
- Translations: add keys to BOTH `lang/en/common.php` and `lang/ua/common.php`
- Frontend toasts use `toast.success(translations['...'])` from sonner — keys must exist in lang files
- File uploads use `forceFormData: true` in Inertia router.post
- Docker commands: `docker compose exec php php artisan migrate` for migrations
- Use relative paths for shell commands (not absolute `/home/...` which fails sometimes)

## User Preferences
- Communicates in English
- App supports Ukrainian (UA) locale
- Prefers concise responses
