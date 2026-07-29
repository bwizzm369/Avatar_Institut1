# Avatar Institut — Platform

Plateforme e-learning bilingue (anglais / arabe) d’Avatar Institut.

## Avant toute contribution

1. Lire [`PROJECT_MEMORY.md`](./PROJECT_MEMORY.md) — mémoire centrale du projet.
2. Respecter [`.cursor/rules/avatar-institute.mdc`](./.cursor/rules/avatar-institute.mdc) — règles permanentes (Git, sécurité, identité visuelle, qualité).

## État actuel

Fondation Next.js + **Supabase Light** (clients, auth UI, migration SQL locale, RLS) sur `develop/avatar-platform`.
Site statique de référence conservé dans [`legacy/index.html`](./legacy/index.html).

Stripe, PayPal et Bunny Stream **ne sont pas connectés**.
Aucune migration distante n’est exécutée depuis ce dépôt.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Pour activer Auth Supabase en local, copier [`.env.example`](./.env.example) vers `.env.local` et renseigner les placeholders avec les valeurs de **votre** projet (jamais de clés dans Git).

Appliquer manuellement la migration locale :

[`supabase/migrations/20260723120000_supabase_light_schema.sql`](./supabase/migrations/20260723120000_supabase_light_schema.sql)

## Qualité

```bash
npm run check
```

Équivalent : `npm run lint && npm run typecheck && npm test && npm run build`.

## Variables d’environnement

| Variable | Portée |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement** |

Ne jamais committer de secrets.

## Git

- Branche de développement : `develop/avatar-platform`
- Ne pas modifier `main` directement
- Aucun commit ni push sans demande explicite
