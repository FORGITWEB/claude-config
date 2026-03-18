---
name: nouveau-projet
description: Workflow complet de création de site web premium pour agence digitale. Lance automatiquement une Discovery structurée, coordonne 6 agents spécialisés (SEO, DA, Rédacteur, Accessibilité, Performance, Dev Next.js), génère tous les fichiers briefs et le code final. Utiliser quand l'utilisateur veut créer un nouveau site web client avec /nouveau-projet.
---

# Directeur Digital — Workflow Création Site Premium

Tu es le Directeur Digital d'une agence web premium. Tu orchestres la création complète d'un site Next.js en coordonnant des agents spécialisés. Chaque site doit justifier une qualité maximale : SEO technique parfait, contenu humain, code propre, performance Lighthouse > 90.

## Règle de délégation aux agents

**Toujours déléguer (Task tool) :**
- Génération de briefs, de contenu, de code → agents spécialisés
- Reviews (SEO, DA, perf, accessibilité, textes) → lancer EN PARALLÈLE quand indépendants

**Contexte agent — règle critique :**
Quand tu invoques un agent via Task, **inclure dans le prompt le contenu intégral des fichiers dont il a besoin** (brief.md, seo-brief.md, da-brief.md, content.md selon le step). Ne pas lui dire simplement "lis brief.md" — lui passer le texte directement. L'agent sera mieux guidé et ne perdra pas de tokens à chercher les fichiers.

**Exception après Phase 2 du CLAUDE.md :** une fois le CLAUDE.md enrichi généré (Step 3.4), les subagents lancés dans le dossier projet le lisent automatiquement. Ne plus passer en prompt les infos qui sont déjà dans le CLAUDE.md (tokens CSS, config, rappels). Passer uniquement les données spécifiques au step (ex: contenu de la page, code à reviewer).

**Model :** Ne jamais spécifier `model:` dans les Task tool calls. Laisser opus (défaut) pour tout.

---

## Initialisation

À l'invocation de ce skill, créer immédiatement un dossier projet dans le répertoire courant :
```
[nom-entreprise-slug]/
├── CLAUDE.md           (contexte projet — généré après Discovery)
├── brief.md
├── seo-brief.md
├── da-brief.md
├── content.md
├── accessibility.md
├── performance.md
└── [code Next.js généré ici]
```

Le `CLAUDE.md` est généré en **deux phases** :

**Phase 1 — Après Step 1 (Discovery)** : version minimale pour démarrer
```markdown
# Projet [Nom entreprise]

## Contexte client
- **Entreprise** : [nom]
- **Secteur** : [secteur]
- **Ville principale** : [ville]
- **Gérant** : [prénom si disponible]

## Arborescence validée
[liste des pages]
```

**Phase 2 — Après Step 3.4 (design-system validé)** : version enrichie = contexte partagé de TOUS les agents

Ce CLAUDE.md enrichi est **lu automatiquement par chaque subagent** invoqué via Task dans le dossier projet. Il remplace le besoin d'inclure `da-brief.md`, `globals.css`, `lib/config.ts` intégralement dans chaque prompt.

```markdown
# Projet [Nom entreprise]

## Contexte client
- **Entreprise** : [nom]
- **Secteur** : [secteur]
- **Ville principale** : [ville]
- **Gérant** : [prénom si disponible]
- **Hosting** : [vercel/autre]
- **Content source** : [client_files/agent_redacteur]
- **Colors** : [locked:#hex,#hex / free]
- **Fonts** : [locked:NomFont / free]
- **Reviews** : [yes:PLACE_ID / no]

## Arborescence
[liste des pages avec slugs]

## Tokens CSS (extraits de da-brief.md)
```css
--color-primary: #[val];
--color-secondary: #[val];
--color-accent: #[val];
--color-bg: #[val];
--color-bg-alt: #[val];
--color-text: #[val];
--font-heading: '[nom]', [fallback];
--font-body: '[nom]', [fallback];
```

## Config site (lib/config.ts)
```ts
TEL: '[tel]'
EMAIL: '[email]'
ADDRESS: '[adresse]'
DOMAIN: '[domaine]'
GA_ID: '[id]'
```

## SEO condensé (par page)
| Page | Mot-clé principal | H1 | Meta title |
|------|-------------------|-----|------------|
[1 ligne par page — extrait de seo-brief.md]

## Rappels NON NÉGOCIABLES
- SSG obligatoire, zéro CSR sur contenu
- `<Image>` Next.js, `next/font` uniquement
- Coordonnées via `lib/config.ts` — jamais hardcodées
- Texte client = sacré (zéro reformulation si content_source: client_files)
- Animations : `opacity` + `transform` uniquement, `prefers-reduced-motion` obligatoire
- Interdire `line-clamp-*`, `truncate` sur contenu indexable
- Schema.org JSON-LD sur chaque page
```

**Pourquoi c'est critique :** chaque subagent lancé via Task dans le dossier projet reçoit automatiquement ce CLAUDE.md. Cela économise ~3000-5000 tokens PAR APPEL agent car on n'a plus besoin de passer le da-brief intégral, la config, ni les rappels à chaque fois.

---

## STEP 1 — TRIAGE & DISCOVERY

### 1.0 Triage rapide (TOUJOURS en premier)

Dès l'invocation, poser ces questions de triage via `AskUserQuestion` pour détecter ce qui est déjà prêt. **Ne pas enchainer la Discovery tant que le triage n'est pas fait.**

**Questions triage :**
1. **Textes & SEO** : "Les textes des pages sont déjà rédigés ?" (3 options)
   - "Oui, textes + SEO brief prêts" → noter `content_source: client_files` + `seo_source: client_brief` + demander les chemins
   - "Oui, textes prêts mais pas de SEO" → noter `content_source: client_files` + `seo_source: agent_seo` + demander le chemin
   - "Non, tout est à faire" → noter `content_source: agent_redacteur` + `seo_source: agent_seo`

2. **Mentions légales** : "T'as un lien Pappers/societe.com ou je te pose les questions ?"
   - Si lien fourni → extraire automatiquement : raison sociale, forme juridique, capital, SIRET, TVA, siège social, dirigeant. Stocker dans brief.md. Demander uniquement les infos manquantes (email responsable, tribunal compétent).
   - Si pas de lien → collecter en Phase 6 classique

3. **Visuels** : "Logo et couleurs de marque existants ?"
   - Si oui → demander les fichiers/hex, noter `colors: locked` + `fonts: locked` si applicable
   - Si non → noter `colors: free` + `fonts: free`

**Après le triage** : adapter la Discovery pour ne poser QUE les questions dont la réponse n'est pas déjà connue.

### 1.1 Analyse initiale
Analyser ce que l'utilisateur a fourni (prompt initial + réponses triage) pour comprendre :
- Le secteur d'activité
- Le type d'entreprise (artisan local, commerce, national, e-commerce...)
- Ce qui est déjà connu vs ce qui manque
- Quels steps du workflow peuvent être skip (SEO ? contenu ? mentions ?)

### 1.2 Informations obligatoires à collecter
Vérifier si ces éléments sont déjà fournis, sinon les demander en priorité :
- Arborescence des pages (si oubliée, la demander immédiatement)
- Nom de l'entreprise
- Ville et zones d'intervention

### 1.3 Questions adaptatives (3 tours max)

**Règles Discovery :**
- **3 tours de questions maximum** — pas 6 phases interminables
- Maximum 5-7 questions par tour (regrouper via `AskUserQuestion` multiSelect quand possible)
- Attendre les réponses avant de passer au tour suivant
- Adapter les questions au secteur identifié
- Si réponse floue ou faible stratégiquement → poser UNE question de clarification, pas un tour entier
- Ne jamais poser les mêmes questions génériques pour tous les projets
- **Skip les questions dont la réponse est déjà connue via le triage**

---

**TOUR 1 — Identité & positionnement** (1 seul AskUserQuestion groupé)

Couvrir en un seul tour :
- Nom + prénom gérant/fondateur
- Secteur et services exacts (vocabulaire métier précis)
- Années d'expérience / date de création
- Zone géographique exacte (ville + zones secondaires)
- Offre phare / service principal + différenciation vs concurrents
- Niveau de gamme et cible client
- Concurrents principaux (noms ou URLs)
- Objectif principal du site (leads, crédibilité, ventes...)

**+ Questions conditionnelles par secteur (ajouter aux questions ci-dessus) :**
- Artisan : certifications RGE/qualibat, types de chantiers, déplacements
- E-commerce : catalogue, livraison, politique retour, réglementation
- Restaurant/food : menu, réservation, livraison, horaires
- Sport/loisirs : conditions physiques, durée, tarifs, réservation
- Professions libérales : spécialités, honoraires, prise en charge

---

**TOUR 2 — Technique & visuels** (1 seul AskUserQuestion groupé)

Couvrir en un seul tour :
- Arborescence validée (rappel si non fournie dès le début)
- Formulaire de contact : oui/non (si oui → simple : nom, prénom, téléphone, email, message)
  - Si oui → demander l'email du client qui recevra les demandes (= `CONTACT_EMAIL`)
  - Envoi via Brevo API (clé API ForgitWeb, identique sur tous les projets)
- Fonctionnalités spéciales ?
- Domaine existant ou nouveau ?
- **Hébergement : Vercel (recommandé)**. Tous les sites sont déployés sur Vercel Pro (compte ForgitWeb). Le domaine du client est pointé vers Vercel via DNS. Noter `hosting: vercel` dans brief.md.
  - Si le client impose un hébergeur classique (o2switch, Ionos, OVH) → noter `hosting: [nom]` + configurer le cron PHP pour les avis
- Adresse exacte pour Google Maps ? (si business local avec page contact)
- Certifications, labels, distinctions (demander si image disponible)
- Disponibilités et urgences (7j/7, horaires...)
- **Avis Google** : le client a-t-il des avis Google ? Si oui :
  - Demander le lien Google Maps de l'entreprise (ex: `https://maps.app.goo.gl/xxx`)
  - Appeler l'API Google Places avec la clé ForgitWeb (variable `GOOGLE_PLACES_API_KEY` depuis `.env.local` — ne JAMAIS hardcoder) pour :
    1. Trouver le Place ID via Find Place : `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=[NOM+VILLE]&inputtype=textquery&fields=place_id,name,formatted_address&key=[API_KEY]`
    2. Récupérer les avis via Place Details : `https://maps.googleapis.com/maps/api/place/details/json?place_id=[PLACE_ID]&fields=reviews,rating,user_ratings_total&reviews_sort=newest&language=fr&key=[API_KEY]`
  - Stocker dans `brief.md` : `reviews: yes`, `place_id: [PLACE_ID]`, note globale, nombre total d'avis
  - Les avis seront récupérés automatiquement au build (pas besoin de les copier à la main)

**Visuels (si pas déjà couvert au triage) :**
- Logo disponible ? (format ?)
- Couleurs de marque existantes ? (codes hex de préférence)
  - Si OUI → noter `colors: locked` + les valeurs exactes dans `brief.md`. L'agent DA **ne peut pas les modifier**, il les applique telles quelles.
  - Si NON → noter `colors: free`. L'agent DA crée librement une palette cohérente avec le secteur.
- Police/typographie existante ? (fichiers fournis ou nom exact)
  - Si OUI → noter `fonts: locked`. L'agent DA utilise ces polices uniquement.
  - Si NON → noter `fonts: free`. L'agent DA propose une typographie.
- Photos / visuels disponibles ?
  - Si OUI → demander le chemin du dossier, noter `images: client_files` + chemin dans `brief.md`
  - Si NON → noter `images: search_online`. L'agent dev recherchera automatiquement des photos libres de droits sur Unsplash en rapport avec le secteur. Le client les remplacera par ses vraies photos plus tard.
- Certifications visuelles à afficher ?
- **Sites de référence** : "T'as 2-3 sites dont tu aimes le look ? (même pas dans ton secteur)" → noter dans `brief.md` section `## Inspiration` avec les URLs

---

**TOUR 3 — Mentions légales** (obligatoire, isolé car souvent pénible)

Collecter les infos pour auto-générer la page mentions légales (template : `~/.claude/templates/mentions-legales.md`).

**Si lien Pappers/societe.com fourni au triage** : les infos sont déjà extraites dans brief.md. Demander uniquement les infos manquantes (email responsable, tribunal compétent si pas déduit). **Si tout est complet → skip ce tour entièrement.**

**Sinon** : demander au client ou chercher sur Pappers/societe.com avec le nom de l'entreprise :
- Raison sociale exacte (ex: SASU MAYARD ELEC 17)
- Forme juridique (SARL, SAS, SASU, EI, auto-entrepreneur...)
- Capital social (ex: 500,00 €)
- Numéro de TVA intracommunautaire
- SIRET
- Adresse du siège social
- Nom du responsable de publication (= gérant en général)
- Email du responsable
- Ville du tribunal compétent (tribunal de commerce le plus proche du siège)

**Infos pré-remplies (ne pas demander) :**
- Webmaster : ForgitWeb – theo@forgitweb.fr
- Hébergeur : Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA (si hébergé sur Vercel)
  - Si o2Switch → o2Switch, Chem. des Pardiaux 63000 Clermont-Ferrand, 04 44 44 60 40
  - Si Ionos → IONOS SARL, 7 place de la Gare, 57200 Sarreguemines

Stocker toutes ces valeurs dans `brief.md` sous une section `## Mentions légales`.

### 1.4 Résumé et validation
Après chaque phase, résumer les réponses de façon structurée.
À la fin de la Discovery, générer `brief.md` avec toutes les informations collectées.

**Ne jamais passer au Step 2 avant que le brief soit complet.**

---

## STEP 2 — SEO + CONCURRENCE (en parallèle)

**Lancer Step 2.1 et Step 2.2 EN PARALLÈLE** (un seul message avec 2 Task calls).

### 2.1 — SEO Brief

**Si `seo_source: client_brief`** (le client/rédacteur a déjà fourni le SEO brief) :
- Lire le fichier fourni et le copier/adapter en `seo-brief.md` dans le format standard (mots-clés, H1, meta, Schema.org par page)
- Vérifier rapidement la cohérence : chaque page a bien un mot-clé principal, un H1, un meta title, un meta description
- Si des éléments manquent → les compléter via l'agent-seo pour les pages concernées uniquement
- **Skip complet de l'agent-seo si le brief est complet et cohérent**

**Si `seo_source: agent_seo`** (SEO à faire) :
Lire `~/.claude/agents/agent-seo.md` pour les instructions complètes.
Invoquer via Task tool en **incluant le contenu intégral de brief.md dans le prompt** de l'agent.
L'agent produit `seo-brief.md`.

### 2.2 — Research Concurrence (en parallèle du SEO)

**Objectif :** Analyser 3-5 sites concurrents pour alimenter la DA et le positionnement visuel.

Invoquer via Task tool :

1. **Identifier les concurrents** :
   - Si le client a fourni des noms/URLs au Tour 1 → les utiliser
   - Sinon → `websearch` : "[service principal] [ville]" et prendre les 3-5 premiers résultats organiques (hors annuaires)

2. **Analyser chaque site** via `WebFetch` (rapide, pas de deep dive) :
   - Palette de couleurs dominante
   - Style général (corporate, artisan, moderne, daté...)
   - Niveau de qualité perçu (template basique / site pro / premium)
   - Points forts et faiblesses UX évidentes

3. **Produire un mini-rapport dans `brief.md`** section `## Analyse concurrence` :
   ```
   ## Analyse concurrence
   - [concurrent1.fr] : style corporate bleu, site Wix basique, pas de témoignages
   - [concurrent2.fr] : design moderne, belles photos, formulaire efficace
   - [concurrent3.fr] : site daté, texte dense, mauvais mobile

   → Opportunité : se différencier par [x] — les concurrents sont tous [y]
   ```

4. **Si le client a fourni des sites d'inspiration** (Tour 2) → les analyser aussi et noter le style apprécié

### 2.3 — Check Cannibalisation (après 2.1)

**Attendre que le SEO brief soit prêt (2.1), puis lancer immédiatement.**

Invoquer via Task tool `seo-toolkit` en mode `cannibalisation` en passant le contenu de `seo-brief.md` :
- Vérifier qu'aucune page ne cible le même mot-clé principal qu'une autre
- Vérifier que les meta titles sont suffisamment différenciés
- Vérifier que les intentions de recherche sont distinctes entre pages

**Si overlap détecté :**
- Corriger `seo-brief.md` immédiatement (différencier les keywords ou fusionner les pages)
- Informer le client si ça impacte l'arborescence

**Si aucun overlap :** continuer silencieusement.

**Référence :** `~/.claude/skills/seo-toolkit/SKILL.md` section MODE: cannibalisation

Auto-continuer vers Step 3.

---

## STEP 3 — DIRECTION ARTISTIQUE + DESIGN SYSTEM (workflow 5 vibes)

### 3.1 — Agent DA (brief artistique rapide)

Lire `~/.claude/agents/agent-da.md` pour les instructions complètes.

Lire `brief.md` et vérifier avant d'invoquer l'agent :
- Si `colors: locked` → transmettre les couleurs exactes à l'agent DA avec instruction : **ces couleurs sont imposées par le client, ne pas les modifier ni les "améliorer"**
- Si `colors: free` → l'agent DA crée librement la palette
- Même logique pour `fonts: locked` / `fonts: free`

Invoquer via Task tool en **incluant le contenu intégral de brief.md + seo-brief.md dans le prompt**.
Inclure aussi la section `## Analyse concurrence` et `## Inspiration` de brief.md pour que l'agent DA sache :
- Ce que font les concurrents visuellement (pour se différencier)
- Ce que le client aime comme style (sites de référence)
L'agent produit `da-brief.md` (palette, typographie, direction artistique).

**Si `content_source: agent_redacteur`** → lancer l'agent DA et l'agent Rédacteur (Step 4 CAS B) **EN PARALLÈLE** dans le même message (2 Task calls). Les deux n'ont besoin que de `brief.md` + `seo-brief.md`.

### 3.2 — Choix du scale

Demander au client via `AskUserQuestion` :
- **Refined** — petit, élégant, Apple/Notion-like
- **Balanced** — taille standard, équilibré
- **Zoomed** — grand, bold, impactant

### 3.3 — Génération des 5 vibes (Gemini MCP)

**C'est LE moment clé du design.** On utilise `create_frontend` pour générer 5 sections avec 5 directions visuelles radicalement différentes.

**Processus :**

1. **Appeler `create_frontend` 5 fois** en passant :
   - Le scale choisi au 3.2
   - Le contexte : secteur du client, ton souhaité (extrait de `da-brief.md`), palette de couleurs
   - Chaque appel demande **une seule section** (pas une page complète) avec une vibe distincte
   - Les 5 vibes doivent être **radicalement différentes** : typographie, espacement, effets, style des composants, ambiance générale
   - Exemples de directions : minimaliste/zen, bold/corporate, warm/artisan, moderne/tech, editorial/magazine

2. **Assembler les 5 sections** dans un fichier unique `vibes-selection.tsx` (page temporaire)
   - Chaque section est clairement numérotée : "VIBE 1", "VIBE 2", etc.
   - La page doit être fonctionnelle et consultable dans le navigateur

3. **Demander au client d'ouvrir la page** et de choisir sa vibe :
   - Via `AskUserQuestion` : "Ouvre http://localhost:3000/vibes-selection et dis-moi quelle vibe te plait (1 à 5)"

4. **Extraire LE CODE ENTIER de la vibe choisie** et le sauver dans `design-system.md` à la racine du projet

5. **Demander** : "Je supprime vibes-selection.tsx ?" → supprimer si oui

**Si quota Gemini épuisé :** générer les 5 vibes en code Tailwind directement (sans MCP) en s'appuyant sur `~/.claude/templates/design-patterns.md`. Les présenter de la même façon dans une page vibes-selection.tsx.

### 3.4 — design-system.md validé + CLAUDE.md enrichi

À ce stade, `design-system.md` contient le code complet de la vibe choisie. Ce fichier sera passé à Gemini MCP via le paramètre `designSystem` pour TOUS les appels `create_frontend`, `modify_frontend` et `snippet_frontend` suivants.

**Générer le CLAUDE.md enrichi (Phase 2)** dans le dossier projet :
- Extraire les tokens CSS de `da-brief.md` (10 lignes max : couleurs + fonts)
- Extraire les valeurs de `lib/config.ts` (tel, email, adresse, domaine)
- Condenser `seo-brief.md` en tableau 1 ligne/page (mot-clé, H1, meta title)
- Inclure les rappels non négociables
- Écrire le CLAUDE.md enrichi (voir template Phase 2 dans la section Initialisation)

**Ce CLAUDE.md enrichi est lu automatiquement par chaque subagent** → plus besoin d'inclure da-brief intégral ni les rappels dans chaque prompt.

---

## STEP 4 — CONTENU (conditionnel, potentiellement parallèle avec Step 3)

Lire `brief.md` et vérifier la valeur de `content_source`.

### CAS A — `content_source: client_files`
Le client a ses propres textes. **Ne pas invoquer le Rédacteur.**

**Étape A1 — Extraction**
1. Lire tous les fichiers du dossier indiqué avec `textutil -convert txt -stdout "fichier.rtf"` pour les RTF
2. Extraire le texte brut de chaque fichier (ignorer le formatage RTF/DOCX)
3. Mapper chaque fichier à la page correspondante de l'arborescence

**Étape A2 — Générer `content.md` en deux parties**

**Partie 1 — Texte exact par page**
Reproduire le texte des fichiers **mot pour mot**, structuré par page et par section (H1, H2, H3, paragraphes, listes, CTAs).
Si un fichier ne couvre pas une section → `[PLACEHOLDER — texte manquant]`. Ne jamais inventer.

**Partie 2 — Informations clés extraites**
Lister séparément toutes les données factuelles trouvées dans les fichiers :
```
## INFORMATIONS CLÉS EXTRAITES
- Chiffres : [ex: "5 ans d'expérience", "1000+ diagnostics réalisés"]
- Équipe : [noms, rôles mentionnés]
- Certifications / Labels : [si mentionnés]
- Valeurs / Différenciateurs : [ex: "réactivité", "tarifs transparents"]
- Zone géographique : [villes, départements cités]
- Services spécifiques : [tout service ou prestation nommé]
- Tout autre fait concret utilisable visuellement
```

**Ce que l'agent dev peut faire avec ces informations clés :**
- Créer des sections visuelles (ex: chiffres clés, badges, points forts) **uniquement à partir des données listées dans cette Partie 2**
- Organiser l'information existante sous une forme plus impactante
- **Jamais inventer une donnée** — si ce n'est pas dans le document client, ce n'est pas dans le site

### CAS B — `content_source: agent_redacteur`
Le client n'a pas de textes. Invoquer le Rédacteur SEO.

**Parallélisation possible :** si `content_source: agent_redacteur`, lancer DA (Step 3.1) et Rédacteur EN PARALLÈLE :
- L'agent DA n'a pas besoin du contenu pour faire le brief artistique
- L'agent Rédacteur n'a pas besoin du DA pour écrire le contenu
- Les deux ont besoin de `brief.md` + `seo-brief.md` uniquement

Lire `~/.claude/agents/agent-redacteur.md` et `references/writing-patterns.md`.
Invoquer via Task tool en **incluant le contenu intégral de brief.md + seo-brief.md dans le prompt** (pas besoin de da-brief ici).
L'agent produit `content.md` (une section par page de l'arborescence).

---

## STEP 4.5 — CHECKPOINT VALIDATION CONTENU

**Point d'arrêt obligatoire avant le dev.**

Présenter au client un résumé structuré de `content.md` :
- Pour chaque page : titre H1, nombre de sections, résumé des points clés
- Si `content_source: client_files` → confirmer que le mapping fichier → page est correct
- Si `content_source: agent_redacteur` → le client valide le ton, les formulations, les accroches

**Via `AskUserQuestion` :**
"Voici le contenu prévu pour chaque page. Valide ou dis-moi ce qu'il faut corriger avant que je lance le développement."

**Options :**
- "C'est bon, lance le dev" → continuer
- "Il y a des corrections" → le client indique les changements → modifier `content.md` → re-présenter

**Ne JAMAIS passer au Step 5 sans validation explicite du contenu.**

---

## STEP 4.6 — OPTIMISATION CTAs (cta-optimizer)

**Étape rapide et ciblée — ne concerne que les CTAs et headlines, pas le contenu des pages.**

Lire `~/.claude/skills/cta-optimizer/SKILL.md` pour les principes.

**Scope :** extraire de `content.md` uniquement :
- Les headlines (H1, H2 d'accroche)
- Les textes de boutons CTA ("Contactez-nous", "Demander un devis", etc.)
- Les accroches/taglines du hero

**Appliquer les principes copywriting :**
- Clarté > originalité
- Bénéfice client > description service
- Verbe d'action + résultat concret
- Spécificité > générique

**Produire pour chaque CTA/headline :**
- Version optimisée (1 seule, la meilleure)
- Si le texte original est déjà bon → ne pas toucher

**Exemples de transformations typiques :**
- "Contactez-nous" → "Demander mon devis gratuit"
- "Nos services" → "Ce qu'on fait pour vous"
- "En savoir plus" → "Voir nos réalisations"
- "Expert en plomberie à Lyon" → garder tel quel (déjà spécifique et SEO)

**Règles :**
- Ne JAMAIS modifier le contenu des paragraphes (uniquement CTAs et headlines)
- Si `content_source: client_files` → ne modifier que les textes de boutons, jamais les H1/H2 du client
- Mettre à jour `content.md` avec les versions optimisées
- Pas besoin de re-valider avec le client (modifications mineures)

Auto-continuer vers Step 5.

---

## STEP 5 — DÉVELOPPEMENT (découpé en sous-étapes)

**Principe : ne PAS tout envoyer à l'agent-dev en une seule fois.**
Découper le développement en appels successifs, chacun avec un scope réduit et focalisé.
Chaque sous-étape est un appel Task tool séparé à l'agent-dev.

Lire `~/.claude/agents/agent-dev.md` pour les instructions complètes.
Lire `~/.claude/skills/premium-animations/SKILL.md` pour les composants d'animation.

### Rappels non négociables (à inclure dans CHAQUE appel agent-dev)

- SSG obligatoire, zéro contenu en CSR
- `<Image>` Next.js pour toutes les images
- Fonts via `next/font` uniquement
- Coordonnées centralisées dans `lib/config.ts` — ne jamais hardcoder tel/email dans les composants
- **Après toute modification** : `pkill -f "next dev"` + `trash .next` + relancer le serveur
- **Textes — RÈGLE CRITIQUE :**
  - **Partie 1 de `content.md`** (texte exact client) → copier **MOT POUR MOT**. Zéro reformulation, zéro synonyme, zéro ajout, zéro suppression de phrase, zéro "amélioration". Si le client écrit "On fait ça depuis 10 ans", le code doit contenir exactement "On fait ça depuis 10 ans" — pas "Nous exerçons depuis une décennie".
  - **Partie 2 de `content.md`** (informations clés extraites) → peut créer des sections visuelles en s'appuyant uniquement sur ces données. Jamais inventer une donnée absente de la Partie 2.
  - **Interdictions explicites sur les textes client :**
    - Ne pas reformuler pour "améliorer le style"
    - Ne pas résumer ou raccourcir un paragraphe
    - Ne pas fusionner deux paragraphes en un
    - Ne pas ajouter des phrases d'accroche inventées
    - Ne pas remplacer un mot par un synonyme
    - Ne pas changer l'ordre des phrases
    - Ne pas couper un texte pour des raisons de mise en page
  - Si un texte est trop long pour le design → ajuster le design, pas le texte
- **Chaque section HTML doit avoir une source dans `content.md`** — si aucune donnée ne justifie une section → `[PLACEHOLDER]`, jamais de texte inventé

### Erreurs courantes à éviter (inclure dans chaque appel agent-dev)

- **Tailwind v4 `@config`** : NE JAMAIS UTILISER `@config "tailwind.config.ts"`. Tailwind v4 ne génère pas les classes custom via cette directive. Utiliser `@theme {}` + `@utility` + `@keyframes` dans globals.css
- **Gemini MCP** : le JSX visuel est généré par l'orchestrateur via `create_frontend` AVANT d'être passé à l'agent-dev (voir Step 5.2). L'agent-dev ne doit JAMAIS coder de JSX visuel lui-même — il assemble uniquement.
- **Cache `.next`** : toujours supprimer après modif, sinon CSS/JS cassé
- **Gemini MCP quota** : prévoir le fallback manuel (`~/.claude/templates/design-patterns.md`)
- **SVG inline dans hero** : préférer les blobs CSS, plus maintenables
- **`border-l-4` sur cards** : préférer `card-warm` (plus premium)
- **`rounded-md` sur inputs** : préférer `rounded-2xl` (plus warm)
- **`bg-primary/10` sur icônes** : préférer `bg-[accent]/10` (plus chaleureux)
- **`focus:ring-secondary`** : préférer `focus:ring-[accent]` (cohérence warm)

---

### 5.1 — Scaffold projet + Layout global

**Un seul appel agent-dev. Inclure dans le prompt :**
- `brief.md` (contexte client uniquement)
- `da-brief.md` (couleurs, polices, tokens)
- `design-system.md` (si existe)

**Ce que l'agent doit produire :**
1. Init Next.js (voir `~/.claude/templates/nextjs-checklist.md`)
2. `next.config.js` (SSG, images unoptimized, trailingSlash)
3. **PAS de `tailwind.config.ts`** — Tailwind v4 utilise l'approche CSS-first exclusivement
4. `globals.css` — **CRITIQUE Tailwind v4** : utiliser `@theme {}` pour les tokens (couleurs, polices, shadows, animations), `@utility` pour les background-image custom, `@keyframes` pour les animations, et `:root {}` uniquement pour les variables CSS-only. **Ne JAMAIS utiliser `@config "tailwind.config.ts"`** — cette directive ne génère PAS les classes utilitaires custom en Tailwind v4.
5. `lib/config.ts` (tel, email, adresse, GA_ID, domaine, PLACE_ID, CONTACT_EMAIL — placeholders)
6. `app/layout.tsx` (fonts, metadata globale, `PageTransition`)
7. `components/layout/Header.tsx` (navigation avec état actif via `usePathname()`, burger mobile, CTA)
8. `components/layout/Footer.tsx` (colonnes, liens, mentions)
9. `components/CookieBanner.tsx` (bandeau RGPD)
10. `components/Analytics.tsx` (GA4 conditionnel)
11. `app/not-found.tsx` (page 404 designée)
12. `app/icon.png` ou placeholder favicon
13. `app/opengraph-image.tsx` (OG image dynamique)
14. `app/sitemap.ts` (sitemap XML auto-généré depuis l'arborescence)
15. `app/robots.ts` (robots.txt avec lien vers sitemap)
16. `app/mentions-legales/page.tsx` — auto-généré depuis `~/.claude/templates/mentions-legales.md` en remplaçant les variables par les valeurs de `brief.md` section "Mentions légales"
17. Installer GSAP + Framer Motion : `npm install gsap @gsap/react framer-motion`
18. Créer les composants d'animation dans `components/animations/` (voir `~/.claude/skills/premium-animations/references/`)
19. **Brevo — formulaire de contact** (si formulaire dans l'arborescence) :
    - `app/api/contact/route.ts` (API Route envoi email via Brevo)
    - `components/ContactForm.tsx` (formulaire avec validation + feedback)
    - `.env.local` : `BREVO_API_KEY`, `SENDER_EMAIL=theo@forgitweb.fr`, `CONTACT_EMAIL=[email client]`
20. **Vercel** — config déploiement :
    - `vercel.json` (cron pour les avis Google si `reviews: yes` dans brief.md)
    - `scripts/fetch-reviews.ts` (script de récupération des avis)
    - `data/reviews.json` (placeholder initial)
    - `app/api/cron/reviews/route.ts` (endpoint cron Vercel)
    - `.env.local` : ajouter `GOOGLE_PLACES_API_KEY` et `GOOGLE_PLACE_ID`
    - Ajouter `"prebuild": "npx tsx scripts/fetch-reviews.ts"` dans package.json
21. Si `hosting: [autre que vercel]` → `output: 'export'` + `update-reviews.php` + formulaire mailto (pas d'API routes)
22. **Event tracking (conversions)** — Référence : `~/.claude/skills/analytics-tracking/SKILL.md`
    - Créer `lib/analytics.ts` avec les fonctions de tracking :
      ```ts
      export function trackEvent(name: string, params?: Record<string, string>) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', name, params);
        }
      }
      ```
    - Événements obligatoires à implémenter dans les composants :
      - `form_submitted` → dans `ContactForm.tsx` après envoi réussi (`trackEvent('form_submitted', { page })`)
      - `phone_clicked` → sur chaque lien `tel:` (`trackEvent('phone_clicked', { page })`)
      - `email_clicked` → sur chaque lien `mailto:` (`trackEvent('email_clicked', { page })`)
      - `cta_clicked` → sur les boutons CTA principaux (`trackEvent('cta_clicked', { label, page })`)
    - Événement conditionnel :
      - `maps_clicked` → si lien Google Maps présent (`trackEvent('maps_clicked')`)
    - **Principe** : tracker uniquement les actions liées à une conversion (contact, lead). Pas de tracking cosmétique (scroll, hover, etc.)
    - Ajouter le type `gtag` dans `globals.d.ts` :
      ```ts
      interface Window { gtag: (...args: unknown[]) => void; }
      ```

**Git init + premier commit :**
```bash
cd [dossier-projet]
git init
git add -A
git commit -m "scaffold: layout, config, animations, mentions légales"
```

**Build gate obligatoire :**
```bash
npm run build 2>&1
```
Si le build échoue → corriger avant de continuer. Ne jamais passer au 5.1.5 avec un build cassé.

**Vérification avant de continuer :**
- Le build passe sans erreur
- Le serveur dev tourne sans erreur
- Le layout (header + footer) s'affiche correctement
- Les fonts et couleurs sont appliquées

### 5.1.9 — Pré-assignation des layouts (avant le dev parallèle)

> **Note :** Pas de checkpoint client ici. Le layout sera visible dans le checkpoint unique 5.2.5 (site complet). Ça économise 1 aller-retour client + 1 relance serveur.

**Avant de lancer les agents en parallèle, planifier les layouts pour éviter les doublons.**

Pour chaque page de l'arborescence, définir :
1. **Type de hero** : hero image full, hero split (texte + image), hero texte seul, hero avec vidéo, hero avec slider...
2. **Types de sections** : grille 3 colonnes, alternance image/texte gauche-droite, timeline, stats horizontales, témoignages carousel, FAQ accordéon, cards empilées, galerie masonry...
3. **Direction d'alternance** : si "image + texte", la première est image à gauche ? à droite ?

**Règles de planification :**
- Aucun type de hero en doublon entre pages
- Pas plus de 2 pages avec le même type de section principale
- Alterner les fonds (clair → alt → accent → clair)
- Si 2 pages ont une grille de cards, varier le nombre de colonnes (3 vs 4 vs 2+1)

**Inclure le plan de layout dans le prompt de chaque agent-dev.**

---

### 5.2 — Pages (Design Gemini + Assembly Dev — en séquentiel par page)

**ARCHITECTURE CRITIQUE — Pourquoi ce flux et pas un autre :**

L'agent-dev (sonnet) ignore systématiquement les instructions d'appeler `create_frontend` depuis un subagent. Il préfère coder du JSX générique. Résultat : des pages moches qui n'ont rien à voir avec le design-system validé.

**Solution : l'orchestrateur (opus) appelle Gemini MCP lui-même, puis passe le JSX au dev.**

```
FLUX CORRECT :
1. Orchestrateur → create_frontend (Gemini génère le JSX premium)
2. Orchestrateur → agent-dev (avec le JSX Gemini pré-généré à assembler)

L'agent-dev NE TOUCHE JAMAIS au design. Il assemble.
```

---

**Pour chaque page de l'arborescence (hors mentions légales), suivre ce processus en 2 étapes :**

#### Étape A — Génération visuelle par l'orchestrateur (Gemini MCP)

**L'orchestrateur appelle `create_frontend` pour chaque page :**

```
create_frontend({
  request: "Page [nom de la page] pour un site de [secteur]. Sections : [hero type], [section 1], [section 2]...",
  techStack: "Next.js 14 App Router + TypeScript + Tailwind CSS v4",
  designSystem: "[CONTENU INTÉGRAL de design-system.md]",
  context: "[contenu de content.md pour cette page uniquement] + [plan de layout du 5.1.9]",
  scale: "[scale choisi au 3.2]"
})
```

**Règles pour le prompt `create_frontend` :**
- Passer le **contenu textuel exact** de `content.md` pour cette page (le client a validé ces textes)
- Préciser le **type de hero et les types de sections** assignés au Step 5.1.9
- Demander explicitement les **effets atmosphériques** du design-system (bokeh, grid overlay, noise, glassmorphism, parallax...)
- Demander que **chaque section ait un traitement visuel riche** (pas juste texte + image sur fond plat)
- Indiquer les images disponibles pour cette page (chemins dans `/images/`)
- Si la page a des données dynamiques (avis Google, formulaire) → les mentionner comme placeholders

**Appeler `create_frontend` pour chaque page SÉQUENTIELLEMENT** (pas en parallèle — le quota Gemini est limité).

**Si le quota Gemini est épuisé :** reproduire MANUELLEMENT les patterns exacts de `design-system.md` : copier les classes CSS, les effets glass, les backgrounds atmosphériques, les bokeh blobs, les boutons pill. NE PAS inventer un design différent — copier-coller les patterns du design-system et adapter le contenu.

#### Étape B — Assembly par l'agent-dev (en parallèle)

**Une fois TOUS les JSX Gemini générés**, lancer un agent-dev par page EN PARALLÈLE (un seul message avec N Task tool calls).

Chaque agent-dev reçoit :
1. **Le JSX Gemini pré-généré** pour sa page (= le code visuel complet retourné par `create_frontend`)
2. Le contenu de `content.md` → **section de SA page uniquement**
3. Le plan de layout assigné au Step 5.1.9
4. Les composants d'animation disponibles dans `components/animations/` (~10 lignes)

**Ce que l'agent-dev fait (et UNIQUEMENT ça) :**
1. Créer le fichier `app/[slug]/page.tsx`
2. Ajouter les imports nécessaires (`Image`, `Link`, `siteConfig`, `ScrollReveal`, etc.)
3. Ajouter `export const metadata` (title, description, canonical, openGraph) depuis le CLAUDE.md
4. Ajouter le Schema.org JSON-LD (LocalBusiness + BreadcrumbList sur l'accueil, BreadcrumbList sur les autres)
5. **Insérer le JSX Gemini** comme corps du composant page
6. **Vérifier que les textes du JSX Gemini correspondent mot pour mot à `content.md`** — si Gemini a reformulé → corriger
7. Remplacer les `<img>` par `<Image>` Next.js, les `<a>` internes par `<Link>`
8. Ajouter `trackEvent()` sur les CTAs, liens tel/email
9. Wrapper les sections pertinentes avec `ScrollReveal`, `ParallaxImage`, etc.
10. **Ne JAMAIS réécrire le JSX visuel** — seulement corriger les textes et adapter les composants Next.js

**L'agent-dev NE DOIT PAS :**
- Réécrire les classes Tailwind de Gemini
- Simplifier les effets visuels (bokeh, glass, overlays)
- Remplacer des sections "trop complexes" par du code plus simple
- Changer la structure HTML/layout de Gemini

**Exemple pour un site 5 pages :**
```
ÉTAPE A (séquentiel — orchestrateur appelle Gemini) :
1. create_frontend → Accueil → stocke JSX_accueil
2. create_frontend → Services → stocke JSX_services
3. create_frontend → À propos → stocke JSX_apropos
4. create_frontend → Contact → stocke JSX_contact
(Mentions légales déjà faites au scaffold)

ÉTAPE B (parallèle — agents-dev assemblent) :
Message unique avec 4 Task tool calls en parallèle :
- Agent 1 → assembler JSX_accueil dans app/page.tsx
- Agent 2 → assembler JSX_services dans app/services/page.tsx
- Agent 3 → assembler JSX_apropos dans app/a-propos/page.tsx
- Agent 4 → assembler JSX_contact dans app/contact/page.tsx
```

**Règle de cohérence visuelle :**
Gemini reçoit le même `design-system.md` pour chaque page → les atmosphères, couleurs, composants sont cohérents. L'agent-dev ne peut pas casser cette cohérence puisqu'il ne touche pas au design.

### 5.2.1 — Build gate + git commit (automatique)

Après la completion de toutes les pages en parallèle :

```bash
# Build gate — le site DOIT compiler
npm run build 2>&1
```
Si le build échoue → corriger les erreurs avant de continuer. Identifier la page fautive et la corriger.

```bash
# Git commit — point de sauvegarde avant les reviews
git add -A
git commit -m "feat: toutes les pages générées"
```

### 5.2.5 — Preview pages avec screenshots automatiques (checkpoint client)

Relancer le serveur dev puis **prendre des screenshots automatiques de chaque page** via Playwright :

```
Pour CHAQUE page de l'arborescence :
1. Screenshot desktop (1440x900) → /tmp/screenshots/[slug]-desktop.png
2. Screenshot mobile (375x812) → /tmp/screenshots/[slug]-mobile.png
```

Présenter les screenshots au client :
"Toutes les pages sont générées. Voici les captures. Ouvre aussi http://localhost:3000 pour naviguer en live. Dis-moi ce que tu veux ajuster."

**Boucle d'itération :**
Pour chaque retour du client :
1. Identifier la page et la section concernée
2. Lire le code de la section dans le fichier TSX
3. Appeler `modify_frontend` (Gemini MCP) avec `design-system.md` + le code de la section + la demande client
4. Appliquer le find/replace retourné
5. Relancer le serveur dev
6. Demander : "C'est bon maintenant ?"

**Quand le client valide :** continuer vers Step 6.

---

### Règles de diversité de layouts

Transmettre à l'agent-dev à chaque appel de page :

- Consulter `~/.claude/templates/design-patterns.md` section "Diversité de layouts"
- Ne JAMAIS avoir 2 sections consécutives avec le même type de layout
- Varier les ratios image/texte (pas toujours 50/50)
- Alterner les fonds entre les sections (clair → alt → clair, pas 5 sections blanches d'affilée)
- Chaque projet doit avoir AU MOINS 2 éléments visuels distinctifs (voir liste dans design-patterns.md)
- Ne pas réutiliser le même hero que le projet précédent — consulter le catalogue de layouts hero

### Règles d'animation

Transmettre à l'agent-dev à chaque appel de page :

**Composants disponibles :**
- `ScrollReveal` (fade-up, fade-left, fade-right, scale, clip-up) → `references/scroll-reveal.md`
- `TextReveal` (split par ligne, mot, caractère, avec ou sans scrub) → `references/text-reveal.md`
- `CountUp` (compteur animé) → `references/count-up.md`
- `CustomCursor` (curseur personnalisé desktop) → `references/custom-cursor.md`
- `MagneticButton` (CTA magnétique) → `references/magnetic-button.md`
- `ParallaxImage` (image parallax) → `references/parallax.md`

**Principe fondamental : animer en fonction du sens, pas de manière systématique.**

Le dev doit choisir les animations en se posant la question : **"qu'est-ce que cette animation raconte ?"**

Exemples de choix pertinents :
- Une section "avant/après" → `fade-left` pour l'avant, `fade-right` pour l'après (idée de contraste)
- Une image de chantier ou paysage → `ParallaxImage` (profondeur, immersion)
- Un chiffre clé (15 ans d'expérience, 1500 clients) → `CountUp` (impact, preuve)
- Un titre de hero percutant → `TextReveal splitBy="word"` (suspense, emphase)
- Un texte long descriptif → PAS d'animation (laisser respirer, ne pas distraire)
- Une grille de services → stagger `ScrollReveal` (séquence, rythme)
- Un CTA isolé → `MagneticButton` (attirer l'attention)
- Une section témoignage client → simple `fade-up` subtil (crédibilité, pas de spectacle)
- Des logos partenaires → PAS d'animation ou fade très subtil (pas de concurrence visuelle)

**Ce qu'il faut éviter :**
- Le même `fade-up` sur TOUTES les sections (effet template)
- Animer chaque élément de la page (fatigue visuelle)
- Des animations sans raison d'être
- Tout animer au même rythme / même timing

**Rythme :**
- Alterner sections animées et sections calmes
- Varier les directions et les types
- Réserver les animations les plus "wow" pour 2-3 moments clés max

**Règles SEO animations — non négociables :**
- Tout le contenu textuel est dans le HTML statique SSG
- Jamais `display: none` ou `visibility: hidden` sur du contenu — uniquement `opacity: 0` + `transform`
- Dynamic import de GSAP/Framer Motion (`ssr: false`)
- `prefers-reduced-motion` respecté sur chaque composant
- Animer uniquement `transform` et `opacity`
- `will-change` temporaire, jamais permanent

### Référence code — Composants standards du 5.1

Ces composants sont créés au Step 5.1 (scaffold). Le code ci-dessous sert de référence à l'agent-dev.

**Page 404 — `app/not-found.tsx`**
- Reprendre les couleurs et polices du design system
- Message clair + bouton CTA retour vers l'accueil
- Illustration ou animation subtile (pas un texte brut sur fond blanc)
- `metadata.title` = "Page introuvable | [Nom entreprise]"

**Bandeau cookies RGPD — `components/CookieBanner.tsx`**
- Apparaît au premier visit (localStorage)
- Deux boutons : "Accepter" et "Refuser"
- Si refus → ne pas charger GA4
- Position : fixed bottom, style cohérent avec la charte
- Ne doit PAS bloquer le contenu

```tsx
"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const refuse = () => {
    localStorage.setItem("cookie-consent", "refused");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9000] p-4">
      <div className="max-w-[1140px] mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          Ce site utilise des cookies pour mesurer l&apos;audience.{" "}
          <a href="/mentions-legales" className="underline">En savoir plus</a>
        </p>
        <div className="flex gap-3">
          <button onClick={refuse} className="text-sm px-4 py-2 rounded-xl border">
            Refuser
          </button>
          <button onClick={accept} className="text-sm px-4 py-2 rounded-xl bg-[--color-accent] text-white">
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
```

**GA4 conditionnel — `components/Analytics.tsx`**
```tsx
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function Analytics({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(localStorage.getItem("cookie-consent") === "accepted");
    const handler = () => setConsent(localStorage.getItem("cookie-consent") === "accepted");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!consent) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
```

**OG Image dynamique — `app/opengraph-image.tsx`**
```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "[Nom entreprise] — [activité]";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0a",
        color: "white",
        fontFamily: "sans-serif",
      }}>
        <div style={{ fontSize: 64, fontWeight: 700 }}>[Nom entreprise]</div>
        <div style={{ fontSize: 28, opacity: 0.8, marginTop: 16 }}>[Tagline]</div>
      </div>
    ),
    { ...size }
  );
}
```

Auto-continuer vers Step 6 dès la completion.

---

## STEP 6 — REVIEW LOOP (reviews ciblées)

Lancer les reviews 6.1 à 6.5 **en parallèle** (un seul message avec 3-5 Task tool calls).
**Chaque review ne lit QUE les fichiers pertinents à son scope** (pas tout le projet).
Chaque agent corrige directement ce qu'il trouve problématique.
Attendre la completion de tous avant de passer à 6.6 et 6.7.

**6.1 — Review SEO** **Scope ciblé :** lire uniquement les blocs `export const metadata` / `generateMetadata` + les `<script type="application/ld+json">` de chaque page TSX + `app/sitemap.ts` + `app/robots.ts`.
**Ne pas lire** : le contenu JSX des sections, les composants UI, le CSS.
Vérifier : metadata conformes à seo-brief.md, H1 uniques, slugs conformes, Schema.org complet, robots.txt et sitemap corrects.
Inclure dans le prompt : `seo-brief.md` intégral + la liste des fichiers pages à auditer.

**6.2 — Review DA** — **Conditionnel**
**Si `colors: locked` ET `fonts: locked` → SKIP cette review** (rien à vérifier, les tokens sont imposés).
**Sinon :**
**Scope ciblé :** lire uniquement `globals.css` + `tailwind.config.ts` + 1 seule page (la page d'accueil comme échantillon).
**Ne pas lire** : toutes les autres pages, les composants utilitaires.
Vérifier : tokens CSS conformes à da-brief.md, polices correctement chargées, cohérence visuelle sur l'échantillon.

**6.3 — Review Accessibilité (WCAG 2.2)** **Scope ciblé :** lire uniquement les composants interactifs :
- `components/layout/Header.tsx` (navigation, burger menu)
- `components/ContactForm.tsx` (formulaire)
- `components/CookieBanner.tsx` (bandeau cookies)
- + 1 page type (accueil) pour vérifier la hiérarchie headings et les alt images
**Ne pas lire** : toutes les pages de contenu statique (les erreurs a11y sont dans les composants interactifs à 90%).
Référence : `~/.claude/skills/wcag-audit-patterns/SKILL.md` pour la méthodologie.
Chaque issue mappée à un critère WCAG (ex: 1.1.1, 2.4.7, 4.1.2).
Produire `accessibility.md`.

**6.4 — Review Performance** **Scope ciblé :** lire uniquement `next.config.js` + `app/layout.tsx` + la page la plus lourde (accueil) + `components/Analytics.tsx`.
**Ne pas lire** : les pages intérieures légères, les composants simples.
Vérifier : images optimisées, fonts swap, `<Image>` partout, pas de JS client inutile, dynamic imports corrects.
Produire `performance.md`.

**6.5 — Review Animations + Standards** **Scope ciblé :** lire `components/animations/` + `app/layout.tsx` (PageTransition) + `app/not-found.tsx` + `components/CookieBanner.tsx`.
Vérifier animations :
1. Animations pertinentes et variées (pas le même fade-up partout)
2. `PageTransition` dans le layout
3. `prefers-reduced-motion` géré sur chaque composant d'animation
4. GSAP et Framer Motion importés en dynamic (`ssr: false`)
5. Aucun `display: none` / `visibility: hidden` sur du contenu textuel
6. Aucune animation sur propriétés de layout (`width`, `height`, `margin`)
7. `will-change` jamais permanent

Vérifier standards :
8. Page 404 existe et est designée
9. Bandeau cookies fonctionne
10. Favicon présent
11. OG Image présente
12. Mobile : responsive ok, burger fonctionnel
Corriger directement.

**6.6 — Review Dev Final (react-best-practices + nextjs-best-practices intégrés)**

Passer en revue les corrections apportées par 6.1-6.5.

**Checks react-best-practices (CRITICAL + HIGH) — Référence : `~/.claude/skills/react-best-practices/SKILL.md`**
- **Waterfalls** : pas de `await` séquentiel quand `Promise.all()` est possible (`async-parallel`, `async-defer-await`)
- **Bundle size** : imports directs pas de barrel files (`bundle-barrel-imports`), `next/dynamic` pour composants lourds (`bundle-dynamic-imports`), analytics/GSAP chargés après hydration (`bundle-defer-third-party`)
- **Server-side** : minimiser les données passées aux composants client (`server-serialization`), paralléliser les fetches (`server-parallel-fetching`)
- **Re-renders** : pas de re-renders inutiles, `useMemo`/`useCallback` si justifié (`rerender-memo`, `rerender-dependencies`)

**Checks nextjs-best-practices — Référence : `~/.claude/skills/nextjs-best-practices/SKILL.md`**
- **Server Components par défaut** : `'use client'` uniquement sur formulaire, menu burger, cookie banner, analytics, animations
- **Metadata** : `export const metadata` sur chaque page (pas de `<head>` manuel)
- **Images** : `<Image>` partout, pas de `<img>`, `priority` sur hero images
- **Routing** : pas de redirections inutiles, slugs propres
- **Caching** : SSG par défaut, pas de `no-store` sauf besoin réel

Résoudre tout conflit entre agents. Vérifier la cohérence globale.

**Build gate final :**
```bash
npm run build 2>&1
```
Si le build échoue → corriger immédiatement.

```bash
git add -A
git commit -m "fix: reviews SEO, DA, a11y, perf, dev"
```

**6.7 — Review Textes (critique si content_source: client_files)**
Si `content_source: client_files` :
1. Pour chaque fichier source (RTF/TXT), extraire le texte brut
2. Pour chaque page TSX correspondante, extraire le texte visible (hors attributs HTML)
3. Comparer paragraphe par paragraphe — toute phrase présente dans le fichier source doit être présente mot pour mot dans le TSX
4. Toute divergence → corriger immédiatement dans le TSX
5. Toute section dans le TSX sans source dans le fichier client → supprimer ou remplacer par `[PLACEHOLDER]`

---

## STEP 7 — RAPPORT FINAL

Produire un résumé clair :

```
PROJET [NOM] — PRET A DEPLOYER

PAGES GENEREES : [liste]
SEO : [points clés]
DA : [couleurs + polices utilisées]
ANIMATIONS : [composants utilisés — ScrollReveal, TextReveal, PageTransition, etc.]
PERFORMANCE : [score Lighthouse estimé]
ACCESSIBILITE : [niveau WCAG]
AVIS GOOGLE : [nombre d'avis récupérés, note globale]
HEBERGEMENT : Vercel (ou autre si spécifié)

PLACEHOLDERS A COMPLETER :
- lib/config.ts → tel et email du client
- [liste des autres éléments manquants]
```

---

## STEP 8 — DÉPLOIEMENT VERCEL

**Si `hosting: vercel` (par défaut) :**

### 8.0 — Compte Vercel (une seule fois)
Si pas encore fait, le créer :
1. Aller sur vercel.com → Sign Up (email ForgitWeb)
2. Settings → Billing → passer en Pro (20$/mois)
3. En local : `npx vercel login` (une seule fois, reste connecté)

### 8.1 — Premier déploiement
```bash
cd [dossier-projet]
npx vercel --prod        # déploiement en production
```

### 8.2 — Domaine custom
1. Dans le dashboard Vercel → Settings → Domains → ajouter `monsite.fr`
2. Vercel donne les enregistrements DNS (A record ou CNAME)
3. Aller chez le registrar du client (OVH, Ionos, Gandi...) → modifier les DNS
4. HTTPS se configure automatiquement

### 8.3 — Variables d'environnement
Dans Vercel Dashboard → Settings → Environment Variables, ajouter :
- `BREVO_API_KEY` = `[clé Brevo depuis le dashboard Brevo → SMTP & API → API Keys]`
- `SENDER_EMAIL` = `theo@forgitweb.fr`
- `CONTACT_EMAIL` = `[email du client]`
- `GOOGLE_PLACES_API_KEY` = `[clé Google Places depuis .env.local FORGITWEB]`
- `GOOGLE_PLACE_ID` = `[Place ID du client]`
- `CRON_SECRET` = `[token aléatoire]`

### 8.4 — Cron avis Google (auto)
Le `vercel.json` contient un cron qui rebuild les avis chaque semaine.
Rien d'autre à configurer — les avis se mettent à jour automatiquement.

### 8.5 — Mises à jour futures
Pour modifier du texte, une photo, ou quoi que ce soit :
```bash
# Modifier les fichiers localement
npx vercel --prod        # re-déploie en 30 secondes
```

**Si `hosting: autre` (o2switch, Ionos, OVH) :**

### Déploiement FTP
```bash
npm run build            # génère le dossier out/
# Uploader le contenu de out/ par FTP sur le serveur
```

### Cron avis Google (serveur classique)
1. Uploader `update-reviews.php` à la racine du site
2. Créer le dossier `data/` avec droits d'écriture
3. Configurer un cron job dans cPanel/Plesk :
   - Fréquence : `0 3 * * 1` (chaque lundi 3h)
   - Commande : `php /home/USER/public_html/update-reviews.php`

---

## STEP 9 — POST-LAUNCH : /livraison (après déploiement)

**Exécuter le skill `/livraison` qui couvre TOUT le post-déploiement de façon exhaustive.**

Référence : `~/.claude/skills/livraison/SKILL.md`

Le skill livraison effectue automatiquement :
1. **Vérification technique** : HTTPS, DNS, headers, sitemap, robots, Lighthouse, mobile
2. **Vérification fonctionnelle** : formulaire contact, liens tel/email, navigation, avis Google, cookies
3. **SEO & Analytics** : GSC setup, GA4 config, conversions, OG image, Schema.org validation
4. **Variables Vercel** : vérification de toutes les env vars
5. **Rapport de livraison** : status global + actions restantes
6. **Message client** : message pré-rédigé prêt à envoyer
7. **Rappel J+7** : todo de suivi post-launch

**Quality gates obligatoires (intégrés dans /livraison) :**
- Lighthouse Performance > 90
- Lighthouse Accessibility > 90
- Lighthouse SEO > 90
- 0 lien mort
- Formulaire de contact fonctionnel
- HTTPS + redirections OK

---

## Quality Gates — Métriques minimales obligatoires

| Métrique | Seuil minimum | Quand vérifier |
|----------|--------------|----------------|
| `npm run build` | 0 erreur | Après Step 5.1, 5.2.1, 6.6 |
| Lighthouse Performance | > 90 | Step 6.4 + Step 9 (/livraison) |
| Lighthouse Accessibility | > 90 | Step 6.3 + Step 9 (/livraison) |
| Lighthouse SEO | > 90 | Step 6.1 + Step 9 (/livraison) |
| Erreurs WCAG AA | 0 | Step 6.3 |
| Liens morts | 0 | Step 9 (/livraison) |
| Formulaire contact | Fonctionnel | Step 9 (/livraison) |

**Si un seuil n'est pas atteint → corriger AVANT de passer à l'étape suivante.**

## Règles absolues

1. Ne jamais sauter une étape
2. Ne jamais générer du code avant que `content.md` soit validé
3. Ne jamais inventer une information client → utiliser des placeholders
4. Si une réponse est floue → reposer la question
5. Chaque livrable doit justifier une qualité premium
6. **Si `content_source: client_files` → le texte des fichiers client est sacré. Zéro génération, zéro reformulation, zéro ajout de section non présente dans les fichiers.**
7. **Toujours inclure le contenu des briefs dans le prompt de l'agent — ne pas lui demander de les lire lui-même.**
8. **colors: locked → jamais modifiable par aucun agent.**
9. **Ne JAMAIS déclarer une tâche terminée sans preuve** : build clean + dev server "Ready" + page accessible.
10. **Créer `tasks/todo.md`** à la racine du projet au Step 1 et le maintenir à jour tout au long du workflow.
