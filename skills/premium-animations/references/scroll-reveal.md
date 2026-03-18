# ScrollReveal — Composant wrapper

## Usage
```tsx
<ScrollReveal>
  <p>Ce texte apparait au scroll</p>
</ScrollReveal>

<ScrollReveal variant="fade-left" delay={0.2}>
  <Card />
</ScrollReveal>

{/* Stagger automatique sur les enfants */}
<ScrollReveal stagger={0.08}>
  <Card />
  <Card />
  <Card />
</ScrollReveal>
```

## Implementation
```tsx
"use client";

import { useRef, useEffect, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Variant = "fade-up" | "fade-left" | "fade-right" | "scale" | "clip-up";

const variantConfig: Record<Variant, gsap.TweenVars> = {
  "fade-up": { y: 40, opacity: 0 },
  "fade-left": { x: -40, opacity: 0 },
  "fade-right": { x: 40, opacity: 0 },
  "scale": { scale: 0.92, opacity: 0 },
  "clip-up": { clipPath: "inset(100% 0 0 0)", opacity: 0 },
};

const variantTo: Record<Variant, gsap.TweenVars> = {
  "fade-up": { y: 0, opacity: 1 },
  "fade-left": { x: 0, opacity: 1 },
  "fade-right": { x: 0, opacity: 1 },
  "scale": { scale: 1, opacity: 1 },
  "clip-up": { clipPath: "inset(0% 0 0 0)", opacity: 1 },
};

interface ScrollRevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.7,
  stagger,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !ref.current) return;

    const targets = stagger ? ref.current.children : ref.current;

    gsap.set(targets, variantConfig[variant]);

    gsap.to(targets, {
      ...variantTo[variant],
      duration,
      delay,
      stagger: stagger || 0,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [variant, delay, duration, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

## Regles SEO
- Le contenu est dans le DOM avant JS (SSG)
- `opacity: 0` est l'etat initial — Google indexe quand meme le texte
- Jamais `display: none` ou `visibility: hidden`
- Sans JS le contenu apparait normalement (pas de GSAP = pas de set initial)

## Fallback CSS (si JS desactive)
Ajouter dans globals.css :
```css
@media (prefers-reduced-motion: reduce) {
  [data-scroll-reveal] {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
  }
}
```
