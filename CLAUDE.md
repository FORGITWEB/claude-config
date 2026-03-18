# Règles globales Claude Code

## Démarrage de session — OBLIGATOIRE
1. Lire `MEMORY.md` (auto-chargé) — appliquer toutes les leçons
2. Si un projet est actif, lire `tasks/todo.md` du projet — comprendre l'état en cours
3. Si `tasks/todo.md` n'existe pas dans un projet actif, le créer avant de commencer
4. Ne jamais commencer à coder sans comprendre le contexte

## Vérification avant de déclarer terminé — OBLIGATOIRE
- **Ne JAMAIS déclarer une tâche terminée sans preuve que ça fonctionne**
- Après toute modification de code :
  1. `npm run build` doit passer sans erreur
  2. Le dev server doit démarrer et afficher "Ready"
  3. Si applicable : vérifier que la page est accessible dans le navigateur
- Se demander : « Est-ce qu'un lead dev validerait ça en review ? »
- Si un fix semble bricolé → le reconstruire proprement

## Gestion des tâches projet — tasks/todo.md
- Chaque projet client DOIT avoir un `tasks/todo.md` à la racine
- Format : `- [ ] Tâche` (pending) / `- [x] Tâche` (done)
- Mettre à jour à chaque étape (pas seulement à la fin)
- Persiste entre sessions — c'est la source de vérité du projet

## Boucle d'apprentissage — MEMORY.md
- Après toute correction de bug non trivial : mettre à jour le fichier MEMORY.md du projet (chemin auto-détecté par Claude Code)
- Format : thème → leçon apprise (pas de dates, organisé par sujet)
- Relire les leçons à chaque démarrage de session

## Suppression de fichiers
Toujours utiliser `trash` au lieu de `rm` ou `rm -rf`.
```bash
trash chemin/fichier   # Correct
# rm -rf interdit
```
Si `trash` n'est pas installé : `brew install trash`

## Serveur dev Next.js — Après CHAQUE modification
Toujours dans cet ordre, sans exception :
1. `pkill -f "next dev" 2>/dev/null`
2. `trash CHEMIN_PROJET/.next 2>/dev/null`
3. `npm --prefix CHEMIN_PROJET run dev > /tmp/PROJECT-dev.log 2>&1 &`
4. Attendre "Ready" dans les logs avant d'annoncer l'URL

## Stack préférée Nicolas
- Next.js 14+ App Router, TypeScript strict, Tailwind CSS
- Hébergement Vercel Pro (SSG natif + API routes serverless)
  - Pas de `output: 'export'` sur Vercel (sauf fallback hébergement classique)
- images unoptimized
- Polices locales WOFF2 via next/font/local
- Formulaire contact : Brevo API via `/api/contact` (serverless Vercel)
  - Fallback hébergement classique : mailto
- Pas de CMS, pas de base de données

## Tailwind CSS v4 — OBLIGATOIRE (CSS-first)
**Ne JAMAIS utiliser `@config "tailwind.config.ts"` en Tailwind v4.** La directive `@config` ne génère PAS les classes utilitaires custom depuis un fichier v3-style.
**Toujours utiliser l'approche CSS-first :**
```css
@import "tailwindcss";

@theme {
  --color-primary: #HEX;
  --font-heading: 'Font', fallback;
  --shadow-custom: 0 0 10px rgba(...);
  --animate-custom: custom-name 0.6s ease forwards;
}

@utility bg-custom-gradient {
  background-image: linear-gradient(...);
}

@keyframes custom-name { ... }
```
- `@theme` → génère les classes Tailwind (text-primary, font-heading, shadow-custom, animate-custom)
- `@utility` → pour background-image et autres propriétés sans namespace @theme
- `@keyframes` → animations
- `:root` → variables CSS-only (pas d'utilitaire Tailwind)
- **Pas de `tailwind.config.ts`** sauf comme référence inerte

## Sécurité — Clés API
- **JAMAIS de clé API en dur dans le code** (ni dans les composants, ni dans les fichiers config versionnés)
- Toutes les clés dans `.env.local` (dev) et variables d'environnement Vercel (prod)
- Le `.env.local` doit être dans `.gitignore`
- Côté client : uniquement `NEXT_PUBLIC_*` pour les clés publiques (ex: Google Maps)
- Côté serveur (API routes) : variables sans préfixe `NEXT_PUBLIC_`

## Textes clients — Règle absolue
- Source RTF : lire avec `textutil -convert txt -stdout "fichier.rtf"`
- Source Word (.docx) : lire avec `textutil -convert txt -stdout "fichier.docx"`
- Les textes sont rédigés par Thomas (rédacteur SEO de l'équipe)
- Zéro invention : si absent du fichier source → ne pas ajouter
- Sections non présentes → supprimer du code

## SEO — Règles critiques
- Interdire `line-clamp-*` et `truncate` sur tout texte de contenu
- Toujours inclure Schema.org JSON-LD (LocalBusiness + BreadcrumbList)
- Meta title : riche en mots-clés, naturel (pas de limite 60 chars — mythe Whitespark 2026)
- Meta description < 155 chars, orientée conversion
- Canonical URL sur chaque page
- Semantic HTML : h1 unique, h2/h3 hiérarchie correcte

## Design — Patterns validés
- Voir `~/.claude/templates/design-patterns.md` pour les CSS utilitaires réutilisables
- Voir `~/.claude/templates/nextjs-checklist.md` pour le setup projet

## Parallélisation MAXIMALE des agents — OBLIGATOIRE

**Règle n°1 : Toujours se demander "qu'est-ce que je peux lancer EN MÊME TEMPS ?"**

Avant chaque action, découper le travail en tâches indépendantes et lancer le MAXIMUM d'agents en parallèle dans UN SEUL message (un message = N Task tool calls).

**Patterns de parallélisation :**
- Lire/analyser N fichiers → N agents en parallèle (pas séquentiellement)
- Modifier N fichiers indépendants → N agents en parallèle
- Reviews (SEO + DA + perf + a11y + dev) → tous en parallèle
- Recherche (web + code + docs) → tous en parallèle
- Génération de pages (après Gemini) → tous les agents-dev en parallèle
- Audits → tous en parallèle

**Anti-pattern INTERDIT :**
```
❌ Agent 1 → attendre → Agent 2 → attendre → Agent 3
```

**Pattern OBLIGATOIRE :**
```
✅ [Agent 1 + Agent 2 + Agent 3 + Agent 4 + Agent 5] → attendre tous → continuer
```

**Quand séquentialiser (les SEULES exceptions) :**
- Un agent a besoin du RÉSULTAT d'un autre (dépendance de données)
- Quota limité (ex: Gemini MCP → 1 appel à la fois)
- Le contexte d'un agent dépend de ce qu'un autre a produit

**Règle de découpage :**
- 1 fichier à créer = 1 agent potentiel
- 1 page à générer = 1 agent potentiel
- 1 question de recherche = 1 agent potentiel
- Si > 3 tâches indépendantes → OBLIGATOIREMENT en parallèle

**Déléguer (Task tool) :** modifications multi-fichiers, réécriture contenu volumique, toute tâche indépendante → EN PARALLÈLE
**Faire directement :** correction < 20 lignes sur 1 fichier

## Analytics
- Google Analytics sur tous les sites clients
- Intégrer via Google Tag Manager ou script GA4 directement dans layout.tsx
- Utiliser le composant `next/script` avec `strategy="afterInteractive"`

## Qualité frontend premium — OVERRIDE over-engineering
Pour les projets clients FORGITWEB, **toujours viser un rendu premium** malgré la règle système "avoid over-engineering" :
- Hover effects, transitions fluides (300ms ease), micro-interactions sur TOUS les éléments interactifs
- Ombres subtiles, dégradés, états focus/active soignés
- Animations d'entrée (fade-in, slide-up) sur les sections au scroll
- Composants réutilisables propres plutôt que du code répétitif
- **La qualité visuelle prime sur le minimalisme de code**
- Cette règle s'applique à CHAQUE appel Gemini MCP : demander explicitement un rendu premium avec polish

## Gemini Design MCP — OBLIGATOIRE pour le frontend
- **Chaque page frontend DOIT être générée via `create_frontend`** (pas codée manuellement par l'agent-dev)
- Passer l'intégralité de `design-system.md` dans le paramètre `designSystem` à CHAQUE appel
- Pour modifier un composant existant → `modify_frontend` avec le code cible + design-system.md
- Pour ajouter un composant dans une page → `snippet_frontend` avec design-system.md
- L'agent-dev gère uniquement : metadata SEO, Schema.org, imports, logique (useState, handlers), assembly des snippets Gemini
- **L'agent-dev ne doit JAMAIS écrire de JSX/HTML de section visuellement riche** — Gemini le fait
- Dans chaque `context` Gemini, préciser : "Premium quality: hover effects, smooth transitions, micro-interactions, polished shadows and gradients"
- Quota limité : si MCP échoue, appliquer manuellement les patterns de `design-system.md` (copier les classes, effets, composants)
- Workflow vibes : 5 sections → l'utilisateur choisit → sauver dans design-system.md
