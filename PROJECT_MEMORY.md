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
- Administration (`/admin`) — Lot 1 shell + Lot 2 students/import + Lot 2B course registry

## Sécurité
Paiement confirmé côté serveur, webhooks idempotents, secrets uniquement dans les variables d’environnement, contrôle des accès aux cours et vidéos.
Inscriptions (`enrollments`) : aucune création depuis le navigateur ; grant uniquement via `SUPABASE_SECRET_KEY` (service role) après paiement confirmé (webhook Stripe) ou validation manuelle.
Checkout Stripe : le navigateur envoie uniquement des slugs ; prix et devises résolus côté serveur ; la page `/cart/success` n’accorde jamais l’accès. Elle vérifie en lecture seule l’apparition d’une inscription active (polling) et guide l’étudiant en EN/AR.
Lecteur étudiant : modules/leçons et `bunny_video_id` uniquement après inscription active (`status=active` + `payment_confirmed_at`) vérifiée côté serveur ; un paramètre URL seul n’accorde jamais l’accès.
Administration : accès uniquement si session Supabase + `profiles.role = 'admin'` **et** vérification administrative par e-mail (code à 6 chiffres, empreinte HMAC uniquement). Cookie `ai_admin_ev` HttpOnly / Secure / SameSite=Strict, signé et lié à l’utilisateur + session. Pas de signup admin public. Élévation de rôle uniquement via SQL / service role (trigger anti auto-élévation). L’inscription publique ignore `role` / Student Pass / `legacy_match_status` envoyés par le navigateur. Ce n’est **pas** Supabase AAL2/TOTP. Mailer admin câblé à Resend (serveur uniquement : `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN`) : expéditeur `Avatar Institut Security <security@{domaine}>`, Reply-To `contact@avatarinstitut.com`. HMAC uniquement via `ADMIN_EMAIL_VERIFICATION_SECRET` (obligatoire, indépendant, aucun fallback Supabase) ; absence = échec fermé. Code jamais dans les logs, URL, erreurs ou réponses serveur. Verrouillage immédiat à la 5ᵉ tentative incorrecte. Migration `admin_email_verification` encore non appliquée. Aucun e-mail réel envoyé depuis ce lot (tests simulés).
Import historique : preview sans écriture ; confirmation explicite ; tables `legacy_students` / `legacy_course_completions` (pas de création Auth, pas de détournement de `enrollments`). Un email déjà présent réutilise l’étudiant et peut attacher une **nouvelle** completion (fingerprint inédit) ; student-only EXISTING reste ignoré. Phone/notes admin-private.
Registre formations : table `courses` étendue (`image_url`, `is_for_sale`, `student_pass_included`, `legacy_only`, `price_cents` nullable) ; CRUD + import Excel/CSV admin ; parsing source-agnostic (Sheets plus tard).

## Échelle prévue
Environ 4 000 étudiants, 100 vidéos, 100 Go de stockage et potentiellement 40 000 heures de visionnage mensuel.

## État actuel
**Phase 3A Light** + **Stripe Checkout Test** + **Supabase Light** + **Phase 3C Light / Bibliothèque digitale publique** + **Admin Lot 1 + Lot 2** sur `develop/avatar-platform` :
- Clients `@supabase/supabase-js` / `@supabase/ssr` (browser, server, middleware, secret key serveur).
- Migrations SQL locales : schéma + seed cours + seed curriculum Foundations + `profiles.role` + **`legacy_students` / `legacy_course_completions`** + **`certificates` / `certificate_year_counters` (Lot Certificats 1, appliqué en production)**.
- Auth réelle (signup étudiant enrichi / login / logout / callback) + **récupération mot de passe étudiant** (`/forgot-password` → email Supabase → `/auth/callback?next=/update-password` → `/login?reset=ok`). Message générique anti-énumération. Aucun service role navigateur. **Self-registration** : `/signup` crée `role=student` (défaut SQL) ; Student Pass non créé (INACTIVE) ; matching legacy conservative (email unique ou certificat officiel + même email). Migration `20260827180000_student_self_registration.sql` **appliquée manuellement sur le projet Supabase distant**.
- Protection `/dashboard` via middleware ; session rafraîchie par cookies.
- **Back-office `/admin`** : shell indépendant (sidebar fixe, Admin Console) ; entrée `/admin/login` ; nav Dashboard / Courses / Student Pass / Students·Import / Certificates ; logout → `/admin/login` ; stats Students / Courses / Active Student Pass. **`/admin/certificates` (Lot 3A + 3B)** : liste, recherche, prévisualisation, anti-doublon, **émission admin réelle**. **Lot 4A** : QR déterministe vers `{NEXT_PUBLIC_APP_URL}/verify/{AVT-YYYY-NNNNNN}`. **Lot 4B** : PDF officiel admin + **preview PDF local** (`/pdf-preview`, mention PREVIEW, désactivé en production) sur **Template 2** (`certificate-template.html` + `frame.png`), sans l’ancien JPEG de fond.
- Dashboard + lecteur : `/dashboard/courses`, `/dashboard/courses/[courseSlug]`, `/dashboard/courses/[courseSlug]/lessons/[lessonId]`. Cours `is_demo` exclus de l’expérience étudiant (liste + accès direct) ; enrollments et lignes `courses` inchangés. Titres/résumés My courses : même fallback EN↔AR que le catalogue public (`displayLocalized`). Slugs Unicode/arabe : hrefs `encodeURIComponent` ; lookup public et dashboard via `resolveCourseSlugParam` avant `.eq("slug")`.
- **Mes certificats** `/dashboard/certificates` : liste serveur des certificats du profil connecté (RLS `certificate_is_own`, y compris legacy lié via `linked_profile_id`) ; vérification `/verify/[numéro]` ; **téléchargement PDF officiel Template 2** via `GET /api/dashboard/certificates/[certificateNumber]/pdf` (propriétaire connecté uniquement). Production : origine HTTPS publique. Local : QR via `NEXT_PUBLIC_APP_URL` (localhost autorisé hors production). **Auto-émission moderne** : 100 % des leçons d’un enrollment actif → RPC `issue_certificate` via **service role serveur** (jamais le JWT étudiant). Legacy / historique : émission admin inchangée.
- **Student Pass / Digital Membership** : `/dashboard/student-pass` affiche une carte membre (nom, Member ID public `AVT-M-` + 8 hex de `profiles.id`, ACTIVE/INACTIVE via `hasActiveStudentPass`). Si les données existent : **PLAN** inféré depuis `started_at`→`expires_at` (période déjà sync Stripe, pas de colonne `plan`) et **VALID UNTIL** = `expires_at`. Si inactif : 3 formules Stripe Test — monthly 12 €, semiannual 72 € / 6 mois, annual 144 €/an (`STRIPE_STUDENT_PASS_*_PRICE_ID`). Le navigateur n’envoie que `plan`. Activation uniquement via webhook. Admin manuel/offline inchangé + source `stripe`. **Aucune migration**.
- Progression globale + « Marquer comme terminée » via `lesson_progress` (session utilisateur + RLS) ; `enrollments.status` reste `active` à 100 % (le statut `completed` casserait le lecteur et Mes formations).
- Emplacement Bunny Stream préparé (`hasBunnyVideo`) sans clés Bunny.
- Stripe Checkout hébergé : formations `mode: payment` + webhook → enrollments ; Student Pass `mode: subscription` + même webhook → `source=stripe`.
- Bibliothèque publique `/library` EN/AR de liens externes.
- **Reviews Lot A + consultation** : schéma distant déjà appliqué sur `gcsrmfmwuxxrblxhffzo`. Insert étudiant = toujours pending + `is_published=false`, `profile_id = auth.uid()`. Une avis par profil. Public = approved + published.
- **Reviews Lot B** : formulaire étudiant sur `/reviews` (note 1–5, texte, confirmation) ; Header EN Reviews / AR الآراء ; admin Approve/Reject ; étoiles publiques pour les avis notés. Pas d’UI de redesign.
- **Reviews statut propre** : SELECT RLS `reviews_select_own` (`profile_id = auth.uid()`) ; plus de lecture service-role pour le statut étudiant.
- **Beta Vercel Production** : déployée sur `avatar-institut-platform`, alias stable `https://avatarinstitut.com`. `NEXT_PUBLIC_APP_URL` = cette origine. Stripe TEST. Webhook Test `https://avatarinstitut.com/api/stripe/webhook`. PDF = `puppeteer-core` + `@sparticuz/chromium`. Compteur certificats 2026 non remis à zéro. Auth Supabase Site URL + 3 Redirect URLs Beta **posés manuellement**.
**Non connectés :** PayPal, virement, Bunny Stream playback, migrations distantes automatiques, révocation certificats, emails d’invitation. Student Pass Stripe : 3 Prices Test (12 / 72 / 144 EUR) — jamais Live sans autorisation.

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
4. Stripe et PayPal. ← **Stripe Checkout Test livré localement** (formations `payment` + Student Pass `subscription` Test ; PayPal non connecté)
5. Bunny Stream et contrôle d’accès.
6. Certificats. ← **Lot 1 appliqué en production** + **Lot 2 page `/verify/[certificateNumber]` livrée localement** + **Lot 3A admin lecture seule livré localement** + **Lot 3B émission admin livrée localement** + **Lot 4A QR officiel livré localement** + **Lot 4B PDF officiel livré localement** + **auto-émission moderne à 100 % livrée localement** (révocation : lots suivants)
7. Administration. ← **Lot 1 + Lot 2 + Lot 2B + Certificats 3A/3B/4A/4B + Student Pass Stripe Test + vérification administrative par e-mail + mailer Resend Lot 1 (câblé, envoi réel non exécuté)** livrés localement (révocation certificats / Google Sheets / premier envoi réel : lots suivants)
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
| 2026-08-05 | UI / Home Hero | Hero Home 2 colonnes : badge Online Institute, titre institut, CTAs Courses/Library, bloc média placeholder responsive | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-05 | UI / Home Hero immersif | Image `public/hero/avatar-online-institute-hero.png` en fond plein cadre, overlay léger, texte ivoire superposé, sans badge ni 2 colonnes | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-05 | Fix / Home Hero+About | Hero image seule (texte HTML retiré) ; About ivoire + transition ; logo sans carte blanche (JPEG opaque) | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-05 | UI / Home Hero premium | Fond `avatar-online-institute-hero.png` + texte HTML gauche ; overlay 20 % ; colonne droite libre pour كهيعص | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-06 | Contenu / About EN-AR | Structure About/Founder alignée EN/AR ; onglets عن المعهد/المؤسس ; biographie validée + physique ; rubriques documentées uniquement | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-06 | Contenu / About validé | Remplacement du texte `/about` par le contenu institutionnel AR validé + traduction EN fournie ; Founder inchangé | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-06 | Fix / Founder copy | Suppression notes institut/Amazon ; « مئات المؤلفات » / « hundreds of publications » | `npm run check` exit 0 (76 tests). Aucun commit ni push. | — |
| 2026-08-07 | 7 / Admin Lot 1 | Back-office `/admin` : migration `profiles.role`, login admin, protection serveur, layout sidebar, dashboard + pages placeholder, tests guards | `lint`, `typecheck`, `test` (87), `build` : OK. Aucune migration distante. Aucun commit ni push. | — |
| 2026-08-07 | 7 / Admin Lot 2 | Students list + Excel/CSV import (preview/confirm), tables legacy, matching cours, idempotence fingerprint, tests import | `lint`, `typecheck`, `test` (106), `build` : OK. Aucune migration distante. Aucun commit ni push. | — |
| 2026-08-07 | 7 / Admin Lot 2B | Course registry : champs `courses`, CRUD admin, import Excel/CSV preview/confirm, template, source-agnostic | `lint`, `typecheck`, `test` (122), `build` : OK. Aucune migration distante. Aucun commit ni push. | — |
| 2026-08-09 | 7 / Auth séparation | Entrées séparées étudiant `/login`→`/dashboard` vs admin `/admin/login`→`/admin` ; policy pure + tests ; logo admin login ; admin peut ouvrir `/dashboard` (preview) | `lint`, `typecheck`, `test` (149), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-09 | 7 / Admin shell | Back-office indépendant : sidebar fixe + logo, nav console, logout → `/admin/login`, stats Student Pass actives, tests shell | `lint`, `typecheck`, `test` (156), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-10 | 7 / Admin shell final | Login Admin simplifié ; dashboard 3 cartes réelles ; shell/nav/logout confirmés | `lint`, `typecheck`, `test` (156), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-10 | Fix / Stripe redirect origin | `getAppOrigin()` : Preview Vercel utilise `VERCEL_URL` (ignore localhost) ; local conserve `NEXT_PUBLIC_APP_URL` / `localhost:3000` | `lint`, `typecheck`, `test` (162), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-11 | Fix / Student Pass discount | `student_pass_discount_percent` + pricing serveur + checkout/catalogue Pass-aware | `lint`, `typecheck`, `test` (179), `build` : OK. Migration appliquée manuellement en prod. Aucun commit ni push. | — |
| 2026-08-11 | 7 / Import Students UX | Bouton Import Students depuis `/admin/students` ; aliases `full_name`/`email` ; preview Ready/Existing/Invalid ; import student-only vers `legacy_students` | `lint`, `typecheck`, `test` (188), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-13 | 7 / Activate account | `/admin/students` : Activate account via `inviteUserByEmail` (service role) + `linked_profile_id` ; pas de Pass/enrollment/certificat | `lint`, `typecheck`, `test` (197), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-13 | 7 / Activate directe | Activation sans email : `auth.admin.createUser` + `email_confirm` + mot de passe temporaire affiché une fois à l’admin | `lint`, `typecheck`, `test` (200), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-14 | UX / Login password toggle | `/login` : bouton œil pour afficher/masquer le mot de passe (état UI seul, pas de stockage) | `lint`, `typecheck` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-16 | Google Form / Pack visuel | Pack local `tools/google-student-form/design/` : bannière 1600×400 (SVG+PNG), `THEME_GUIDE.md`, maquette `preview.html`. Palette #1F4D3A / #FBFAF7 / #B6823C / #1A1A1A. Aucune modification Form/Sheet/site. | Pack local uniquement. Aucun commit ni push ni deploy. | — |
| 2026-08-17 | Catalogue public / Supabase | `/courses` et `/courses/[slug]` chargent les cours publiés non `legacy_only` depuis Supabase. Demo hardcodé isolé (tests/panier). Pass display conservé. Stripe inchangé. | `lint`, `typecheck`, `test`, `build` à la livraison. Aucun commit ni push ni deploy. | — |
| 2026-08-17 | Catalogue / fallback EN←AR | Titre/description EN vides → affichage AR (sans traduction). Import AR-only accepté. Stripe inchangé. | `lint`, `typecheck`, `test`, `build` à la livraison. Aucun commit ni push ni deploy. | — |
| 2026-08-17 | Import / formations réelles | Fichiers locaux `tools/imports/avatar-real-courses-import.csv` + `.xlsx` : 10 formations AR restantes, hors `دورة الشكر`. Preview parser OK, 10 READY. Aucune écriture Supabase. | Preview locale `parseCourseImportBuffer` + `buildCoursePreviewReport`. Aucun commit ni push ni deploy. | — |
| 2026-08-17 | 6 / Certificats Lot 1 | Migration locale `certificates` + compteurs `AVT-YYYY-XXXXXX` + RLS + RPC `verify_certificate`. Types + tests format/statut/payload public. Pas d’UI/QR/PDF. | `lint`, `typecheck`, `test` (228), `build` : OK. Aucune migration distante. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | 6 / Certificats Lot 1 fix | `legacy_completion_id` : FK `legacy_course_completions(id)` passée en `ON DELETE SET NULL` pour conserver le certificat si la completion historique change. | Un seul `npm run check`. Aucune migration distante. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | 6 / Certificats Lot 2 | Page publique `/verify/[certificateNumber]` via RPC `verify_certificate` uniquement. États issued/revoked/not found, EN/AR+RTL, `noindex,nofollow`. Pas de QR/PDF/émission. | `lint`, `typecheck`, `test` (238), `build` : OK. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | 6 / Certificats Lot 3A | Admin `/admin/certificates` : totaux, liste, recherche, étudiants moderne/legacy, completions, anti-doublon, prévisualisation lecture seule. Pas d’émission ni révocation. | `lint`, `typecheck`, `test` (255), `build` : OK. Aucune migration SQL. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | 6 / Certificats Lot 3B | Émission admin réelle : action serveur, snapshots reconstruits, anti-doublon, RPC locale `issue_certificate` (numéro + INSERT atomiques). Pas de révocation/QR/PDF. `AVT-2026-000001` inchangé. | `lint`, `typecheck`, `test` (276), `build` : OK. Migration locale non exécutée en distant. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | 6 / Certificats Lot 3B durcie | RPC `issue_certificate` : vérifie enrollment/completion/lien/cours ; reconstruit nom et titres depuis les tables ; date/langue/ancien numéro restent des paramètres. Migration locale non exécutée. | `lint`, `typecheck`, `test` (279), `build` : OK. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | 6 / Certificats 3B nom public | `holder_display_name` : `first_name`+`last_name` ou `legacy_students.full_name` uniquement. Plus aucun fallback email. Émission refusée si nom public absent. | `lint`, `typecheck`, `test` (281), `build` : OK. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-18 | Fix / recherche émission | Recherche étudiant `/admin/certificates` : décoder `+` en espace (Next.js) + tokens nom/email. Pas de certificat ni activation exigés. | `lint`, `typecheck`, `test`, `build` à la livraison. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | Fix / import completions existants | `/admin/import` : email déjà dans `legacy_students` + nouvelle completion (fingerprint inédit) → réutilise l’étudiant, INSERT `legacy_course_completions` uniquement. Student-only EXISTING et même fingerprint restent ignorés. | `lint`, `typecheck`, `test` (293), `build` : OK. Aucune migration. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | Fix / admin certificates UI | `/admin/certificates` + shell : CSS admin rétabli, logo 64px, nav/cartes/tableaux/preview alignés. `globals.css` n’écrase plus le logo admin. Logique inchangée. | `lint`, `typecheck`, `test` (293), `build` : OK. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | Fix / workflow next quality | `npm run check` = `check:safe` : lint/tests sans casser le serveur ; stop `next dev` seulement avant `next build` ; relance via `node …/next dev` (pas `npm` détaché Windows). `npm run build` refuse si un `next dev` local tourne. | `check:safe` : lint+typecheck+test (300) + build OK. Relance locale `http://localhost:3000`. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | 6 / Certificats Lot 4A | QR officiel déterministe vers `{NEXT_PUBLIC_APP_URL}/verify/{numéro}`. Local = localhost ; PDF officiel refuse localhost. Pas de PDF graphique. `AVT-2026-000001` inchangé. | `lint`, `typecheck`, `test` (315), `build` : OK. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | 6 / Certificats Lot 4B | PDF officiel admin : template vertical, QR Lot 4A, route `/api/admin/certificates/[certificateNumber]/pdf`. Origin HTTPS public obligatoire. | `lint`, `typecheck`, `test` (329), `build` : OK. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | 6 / Certificats PDF preview | Preview local admin-only `/pdf-preview` : même template + mention PREVIEW. Désactivé en production. PDF officiel refuse toujours localhost. | `lint`, `typecheck`, `test` (335), `build` : OK. Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-19 | 6 / Certificats Template 2 | PDF/preview branchés sur le HTML+`frame.png` validés. Données officielles + logo JPEG + QR Lot 4A. Director/Seal vides. Ancien JPEG de fond retiré de la génération. | `typecheck` + `test` (339) : OK. Pas de `next build` (dev local actif). Aucun SQL distant. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | 6 / Certificats logo Template 2 | Logo officiel agrandi à 19cqw, centré, sans toucher la bordure ni le titre Certificate. | Preview locale `AVT-2026-000001`. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | Fix / dashboard certificates RSC | Client `DashboardCertificatesClient` n’importe plus `student.ts` (cookies/`next/headers`). Chargement serveur conservé. | `lint` 0 erreur, `tsc` OK, `student.test.ts` OK. SQL non. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | 6 / Auto-émission 100 % | Formation moderne : dernière leçon → recalcul serveur → RPC `issue_certificate` via service role. Étudiant n’appelle pas la RPC. Legacy admin inchangé. `enrollments.status` reste `active`. | `lint` 0 erreur, `typecheck` OK, tests ciblés 88. SQL non. Aucun certificat réel. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | Fix / dashboard démo | Masque les cours `is_demo` du dashboard et du lecteur par slug. Enrollments / `courses` / `دورة الشكر` inchangés. | `lint` 0, `typecheck` OK, tests ciblés 21. Pas de `next build`. SQL non. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | Fix / dashboard EN↔AR | My courses + lecteur : fallback titre/résumé identique au catalogue (`title_en` vide → `title_ar`). `دورة الشكر` visible en EN. Démos toujours masquées. | `lint` 0 erreur, `typecheck` OK, tests ciblés 42. Pas de `next build`. SQL non. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | Fix / slug arabe lecteur | `getStudentCourseBySlug` décode le param URL (`%D8%AF…` → `دورة-الشكر`) avant `.eq("slug")`. Enrollment / démo inchangés. | `tsc` OK, tests ciblés 26. Pas de `next build`. SQL non. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | Test / auto-certificat prep | `دورة الشكر` : 1 module + 1 leçon text de test ; enrollment actif Imane (service role). Pas de progress completed, pas de certificat, admin/`AVT-2026-000002` inchangés. | Vérifié en base. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | Auth / forgot password | Parcours étudiant Forgot password EN/AR : `/forgot-password`, callback PKCE existant, `/update-password`, message générique. Stripe/enrollments/certificats inchangés. | Tests ciblés à la livraison. Aucun commit ni push ni deploy. | — |
| 2026-08-20 | 6 / Certificats PDF étudiant | Téléchargement PDF Template 2 depuis `/dashboard/certificates` (route existante). Local : QR `NEXT_PUBLIC_APP_URL`. Fichier `Avatar-Institut-{numéro}.pdf`. Propriété + RLS. Pas d’émission. | Tests ciblés à la livraison. Aucun commit ni push ni deploy. | — |
| 2026-08-26 | Fix / slug arabe Preview | Liens `/courses/[slug]` et `/dashboard/courses/[slug]` encodés (`encodeURIComponent`). Lookup public + dashboard : `resolveCourseSlugParam` avant `.eq("slug")`. Certificats/Pass/Stripe/Auth inchangés. | `tsc` OK, tests 409, lint 0 erreur. Local : `/courses/دورة-الشكر` 200 ; dashboard route reconnue (login si non connecté). Preview Vercel : `/courses/%D8%AF…` 200, titre دورة الشكر. Aucun commit ni push ni prod. | — |
| 2026-08-27 | 7 / Student Pass Digital Membership | Présentation adhésion digitale : `/dashboard/student-pass` + carte membre (`profiles.id`, ACTIVE/INACTIVE existant). Admin libellé membership. Stripe/prix 12 €/avantages inchangés. Pas de QR, pas de migration. | `lint` 0 erreur, `typecheck` OK, tests ciblés 73, `build` OK. `/dashboard/student-pass` → login étudiant ; `/admin/student-pass` → login admin. Aucun commit ni push ni deploy. | — |
| 2026-08-27 | Fix / Member ID public | Affichage Member ID `AVT-M-` + 8 hex de `profiles.id` (carte + admin). UUID interne conservé pour actions. Pas de colonne/migration. | `lint` 0 erreur, `typecheck` OK, tests 421, `build` OK. Aucun commit ni push ni deploy. | — |
| 2026-08-27 | 4 / Student Pass Stripe Subscription | Checkout `mode: subscription` 12 EUR/mois via `STRIPE_STUDENT_PASS_PRICE_ID` ; webhook existant étendu ; sync central `source=stripe` ; admin manuel/offline conservé ; carte ACTIVE via `has_active_student_pass`. Pas de migration. Test only. | `check:safe` : lint 0 erreur, typecheck OK, tests 447, build OK. Aucun commit ni push ni deploy ni Live ni SQL distant. | — |
| 2026-08-27 | 4 / Student Pass 3 formules Stripe | Checkout Student Pass : monthly 12 €, semiannual 72 € / 6 mois, annual 144 €/an. Le client n’envoie que `plan`. Prices serveur validés. Webhook inchangé (même `has_active_student_pass`). Pas de migration. Test only. | `check:safe` : lint 0 erreur, typecheck OK, tests 450, build OK. Aucun commit ni push ni deploy ni Live ni SQL distant. | — |
| 2026-08-27 | UI / Student Pass 3 formules | Page `/dashboard/student-pass` : retrait du libellé isolé 12 €/mois ; cartes Monthly / 6 months / Annual. Carte membre inchangée. Pas de plan ni échéance inventés (non persistés). | `check:safe` : lint 0 erreur, typecheck OK, tests 450, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-27 | Auth / Self-registration étudiant | `/signup` formulaire étudiant (identité, contact, mot de passe + confirmation, langue AR/EN, historique Avatar). Pas de date de naissance. `role=student` par défaut. Student Pass non créé. Matching legacy conservative. Migration locale non appliquée en prod. | `check:safe` : lint 0 erreur, typecheck OK, tests 475, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-27 | Auth / Self-registration distant | Migration `20260827180000_student_self_registration.sql` exécutée manuellement dans Supabase. Colonnes `profiles` + `handle_new_user` / `protect_profile_role` vérifiés à distance. Compte test nouvel étudiant : `role=student`, Pass/enrollment/certificat absents, `legacy_match_status=none`. Compte test supprimé. | Qualité relancée après audit. Aucun commit ni push ni deploy. | — |
| 2026-08-28 | UI / Présence éditoriale | Pages publiques + dashboard : rythme resserré, fonds ivoire, cards/empty states, placeholders cours, overview (compte, Pass, formations, certificats, progression). Logique métier inchangée. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 494, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-29 | Reviews / Lot A schéma | Modèle avis étudiant : pending → admin approve/reject ; public = approved+published ; RLS + trigger ; 1 avis / profil. Pas d’UI publique, pas d’application distante. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 504, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-29 | Reviews / Lot B UI | Formulaire étudiant `/reviews`, étoiles 1–5, Header Reviews/الآراء, admin Approve/Reject, affichage public approved+published. Lot A RLS inchangé. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 519, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-29 | Reviews / SELECT own RLS | `reviews_select_own` : l’étudiant lit uniquement sa ligne via le client JWT. Plus de service-role pour le statut. Migration Lot A locale amendée, non appliquée en distant. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 524, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-29 | Beta Vercel / certificats | Audit flux étudiant + QR. Origine unique `NEXT_PUBLIC_APP_URL` ; signup via `authRedirectOrigin` ; tracing assets PDF ; `maxDuration=60`. Pas d’URL Vercel en dur. Stripe Live / domaine final / migrations distantes / deploy inchangés. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 528, build OK. Aucun commit ni push ni deploy. | — |
| 2026-08-29 | Certificats / PDF Vercel | Impression Template 2 : Chrome/Edge local conservé ; Vercel = `puppeteer-core` + `@sparticuz/chromium`. QR toujours `{NEXT_PUBLIC_APP_URL}/verify/{numéro}`. Pas de redesign. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 534, build OK. Smoke PDF local OK. Aucun commit ni push ni deploy. | — |
| 2026-08-29 | Beta / Vercel Production | Deploy Production `avatar-institut-platform` → `https://avatarinstitut.com`. Env Production complétée (APP_URL, Price IDs, webhook Test). Stripe TEST. Compteur certificats inchangé. Auth redirects Dashboard encore manuels. | Deploy Ready. Smoke public OK. `/verify/AVT-2026-000001` Valid. Aucun commit ni push. | `716ae86` |
| 2026-08-29 | Beta / Auth + smoke | Site URL + 3 Redirect URLs posés manuellement. Smoke public/auth/callback/catalogue/panier/verify/admin/login OK. Stripe TEST. Compteur/certificats de test **non** touchés. | Routes 200/307 attendus. Callback → `/dashboard` ou `/update-password`. Webhook `400 missing_signature`. Achat/PDF/admin = test humain. Aucun commit ni push. | — |
| 2026-08-29 | Fix / contrôle humain | Nav AR : plus de doublon `عن المعهد` (dropdown). Reviews AR `آراء/أصوات الطلاب`. Dashboard inscription = bienvenue sans paiement. Add to cart → `/cart`. Copy panier sans démo/Stripe. Carte Pass : plan inféré + `expires_at`. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 539, build OK. Aucune migration. Stripe TEST. Compteur/certificats inchangés. | this lot |
| 2026-08-30 | Fix / thème mobile | Fond sombre mobile = Auto Dark du navigateur (`color-scheme` absent, `html` transparent). Opt-out clair : `color-scheme: only light` + fond ivoire `html` + viewport `themeColor` `#FBFAF7`. Pas de redesign mobile. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 539, build OK. Vérif mobile EN/AR+RTL (Auto Dark). Aucun commit/push/deploy. | — |
| 2026-08-30 | UI / homepage mobile | Présentation mobile Home : logo JPEG (pas de PNG transparent) via `mix-blend-mode: darken` ; header moins serré ; hero `object-position` + hauteur `svh` ; titre/CTA/paddings réduits. Desktop ≥768px inchangé. `color-scheme` conservé. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 539, build OK. Vérif 360/390/430 EN+AR/RTL. Menu inchangé. Aucun commit/push/deploy. | — |
| 2026-08-30 | UI / Hero responsive | Hero Home : `hero-desktop.png` ≥768px ; `hero-mobile.png` ≤767px. Texte HTML conservé. Mobile `object-fit: cover` / `object-position: center 70%` (tableau + livre). `color-scheme` / header / sections inchangés. | `check:safe` : lint 0 erreur (2 warnings préexistants), typecheck OK, tests 539, build OK. Vérif 360/390/430 EN+AR/RTL + desktop 1440. Aucun commit/push/deploy. | — |
| 2026-09-05 | 7 / Vérification admin e-mail | Lot 1 : après `/admin/login`, code 6 chiffres (TTL 10 min, 1 usage, 5 essais, renvoi 60 s, rotation). Empreinte HMAC, cookie signé HttpOnly/Secure/Strict. Page `/admin/verify` EN/AR. Étudiants inchangés. Migration locale non appliquée. **Blocage : aucun canal e-mail applicatif compatible.** | lint 0 erreur (2 warnings préexistants), typecheck OK, tests 572, build OK. Aucun commit/push/deploy/SQL distant. | — |
| 2026-09-05 | 7 / Mailer admin Resend Lot 1 | Mailer admin câblé à Resend (`RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN`). Expéditeur Security, Reply-To contact, e-mail bilingue EN/AR, verrouillage à la 5ᵉ tentative. Tests avec envoi simulé uniquement. Migration non appliquée. | lint 0 erreur (2 warnings préexistants), typecheck OK, tests 580, build OK. Aucun commit/push/deploy/SQL distant. Aucun e-mail réel. | — |
| 2026-09-05 | 7 / Secret HMAC admin | Suppression du fallback `ADMIN_EMAIL_VERIFICATION_SECRET` ← `SUPABASE_SECRET_KEY`. Secret dédié obligatoire, serveur uniquement ; absence = échec fermé. | tests ciblés + `tsc --noEmit`. Aucun commit/push/deploy/SQL distant. | — |

## Points en attente
- Nom de domaine définitif.
- Liste réelle des formations.
- Prix et devises.
- Délivrance certificats : moderne = 100 % leçons auto ; legacy = admin. Révocation encore ouverte.
- Identité juridique et mentions légales.
- Liens Amazon KDP officiels des ouvrages du fondateur (actuellement `is_published=false`).
- Compte Supabase distant + application manuelle des migrations (schéma + seed démo + 3A).
- Redirect URLs Auth : `{NEXT_PUBLIC_APP_URL}/auth/callback` (signup confirmation + password reset). **Beta** : Site URL `https://avatarinstitut.com` + `/auth/callback` (+ `next=/dashboard` et `next=/update-password`) posés sur `gcsrmfmwuxxrblxhffzo`.
- Génération locale de `STRIPE_WEBHOOK_SECRET` via Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
- Student Pass Stripe Test : 3 Price IDs déjà configurés (`MONTHLY` / `SEMIANNUAL` / `ANNUAL`). Ne pas passer en Live sans autorisation.
- PayPal et Bunny Stream (playback signé).
- Assets officiels Director (signature) et Official Seal (cachet) pour Template 2.
- Tests humains Beta : compte étudiant → Stripe TEST formation → webhook → enrollment → cours → completion → certificat → PDF → QR ; Student Pass ; admin.
- Après validation Beta : nettoyer certificats/données de test identifiés et remettre le compteur au niveau convenu. Pas maintenant.
- Vérifier que `issue_certificate` existe déjà en distant avant d’appliquer `20260818160000_issue_certificate.sql`.
- Vérification administrative par e-mail : mailer Resend câblé. Appliquer `20260905120000_admin_email_verification.sql` manuellement avant tout envoi réel. Premier e-mail réel encore à valider (pas dans ce lot).
