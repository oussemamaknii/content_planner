# ContentPlanner (Nuxt 4 / SaaS de planification de contenu)

SaaS pour planifier, rédiger (assisté IA), stocker des médias, publier via API et suivre la performance.

## Objectif
- Planifier et collaborer sur un calendrier éditorial multi‑workspaces (RBAC)
- Rédaction assistée IA et gestion des brouillons
- Bibliothèque médias (S3/R2) et publication e2e (social APIs)
- Analytics avec cache Redis et observabilité

## Stack
- Nuxt 4 (SSR/ISR), Nitro routes
- Pinia, TailwindCSS
- Prisma/PostgreSQL
- Redis (cache/queues, BullMQ)
- Stripe (billing), S3/R2 (stockage)
- Auth.js (OAuth + email), Zod
- Tests: Vitest/Playwright
- CI/CD: GitHub Actions, hébergement Vercel

## Architecture rapide
- Frontend: Nuxt 4 SSR + `routeRules` (ISR), Pinia, composants découplés
- Backend: `/server/api/**` avec Nitro, Prisma pour DB, Redis + worker BullMQ
- Sécurité: headers stricts, validation Zod, CSRF (formulaires), rate‑limit, permissions par `workspaceId`
- Perf/SEO: ISR ciblé, `nuxt-image`, prefetch/HTTP hints, `@nuxtjs/sitemap`, robots

## Roadmap (phases)
1) Setup project foundation (Nuxt 4, deps, dev env)
2) Database schema & Prisma (PostgreSQL)
3) Auth.js (OAuth + email) + sessions
4) Workspaces & RBAC
5) Contenu: création/édition/planification
6) Media library (S3/R2)
7) Calendrier collaboratif
8) Social APIs (publishing e2e)
9) Analytics + Redis cache
10) Stripe (abonnements + webhooks)
11) AI writing assistant
12) Tests + CI/CD

## Démarrage rapide
```bash
npm install
npm run dev
# Build prod
npm run build && npm run preview
```

## Configuration (.env)

Base:
```env
DATABASE_URL=postgresql://USER:PASS@localhost:5432/content_planner?schema=public
NEXTAUTH_SECRET=change_me
NEXTAUTH_URL=http://localhost:3000

# Supabase Storage
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=media
NUXT_PUBLIC_SUPABASE_URL=...
NUXT_PUBLIC_SUPABASE_ANON_KEY=...

# Redis (BullMQ)
REDIS_URL=redis://127.0.0.1:6379

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/oauth/linkedin/callback
# Scopes minimaux pour sign-in, ajouter w_member_social pour publier
LINKEDIN_SCOPE=openid profile email

# SMTP (invitation email, optionnel)
EMAIL_SERVER=smtp://USER:PASS@smtp.example.com:587
EMAIL_FROM=ContentPlanner <no-reply@example.com>
```

## Services requis

- PostgreSQL (Prisma): `DATABASE_URL`
- Redis (queues BullMQ): démarrer un Redis local ou via docker:
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

## Publication LinkedIn (dev)

1. Dans LinkedIn Developers, crée une app et active:
   - Sign In with LinkedIn using OpenID Connect
   - Share on LinkedIn (pour publier)
2. Ajoute les redirect URIs: `http://localhost:3000/api/oauth/linkedin/callback`
3. Renseigne `.env` (ID, secret, scope). Pour publier: `LINKEDIN_SCOPE=openid profile email w_member_social`.
4. Connecte le compte dans `Settings → Channels` puis utilise "Publish now" dans l’éditeur de contenu.

## Queues BullMQ

- Un worker consomme la queue `publish`. Configure `REDIS_URL`.
- Enqueue d’un schedule: `POST /api/schedules/:id/enqueue` (delay auto jusqu’à `scheduledFor`, retries/backoff).

## Invitations par email

- Crée un membre: `POST /api/workspaces/:id/members` (user existant), sinon une invitation est créée via `POST /api/workspaces/:id/invitations` et un email est envoyé si `EMAIL_SERVER` est configuré.


## Notes de dev
- Modules: `@pinia/nuxt`, `@nuxtjs/tailwindcss` activés
- CSS: `assets/css/tailwind.css` avec Tailwind
- Page d’accueil temporaire: `pages/index.vue`
