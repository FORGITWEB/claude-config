# ParallaxImage — Image avec effet parallax

## Usage
```tsx
<ParallaxImage
  src="/images/hero-bg.jpg"
  alt="Description de l'image"
  speed={0.3}
  className="h-[500px] rounded-3xl"
/>
```

## Implementation
```tsx
"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number;
  className?: string;
}

export default function ParallaxImage({
  src,
  alt,
  speed = 0.3,
  className,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !containerRef.current || !imageRef.current) return;

    const distance = speed * 100;

    gsap.set(imageRef.current, { y: -distance / 2 });

    const tween = gsap.to(imageRef.current, {
      y: distance / 2,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      tween.kill();
    };
  }, [speed]);

  return (
    <div ref={containerRef} className={`overflow-hidden relative ${className}`}>
      <div ref={imageRef} className="absolute inset-0 -top-[15%] -bottom-[15%]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
      </div>
    </div>
  );
}
```

## Regles
- L'image est surdimensionnee en CSS (`-top-[15%] -bottom-[15%]`) pour eviter les bords blancs
- Le conteneur a `overflow: hidden` — pas de debordement visible
- Seul `transform: translateY` est anime (compositor only)
- `will-change` n'est pas necessaire — GSAP gere la promotion de couche
- `speed` entre 0.1 (subtil) et 0.5 (prononce), ne jamais depasser 0.5
- Sur mobile : reduire `speed` a 0.15 max ou desactiver (touch scrolling)
