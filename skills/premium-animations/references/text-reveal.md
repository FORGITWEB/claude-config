# TextReveal — Titres premium

## Usage
```tsx
<TextReveal as="h1" splitBy="line">
  Votre expert en diagnostic immobilier
</TextReveal>

<TextReveal as="h2" splitBy="word" stagger={0.04}>
  Des solutions sur mesure pour votre projet
</TextReveal>

<TextReveal as="h2" splitBy="char" scrub>
  Innovation et performance
</TextReveal>
```

## Implementation
```tsx
"use client";

import { useRef, useEffect, ElementType, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SplitMode = "line" | "word" | "char";

interface TextRevealProps {
  children: string;
  as?: ElementType;
  splitBy?: SplitMode;
  stagger?: number;
  duration?: number;
  scrub?: boolean;
  className?: string;
}

export default function TextReveal({
  children,
  as: Tag = "h2",
  splitBy = "line",
  stagger = 0.08,
  duration = 0.6,
  scrub = false,
  className,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const srOnly = container.querySelector("[data-sr-only]") as HTMLElement;
    const visual = container.querySelector("[data-visual]") as HTMLElement;

    if (!srOnly || !visual) return;

    srOnly.style.position = "absolute";
    srOnly.style.width = "1px";
    srOnly.style.height = "1px";
    srOnly.style.overflow = "hidden";
    srOnly.style.clip = "rect(0,0,0,0)";

    visual.style.display = "block";
    visual.setAttribute("aria-hidden", "true");

    const elements = visual.querySelectorAll("[data-split]");

    gsap.set(elements, { y: "110%", opacity: 0 });

    const tween = gsap.to(elements, {
      y: "0%",
      opacity: 1,
      duration,
      stagger,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        ...(scrub ? { scrub: 1, start: "top 90%", end: "top 40%" } : { once: true }),
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [children, splitBy, stagger, duration, scrub]);

  const splitText = (text: string, mode: SplitMode): string[] => {
    if (mode === "char") return text.split("");
    if (mode === "word") return text.split(" ");
    return text.split("\n").length > 1 ? text.split("\n") : [text];
  };

  const parts = splitText(children, splitBy);

  return (
    <div ref={containerRef} className={className}>
      {/* Texte reel pour SEO — toujours dans le DOM */}
      <Tag data-sr-only>{children}</Tag>

      {/* Version visuelle animee */}
      <Tag data-visual style={{ display: "none" }} aria-hidden="true">
        {parts.map((part, i) => (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden" }}
          >
            <span data-split style={{ display: "inline-block" }}>
              {part}
              {splitBy === "word" && i < parts.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}
```

## Pourquoi c'est SEO-friendly
- Le `<h1>` / `<h2>` reel avec le texte complet est TOUJOURS dans le HTML
- L'element `data-sr-only` contient le vrai texte pour les moteurs de recherche
- La version animee (`data-visual`) est `aria-hidden="true"` et `display: none` par defaut
- Si JS ne charge pas → le titre reel s'affiche normalement
- Google voit le H1/H2 avec le texte complet, pas les spans splittes

## Variantes visuelles
- `splitBy="line"` : revele ligne par ligne (hero, titres longs)
- `splitBy="word"` : revele mot par mot (titres courts, slogans)
- `splitBy="char"` : revele caractere par caractere (noms de marque, accent)
- `scrub={true}` : animation liee au scroll (sections mid-page)
