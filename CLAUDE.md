# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Spark is a Twitter/X clone built with **Laravel 12** (backend) + **React 19 + Inertia.js** (frontend), running in Docker. Real-time features use **Laravel Reverb** (WebSockets) with Laravel Echo on the frontend.

## Development Commands

All dev commands run inside Docker via `make` or `docker compose`:

```bash
make up          # Start all containers (nginx, php-fpm, mysql, redis, node)
make down        # Stop containers
make dev         # Run Vite dev server (node container, port 5173)
make php         # Shell into the PHP container
make mysql       # Shell into the MySQL container
make pint        # Run Laravel Pint (PHP code formatter)
make dump        # Run php artisan dump
```

Alternatively, run everything at once (outside Docker) via Composer:
```bash
composer run dev  # Starts Laravel server + queue + pail logs + Vite concurrently
```

Frontend-only:
```bash
npm run dev       # Vite dev server
npm run build     # Production build
npm run lint      # ESLint with auto-fix
npm run format    # Prettier on resources/
```

PHP tests:
```bash
php artisan test                        # Run all tests
php artisan test --filter TestClassName # Run a single test
```

## Architecture

### Backend (`app/`)

- **`app/Http/Controllers/`** — Domain controllers: `PostController`, `CommentController`, `LikeController`, `RepostController`, `FavoriteController`, `FollowController`, `NotificationController`, `ChatController`, `GroupChatController`, `SearchController`, `HashtagController`, `PollController`, `UserProfileController`, `UserContentController`, `UserSocialController`. Auth handled by `Auth/` subdir (includes `GoogleAuthController` for OAuth via Laravel Socialite).
- **`app/Models/`** — Eloquent models: `User`, `Post`, `Comment`, `Like`, `Repost`, `Favorite`, `Follow`, `Notification`, `Chat`, `Message`, `GroupChat`, `Hashtag`, `Media`, `Poll`, `PollOption`, `PollVote`.
- **`app/Services/`** — `MediaService` (S3/file uploads via `league/flysystem-aws-s3-v3`), `NotificationService`.
- **`app/Events/`** — Broadcast events for real-time: `GotMessage`, `GotPersonalMessage`, `GotGroupMessage`, `NotificationCreated`, `NotificationIsReadChange`, `UserMessageCreated`, `UserMessageIsReadChange`, `PostCreated`, `PostEngagementChanged`, `FollowChanged`, `MessagesRead`, `UserTyping`.
- **`app/Jobs/`** — `SendMessage`, `SendPersonalMessage` (queued via Redis).
- **`app/Helpers/`** — `StorageHelper`, `PostHelper` (autoloaded utilities).

All routes are in `routes/web.php` (Inertia-based, no separate API routes file). Protected routes use `auth` + `verified` middleware.

### Frontend (`resources/js/`)

Uses **Inertia.js** — no API fetching, pages receive props directly from Laravel controllers.

- **`pages/`** — Inertia page components organized by domain:
  - `post/` — feed, show, edit, like button, hashtag pages
  - `user/` — profile, edit, followers, following, friends, notifications, favorites, liked, reposts
  - `chat/` — everyone chat, user-to-user chat, group chat, chat list
  - `search.jsx` — multi-tab search (posts, users, hashtags)
  - `dashboard.jsx`, `user-dashboard.jsx`, `welcome.jsx`
- **`components/`** — Shared UI: `app-shell.jsx`, `app-sidebar.jsx`, `app-header.jsx`, `nav-main.jsx`, `mobile-nav.jsx`, `notification.jsx`, `comment.jsx`, `message.jsx`, `linkified-content.jsx`, `error-boundary.jsx`, `ui/` (shadcn/Radix primitives)
- **`contexts/`** — React context providers (`UnreadCountsContext` for real-time badge counts)
- **`hooks/`** — Custom React hooks (`usePostActions`, `useInfiniteScroll`, `usePullToRefresh`, `useOnlineUsers`, `useDropdown`)
- **`layouts/`** — Page layout wrappers
- **`echo.js`** — Laravel Echo + Pusher-js setup for WebSocket subscriptions

### Real-time

Laravel Reverb handles WebSockets. Events are broadcast from the server, consumed via `echo.js` on the client. Chat and notifications update in real-time through this channel.

### Infrastructure

Docker services: `web` (nginx, `spark.localhost`), `php` (php-fpm, port 8080), `mysql` (port 2345), `redis`, `node` (Vite, port 5173). Uses an external `nginx-proxy` network for local domain routing.

Media files are stored via AWS S3 (configured in `.env`).
