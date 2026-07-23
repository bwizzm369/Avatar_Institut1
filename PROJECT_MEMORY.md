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

## État initial
Le dépôt GitHub contient actuellement un site statique `index.html`. Aucun backend, paiement, compte étudiant ou base de données n’est encore connecté.

## Décisions confirmées
- Vercel séparé pour l’académie.
- Pas de connexion GitHub au compte Vercel de l’académie.
- Déploiement Vercel manuel prévu.
- Stripe et PayPal.
- Bunny Stream pour les vidéos.
- Supabase pour les comptes et les données.
- Ancien design conservé comme référence.
- Développement sur `develop/avatar-platform`.
- Aucun commit ni push sans autorisation.

## Phases
1. Règles, mémoire et fondation Next.js.
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
| 2026-07-23 | 1 | Création des règles Cursor, PROJECT_MEMORY.md et README.md | Fichiers créés, cohérence vérifiée. Aucune transformation Next.js. Aucun commit ni push. | — |

## Points en attente
- Nom de domaine définitif.
- Liste réelle des formations.
- Prix et devises.
- Conditions de délivrance des certificats.
- Identité juridique et mentions légales.
- Comptes Supabase, Stripe, PayPal et Bunny.
