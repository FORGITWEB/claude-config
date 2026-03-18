---
name: migration-wp
description: Migration complète d'un site WordPress vers Next.js. Crawle automatiquement le site (sitemap + liens récursifs), extrait tout le contenu mot pour mot (textes, meta, images, PDFs), reproduit l'arborescence URL exacte, et génère un projet Next.js complet (App Router, TypeScript, Tailwind, SSG). Supporte les sites multilingues et les gros sites (100+ pages). Choix entre copie fidèle ou design modernisé via Gemini MCP. Utiliser avec /migration-wp [URL du site WordPress].
---

# Migration WordPress → Next.js

Migration complète et automatisée d'un site WordPress vers Next.js. Contenu copié mot pour mot, URLs préservées, SEO intact.

## Déclenchement

```
/migration-wp https://example.com
```

L'URL du site WordPress est le seul argument requis.

## Workflow

6 étapes avec validation utilisateur :

1. **Crawl & Analyse** → rapport complet du site
2. **Validation** → utilisateur valide/exclut des pages
3. **Extraction contenu** → tout le contenu page par page
4. **Validation contenu** → utilisateur vérifie l'extraction
5. **Génération Next.js** → projet complet, agents en parallèle
6. **Review finale** → vérification contenu + SEO + build

---

## STEP 0 — INITIALISATION

1. Extraire le nom de domaine de l'URL pour créer le slug projet
2. Créer le dossier projet :

```
[slug-projet]/
└── _migration/
    ├── package.json     (copier depuis ~/.claude/skills/migration-wp/scripts/package.json)
    └── crawler.mjs      (copier depuis ~/.claude/skills/migration-wp/scripts/crawler.mjs)
```

3. Installer les dépendances du crawler :
```bash
cd [slug-projet]/_migration && npm install
```

4. Demander le choix design à l'utilisateur via `AskUserQuestion` :
   - **Copie fidèle** : mêmes couleurs, mêmes fonts, layout similaire
   - **Design modernisé** : on garde l'identité (couleurs, fonts) mais on modernise via Gemini MCP

Stocker le choix dans `_migration/config.json` :
```json
{
  "sourceUrl": "https://example.com",
  "designMode": "faithful" | "modernized",
  "excludedPages": [],
  "validatedAt": null
}
```

---

## STEP 1 — CRAWL & ANALYSE

Exécuter le crawler :
```bash
node [slug-projet]/_migration/crawler.mjs https://example.com [slug-projet]/_migration
```

Le script produit :
- `_migration/crawl-report.json` — rapport global (pages, images, documents, architecture, langues)
- `_migration/pages/*.json` — contenu structuré par page
- `_migration/assets/images/` — images téléchargées
- `_migration/assets/docs/` — PDFs/documents téléchargés
- `_migration/design-tokens.json` — couleurs et fonts extraits

### Présentation du rapport

Lire `crawl-report.json` et présenter un résumé clair :

```
RAPPORT DE CRAWL — [domaine]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pages trouvées : XX
Images :         XX
Documents :      XX
URLs en erreur : XX
Langues :        [fr] ou [fr, en, ...]

ARBORESCENCE :
/ (Accueil)
├── /a-propos
├── /services
│   ├── /services/plomberie
│   └── /services/electricite
├── /blog
│   ├── /blog/article-1
│   └── /blog/article-2
├── /contact
└── /mentions-legales

DESIGN TOKENS DÉTECTÉS :
Couleurs principales : #XX, #XX, #XX
Fonts : "Font1", "Font2"

FORMULAIRES DÉTECTÉS : X page(s) avec formulaire
VIDÉOS EMBARQUÉES : X embed(s)
```

**Ne pas continuer sans validation de l'utilisateur.**

---

## STEP 2 — VALIDATION UTILISATEUR

Demander à l'utilisateur via `AskUserQuestion` :
- Le rapport est-il correct ?
- Y a-t-il des pages à exclure ? (ex : pages obsolètes, doublons)
- Le domaine cible est-il connu ? (pour les canonicals)

Mettre à jour `_migration/config.json` avec les pages exclues.

**Si des pages sont exclues** → les supprimer de la liste de travail.

---

## STEP 3 — EXTRACTION & VALIDATION CONTENU

Pour chaque page validée, lire le JSON correspondant dans `_migration/pages/` et présenter le contenu extrait de façon lisible.

### Présentation par page

Pour chaque page, afficher :
```
PAGE : /a-propos
TITLE : "À propos | Entreprise"
DESCRIPTION : "Découvrez notre entreprise..."

CONTENU :
[H1] Notre histoire
[P] Depuis 2005, nous accompagnons...
[H2] Notre équipe
[P] Composée de 15 professionnels...
[IMG] team.jpg — alt: "L'équipe au complet"
[H2] Nos valeurs
[UL] - Qualité / - Réactivité / - Transparence

IMAGES : 3 (toutes téléchargées)
LIENS INTERNES : 5
FORMULAIRE : non
```

### Pour les gros sites (20+ pages)

Ne pas afficher chaque page individuellement. Présenter :
1. Un résumé global (nombre de pages par section)
2. Les 5 pages les plus importantes (accueil, contact, services principaux)
3. Demander si l'utilisateur veut vérifier des pages spécifiques

### Validation

Demander confirmation :
- Le contenu extrait est-il fidèle ?
- Des corrections nécessaires ?

**Ne pas continuer sans validation.**

---

## STEP 4 — GÉNÉRATION NEXT.JS (scaffold)

Lire les règles de génération dans `~/.claude/skills/migration-wp/references/generation-rules.md`.

### 4.1 — Création du projet

Invoquer un **agent-dev** (Task tool, subagent_type: agent-dev) avec :

**Dans le prompt, inclure :**
- Le contenu de `_migration/design-tokens.json`
- Le contenu de `_migration/config.json` (designMode, sourceUrl)
- La liste des pages validées (depuis crawl-report.json)
- Les règles de `references/generation-rules.md`
- Si multilingue : les langues détectées et la structure d'URLs

**Ce que l'agent produit :**

1. `npx create-next-app` avec TypeScript + Tailwind + App Router
2. `next.config.js` — SSG, images unoptimized, trailingSlash si le WP original en a
3. `tailwind.config.ts` — couleurs et fonts extraits du site original
4. `globals.css` — tokens CSS depuis les design tokens
5. `lib/config.ts` — coordonnées centralisées (extraites du site ou placeholders)
6. `app/layout.tsx` — fonts, metadata globale
7. `components/layout/Header.tsx` — navigation reproduite depuis le site original
8. `components/layout/Footer.tsx` — footer reproduit
9. `app/not-found.tsx`
10. `app/sitemap.ts` — toutes les URLs migrées
11. `app/robots.ts`
12. `components/CookieBanner.tsx` — RGPD
13. `components/Analytics.tsx` — GA4 conditionnel
14. `app/api/contact/route.ts` — Brevo (si formulaire détecté)
15. `components/ContactForm.tsx` — reproduit les champs du formulaire original
16. Copier images depuis `_migration/assets/images/` → `public/images/`
17. Copier docs depuis `_migration/assets/docs/` → `public/docs/`
18. Si multilingue : `middleware.ts` + structure `app/[lang]/`

**Si designMode = "modernized" :**
- Après le scaffold, utiliser Gemini MCP `create_frontend` pour générer un design system modernisé
- Sauver dans `design-system.md`
- Le design system est transmis aux agents de pages

**Si designMode = "faithful" :**
- Utiliser directement les design tokens extraits
- Reproduire le layout le plus fidèlement possible

### Vérification scaffold
- Le serveur dev tourne sans erreur
- Header + Footer s'affichent
- Fonts et couleurs sont correctes

---

### 4.2 — Pages (en parallèle)

Après le scaffold, **lancer un agent-dev par page en parallèle** (un seul message avec N Task tool calls).

**Pour les gros sites (20+ pages) :** travailler par batch de 10 pages. Ne pas attendre de validation entre les batches — enchaîner automatiquement.

**Contenu commun à chaque agent-dev :**
- Le design system (tokens ou design-system.md)
- `globals.css`
- `lib/config.ts`
- Header.tsx et Footer.tsx (pour cohérence)
- Les rappels non négociables (voir section ci-dessous)

**Contenu spécifique à chaque agent :**
- Le JSON de SA page uniquement (depuis `_migration/pages/[slug].json`)
- Les images de SA page
- Le `assetMaps.imageMap` pour mapper les URLs d'images

**Ce que chaque agent produit :**
- Le fichier `app/[path]/page.tsx` avec le bon slug
- Metadata SEO (title + description copiés mot pour mot de l'original)
- Schema.org JSON-LD (BreadcrumbList + LocalBusiness si accueil)
- Contenu fidèle mot pour mot

### Pour le blog

Si le site a un blog :
1. Créer `content/blog/` avec un fichier JSON par article (depuis `_migration/pages/`)
2. Créer `lib/blog.ts` avec les helpers (getAllPosts, getPostBySlug, getPostsByCategory)
3. Créer les pages : blog index, article, catégorie, tag
4. Implémenter la pagination identique à l'original
5. `generateStaticParams` pour toutes les pages de blog

---

## STEP 5 — REVIEW FINALE

### 5.1 — Vérification contenu (critique)

Pour chaque page migrée :
1. Lire le JSON source (`_migration/pages/[slug].json`)
2. Lire le TSX généré (`app/[path]/page.tsx`)
3. Comparer le texte visible — **chaque phrase du JSON doit être présente mot pour mot dans le TSX**
4. Vérifier les meta title et description
5. Vérifier les alt text des images

Toute divergence → corriger immédiatement.

### 5.2 — Vérification SEO

- Toutes les URLs sont identiques à l'original
- Meta titles et descriptions copiés exactement
- H1 unique par page
- Schema.org présent
- sitemap.xml liste toutes les pages
- robots.txt correct
- hreflang tags si multilingue
- Canonical URLs correctes

### 5.3 — Build test

```bash
pkill -f "next dev" 2>/dev/null
trash [slug-projet]/.next 2>/dev/null
npm --prefix [slug-projet] run build
```

Si le build échoue → corriger et relancer.

### 5.4 — Rapport final

```
MIGRATION COMPLÈTE — [domaine]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pages migrées :    XX/XX
Images :           XX
Documents :        XX
Blog articles :    XX
Langues :          [liste]
Design mode :      faithful / modernized

SEO :
- URLs préservées : ✓
- Meta tags fidèles : ✓
- Schema.org : ✓
- Sitemap : ✓

Build : ✓ SUCCESS

PLACEHOLDERS À COMPLÉTER :
- lib/config.ts → [liste des valeurs manquantes]
- .env.local → BREVO_API_KEY, CONTACT_EMAIL
- GA_ID → à configurer
```

---

## STEP 6 — NETTOYAGE

Après validation finale de l'utilisateur :

```bash
trash [slug-projet]/_migration
```

Supprimer le dossier `_migration/` qui contient les données intermédiaires.

---

## Rappels non négociables

À inclure dans **chaque prompt d'agent-dev** :

### Contenu
- **MOT POUR MOT** — zéro reformulation, zéro correction, zéro ajout
- Si le texte original a une faute → garder la faute
- Si une section n'a pas de contenu → `{/* PLACEHOLDER */}`, jamais de texte inventé
- Meta titles et descriptions : copiés exactement
- Alt text des images : copiés exactement

### SEO
- URLs identiques à l'original (CRITIQUE)
- Pas de changement de slug
- H1 unique par page, identique à l'original
- Schema.org JSON-LD sur chaque page
- Canonical URL sur chaque page

### Technique
- SSG obligatoire
- `<Image>` Next.js pour toutes les images
- Fonts via `next/font`
- Coordonnées dans `lib/config.ts`
- Pas de `line-clamp` ou `truncate` sur du contenu
- Semantic HTML (h1 > h2 > h3)

### Après chaque modification
```bash
pkill -f "next dev" 2>/dev/null
trash [slug-projet]/.next 2>/dev/null
npm --prefix [slug-projet] run dev > /tmp/[slug]-dev.log 2>&1 &
```

---

## Règles absolues

1. **Ne jamais modifier le contenu** — copier mot pour mot, point final
2. **Ne jamais changer une URL** — l'arborescence est sacrée
3. **Ne jamais sauter une étape de validation**
4. **Ne jamais inventer une information** — placeholder si manquant
5. **Toujours inclure le contenu des fichiers dans le prompt de l'agent** — ne pas lui demander de les lire
6. **Paralléliser au maximum** — agents en simultané pour les pages
7. **Batch automatique pour les gros sites** — pas de validation entre batches
