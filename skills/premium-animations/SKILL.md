---
name: premium-animations
description: Animations premium SEO-friendly pour sites Next.js SSG. Text reveal, scroll-triggered, parallax, page transitions, curseur custom, preloader. Utilise GSAP + ScrollTrigger et Framer Motion. Tout le contenu reste dans le HTML statique — animations purement visuelles.
---

# Premium Animations — SEO-Friendly

Skill d'animations haut de gamme pour sites Next.js SSG. Chaque pattern est concu pour etre indexable par Google tout en offrant une experience visuelle premium.

## Regle d'or SEO

**Le contenu est TOUJOURS dans le HTML statique genere par Next.js SSG.**
Les animations ne font que reveler visuellement ce qui est deja dans le DOM.

### Regles absolues
- Jamais de `display: none` ou `visibility: hidden` sur du contenu textuel
- Utiliser uniquement `opacity: 0` + `transform` comme etat initial
- Jamais de contenu injecte par JavaScript — tout est dans le HTML SSG
- Les animations sont du progressive enhancement : sans JS, le contenu est visible
- `prefers-reduced-motion` : desactiver toutes les animations, contenu visible immediatement
- Dynamic import de GSAP/Framer Motion pour ne pas bloquer le LCP

### Proprietes animables (performance)
- `transform` (translate, scale, rotate) — compositor only
- `opacity` — compositor only
- `clip-path` — acceptable sur petites surfaces
- JAMAIS animer `width`, `height`, `top`, `left`, `margin`, `padding`

## Stack technique

### GSAP + ScrollTrigger (animations scroll complexes)
```bash
npm install gsap @gsap/react
```
- Text reveal (lignes, mots, caracteres)
- Parallax scroll
- Pin sections
- Scrub animations (animation liee au scroll)
- Stagger sequences

### Framer Motion (animations composants React)
```bash
npm install framer-motion
```
- Page transitions (AnimatePresence)
- Layout animations
- Hover/tap micro-interactions
- Enter/exit animations

### Regle de choix
- **Scroll-driven** → GSAP + ScrollTrigger
- **Composant React interactif** → Framer Motion
- **Simple hover/focus** → CSS pur (transition)
- **Ne jamais mixer GSAP et Framer Motion sur le meme element**

## Architecture fichiers

```
components/
  animations/
    ScrollReveal.tsx        # Wrapper generique scroll reveal
    TextReveal.tsx          # Text reveal par ligne/mot/caractere
    ParallaxImage.tsx       # Image avec parallax
    PageTransition.tsx      # Transition entre pages
    Preloader.tsx           # Ecran de chargement brande
    CustomCursor.tsx        # Curseur custom desktop
    MagneticButton.tsx      # Bouton magnetique
    CountUp.tsx             # Animation compteur chiffres
```

## Patterns d'animation

### 1. ScrollReveal — Wrapper generique
Voir `references/scroll-reveal.md`

Wrap n'importe quelle section pour l'animer au scroll.
- Fade up par defaut
- Variantes : fade-left, fade-right, scale, clip
- Stagger automatique pour les enfants
- Respecte `prefers-reduced-motion`
- Contenu present dans le DOM meme sans JS

### 2. Text Reveal — Titres premium
Voir `references/text-reveal.md`

Anime les titres h1/h2 ligne par ligne ou mot par mot.
- Split par ligne, mot ou caractere
- Le texte original reste dans un `<h1>` / `<h2>` standard dans le HTML
- L'animation est un overlay visuel uniquement
- Scrub possible (lie au scroll)

### 3. Parallax Image
Voir `references/parallax.md`

Image qui se deplace plus lentement que le scroll.
- Utilise `transform: translateY()` uniquement
- Image dans un conteneur `overflow: hidden`
- Pas de layout shift (image surdimensionnee en CSS, pas en DOM)
- `will-change: transform` temporaire pendant l'animation

### 4. Page Transitions
Voir `references/page-transitions.md`

Transition fluide entre les pages avec Framer Motion.
- AnimatePresence dans le layout.tsx
- Fade + slide subtil (pas de transition lourde)
- Le contenu de la nouvelle page est deja dans le HTML (SSG)
- Duree max 400ms

### 5. ~~Preloader~~ — SUPPRIME

Pas de preloader. Le contenu doit etre visible immediatement au chargement.
Un ecran de chargement retarde le LCP, degrade le SEO et frustre l'utilisateur.
Le fichier `references/preloader.md` reste comme reference technique mais ne doit JAMAIS etre utilise.

### 6. Curseur Custom
Voir `references/custom-cursor.md`

Curseur personnalise sur desktop uniquement.
- Petit cercle qui suit la souris avec lerp (smooth)
- Grossit sur les elements interactifs (links, buttons)
- Desactive sur mobile/tablette (`pointer: fine` only)
- N'affecte pas l'accessibilite (le vrai curseur reste fonctionnel)

### 7. Bouton Magnetique
Voir `references/magnetic-button.md`

CTA qui se deplace legerement vers le curseur.
- Mouvement max 10-15px
- Desktop only (`pointer: fine`)
- Lerp pour le mouvement fluide
- Reset smooth au mouseLeave

### 8. Compteur Anime
Voir `references/count-up.md`

Chiffres qui s'incrementent quand la section entre dans le viewport.
- Le chiffre final est dans le HTML statique (SEO)
- L'animation remplace visuellement de 0 au chiffre
- Declenche une seule fois (IntersectionObserver)
- Duree 1.5-2.5s avec easing out

## Regles de performance

### Dynamic imports obligatoires
```tsx
"use client";
import dynamic from 'next/dynamic';

const ScrollReveal = dynamic(() => import('@/components/animations/ScrollReveal'), {
  ssr: false,
});
```

### Bundle size
- GSAP core : ~25KB gzip
- ScrollTrigger : ~10KB gzip
- Framer Motion : ~35KB gzip
- Ne JAMAIS importer les deux si un seul suffit
- Preferer GSAP si le site est animation-heavy (plus leger)

### Timing guidelines
| Type | Duree | Easing |
|------|-------|--------|
| Micro-interaction (hover, tap) | 150-250ms | ease-out |
| Enter/reveal | 400-700ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Exit | 200-350ms | ease-in |
| Page transition | 300-400ms | ease-in-out |
| Parallax | continu (scroll) | linear |
| Text reveal | 600-1000ms total | cubic-bezier(0.65, 0, 0.35, 1) |
| Compteur | 1500-2500ms | ease-out |

### Stagger
- Entre elements d'une liste : 50-80ms
- Entre lignes de texte : 80-120ms
- Entre caracteres : 20-30ms
- Max 8 elements en stagger (au-dela, effet dilue)

## Checklist pre-livraison

- [ ] Chaque animation respecte `prefers-reduced-motion`
- [ ] Aucun contenu textuel en `display: none` ou `visibility: hidden`
- [ ] GSAP/Framer Motion importes en dynamic (pas dans le bundle initial)
- [ ] Pas de layout shift visible (CLS = 0)
- [ ] Animations pausees hors viewport (IntersectionObserver ou ScrollTrigger)
- [ ] `will-change` applique temporairement, jamais en permanence
- [ ] Mobile : animations reduites ou supprimees si perf insuffisante
- [ ] Le site est entierement lisible et navigable sans JavaScript
- [ ] LCP non impacte (preloader ne bloque pas le contenu principal)
- [ ] Aucune animation sur les proprietes de layout (width, height, margin)

## Integration dans le workflow /nouveau-projet

Ce skill est utilise automatiquement au Step 5 (Developpement) :
1. L'agent-dev importe les composants d'animation depuis `components/animations/`
2. Chaque section est wrappee dans `<ScrollReveal>` sauf le hero (animation custom)
3. Les h1/h2 utilisent `<TextReveal>` si le DA brief le demande
4. Le preloader est ajoute si mentionne dans le brief
5. Le curseur custom est ajoute si mentionne dans le brief
6. Les images avec ratio > 16:9 utilisent `<ParallaxImage>`
