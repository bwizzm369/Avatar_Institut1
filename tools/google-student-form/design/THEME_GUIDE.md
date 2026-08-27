# Avatar Institut — Thème Google Forms

Réglages **manuels** à appliquer dans Google Forms après création du formulaire.  
Apps Script ne gère pas le thème de façon fiable : tout se fait ici, à la main.

Ce guide ne modifie pas les questions, le Sheet, ni `Code.gs`.

---

## Fichier à téléverser

| Élément | Fichier |
|---------|---------|
| Bannière d’en-tête | `banner-avatar-google-form.png` |
| Source vectorielle (ne pas téléverser) | `banner-avatar-google-form.svg` |

Dimensions : **1600 × 400 px**.  
Format : PNG. Google Forms n’accepte pas le SVG en image d’en-tête.

---

## Palette

| Rôle | Hex | Usage |
|------|-----|--------|
| Vert institutionnel | `#1F4D3A` | Couleur principale du thème |
| Blanc cassé | `#FBFAF7` | Fond de la bannière (déjà dans le PNG) |
| Or manuscrit | `#B6823C` | Accents dans la bannière uniquement (ne pas forcer dans Forms) |
| Encre | `#1A1A1A` | Symbole et titre arabe dans la bannière |

---

## Étapes dans Google Forms

Ouvre l’URL d’**édition** du formulaire (pas l’URL publique).

1. Clique sur l’icône **palette** (Personnaliser le thème / Customize theme).

### 1. Bannière

2. Section **En-tête / Header** → **Choisir une image** / **Upload**.
3. Sélectionne `tools/google-student-form/design/banner-avatar-google-form.png`.
4. Ne recadre pas manuellement si Google propose un cadre : le contenu important est déjà dans la zone centrale.
5. Valide.

### 2. Couleur principale

6. Section **Couleur / Color**.
7. Ouvre le sélecteur personnalisé (croix / + / Custom).
8. Saisis exactement : **`#1F4D3A`**.

### 3. Fond

9. Section **Arrière-plan / Background**.
10. Choisis la **teinte la plus claire** proposée par Google pour cette couleur.  
    Ne prends pas un fond vert saturé. Le formulaire doit rester aéré, proche du blanc cassé.

### 4. Typographie

11. Section **Police / Font**.

| Zone | Réglage |
|------|---------|
| En-tête / Header | **Formal** (si disponible). Sinon Georgia / serif proche. |
| Questions / Question | **Roboto**, taille **12** |
| Texte / Text | **Roboto**, taille **11** |

Si les tailles 12 / 11 n’apparaissent pas comme menu, choisis Roboto puis la taille la plus proche du corps courant (Questions plus grandes que le texte d’aide).

12. Ferme le panneau thème. Enregistre n’est en général pas nécessaire : Google Forms applique immédiatement.

---

## Contrôle visuel

- Le cercle et le point central restent ronds, non écrasés.
- Le titre arabe **معهد الأفاتار** reste lisible sur mobile (Google recadre les bords).
- Le bouton d’envoi doit apparaître en vert `#1F4D3A`.
- Aucune photo, aucun motif, aucun surplus décoratif.

Maquette locale (ne remplace pas Forms) : ouvrir `preview.html` dans un navigateur.

---

## Ce qu’il ne faut pas faire

- Ne pas téléverser le SVG.
- Ne pas remplacer la bannière par une photo ou un logo JPEG plein cadre.
- Ne pas étirer l’image.
- Ne pas choisir un fond vert foncé.
- Ne pas modifier les questions depuis ce pack visuel.
