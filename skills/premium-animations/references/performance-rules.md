# Regles de performance animations

Source : fixing-motion-performance (ibelick) + ui-animation (mblode)

## Proprietes par cout de rendu

| Niveau | Proprietes | Usage |
|--------|-----------|-------|
| Compositor (gratuit) | `transform`, `opacity` | Toujours preferer |
| Paint (moyen) | `color`, `background`, `box-shadow`, `border`, `filter` | Petites surfaces seulement |
| Layout (interdit) | `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | JAMAIS animer |

## Never patterns (critique)

- Ne jamais entrelacer lectures et ecritures DOM dans la meme frame
- Ne jamais animer layout sur de grandes surfaces
- Ne jamais driver une animation depuis `scrollTop`, `scrollY` ou `scroll` events
- Pas de `requestAnimationFrame` sans condition d'arret
- Ne jamais mixer GSAP et Framer Motion sur le meme element

## Easing par defaut

| Type d'interaction | Easing | Valeur |
|-------------------|--------|--------|
| Enter / apparition | ease-out | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Exit / disparition | ease-in | `cubic-bezier(0.55, 0, 1, 0.45)` |
| Move / deplacement | ease-out | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Hover | ease | `ease` ou `200ms ease` |
| Spring (Framer) | spring | `stiffness: 500, damping: 40` |

## Timing

- Micro-interactions : 150-250ms
- Enter animations : 200-300ms (jamais > 500ms)
- Page transitions : 300-400ms
- Ne jamais animer au keyboard event
- CSS prefere a JS pour les animations simples

## Scroll animations

- Preferer `animation-timeline: view()` CSS quand supporte
- Sinon : GSAP ScrollTrigger avec `scrub`
- Utiliser IntersectionObserver pour la visibilite et le pause
- Ne jamais poller `scrollPosition`
- Pauser les animations hors viewport

## will-change

- Appliquer temporairement pendant l'animation, JAMAIS en permanence
- Retirer apres l'animation terminee
- Eviter de promouvoir trop de layers (memoire GPU)

## Blur et filters

- Blur max 8px
- Jamais animer blur en continu
- Jamais animer blur sur de grandes surfaces
- Preferer `opacity` + `translate` avant blur
- Blur uniquement pour des effets courts et ponctuels

## prefers-reduced-motion

Obligatoire sur TOUTES les animations :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
import { useReducedMotion } from "framer-motion";

export function Component() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div>{children}</div>;
  return <motion.div animate={...}>{children}</motion.div>;
}
```

## Hover sur mobile

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  }
}
```

Jamais de hover sans `@media (hover: hover)` — sinon l'effet reste colle au tap sur mobile.

## Debug

- Enregistrer l'animation et la relire frame par frame si quelque chose semble off
- Fix shaky 1px : appliquer `will-change: transform` temporairement pendant l'animation
- Ne jamais animer depuis `scale(0)` — commencer a `scale(0.95)` minimum
- Fix hover flicker : appliquer le hover sur le parent, animer l'enfant
