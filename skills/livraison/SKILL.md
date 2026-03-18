---
name: livraison
description: "Checklist post-deploiement complete pour livraison client. DNS, GA4, GSC, test formulaire, mobile, OG, formation client. Usage : /livraison [chemin-du-projet]"
metadata:
  author: FORGITWEB
  version: "1.0"
---

# Livraison — Checklist Post-Deploiement

Checklist exhaustive de livraison d'un site client. A lancer apres le deploiement Vercel (ou autre hebergeur).

## Declenchement

L'utilisateur lance `/livraison` suivi du chemin du projet ou du domaine.
Exemples :
- `/livraison /Users/nicolas/Projets IA/homi`
- `/livraison homi.fr`
- "je viens de deployer, fais la checklist livraison"

## Phase 0 — Collecte d'infos

1. Identifier le projet (chemin local + domaine de production)
2. Lire `brief.md` pour les infos client (email, tel, services, hosting)
3. Lire `lib/config.ts` pour les variables de config
4. Verifier que le site est accessible : `curl -sI https://[domaine]`

Si le site n'est pas encore en ligne → proposer d'abord le deploiement (Step 8 de nouveau-projet).

## Phase 1 — Verification Technique (5 checks paralleles)

Lancer ces verifications EN PARALLELE via des appels Bash/WebFetch :

### 1.1 — HTTPS & DNS
```
- curl -sI https://[domaine] → verifier HTTP 200 + headers
- Verifier redirect HTTP → HTTPS (curl -sI http://[domaine])
- Verifier que www redirige vers non-www (ou l'inverse selon config)
- Verifier certificat SSL valide (date d'expiration)
```

### 1.2 — Headers de securite
```
Verifier dans la reponse HTTP :
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY ou SAMEORIGIN
- Strict-Transport-Security present
- Referrer-Policy present
Si manquants → noter dans le rapport
```

### 1.3 — Sitemap & Robots
```
- https://[domaine]/sitemap.xml → accessible, contient toutes les pages
- https://[domaine]/robots.txt → n'exclut pas de pages importantes
- Verifier que /mentions-legales est dans le sitemap
```

### 1.4 — Performance (Lighthouse)
```bash
npx lighthouse https://[domaine] --output=json --quiet --chrome-flags="--headless --no-sandbox"
```
Extraire : Performance, Accessibility, Best Practices, SEO
**Gate : si un score < 90 → lister les causes et proposer des corrections**

### 1.5 — Mobile & Responsive
```
Verifier via Playwright (viewport 375x812) :
- Le site charge correctement
- Le menu burger fonctionne
- Pas de scroll horizontal
- Les textes sont lisibles (pas de texte coupe)
- Les CTAs sont cliquables (touch target > 44px)
```

## Phase 2 — Verification Fonctionnelle

### 2.1 — Formulaire de contact
```
Tester via Playwright :
1. Ouvrir la page contact
2. Remplir tous les champs avec des donnees de test
3. Soumettre le formulaire
4. Verifier : loading state → message succes → pas d'erreur console
5. Verifier que l'email arrive (demander au client de confirmer)
```

### 2.2 — Liens de contact
```
Verifier que ces liens fonctionnent :
- tel: → format correct (+33...)
- mailto: → email correct
- Google Maps → lien fonctionnel
- Reseaux sociaux → liens corrects (pas de 404)
```

### 2.3 — Navigation complete
```
Pour CHAQUE lien interne du site :
- Cliquer → la page charge sans erreur
- Pas de lien mort (404)
- Logo → retour accueil
- Menu mobile → tous les liens fonctionnent
```

### 2.4 — Avis Google (si active)
```
- Verifier que data/reviews.json est alimente
- Tester le cron : curl https://[domaine]/api/cron/reviews?secret=[CRON_SECRET]
- Les avis s'affichent sur le site
```

### 2.5 — Bandeau cookies
```
- Le bandeau apparait au premier visite
- "Accepter" → GA4 s'active (verifier dans console : gtag present)
- "Refuser" → GA4 ne charge pas
- Le choix persiste apres refresh
```

## Phase 3 — SEO & Analytics

### 3.1 — Google Search Console
Rappeler au client / executer si acces disponible :
1. Ajouter le site dans GSC (methode DNS ou balise HTML)
2. Soumettre le sitemap : `https://[domaine]/sitemap.xml`
3. Demander l'indexation de la page d'accueil
4. Verifier qu'aucune page n'est en erreur d'indexation

### 3.2 — Google Analytics (GA4)
1. Verifier que GA_ID est configure dans les variables Vercel
2. Ouvrir le site → accepter les cookies → verifier dans GA4 Realtime qu'un utilisateur apparait
3. Configurer les conversions dans GA4 → Admin → Events :
   - `form_submitted` → marquer comme conversion
   - `phone_clicked` → marquer comme conversion
   - Optionnel : `email_clicked`, `cta_clicked`
4. Tester : soumettre le formulaire → verifier que `form_submitted` apparait dans Realtime Events

### 3.3 — OG Image & Social
```
Verifier via https://cards-dev.twitter.com/validator ou https://developers.facebook.com/tools/debug/ :
- OG Image s'affiche correctement (1200x630)
- Title et description corrects
- URL correcte
```

### 3.4 — Meta & Schema.org
```
Pour chaque page :
- Meta title present et unique
- Meta description < 155 chars
- Canonical URL correcte (https://[domaine]/[slug])
- Schema.org JSON-LD valide (tester sur https://validator.schema.org/)
```

## Phase 4 — Variables d'environnement Vercel

Verifier que TOUTES les variables sont configurees dans Vercel Dashboard :

| Variable | Valeur attendue | Obligatoire |
|----------|----------------|-------------|
| BREVO_API_KEY | xkeysib-... | Oui (si formulaire) |
| SENDER_EMAIL | theo@forgitweb.fr | Oui (si formulaire) |
| CONTACT_EMAIL | [email client] | Oui (si formulaire) |
| GOOGLE_PLACES_API_KEY | AIzaSy... | Oui (si avis) |
| GOOGLE_PLACE_ID | ChIJ... | Oui (si avis) |
| CRON_SECRET | [token] | Oui (si avis) |
| GA_ID | G-XXXXXXX | Oui |

Si une variable manque → alerter et proposer de la configurer.

## Phase 5 — Rapport de Livraison

```markdown
# Livraison — [Nom du projet] ([domaine])
Date : [date]

## Status Global : [PRET / ATTENTION REQUISE / BLOQUANT]

## Checks Techniques
| Check | Status | Details |
|-------|--------|---------|
| HTTPS | OK/FAIL | [details] |
| DNS redirect | OK/FAIL | |
| Headers securite | OK/PARTIEL | [manquants] |
| Sitemap | OK/FAIL | [nb pages] |
| Robots.txt | OK/FAIL | |
| Lighthouse Perf | [score] | |
| Lighthouse A11y | [score] | |
| Lighthouse SEO | [score] | |
| Mobile responsive | OK/FAIL | |

## Checks Fonctionnels
| Check | Status | Details |
|-------|--------|---------|
| Formulaire contact | OK/FAIL | |
| Liens tel/email | OK/FAIL | |
| Navigation | OK/FAIL | [liens morts] |
| Avis Google | OK/FAIL/N/A | |
| Bandeau cookies | OK/FAIL | |

## SEO & Analytics
| Check | Status | Details |
|-------|--------|---------|
| GSC configure | OUI/NON | |
| Sitemap soumis | OUI/NON | |
| GA4 actif | OUI/NON | |
| Conversions GA4 | OUI/NON | |
| OG Image | OK/FAIL | |
| Schema.org valide | OK/FAIL | |

## Variables Vercel
[Tableau des variables avec status present/absent]

## Actions restantes
### A faire maintenant
- [liste]

### A faire par le client
- [liste : remplacer photos, fournir GA_ID, etc.]

## Message de livraison client
[Message pre-redige a envoyer au client]
```

## Phase 6 — Message Client

Generer un message de livraison pret a envoyer :

```
Bonjour [Prenom],

Le site [domaine] est en ligne !

Ce qui est configure :
- Hebergement Vercel avec HTTPS automatique
- Formulaire de contact → emails envoyes a [email]
- Google Analytics active
- [Avis Google synchronises automatiquement (si applicable)]

De votre cote, il reste a :
- [Remplacer les photos temporaires par vos vraies photos]
- [Nous envoyer votre GA_ID si vous avez votre propre compte GA]
- [Autres placeholders]

N'hesitez pas si vous avez des questions.

L'equipe FORGITWEB
```

## Phase 7 — Rappel J+7

Creer un todo dans le systeme :
```
RAPPEL J+7 — [domaine]
- Verifier site:[domaine] dans Google → pages indexees ?
- Si pas indexees → re-soumettre dans Search Console
- Checker GA4 → events remontent correctement ?
- Demander au client s'il a des retours
```

## Regles

- Ne JAMAIS corriger le code automatiquement pendant la livraison
- Si un check echoue → noter dans le rapport, proposer la correction
- Si Lighthouse < 90 → c'est un bloquant, corriger avant de livrer
- Toujours generer le message client a la fin
- Le rapport de livraison peut etre sauvegarde dans `livraison-[DATE].md` si demande
