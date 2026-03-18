---
name: seo-toolkit
description: "Boite a outils SEO complete pour agence web. 6 modes : audit technique, optimisation meta, featured snippets, detection cannibalisation, planning contenu, refresh contenu. Usage : /seo-toolkit [mode] [args]"
---

# SEO Toolkit — Boite a outils SEO unifiee

Skill unifie pour toutes les operations SEO courantes. Chaque mode est autonome et actionnable.

## Usage

```
/seo-toolkit audit [url]          → Audit technique SEO complet
/seo-toolkit meta [page]          → Optimisation meta titles/descriptions
/seo-toolkit snippets [contenu]   → Formatage featured snippets
/seo-toolkit cannibalisation      → Detection overlap mots-cles entre pages
/seo-toolkit planning [brief]     → Topic clusters & calendrier editorial
/seo-toolkit refresh [url]        → Identification contenu obsolete a rafraichir
```

## Choix automatique du mode

Si l'utilisateur ne precise pas de mode, identifier automatiquement :
- Demande d'audit / diagnostic / "pourquoi je ne ranke pas" → `audit`
- Demande sur les meta / titles / descriptions → `meta`
- Demande sur les featured snippets / position zero / PAA → `snippets`
- Demande sur le contenu similaire / pages en conflit → `cannibalisation`
- Demande de strategie contenu / calendrier / topic clusters → `planning`
- Demande de mise a jour / contenu perime / rafraichissement → `refresh`

---

# MODE: audit

Audit technique SEO complet d'un site existant.

## Collecte initiale

Avant d'auditer, comprendre :

1. **Contexte site** : type (SaaS, e-commerce, blog, local...), objectif SEO principal, mots-cles prioritaires
2. **Etat actuel** : problemes connus, trafic organique, migrations recentes
3. **Scope** : audit complet ou pages specifiques, acces Search Console ?

## Limitation Schema Markup

**`web_fetch` et `curl` ne detectent PAS le schema markup de facon fiable.** Beaucoup de CMS injectent le JSON-LD via JavaScript cote client — invisible dans le HTML statique.

**Pour verifier le schema :** utiliser Google Rich Results Test (https://search.google.com/test/rich-results) ou le browser tool avec `document.querySelectorAll('script[type="application/ld+json"]')`.

**Ne JAMAIS reporter "pas de schema" base uniquement sur web_fetch.**

## Framework d'audit (par priorite)

### 1. Crawlabilite & Indexation

**Robots.txt** : pas de blocages involontaires, reference au sitemap
**XML Sitemap** : existe, accessible, contient uniquement les URLs canoniques indexables
**Architecture** : pages importantes a max 3 clics de la homepage, pas de pages orphelines
**Crawl budget** (grands sites) : URLs parametrees controlees, scroll infini avec pagination fallback

**Indexation** : verifier `site:domain.com`, rapport Search Console, pages noindex involontaires, chaines de redirections, canonicals incorrects, soft 404s, contenu duplique sans canonical

**Canonicalisation** : self-referencing canonicals, HTTP→HTTPS, www vs non-www, trailing slash coherent

### 2. Vitesse & Core Web Vitals

- LCP < 2.5s, INP < 200ms, CLS < 0.1
- TTFB, optimisation images, execution JS, CSS delivery, cache, CDN, fonts
- Outils : PageSpeed Insights, WebPageTest, Search Console CWV report

### 3. Mobile-Friendliness

- Responsive (pas de site m. separe), tap targets, viewport, pas de scroll horizontal

### 4. HTTPS & Securite

- HTTPS partout, certificat valide, pas de mixed content, redirections HTTP→HTTPS

### 5. Structure URL

- URLs lisibles, descriptives, keywords naturels, coherentes, lowercase + hyphens

### 6. On-Page

**Title tags** : uniques par page, keyword au debut, 50-60 chars, convaincants
**Meta descriptions** : uniques, 150-160 chars, keyword + value proposition + CTA
**Heading structure** : H1 unique avec keyword, hierarchie logique H1→H2→H3
**Contenu** : keyword dans les 100 premiers mots, profondeur suffisante, repond a l'intention de recherche
**Images** : noms descriptifs, alt text, compression, WebP, lazy loading, responsive
**Maillage interne** : pages importantes bien linkees, ancres descriptives, pas de liens casses

### 7. Qualite contenu (E-E-A-T)

- Experience : exemples concrets, donnees originales
- Expertise : credentials auteurs, infos detaillees et sourcees
- Autorite : reconnu dans le secteur, cite par d'autres
- Confiance : HTTPS, infos contact, CGV/politique confidentialite

## Problemes courants par type de site

**Sites locaux** : NAP inconsistant, pas de schema local, GBP non optimise, pas de pages villes
**SaaS** : pages produit trop fines, blog deconnecte du produit, pas de pages comparaison
**E-commerce** : categories fines, descriptions produit dupliquees, faceted navigation dupliquante
**Blog** : contenu non rafraichi, cannibalisation, pas de topic clusters

## Format de sortie

```
## Resume executif
- Sante globale : [score]
- Top 3-5 problemes prioritaires
- Quick wins identifies

## Findings techniques
Pour chaque issue :
- **Probleme** : description
- **Impact** : High/Medium/Low
- **Preuve** : comment detecte
- **Correction** : recommendation specifique
- **Priorite** : 1-5

## Plan d'action priorise
1. Corrections critiques (bloquant indexation/ranking)
2. Ameliorations a fort impact
3. Quick wins (facile, benefice immediat)
4. Recommandations long terme
```

## Outils references

**Gratuits** : Google Search Console, PageSpeed Insights, Rich Results Test, Mobile-Friendly Test, Schema Validator
**Payants** : Screaming Frog, Ahrefs/Semrush, Sitebulb

## Skills lies
- `programmatic-seo` : pour construire des pages SEO a grande echelle
- Mode `meta` : pour optimiser les meta tags
- Mode `cannibalisation` : pour detecter les conflits entre pages

---

# MODE: meta

Optimisation des meta titles, descriptions et URLs pour maximiser le CTR et le ranking.

## Regles d'optimisation

**URLs :**
- < 60 caracteres, hyphens, lowercase
- Keyword principal au debut
- Supprimer les stop words quand possible

**Title tags :**
- 50-60 caracteres (pixels variables)
- Keyword principal dans les 30 premiers caracteres
- Inclure des power words / declencheurs emotionnels
- Ajouter chiffres/annee pour la fraicheur
- Strategie placement marque (debut vs fin)

**Meta descriptions :**
- 150-160 caracteres optimal
- Keyword principal + secondaires naturellement
- Verbes d'action + benefices
- CTA convaincant
- Caracteres speciaux pour la visibilite (→ ★)

## Approche

1. Analyser le contenu et les keywords fournis
2. Extraire les benefices cles et USPs
3. Calculer les limites de caracteres
4. Creer 3-5 variations par element
5. Optimiser pour mobile ET desktop
6. Equilibrer keywords et copywriting persuasif

## Format de sortie

```
URL: /slug-optimise
Title: Keyword Principal - Accroche Convaincante | Marque (55 chars)
Description: Verbe d'action + benefice. Keyword naturel. CTA clair → (155 chars)

Variations A/B (3 minimum) :
1. [variation]
2. [variation]
3. [variation]

Power words suggeres : [liste]
Recommandations Schema : [si applicable]
```

**Implementation :**
- Next.js : export metadata dans page.tsx
- WordPress : configuration Yoast/RankMath

---

# MODE: snippets

Formatage du contenu pour maximiser les chances d'apparaitre en featured snippet (position zero).

## Types de snippets

**Paragraphe (40-60 mots) :**
- Reponse directe des la premiere phrase
- Headers sous forme de question
- Definitions claires et concises

**Liste :**
- Etapes numerotees (5-8 items)
- Bullet points pour fonctionnalites
- Header clair avant la liste

**Tableau :**
- Donnees de comparaison
- Specifications
- Information structuree

## Approche

1. Identifier les questions dans le contenu fourni
2. Determiner le meilleur format de snippet
3. Creer des blocs optimises pour les snippets
4. Formater les reponses de facon concise
5. Structurer le contexte environnant
6. Suggerer le balisage FAQ schema

## Format de sortie

```markdown
## [Question exacte de la SERP]

[Reponse directe en 40-60 mots avec keyword dans la premiere phrase. Reponse claire et definitive.]

### Details complementaires :
- Point 1 (contexte enrichi)
- Point 2 (entite associee)
- Point 3 (valeur ajoutee)
```

**Livrables :**
- Blocs contenu optimises snippets
- Paires question/reponse PAA
- Recommandations format (paragraphe/liste/tableau)
- Schema markup (FAQPage, HowTo)
- Jump links pour contenu long
- Sections FAQ pour domination PAA
- Optimisation recherche vocale

---

# MODE: cannibalisation

Detection et resolution des conflits de mots-cles entre pages d'un meme site.

## Types de cannibalisation

**Overlap title/meta** : titles similaires, descriptions dupliquees, memes keywords cibles
**Overlap contenu** : couverture sujet similaire, sections dupliquees, meme intention de recherche
**Problemes structurels** : patterns de headings identiques, profondeur similaire

## Strategie de prevention

1. **Mapping keyword clair** — un keyword principal par page
2. **Intention de recherche distincte** — besoins utilisateur differents
3. **Angles uniques** — perspectives differentes
4. **Metadata differenciee** — titles/descriptions uniques
5. **Consolidation strategique** — fusionner quand necessaire

## Approche

1. Analyser les keywords des pages fournies
2. Identifier les overlaps de sujet et keywords
3. Comparer les intentions de recherche ciblees
4. Evaluer le pourcentage de similarite
5. Trouver les opportunites de differenciation
6. Suggerer la consolidation si necessaire

## Format de sortie

```
## Rapport de cannibalisation

### Conflit : [Keyword]
Pages en concurrence :
- Page A : [URL] | Ranking : #X
- Page B : [URL] | Ranking : #Y

Resolution recommandee :
□ Consolider en une page unique authoritative
□ Differencier avec des angles uniques
□ Implementer canonical vers la page principale
□ Ajuster le maillage interne
```

**Livrables :**
- Matrice d'overlap keywords
- Inventaire des pages en conflit
- Analyse d'intention de recherche
- Liste de resolution priorisee
- Plan de consolidation + redirections 301
- Guide implementation canonicals
- Structure hub/spoke recommandee

---

# MODE: planning

Strategie de contenu SEO : topic clusters, outlines, calendrier editorial.

## Framework de planification

**Structure outline contenu :**
- Sujet principal et angle
- Definition audience cible
- Alignement intention de recherche
- Keywords primaire/secondaires
- Decoupage sections detaille
- Objectifs volume de mots
- Opportunites maillage interne

**Composants topic cluster :**
- Page pilier (guide complet)
- Articles supports (sous-sujets)
- Contenu FAQ et glossaire
- Guides how-to associes
- Etudes de cas et exemples
- Contenu comparaison/versus
- Pages outils et ressources

## Approche

1. Analyser le sujet principal de facon exhaustive
2. Identifier sous-sujets et angles
3. Mapper les variations d'intention de recherche
4. Creer une structure outline detaillee
5. Planifier la strategie de maillage interne
6. Suggerer les formats de contenu
7. Prioriser l'ordre de creation

## Format de sortie

```
## Outline contenu

Title: [Sujet principal]
Intent: [Informational/Commercial/Transactional]
Volume mots: [Cible]

I. Introduction
   - Accroche
   - Proposition de valeur
   - Vue d'ensemble

II. Section principale 1
    A. Sous-sujet
    B. Sous-sujet

[etc.]

## Calendrier editorial (30-60 jours)
| Semaine | Sujet | Keyword cible | Format | Volume mots | Priorite |
|---------|-------|---------------|--------|-------------|----------|
| S1 | ... | ... | ... | ... | ... |

## Topic cluster map
- Page pilier : [sujet]
  - Support 1 : [sous-sujet]
  - Support 2 : [sous-sujet]
  - ...

## Blueprint maillage interne
[Schema des liens entre contenus]
```

---

# MODE: refresh

Identification du contenu obsolete et recommandations de mise a jour pour maintenir la fraicheur SEO.

## Priorites de mise a jour

**Haute priorite (immediat) :**
- Pages en perte de ranking (> 3 positions)
- Contenu avec informations perimees
- Pages a fort trafic en decline
- Contenu saisonnier a venir

**Priorite moyenne (ce mois) :**
- Rankings stagnants (6+ mois)
- Mises a jour concurrentielles
- Tendances manquantes
- Metriques engagement faibles

## Elements a verifier

- Statistiques de plus de 2 ans
- Dates dans les titles et le contenu
- Exemples de plus de 3 ans
- Developpements recents du secteur manquants
- Informations perimees ou modifiees
- Terminologie ou tendances datees

## Approche

1. Scanner le contenu pour les dates et references temporelles
2. Identifier les statistiques et donnees chiffrees
3. Trouver les exemples et etudes de cas
4. Verifier la terminologie datee
5. Evaluer la completude du sujet
6. Suggerer les priorites de mise a jour
7. Recommander de nouvelles sections

## Format de sortie

```
## Plan de rafraichissement

### Page : [URL]
Derniere maj : [Date]
Priorite : High/Medium/Low

Actions :
- Mettre a jour les stats de 2023 vers 2026
- Ajouter section sur [nouvelle tendance]
- Rafraichir les exemples avec des exemples actuels
- Mettre a jour le meta title avec "2026"

## File d'attente priorisee
| Page | Derniere MAJ | Priorite | Actions cles |
|------|-------------|----------|-------------|
| ... | ... | ... | ... |

## Tactiques de rafraichissement
- Mises a jour stats (trimestrielles)
- Nouvelles etudes de cas/exemples
- Questions FAQ additionnelles
- Citations experts (E-E-A-T frais)
- Ajouts multimedia
- Nouveaux liens internes
- Mise a jour schema markup (dateModified)
```

## Signaux de fraicheur

- Date modified dans le schema
- Date de publication mise a jour
- Nouveaux liens internes vers le contenu
- Images fraiches avec dates actuelles
- Resharing sur les reseaux sociaux

---

## References

- Pour l'optimisation IA search (AEO, GEO, LLMO), voir le skill **ai-seo** si installe
- Pour le SEO programmatique, voir le skill **programmatic-seo**
