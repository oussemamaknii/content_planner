# ContentPlanner (Nuxt 3 / SaaS de planification de contenu)

SaaS pour planifier, rédiger (assisté IA), stocker des médias, publier via API et suivre la performance.

## Objectif
- Planifier et collaborer sur un calendrier éditorial multi‑workspaces (RBAC)
- Rédaction assistée IA et gestion des brouillons
- Bibliothèque médias (S3/R2) et publication e2e (social APIs)
- Analytics avec cache Redis et observabilité

## Stack
- Nuxt 3 (SSR/ISR), Nitro routes
- Pinia, TailwindCSS
- Prisma/PostgreSQL
- Redis (cache/queues, BullMQ)
- Stripe (billing), S3/R2 (stockage)
- Auth.js (OAuth + email), Zod
- Tests: Vitest/Playwright
- CI/CD: GitHub Actions, hébergement Vercel

## Architecture rapide
- Frontend: Nuxt 3 SSR + `routeRules` (ISR), Pinia, composants découplés
- Backend: `/server/api/**` avec Nitro, Prisma pour DB, Redis + worker BullMQ
- Sécurité: headers stricts, validation Zod, CSRF (formulaires), rate‑limit, permissions par `workspaceId`
- Perf/SEO: ISR ciblé, `nuxt-image`, prefetch/HTTP hints, `@nuxtjs/sitemap`, robots

## Roadmap (phases)
1) Setup project foundation (Nuxt 3, deps, dev env)
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

## Notes de dev
- Modules: `@pinia/nuxt`, `@nuxtjs/tailwindcss` activés
- CSS: `assets/css/tailwind.css` avec Tailwind
- Page d’accueil temporaire: `pages/index.vue`
