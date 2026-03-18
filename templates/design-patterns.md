# Design Patterns CSS — Réutilisables sur tous les projets

## Classes utilitaires éprouvées (à mettre dans globals.css)

### Bouton primaire — CTA principal
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-accent);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.875rem 1.75rem;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(var(--accent-rgb), 0.4);
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -10px rgba(var(--accent-rgb), 0.5);
}
```

### Card chaleureuse — ombre douce + hover lift
```css
.card-warm {
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border: 1px solid rgba(213, 217, 236, 0.5);
  transition: box-shadow 0.3s, transform 0.3s;
}
.card-warm:hover {
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
```

### Glassmorphism
```css
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

### Blobs ambiants (profondeur douce)
```css
.ambient-blobs {
  position: relative;
  overflow: hidden;
}
.ambient-blobs::before {
  content: '';
  position: absolute;
  top: -10%; right: -5%;
  width: 60%; height: 60%;
  border-radius: 9999px;
  background-color: var(--color-accent);
  opacity: 0.08;
  filter: blur(120px);
  pointer-events: none;
}
.ambient-blobs::after {
  content: '';
  position: absolute;
  bottom: -10%; left: -5%;
  width: 40%; height: 50%;
  border-radius: 9999px;
  background-color: var(--color-primary);
  opacity: 0.05;
  filter: blur(100px);
  pointer-events: none;
}
```

### Section label éditorial
```css
.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
}
```

### Séparateur section
```css
.section-divider {
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent) 60%, transparent);
  border-radius: 9999px;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
```

## Patterns de fond de section
- **Fond chaud** : `background-color: #FDFAF7` (léger crème)
- **Fond alt** : `background-color: #F4F5FB` (lavande très pâle)
- **Fond hero** : couleur primaire + blobs + image en opacity faible

## Patterns d'icônes
```jsx
{/* Conteneur icône warm */}
<div className="w-14 h-14 rounded-2xl bg-[accent]/10 flex items-center justify-center">
  <Icon size={22} className="text-[accent]" />
</div>
```

## Inputs formulaire warm
```css
/* rounded-2xl, focus ring accent */
border rounded-2xl px-4 py-3
focus:ring-2 focus:ring-[accent] focus:border-[accent]
```

## Typographie
- **Titres h1/h2** : font display/serif, weight 400, line-height 1.15
- **h1** : `clamp(2.5rem, 5vw, 3.5rem)`
- **h2** : `clamp(1.75rem, 3vw, 2.25rem)`
- **Corps** : font sans-serif, weight 400, line-height 1.7
- **Sous-titres** : italique, opacity réduite

## Diversité de layouts — Anti-template

### Règle fondamentale
Chaque site doit avoir une identité visuelle UNIQUE. Deux clients ne doivent jamais recevoir des sites qui se ressemblent. Varier les layouts entre les projets ET entre les sections d'un même site.

### Catalogue de layouts de sections (ne pas toujours utiliser les mêmes)

**Layouts hero :**
- Split 50/50 image/texte (le basique — ne pas utiliser par défaut)
- Plein écran image/vidéo avec overlay texte centré
- Typo XXL plein écran sans image, CTA en bas
- Image fond + texte aligné gauche avec forme géométrique
- Hero asymétrique 60/40 avec image qui déborde du conteneur
- Hero avec grille d'images en mosaïque

**Layouts sections de contenu :**
- Split image/texte (varier les ratios : 40/60, 55/45, pas toujours 50/50)
- Texte pleine largeur avec image en fond (parallax ou fixe)
- Bento grid (grille asymétrique type dashboard)
- Texte centré étroit (max-w-2xl) avec marges généreuses
- Image pleine largeur qui casse le conteneur (negative margin ou full-bleed)
- Colonnes décalées verticalement (staggered grid)
- Texte qui chevauche une image (overlap avec z-index)

**Layouts grilles de services/features :**
- Grille 3 colonnes classique (ne pas utiliser par défaut)
- Grille 2 colonnes avec une grande card + 2 petites
- Liste verticale avec icône/image à gauche
- Carousel/slider horizontal
- Grille asymétrique (1 grande + 3 petites)
- Accordéon avec détails dépliables

**Layouts témoignages :**
- Card unique centrée avec flèches
- Grille masonry
- Citation plein écran avec typo serif XXL
- Carousel automatique avec avatars

**Layouts CTA :**
- Bandeau pleine largeur fond accent
- Card flottante centrée avec ombre portée
- Split image/CTA avec fond contrasté
- CTA intégré dans le footer (pas une section séparée)

### Règle de non-répétition dans un même site
- Ne JAMAIS avoir 2 sections consécutives avec le même layout
- Alterner les sections larges et étroites
- Alterner les fonds (clair → sombre → clair ou clair → alt → clair)
- Si une section est en split image/texte, la suivante ne doit PAS être en split image/texte
- Varier les alignements : centré, gauche, droite

### Éléments d'identité unique par projet
Chaque projet doit avoir AU MOINS 2 de ces éléments distinctifs :
- Un motif graphique récurrent (ligne, arc, cercle, grille de points)
- Un traitement d'image spécifique (duotone, coins arrondis spéciaux, bordure, ombre colorée)
- Un style de séparateur unique entre les sections
- Un hover state signature sur les cards/boutons
- Un élément typographique distinctif (un mot en accent, une lettrine, un trait sous les titres)
- Une forme custom en CSS (clip-path, border-radius asymétrique)
- Un traitement du header/navigation non standard

## Spacing system — Obligatoire sur tous les projets

### Conteneur principal
```css
.container {
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}
```

### Sections — Paddings par breakpoint
```
Mobile (< 768px)    : padding: 50px 20px
Tablet (768-1023px) : padding: 80px 30px
Desktop (1024+)     : padding: 100px 0  (conteneur centré 1140px)
```

### Implémentation Tailwind
```jsx
<section className="px-5 py-[50px] md:px-[30px] md:py-20 lg:px-0 lg:py-[100px]">
  <div className="max-w-[1140px] mx-auto">
    {/* contenu */}
  </div>
</section>
```

### Règle absolue
- Chaque `<section>` du site DOIT respecter ce système
- Aucune exception sans validation explicite du client
- Le conteneur 1140px est toujours centré sur desktop

## Layout image + texte — Règle mobile obligatoire

Sur desktop/tablette, une section avec image et texte côte à côte peut avoir l'image à gauche ou à droite.

**Sur mobile : l'image passe TOUJOURS sous le texte, jamais au-dessus.**

### Implémentation Tailwind
```jsx
<div className="flex flex-col lg:flex-row items-center gap-10">
  <div className="w-full lg:w-1/2">
    {/* Texte — toujours en premier dans le DOM */}
  </div>
  <div className="w-full lg:w-1/2">
    {/* Image — toujours en second dans le DOM */}
  </div>
</div>

{/* Si l'image doit être à GAUCHE sur desktop, inverser visuellement : */}
<div className="flex flex-col lg:flex-row-reverse items-center gap-10">
  <div className="w-full lg:w-1/2">
    {/* Texte — reste en premier dans le DOM = en haut sur mobile */}
  </div>
  <div className="w-full lg:w-1/2">
    {/* Image — reste en second dans le DOM = en bas sur mobile */}
  </div>
</div>
```

### Règle absolue
- Le texte est TOUJOURS en premier dans le DOM (= au-dessus sur mobile)
- Utiliser `lg:flex-row-reverse` si l'image doit apparaître à gauche sur desktop
- Ne JAMAIS utiliser `order-` pour réordonner sur mobile
