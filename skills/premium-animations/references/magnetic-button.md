# MagneticButton — CTA magnetique

## Usage
```tsx
<MagneticButton>
  <a href="/contact" className="btn-primary">
    Demander un devis
  </a>
</MagneticButton>

<MagneticButton strength={0.4}>
  <button className="btn-primary">En savoir plus</button>
</MagneticButton>
```

## Implementation
```tsx
"use client";

import { useRef, useState, ReactNode, useEffect } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export default function MagneticButton({
  children,
  strength = 0.3,
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    setIsEnabled(!prefersReduced && !isCoarse);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || !isEnabled) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    const maxMove = 15;
    setPosition({
      x: Math.max(-maxMove, Math.min(maxMove, deltaX)),
      y: Math.max(-maxMove, Math.min(maxMove, deltaY)),
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      className={`inline-block ${className || ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0
          ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
          : "transform 0.15s ease-out",
      }}
    >
      {children}
    </div>
  );
}
```

## Regles
- **Desktop only** : detection via `(pointer: coarse)`
- **Mouvement max 15px** : au-dela ca devient distrayant
- **Strength** : 0.2 (subtil) a 0.5 (prononce), defaut 0.3
- **Transition retour** : plus lente (0.5s) avec easing out pour un effet elastique
- **Transition active** : plus rapide (0.15s) pour suivre la souris
- Ne pas appliquer sur des liens de navigation — uniquement sur les CTA principaux
- `prefers-reduced-motion` → pas d'effet magnetique
