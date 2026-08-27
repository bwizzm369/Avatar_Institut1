# Avatar Institut — Google Form (Student Data Update)

Script **indépendant** Google Apps Script pour créer automatiquement :

1. un Google Form court (3 sections, mobile-friendly) ;
2. un Google Sheet lié aux réponses ;
3. une feuille `IMPORT_GUIDE` pour l’import Admin plus tard.

**Ce script ne touche pas** à Next.js, Supabase, Student Pass, certificats ni enrollments.  
Aucune donnée n’est envoyée automatiquement vers Avatar Institut.

---

## Étapes

1. Ouvre [https://script.google.com](https://script.google.com)
2. Clique sur **Nouveau projet**
3. Ouvre `tools/google-student-form/Code.gs` dans ce dépôt
4. **Copie tout** le contenu de `Code.gs`
5. Dans Apps Script, **remplace complètement** le contenu du fichier par défaut
6. **Enregistre** (Ctrl+S) — nom suggéré : `Avatar Institut Student Form`
7. Dans le menu des fonctions, sélectionne **`createAvatarStudentForm`**
8. Clique sur **Exécuter** (▶) **une seule fois**
9. Autorise le script (compte Google → Examiner les autorisations → Accéder…)
10. Ouvre **Exécution** / les journaux (Logger) et récupère les **3 URLs** :
    - Public form URL (étudiants)
    - Form edit URL (admin)
    - Google Sheet URL (réponses)

> **Avertissement :** chaque nouvelle exécution de `createAvatarStudentForm()` crée un **nouveau** Form et un **nouveau** Sheet. Ne relance pas sans besoin.

---

## Contenu final du formulaire

| Section | Clé | Question | Obligatoire |
|---------|-----|----------|-------------|
| 1. بيانات الطالب | `full_name` | الاسم الكامل بالحروف اللاتينية / Full name | Oui |
| 1 | `email` | البريد الإلكتروني / Email | Oui |
| 1 | `phone` | رقم الهاتف مع رمز الدولة / Phone | Oui |
| 1 | `country` | البلد / Country (liste) | Oui |
| 2. الدورات السابقة | `courses` | الدورات التي سبق لك دراستها… (checkboxes) | Oui |
| 3. الشهادات | `has_certificate` | هل سبق أن حصلت على شهادة… (نعم / لا) | Oui |
| 3 | `old_certificate_number` | رقم الشهادة القديمة إن كان متوفراً | Non |

**Champs absents (volontairement) :** `full_name_ar`, `student_pass`, `notes`, `course_year`, `course_dates`

---

## Colonnes Google Sheet (exactes)

```
timestamp
full_name
email
phone
country
courses
has_certificate
old_certificate_number
```

---

## Personnalisation visuelle (manuelle, après création)

Apps Script **ne propose pas** d’API simple et stable pour la couleur de thème ou l’image d’en-tête.  
Pour rester fiable, le script configure uniquement ce qui est officiel et robuste :

- 3 sections (pages) + en-tête de section
- barre de progression
- pas de quiz
- pas de collecte d’email Google
- pas d’obligation de connexion Google
- plusieurs réponses autorisées
- message de confirmation clair

Ensuite, dans Google Forms (URL d’édition) :

1. Ouvre le formulaire avec **Form edit URL**
2. Clique sur l’icône **Palette** (Personnaliser le thème)
3. Choisis la **couleur principale** (ex. vert Avatar `#1F4D3A`)
4. Ajoute une **image d’en-tête** si tu veux
5. Ajoute le **logo Avatar** via l’en-tête / thème (ne déforme pas le logo officiel)

Ne force pas de « hack » design via le script : cela peut casser le formulaire.

---

## Ce que le script ne fait jamais

- Appeler Supabase
- Créer un compte étudiant
- Créer un Student Pass
- Créer un certificat
- Créer un enrollment
- Envoyer les données vers Avatar automatiquement

---

## Suite

1. Les étudiants remplissent le Form  
2. Tu exportes le Sheet en **CSV** ou **XLSX**  
3. Tu importes dans l’Admin Avatar Institut
