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
Inscriptions (`enrollments`) : aucune création depuis le navigateur ; grant uniquement via `SUPABASE_SECRET_KEY` (service role) après paiement confirmé (webhook Stripe) ou validation manuelle.
Checkout Stripe : le navigateur envoie uniquement des slugs ; prix et devises résolus côté serveur ; la page `/cart/success` n’accorde jamais l’accès. Elle vérifie en lecture seule l’apparition d’une inscription active (polling) et guide l’étudiant en EN/AR.
Lecteur étudiant : modules/leçons et `bunny_video_id` uniquement après inscription active (`status=active` + `payment_confirmed_at`) vérifiée côté serveur ; un paramètre URL seul n’accorde jamais l’accès.

## Échelle prévue
Environ 4 000 étudiants, 100 vidéos, 100 Go de stockage et potentiellement 40 000 heures de visionnage mensuel.

## État actuel
**Phase 3A Light** + **Stripe Checkout Test** + **Supabase Light** + **Phase 3C Light / Bibliothèque digitale publique** sur `develop/avatar-platform` :
- Clients `@supabase/supabase-js` / `@supabase/ssr` (browser, server, middleware, secret key serveur).
- Migrations SQL locales : schéma + seed cours + seed curriculum Foundations (`modules` / `lessons` + champs contenu) + RLS `lesson_progress` écriture propriétaire inscrit.
- Auth réelle (signup / login / logout / callback).
- Protection `/dashboard` via middleware ; session rafraîchie par cookies.
- Dashboard + lecteur : `/dashboard/courses`, `/dashboard/courses/[courseSlug]`, `/dashboard/courses/[courseSlug]/lessons/[lessonId]`.
- Progression globale + « Marquer comme terminée » via `lesson_progress` (session utilisateur + RLS).
- Emplacement Bunny Stream préparé (`hasBunnyVideo`) sans clés Bunny.
- Import Light documenté : `content/import/` (CSV modèle + exemple) — **aucun import distant exécuté**.
- Stripe Checkout hébergé (`mode: payment`) + webhook → enrollments actifs.
- Bibliothèque publique `/library` EN/AR de liens externes (YouTube, Amazon, recherches, podcasts, PDF officiels) alimentée localement par `content/library/resources.json`.
- Aucun hébergement local de livres protégés ; seuls des liens externes HTTPS publiés sont affichés.
- Tableau d’administration futur pour la bibliothèque : hors périmètre de cette phase.
**Non connectés :** PayPal, virement, Bunny Stream playback, migrations distantes automatiques.

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
- Clé `SUPABASE_SECRET_KEY` exclusivement côté serveur (alias legacy `SUPABASE_SERVICE_ROLE_KEY` encore lu si présent).

## Phases
1. Règles, mémoire et fondation Next.js. ← validée
2. Catalogue, panier et interface étudiant. ← livré avec la fondation
3. Supabase Auth et base de données. ← **Supabase Light livré localement** (sans projet distant)
3A. Structure de contenu et lecteur étudiant. ← **livré localement** (sans import distant)
3C. Bibliothèque digitale publique Light. ← **livrée localement** (liens externes uniquement)
4. Stripe et PayPal. ← **Stripe Checkout Test livré localement** (PayPal non connecté)
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
| 2026-07-23 | 3 / Supabase Light | Paquets Supabase, `.env.example` placeholders, migration SQL+RLS locale, auth signup/login/logout/callback, middleware dashboard, dashboard lectures, tests validation/guards/env/enrollments | `npm run check` exit 0 (28 tests). Aucune migration distante. Aucun commit ni push. | — |
| 2026-07-24 | 4 / Stripe Checkout Test | Package `stripe`, env Stripe + `SUPABASE_SECRET_KEY`, Checkout API, webhook signature+enrollments idempotents, bouton panier EN/AR, seed démo SQL, tests checkout/webhook | `npm run check` exit 0 (41 tests). Aucune migration distante. Aucun commit ni push. | — |
| 2026-07-26 | UI / Identité | Remplacement du logo SVG par le JPEG officiel `public/brand/avatar-institut-official.jpeg` via `next/image` (Header, alt EN/AR, tailles mobile/desktop, proportions conservées) | `npm run check` exit 0 (41 tests). Aucun commit ni push. | — |
| 2026-07-26 | UI / Accueil | Section « Bridging Science and Spirit » : suppression du symbole SVG à 4 points + tagline ; logo officiel complet centré dans le panneau | `npm run check` exit 0 (41 tests). Aucun commit ni push. | — |
| 2026-07-26 | Fix / Auth+i18n | LocaleProvider sans course localStorage ; loginAction ne throw plus redirect (évite catch client) ; erreurs login bilingues ; form method=post ; restart Next après corruption webpack | `npm run check` exit 0 (41 tests). Aucun commit ni push. | — |
| 2026-07-27 | 3A / Lecteur | Migration curriculum + RLS progress ; pages `/dashboard/courses/[courseSlug]` et leçons ; mark complete ; CSV import Light ; tests auth/progress | `npm run check` exit 0 (52 tests). Aucune migration distante. Aucun commit ni push. | — |
| 2026-07-28 | UX / Post-paiement | Page `/cart/success` premium EN/AR + polling lecture seule ; bandeau technique masqué ; i18n sans jargon | `npm run check` exit 0 (55 tests). Aucun commit ni push. | — |
| 2026-07-29 | 3C / Bibliothèque publique Light | Route `/library` publique EN/AR, filtres/recherche client, validation HTTPS, `content/library/resources.json` + modèles CSV/README, état vide premium, aucun livre hébergé localement | `npm run check` exit 0 (62 tests). Aucune migration distante. Aucun commit ni push. | — |
| 2026-07-29 | 3C / Finalisation bibliothèque | `next/image` pour miniatures externes ; première ressource publiée Andrew Newberg Research ; vérification EN/AR/mobile | Validation via `npm run check`. Aucun commit ni push. | — |
| 2026-07-29 | Fix / Session panier | Sync AuthProvider cookies sur routes + login refresh ; rejet user_id client checkout ; CTA panier aligné Header | Validation via `npm run check`. Aucun commit ni push. | — |
| 2026-07-30 | Fix / Panier par utilisateur | Stockage panier séparé invité/utilisateur Supabase, fusion invité→compte sans doublons, purge ciblée après succès paiement, tests isolement/logout/reconnexion | `npm run check` exit 0 (71 tests). Aucune migration distante. Aucun commit ni push. | — |
| 2026-07-30 | Fix /cart/success activation | Vérifie inscriptions actives contre `course_ids` de la session Stripe ; activated immédiat ; polling continu après délai ; CTA « Open my course » | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-01 | Contenu / Fondateur | Pages `/about` et `/about/founder` EN/AR+RTL ; portrait temporaire « م ر ح » ; 18 ouvrages fondateur en bibliothèque `is_published=false` sans liens Amazon | `npm run check` à la livraison. Aucun commit ni push. | — |
| 2026-08-02 | UI / About+Founder | Refonte esthétique lumineuse `/about` et `/about/founder` : hero 2 colonnes, badges, sections premium, copy EN/AR, sans onglets redondants | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-04 | Contenu / Éditorial+SEO | Accueil sans jargon démo ; valeurs adoucies ; CTA fondateur ; page fondateur (vision philosophique, landmarks, bibliographie `{titleEn,titleAr,category,link}`) ; meta `/` et `/courses` ; logo sizes confirmés ; `next-size-adjust` non forcé (génération Next.js) | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-04 | UI / About+Founder design | Refonte design+copy `/about` et `/about/founder` : hero ivoire/vert, mission/vision/domaines, teaser fondateur, cartes bibliographie, CTA bibliothèque ; or mat discret | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-04 | UI / About+Founder v2 | Hiérarchie resserrée ; valeurs ; TOC interne fondateur ; 6 sections biographiques ; textes fractionnés ; RTL/responsive | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-05 | Nav / Header | Retrait du lien Founder du Header (desktop+mobile) ; route `/about/founder` et sous-nav About conservées ; Cart conservé | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |

## Points en attente
- Nom de domaine définitif.
- Liste réelle des formations.
- Prix et devises.
- Conditions de délivrance des certificats.
- Identité juridique et mentions légales.
- Liens Amazon KDP officiels des ouvrages du fondateur (actuellement `is_published=false`).
- Compte Supabase distant + application manuelle des migrations (schéma + seed démo + 3A).
- Génération locale de `STRIPE_WEBHOOK_SECRET` via Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
- PayPal et Bunny Stream (playback signé).
