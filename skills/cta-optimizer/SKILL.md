---
name: cta-optimizer
description: "Optimisation des CTAs, headlines et emails marketing. Applique les principes de copywriting conversion-focused sur les elements d'action uniquement. Usage : /cta-optimizer [chemin-du-projet ou contenu]"
metadata:
  author: FORGITWEB
  version: "1.0"
---

# CTA Optimizer — Copy Conversion-Focused

Optimise les **elements d'action** d'un site ou d'un email : CTAs, headlines, accroches hero, sujets email, boutons.

**Ne touche PAS au contenu des pages** (paragraphes, descriptions, texte SEO) — c'est le role de l'agent-redacteur.

## Perimetre strict

### CE QUE CE SKILL OPTIMISE :
- Textes de boutons CTA ("Contactez-nous" → "Demander mon devis gratuit")
- Headlines hero (H1 d'accroche au-dessus du fold)
- Sujets et preview text d'emails marketing
- Titres de landing pages
- Accroches / taglines courtes

### CE QUE CE SKILL NE FAIT PAS :
- Rediger le contenu des pages (→ agent-redacteur)
- Ecrire les meta descriptions (→ agent-seo / seo-toolkit)
- Rediger des articles de blog (→ agent-redacteur)
- Modifier les textes des paragraphes
- Reformuler le contenu client

## Declenchement

- `/cta-optimizer` suivi du chemin du projet
- `/cta-optimizer` sur un contenu colle directement
- "optimise mes CTAs"
- "ameliore les boutons du site"
- "ecris un email marketing pour [produit]"
- "ameliore l'accroche du hero"

## Principes (Non-Negociables)

1. **Clarte > Originalite** — le CTA doit etre immediatement compris
2. **Benefice client > Description service** — ce que l'utilisateur OBTIENT, pas ce que tu fais
3. **Verbe d'action + Resultat concret** — "Demander mon devis" > "Soumettre"
4. **Specificite > Generique** — "Devis gratuit sous 24h" > "Contactez-nous"
5. **Honnetete > Hype** — pas de promesses inveriables

## Workflow — Mode Projet

### Phase 1 : Extraction

1. Lire les fichiers TSX de chaque page du projet
2. Extraire :
   - Tous les textes de `<button>` et composants CTA
   - Les H1 de chaque page (headline hero)
   - Les taglines / sous-titres hero
   - Les textes de liens CTA (ex: "En savoir plus", "Voir nos realisations")
3. Lister dans un tableau :

```
| # | Page | Element | Texte actuel | Type |
|---|------|---------|-------------|------|
| 1 | Accueil | Hero H1 | Expert plomberie Lyon | headline |
| 2 | Accueil | CTA hero | Contactez-nous | button |
| 3 | Services | CTA section | En savoir plus | link |
```

### Phase 2 : Optimisation

Pour chaque element :
1. **Si deja bon** (specifique + actionnable + benefice) → ne pas toucher
2. **Si ameliorable** → proposer UNE version optimisee avec justification courte

```
| # | Texte actuel | Texte optimise | Justification |
|---|-------------|----------------|---------------|
| 1 | Expert plomberie Lyon | Garder tel quel | Deja specifique et SEO |
| 2 | Contactez-nous | Demander mon devis gratuit | Benefice + action concrete |
| 3 | En savoir plus | Voir nos realisations | Plus specifique |
```

### Phase 3 : Validation et Application

1. Presenter le tableau au client
2. Si valide → appliquer les modifications dans les fichiers TSX
3. Mettre a jour `content.md` si necessaire

## Workflow — Mode Email Marketing

### Phase 1 : Brief

Collecter via AskUserQuestion :
- Objectif de l'email (promo, relance, newsletter, annonce)
- Destinataire (clients existants, prospects, segment specifique)
- Offre ou message principal
- CTA souhaite (prise de RDV, achat, visite site)

### Phase 2 : Copy Brief Lock

Presenter un resume et attendre validation avant d'ecrire.

### Phase 3 : Redaction

Produire :
- **2-3 options de sujet** (< 50 chars, pas de spam words)
- **Preview text** (complement du sujet, < 90 chars)
- **Corps email** structure :
  - Accroche (1-2 lignes max)
  - Valeur / Offre (benefice clair)
  - CTA principal (1 seul, visible)
  - PS optionnel (urgence ou preuve sociale)
- **CTA button** : texte optimise

### Regles Email

- Pas de "Cher client" → utiliser le prenom ou commencer direct
- Pas de paragraphes > 3 lignes
- UN SEUL CTA principal (pas 5 liens)
- Mobile-first : le CTA doit etre visible sans scroller
- Pas de claims inveriables
- Sujet : pas de MAJUSCULES, pas de !!!, pas de "URGENT"

## Transformations Types

| Generique | Optimise | Principe |
|-----------|----------|----------|
| Contactez-nous | Demander mon devis gratuit | Benefice + specifique |
| En savoir plus | Voir nos realisations | Specifique |
| Soumettre | Envoyer ma demande | Action personnalisee |
| Nos services | Ce qu'on fait pour vous | Orientee client |
| Reserver | Reserver mon creneau | Possessif + specifique |
| Commander | Recevoir ma commande | Resultat concret |
| S'inscrire | Rejoindre la communaute | Benefice |
| Telecharger | Obtenir le guide gratuit | Benefice + gratuit |

## Regles

- Si `content_source: client_files` → ne JAMAIS modifier les H1/H2 rediges par le client. Uniquement les textes de boutons.
- Chaque optimisation doit etre justifiee en 1 phrase
- Ne pas proposer plus de 1 alternative par element (pas d'A/B testing sauf demande explicite)
- Les CTAs doivent rester courts (< 5 mots ideal, < 8 mots max)
- Pas d'emoji dans les CTAs (sauf email marketing si le ton le justifie)
