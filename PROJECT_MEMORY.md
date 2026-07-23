# Avatar Institut — Project Memory

## Vision
Plateforme internationale de formation consacrée aux sciences métaphysiques, à la conscience, au leadership et à la transformation humaine.

## Public
Étudiants, chercheurs, professionnels, dirigeants et personnes intéressées par le développement de la conscience.

## Langues
Anglais et arabe avec prise en charge RTL complète.

## Identité visuelle
Blanc, noir, vert profond #1F4D3A, style institutionnel premium. Logo officiel préservé.

## Parcours étudiant
Formation → panier → création de compte ou connexion → Stripe/PayPal → confirmation serveur → ajout dans Mes formations → apprentissage → certificat.

## Architecture cible
- Next.js App Router
- TypeScript strict
- Supabase Auth et PostgreSQL
- RLS Supabase
- Stripe
- PayPal
- Bunny Stream
- Vercel

## Espaces
- Site public
- Catalogue
- Panier
- Authentification
- Mes formations
- Lecteur de cours
- Mes certificats
- Administration future

## Sécurité
Paiement confirmé côté serveur, webhooks idempotents, secrets uniquement dans les variables d’environnement, contrôle des accès aux cours et vidéos.

## Échelle prévue
Environ 4 000 étudiants, 100 vidéos, 100 Go de stockage et potentiellement 40 000 heures de visionnage mensuel.

## État actuel
Fondation Next.js App Router (TypeScript strict) sur `develop/avatar-platform`.
Site historique conservé dans `legacy/index.html`.
Corrections post-audit visuel : hydratation locale/panier, titres par route, header mobile, composition grands écrans, libellés leçons, bandeau AR.
Catalogue (3 formations de démonstration), panier local, pages auth/dashboard en interface uniquement.
Aucun backend, paiement, compte étudiant réel ou streaming connecté.

## Décisions confirmées
- Vercel séparé pour l’académie.
- Pas de connexion GitHub au compte Vercel de l’académie.
- Déploiement Vercel manuel prévu.
- Stripe et PayPal.
- Bunny Stream pour les vidéos.
- Supabase pour les comptes et les données.
- Ancien design conservé comme référence dans `legacy/`.
- Développement sur `develop/avatar-platform`.
- Aucun commit ni push sans autorisation.

## Phases
1. Règles, mémoire et fondation Next.js. ← fondation livrable localement (validée)
2. Catalogue, panier et interface étudiant.
3. Supabase Auth et base de données.
4. Stripe et PayPal.
5. Bunny Stream et contrôle d’accès.
6. Certificats.
7. Administration.
8. Tests, sécurité et déploiement Vercel.

## Journal de progression

| Date | Phase | Modification | Validation | Commit |
|------|-------|--------------|------------|--------|
| 2026-07-23 | 1 | Création des règles Cursor, PROJECT_MEMORY.md et README.md | Cohérence vérifiée | `0dca699` |
| 2026-07-23 | 1 | Fondation Next.js 15 : `legacy/index.html`, App Router, types domaine, i18n EN/AR+RTL, 3 cours démo, panier local, pages publiques + dashboard, `.env.example`, tests Vitest | `lint`, `typecheck`, `test` (8), `build` : OK. Aucun commit ni push de cette livraison. | — |
| 2026-07-23 | 1 | Script `npm run check` (lint+typecheck+test+build) ; revalidation groupée | `npm run check` exit 0. Aucun commit ni push. | — |
| 2026-07-23 | 1 | Corrections audit visuel : hydratation panier/locale, titres routes absolus, CSS header mobile, ultra-wide, logo lisible, lessonsLabel, bandeau AR, tests cart/titles | `npm run check` exit 0 (12 tests). Contrôle 1440/390 EN+AR OK. Badge Next «1 Issue» hydratation encore visible dans le navigateur Cursor (à confirmer hors instrumentation). Aucun commit ni push. | — |

## Points en attente
- Nom de domaine définitif.
- Liste réelle des formations.
- Prix et devises.
- Conditions de délivrance des certificats.
- Identité juridique et mentions légales.
- Comptes Supabase, Stripe, PayPal et Bunny.
