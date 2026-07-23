# Avatar Institut — Platform

Plateforme e-learning bilingue (anglais / arabe) d’Avatar Institut.

## Avant toute contribution

1. Lire [`PROJECT_MEMORY.md`](./PROJECT_MEMORY.md) — mémoire centrale du projet.
2. Respecter [`.cursor/rules/avatar-institute.mdc`](./.cursor/rules/avatar-institute.mdc) — règles permanentes (Git, sécurité, identité visuelle, qualité).

## État actuel

Fondation Next.js (App Router, TypeScript strict) sur `develop/avatar-platform`.
Site statique de référence conservé dans [`legacy/index.html`](./legacy/index.html).

Supabase, Stripe, PayPal et Bunny Stream **ne sont pas connectés** à cette phase.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Qualité

```bash
npm run check
```

Équivalent : `npm run lint && npm run typecheck && npm test && npm run build`.

## Variables d’environnement

Copier [`.env.example`](./.env.example) vers `.env.local` si besoin.
Ne jamais committer de secrets.

## Git

- Branche de développement : `develop/avatar-platform`
- Ne pas modifier `main` directement
- Aucun commit ni push sans demande explicite
