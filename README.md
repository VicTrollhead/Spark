<p align="center">
  <img src="public/spark-light.svg" alt="Spark" width="80" />
</p>

<h1 align="center">Spark</h1>

<p align="center">
  A full-featured social media platform inspired by Twitter/X — built with Laravel 12, React 19, and real-time WebSockets.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Inertia.js-2-6C47FF?style=flat-square" alt="Inertia.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## Overview

Spark is a Twitter/X-style social network that goes beyond a simple clone. It supports posts with media, polls, and hashtags; threaded comments; real-time chat (public, direct, and group); a full notification system; user discovery and search; and more — all wrapped in a responsive, mobile-friendly UI with dark mode and i18n support.

## Features

### Posts & Content
- **Rich posts** — text, images, videos, hashtags, and mentions
- **Polls** — create polls with multiple options, expiration times, and live vote counts
- **Quote posts** — share posts with your own commentary
- **Threads** — reply chains and conversation views
- **Media uploads** — multi-file attachments (S3 or local storage)
- **Post management** — edit, delete, pin to profile

### Social
- **Follow system** — follow/unfollow, follow requests for private accounts
- **Engagement** — like, repost, and favorite (bookmark) posts
- **Comments** — threaded replies with likes and sorting options
- **User profiles** — bio, location, website, cover images, achievement badges
- **User discovery** — browse users with multiple sorting options (popular, mutual, recent)

### Messaging
- **Direct messages** — private 1-on-1 chats with media support
- **Group chats** — create groups, add members, share media
- **Public chat** — community-wide chatroom
- **Real-time delivery** — typing indicators, read receipts, live message updates

### Notifications
- Real-time notifications for likes, comments, replies, follows, mentions, reposts, favorites, and messages
- Auto mark-as-read on navigation
- Filter and sort (unread, read, latest, oldest)

### Search & Discovery
- Full-text search across posts, users, and hashtags
- Trending hashtags (7-day window)
- Popular hashtags leaderboard
- Multi-tab search results

### User Experience
- **Dark/light theme** with system preference detection
- **Internationalization** — English, Ukrainian, and German
- **Mobile-first responsive design** with bottom navigation
- **Pull-to-refresh** and infinite scroll
- **Optimistic UI** — instant feedback on interactions
- **Achievement badges** — earned automatically (First Post, Rising Star, Influencer, etc.)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Laravel 12, PHP 8.2+ |
| **Frontend** | React 19, Inertia.js 2, Tailwind CSS 4 |
| **UI Components** | Radix UI / shadcn, Lucide Icons, Framer Motion |
| **Real-time** | Laravel Reverb (WebSockets), Laravel Echo |
| **Database** | MySQL 8 |
| **Cache & Queue** | Redis |
| **File Storage** | AWS S3 (configurable, local fallback) |
| **Auth** | Laravel Fortify + Google OAuth (Socialite) |
| **Dev Environment** | Docker Compose (Nginx, PHP-FPM, MySQL, Redis, Node) |
| **Testing** | PHPUnit (backend), Vitest (frontend) |

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Make](https://www.gnu.org/software/make/) (optional, for shortcut commands)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/VicTrollhead/Spark.git
cd Spark

# Copy environment file and configure
cp .env.example .env

# Start all services
make up

# Install dependencies (inside containers)
docker compose exec php composer install
docker compose exec node npm install

# Generate application key
docker compose exec php php artisan key:generate

# Run migrations and seed the database
docker compose exec php php artisan migrate --seed

# Start the Vite dev server
make dev
```

The app will be available at **http://spark.localhost** (requires the `nginx-proxy` Docker network — see [Infrastructure](#infrastructure) below).

### Environment Configuration

Key `.env` variables to configure:

```env
# Database (matches docker-compose.yml)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=spark
DB_USERNAME=spark
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis

# File storage (s3 or local)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=

# WebSockets (Laravel Reverb)
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

### Without Docker

```bash
# Install dependencies
composer install
npm install

# Configure .env for your local MySQL/Redis

# Run everything at once (server + queue + logs + Vite)
composer run dev
```

## Development

### Useful Commands

```bash
make up           # Start all Docker containers
make down         # Stop containers
make dev          # Run Vite dev server (hot reload)
make php          # Shell into PHP container
make mysql        # Shell into MySQL container
make pint         # Run Laravel Pint (PHP formatter)
```

### Testing

```bash
# Backend tests (PHPUnit)
docker compose exec php php artisan test

# Run a specific test
docker compose exec php php artisan test --filter PostControllerTest

# Frontend tests (Vitest)
docker compose exec node npm test
```

### Code Quality

```bash
# PHP formatting
make pint

# JavaScript linting & formatting
npm run lint
npm run format
```

## Architecture

```
app/
├── Events/          # Broadcast events (real-time WebSocket)
├── Helpers/         # Post & storage helpers
├── Http/
│   ├── Controllers/ # Domain controllers (Post, User, Chat, etc.)
│   └── Requests/    # Form validation
├── Jobs/            # Queued jobs (message sending)
├── Models/          # Eloquent models
├── Policies/        # Authorization policies
└── Services/        # Media uploads, notifications

resources/js/
├── components/      # Shared UI components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── layouts/         # Page layout wrappers
├── lib/             # Utilities
└── pages/           # Inertia page components
    ├── chat/        # Public, direct, and group chat
    ├── post/        # Feed, detail, edit, hashtags
    ├── settings/    # Profile, password, appearance, language
    └── user/        # Profiles, social lists, notifications
```

Spark uses **Inertia.js** — there are no separate API routes. Controllers return Inertia responses and pages receive data as props. Real-time features are powered by **Laravel Reverb** broadcasting events through WebSocket channels, consumed on the frontend via **Laravel Echo**.

## Infrastructure

Docker Compose provides the full stack:

| Service | Role | Port |
|---------|------|------|
| **web** | Nginx reverse proxy | 80 (via nginx-proxy) |
| **php** | PHP-FPM application | 8080 |
| **mysql** | Database | 2345 → 3306 |
| **redis** | Cache, queue, sessions | 6379 |
| **node** | Vite dev server | 5173 |
| **db-backup** | On-demand MySQL backups | — |

> **Note:** The `web` service expects an external Docker network called `nginx-proxy` for local domain routing. Create it with:
> ```bash
> docker network create nginx-proxy
> ```

## License

This project is open-source under the [MIT License](LICENSE).

## Contact

**Tymur Shapovalov** — [shapovalovtimur16@gmail.com](mailto:shapovalovtimur16@gmail.com)
