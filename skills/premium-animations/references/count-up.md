# CountUp — Compteur anime

## Usage
```tsx
<CountUp value={1500} suffix="+" label="Diagnostics realises" />
<CountUp value={15} label="Annees d'experience" />
<CountUp value={98} suffix="%" label="Clients satisfaits" />
```

## Implementation
```tsx
"use client";

import { useRef, useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  className?: string;
}

export default function CountUp({
  value,
  duration = 2000,
  suffix = "",
  prefix = "",
  label,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !ref.current) return;

    setDisplayValue(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = performance.now();

          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOut(progress);

            setDisplayValue(Math.round(easedProgress * value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <div className={className}>
      <span ref={ref} className="text-4xl md:text-5xl font-bold">
        {prefix}{displayValue.toLocaleString("fr-FR")}{suffix}
      </span>
      <span className="block mt-2 text-sm opacity-70">{label}</span>
    </div>
  );
}
```

## Regles SEO
- La valeur finale (`value`) est le state initial — si JS ne charge pas, le chiffre correct s'affiche
- Avec `prefers-reduced-motion` : la valeur finale est affichee directement, pas d'animation
- L'element est un `<span>` standard — indexable normalement
- Le `label` est visible dans le DOM pour le contexte semantique

## Regles UX
- **Duree** : 1500-2500ms selon la grandeur du chiffre
- **Easing** : ease-out cubique (ralentit en fin)
- **Trigger** : quand l'element est visible a 50% dans le viewport
- **Une seule fois** : ne rejoue pas au re-scroll
- **Locale** : `toLocaleString("fr-FR")` pour les separateurs de milliers (1 500 au lieu de 1,500)
- **Suffix/prefix** : pour les "+" , "%", "euros", etc.
