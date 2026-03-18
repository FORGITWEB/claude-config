---
name: audit-complet
description: "Meta-audit complet d'un projet web. Lance en parallele 3 audits specialises (fonctionnel, securite, technique) et produit un rapport unifie avec priorites. Usage : /audit-complet [chemin-du-projet]"
metadata:
  author: FORGITWEB
  version: "1.0"
---

# Audit Complet — Meta-Skill

Lance **3 audits en parallele** sur un projet existant et produit un rapport unique consolide.

```
/audit-complet [chemin-du-projet]
  |-- full-audit   (fonctionnel)     --|
  |-- full-secu    (securite)        --|--> en PARALLELE
  |-- maintenance  (technique)       --|
  --> Rapport unique consolide
```

## Declenchement

L'utilisateur lance `/audit-complet` suivi du chemin du projet.
Exemples :
- `/audit-complet /Users/nicolas/Projets IA/homi`
- `/audit-complet` (demander le chemin)
- "fais un audit complet de mon projet"
- "verifie tout sur ce site"

## Phase 0 — Localisation & Pre-check

1. Identifier le chemin du projet (argument ou demander)
2. Verifier que `package.json` existe
3. Verifier que `node_modules` existe, sinon `npm install`
4. Quick build check :
   ```bash
   npm run build --prefix CHEMIN 2>&1
   ```
   - Si echec → noter dans le rapport mais continuer les audits
   - Les 3 audits doivent tourner meme si le build echoue (ils detecteront pourquoi)

## Phase 1 — 3 Audits en Parallele

Lancer **3 agents Task en parallele dans un seul message** :

### Agent 1 : Audit Fonctionnel (full-audit)

```
Prompt :

Tu es un auditeur fonctionnel. Execute le workflow de full-audit sur le projet [chemin].

Reference : ~/.claude/skills/full-audit/SKILL.md

Execute les phases 0 a 4 (build check, detection d'intention, audit statique 4 agents, tests runtime Playwright).
Phase 5 (corrections) : NE PAS corriger, uniquement produire le rapport.

Format de sortie attendu :
- Declaration d'intention (ce que l'app est censee faire)
- Ecart intention vs realite (tableau)
- Ruptures de flux par priorite (BLOQUANT / DEGRADANT / COSMETIQUE)
- Score de completude fonctionnelle
- Erreurs runtime (console, network, formulaires)
```

### Agent 2 : Audit Securite (full-secu)

```
Prompt :

Tu es un auditeur securite. Execute le workflow de full-secu sur le projet [chemin].

Reference : ~/.claude/skills/full-secu/SKILL.md

Execute les phases 0 a 2 (init, 4 agents securite en parallele, rapport consolide).
Phase 3 (corrections automatiques) : NE PAS corriger, uniquement produire le rapport.

Format de sortie attendu :
- Secrets exposes (CRITIQUE / ALERTE / OK)
- Vulnerabilites code (XSS, injection, CSRF)
- Headers HTTP manquants
- Dependances vulnerables
- Score global /100
```

### Agent 3 : Audit Technique (maintenance)

```
Prompt :

Tu es un auditeur technique. Execute le workflow de maintenance sur le projet [chemin].

Reference : ~/.claude/skills/maintenance/SKILL.md

Execute les etapes 1 a 6 (dependances, build, headers, env, etat projet, Lighthouse si URL fournie).
NE PAS corriger, uniquement produire le rapport.

Format de sortie attendu :
- Failles npm (nombre par severite)
- Packages obsoletes (liste)
- Version Next.js vs derniere stable
- Build status
- Headers de securite (present/absent)
- Cles API exposees
- Score Lighthouse (si URL fournie)
```

## Phase 2 — Rapport Unifie

Assembler les 3 rapports dans un format unique :

```markdown
# Audit Complet — [Nom du projet]
Date : [date]
Stack : [detecte]

---

## Resume Executif

| Domaine | Score | Status |
|---------|-------|--------|
| Fonctionnel | X/Y flux OK | [CRITIQUE/ATTENTION/SAIN] |
| Securite | X/100 | [CRITIQUE/ATTENTION/SAIN] |
| Technique | [voir details] | [CRITIQUE/ATTENTION/SAIN] |

**Verdict global :** [1-2 phrases sur l'etat general]

---

## 1. Audit Fonctionnel

### Intention vs Realite
[Tableau ecart]

### Flux casses (BLOQUANT)
[Liste des features qui ne marchent pas]

### Flux degrades (DEGRADANT)
[Liste des features avec friction]

### Score completude
[Tableau par flux]

---

## 2. Audit Securite

### Failles CRITIQUES (a corriger avant deploiement)
[Liste numerotee avec fichier:ligne + impact]

### ALERTES (a corriger rapidement)
[Liste]

### Score securite : X/100

---

## 3. Audit Technique

### Dependances
- Next.js : [version] -> [derniere stable]
- Packages obsoletes : [nombre]
- Failles npm : [nombre par severite]

### Build : [OK/FAIL]

### Performance (Lighthouse)
[Scores si disponibles]

### Headers securite
[Present/absent pour chaque header]

---

## Plan d'Action Priorise

### IMMEDIAT (avant mise en prod)
| # | Domaine | Probleme | Fichier(s) | Fix estime |
|---|---------|----------|------------|------------|
[Bloquants fonctionnels + critiques securite]

### CETTE SEMAINE
| # | Domaine | Probleme | Fichier(s) |
|---|---------|----------|------------|
[Degradants + alertes securite + deps critiques]

### CE MOIS
| # | Domaine | Probleme | Fichier(s) |
|---|---------|----------|------------|
[Cosmetique + recommandations + deps mineures]

### OPTIONNEL (prochain cycle)
[Invisible + infos]
```

## Phase 3 — Corrections (avec validation)

Presenter le rapport et demander :
"Voici le rapport complet. Je corrige les [X] problemes IMMEDIATS ?"

**Si oui :**
1. Corriger dans l'ordre du plan d'action (IMMEDIAT d'abord)
2. Apres chaque batch de corrections : `npm run build` pour verifier
3. Git commit apres corrections : `git add -A && git commit -m "fix: audit complet [date]"`

**Si non :**
- Sauvegarder le rapport dans `audit-complet-[DATE].md` si demande

## Regles

- Les 3 audits sont **independants** — si l'un echoue, les autres continuent
- Ne JAMAIS corriger automatiquement en Phase 1-2 (rapport uniquement)
- Toujours presenter le rapport AVANT de proposer des corrections
- Utiliser `trash` pour toute suppression de fichier
- Si le projet n'a pas d'URL de production → skip Lighthouse dans l'audit technique
- Les corrections suivent les regles de chaque audit original (full-audit corrige les flux, full-secu corrige la secu, maintenance corrige les deps)
