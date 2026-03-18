# CustomCursor — Curseur personnalise desktop

## Usage
```tsx
// Dans layout.tsx
<CustomCursor color="var(--color-accent)" />
```

## Implementation
```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface CustomCursorProps {
  color?: string;
  size?: number;
  hoverSize?: number;
}

export default function CustomCursor({
  color = "var(--color-accent)",
  size = 12,
  hoverSize = 40,
}: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const position = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;

    if (prefersReduced || isCoarse || !cursorRef.current) return;

    document.documentElement.style.cursor = "none";

    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const isInteractive =
        el.tagName === "A" ||
        el.tagName === "BUTTON" ||
        el.closest("a") ||
        el.closest("button") ||
        el.closest("[data-cursor-hover]");
      setIsHovering(!!isInteractive);
    };

    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      position.current.x = lerp(position.current.x, target.current.x, 0.15);
      position.current.y = lerp(position.current.y, target.current.y, 0.15);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafId.current);
      document.documentElement.style.cursor = "";
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9998] mix-blend-difference"
      style={{
        width: isHovering ? hoverSize : size,
        height: isHovering ? hoverSize : size,
        marginLeft: isHovering ? -hoverSize / 2 : -size / 2,
        marginTop: isHovering ? -hoverSize / 2 : -size / 2,
        backgroundColor: color,
        borderRadius: "50%",
        transition: "width 0.3s ease, height 0.3s ease, margin 0.3s ease",
        willChange: "transform",
      }}
    />
  );
}
```

## Regles
- **Desktop only** : detection via `(pointer: coarse)` — jamais sur mobile/tablette
- **Accessibilite** : le vrai curseur natif est masque visuellement (`cursor: none`) mais reste fonctionnel pour les clics
- **Performance** : utilise `requestAnimationFrame` + `transform3d` uniquement
- **Lerp factor** : 0.15 = smooth mais reactif. Ne pas depasser 0.2 (trop rapide = pas d'effet)
- **Mix-blend-difference** : le curseur reste visible sur fond clair et sombre
- **z-index** : 9998 (sous le preloader 9999)
- Le `data-cursor-hover` permet d'ajouter l'effet hover sur n'importe quel element
- `prefers-reduced-motion` → pas de curseur custom

## Ajout de l'attribut hover sur des elements custom
```tsx
<div data-cursor-hover>
  Ce block agrandit le curseur au survol
</div>
```
