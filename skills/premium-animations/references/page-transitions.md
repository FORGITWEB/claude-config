# Page Transitions — Framer Motion

## Architecture

La transition de page se fait dans le layout principal avec `AnimatePresence`.

### layout.tsx — Setup
```tsx
import { Inter } from "next/font/local";
import PageTransitionProvider from "@/components/animations/PageTransition";
import "./globals.css";

const inter = Inter({ src: "./fonts/Inter.woff2" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Header />
        <PageTransitionProvider>{children}</PageTransitionProvider>
        <Footer />
      </body>
    </html>
  );
}
```

## Implementation — PageTransition.tsx
```tsx
"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransitionProvider({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

## Regles SEO
- Le contenu de chaque page est genere en SSG — la transition est purement visuelle
- L'animation ne bloque pas le rendu initial (le HTML est la)
- Duree max 400ms — au-dela l'utilisateur percoit un ralentissement
- Le `<main>` contient tout le contenu de la page, indexable normalement

## Variantes de transition

### Fade simple (par defaut, le plus sur)
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.25 }}
```

### Slide up (plus dynamique)
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
```

### Clip reveal (premium)
```tsx
initial={{ clipPath: "inset(0 0 100% 0)" }}
animate={{ clipPath: "inset(0 0 0% 0)" }}
exit={{ clipPath: "inset(100% 0 0 0)" }}
transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
```

## Attention SSG
Avec `output: 'export'` (SSG), les page transitions fonctionnent car :
- Le routing est gere cote client par Next.js apres le premier chargement
- Le HTML de chaque page est pre-genere
- `AnimatePresence` intercepte le changement de route cote client
- Le premier chargement n'a PAS de transition (directement le contenu)
