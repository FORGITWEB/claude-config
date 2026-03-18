---
name: maintenance
description: Audit technique complet d'un site Next.js client. Verifie les dependances npm, les failles de securite, la performance Lighthouse, les liens casses, les headers de securite, et l'etat general du projet. Genere un rapport clair avec actions a mener. Utiliser avec /maintenance [nom-du-projet].
---

# Maintenance — Audit technique site client

Audit complet d'un site Next.js deploye sur Vercel. A lancer tous les 6 mois par projet, ou sur demande.

## Declenchement

L'utilisateur lance `/maintenance` suivi du nom du projet.
Exemple : `/maintenance homi`

## Etape 0 — Localiser le projet

1. Chercher le dossier "Projets IA" sur la machine :
```bash
find /Users/nicolas -maxdepth 4 -type d -name "Projets IA" 2>/dev/null | head -1
```
2. Verifier que le sous-dossier du projet existe (ex: `Projets IA/homi`)
3. Si le projet n'existe pas → demander le chemin a l'utilisateur

## Etape 1 — Dependances npm

Lancer en parallele :

### 1a. Failles de securite
```bash
npm audit --prefix CHEMIN_PROJET
```
- Si failles critiques ou hautes → les lister avec le package concerne
- Si uniquement low/moderate → mentionner sans alarmer

### 1b. Packages obsoletes
```bash
npm outdated --prefix CHEMIN_PROJET
```
- Lister les packages avec ecart majeur (ex: next 14.1.0 → 15.2.0)
- Distinguer : patch (safe), minor (generalement safe), major (attention)

### 1c. Version de Next.js
- Verifier la version actuelle vs la derniere stable
- Si retard > 1 version majeure → recommander la mise a jour
- Si retard = patch uniquement → pas urgent

## Etape 2 — Build test

```bash
npm run build --prefix CHEMIN_PROJET
```
- Si le build passe → OK
- Si le build echoue → lister les erreurs, c'est la priorite n°1

## Etape 3 — Security headers

Lire le fichier `next.config.js` ou `next.config.ts` du projet et verifier la presence des headers de securite :

| Header | Attendu |
|--------|---------|
| X-Frame-Options | DENY ou SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | origin-when-cross-origin |
| X-DNS-Prefetch-Control | on |
| Strict-Transport-Security | max-age=63072000 |

- Si absents → les ajouter dans les recommandations

## Etape 4 — Verification .env et securite

1. Verifier que `.env.local` est dans `.gitignore`
2. Scanner le code source pour des cles API en dur :
```
Chercher dans src/ et app/ : patterns "sk-", "xkeysib-", "AIzaSy", "NEXT_PUBLIC_" suivi d'une vraie valeur
```
3. Si une cle est trouvee en dur dans le code → ALERTE CRITIQUE

## Etape 5 — Etat du projet

Verifier :
- Taille du dossier `node_modules` et `.next`
- Nombre de pages/routes
- Presence de fichiers inutiles (`.DS_Store`, `thumbs.db`, fichiers temporaires)
- Verifier que les images sont optimisees (pas de PNG > 500KB non justifie)

## Etape 6 — Lighthouse (si le site est en ligne)

Si l'utilisateur fournit une URL de production :
```bash
npx lighthouse URL --output=json --quiet --chrome-flags="--headless --no-sandbox"
```
- Extraire les scores : Performance, Accessibility, Best Practices, SEO
- Si un score < 90 → identifier les causes principales

Si pas d'URL fournie → passer cette etape.

## Rapport final

Generer un rapport structure avec ce format :

```
# Rapport de maintenance — [NOM PROJET]
Date : [DATE]

## Resume
[1-2 phrases sur l'etat general : sain / attention requise / problemes critiques]

## Securite
- Failles npm : [nombre] (critique: X, haute: X, moderate: X)
- Headers de securite : [OK / manquants]
- Cles API exposees : [OK / ALERTE]
- .env protege : [OK / NON]

## Dependances
- Next.js : [version actuelle] → [derniere stable]
- Packages obsoletes : [nombre]
- Mise a jour recommandee : [oui/non + details]

## Build
- Status : [OK / ECHEC]
- Erreurs : [details si echec]

## Performance (si Lighthouse)
- Performance : [score]/100
- Accessibilite : [score]/100
- Best Practices : [score]/100
- SEO : [score]/100

## Actions a mener
### Critique (faire maintenant)
- [liste]

### Recommande (dans le mois)
- [liste]

### Optionnel (au prochain cycle)
- [liste]
```

## Regles

- Ne JAMAIS modifier le code automatiquement pendant un audit
- Presenter le rapport et attendre la validation de l'utilisateur avant toute action
- Si des mises a jour sont necessaires, proposer de les faire une par une
- Toujours tester le build apres chaque modification
- Sauvegarder le rapport dans le dossier du projet sous `maintenance-[DATE].md` uniquement si l'utilisateur le demande
