# Règles de génération Next.js — Migration WordPress

## Table des matières
1. Structure du projet
2. Mapping URLs WordPress → Next.js
3. Contenu — Fidélité absolue
4. Multilingue
5. Images & Médias
6. Formulaires
7. Blog & Pagination
8. SEO Préservation

---

## 1. Structure du projet

```
[nom-projet]/
├── app/
│   ├── layout.tsx              # Layout global + fonts + metadata
│   ├── page.tsx                # Homepage
│   ├── sitemap.ts              # Sitemap XML auto-généré
│   ├── robots.ts               # robots.txt
│   ├── not-found.tsx           # 404
│   ├── opengraph-image.tsx     # OG image
│   ├── icon.png                # Favicon
│   ├── [slug]/page.tsx         # Pages statiques
│   ├── blog/
│   │   ├── page.tsx            # Liste articles (paginée)
│   │   ├── [slug]/page.tsx     # Article individuel
│   │   └── category/
│   │       └── [slug]/page.tsx # Page catégorie
│   ├── api/
│   │   └── contact/route.ts    # Brevo API
│   └── mentions-legales/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/                     # Composants réutilisables
├── lib/
│   ├── config.ts               # Coordonnées centralisées
│   └── blog.ts                 # Helpers blog (si blog)
├── content/
│   └── blog/                   # Articles en JSON ou MDX
├── public/
│   ├── images/                 # Images migrées
│   └── docs/                   # PDFs migrés
├── _migration/                 # Données de migration (supprimé à la fin)
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## 2. Mapping URLs WordPress → Next.js

**Règle critique : reproduire EXACTEMENT la même arborescence d'URLs.**

| WordPress URL | Next.js App Router |
|---|---|
| `/` | `app/page.tsx` |
| `/about/` | `app/about/page.tsx` |
| `/services/plomberie/` | `app/services/plomberie/page.tsx` |
| `/blog/` | `app/blog/page.tsx` |
| `/blog/mon-article/` | `app/blog/mon-article/page.tsx` |
| `/category/renovation/` | `app/category/renovation/page.tsx` |
| `/tag/urgent/` | `app/tag/urgent/page.tsx` |
| `/fr/a-propos/` | `app/fr/a-propos/page.tsx` |
| `/en/about/` | `app/en/about/page.tsx` |

**Important :**
- Si WordPress utilise des trailing slashes → configurer `trailingSlash: true` dans next.config.js
- Si les articles ont un prefix `/blog/` ou `/actualites/` → le garder
- Les slugs sont IDENTIQUES — ne pas les "améliorer"

## 3. Contenu — Fidélité absolue

### Textes
- Copier **MOT POUR MOT** depuis les JSON dans `_migration/pages/`
- Zéro reformulation, zéro correction, zéro ajout
- Si le texte original a une faute → garder la faute
- Si une section n'a pas de contenu dans le JSON → `{/* PLACEHOLDER — contenu manquant */}`

### Structure HTML
- Respecter la hiérarchie des headings (h1 → h2 → h3)
- Si le site original a un h1 → le garder exactement
- Si le site original a des listes → les garder comme listes
- Les blockquotes restent des blockquotes

### Meta tags
- `title` : copier exactement depuis `meta.title`
- `description` : copier exactement depuis `meta.description`
- `canonical` : adapter au nouveau domaine mais garder le même path
- `robots` : si "noindex" dans l'original → garder noindex

## 4. Multilingue

### Détection
Le crawler détecte automatiquement les langues via :
- hreflang tags
- Sous-dossiers d'URL (`/fr/`, `/en/`)
- Sitemap hreflang

### Structure Next.js
```
app/
├── [lang]/
│   ├── layout.tsx          # Layout avec lang
│   ├── page.tsx            # Homepage locale
│   └── [slug]/page.tsx     # Pages locales
├── layout.tsx              # Root layout
└── middleware.ts            # Redirect selon Accept-Language
```

### Middleware i18n
```typescript
import { NextRequest, NextResponse } from 'next/server';

const locales = ['fr', 'en']; // Adapter selon les langues détectées
const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return;

  // Detect preferred locale
  const acceptLang = request.headers.get('accept-language') || '';
  const preferred = locales.find((l) => acceptLang.includes(l)) || defaultLocale;

  return NextResponse.redirect(
    new URL(`/${preferred}${pathname}`, request.url)
  );
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### generateStaticParams
Chaque page dynamique doit exporter `generateStaticParams` avec toutes les langues :
```typescript
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}
```

## 5. Images & Médias

### Images migrées
- Copiées depuis `_migration/assets/images/` → `public/images/`
- Utiliser `<Image>` de Next.js pour toutes les images
- Garder les alt texts originaux mot pour mot
- `unoptimized: true` dans next.config.js

### Mapping des URLs d'images
Le fichier `_migration/crawl-report.json` contient `assetMaps.imageMap` qui mappe les URLs originales vers les chemins locaux. Utiliser ce mapping pour remplacer les `src` dans le code.

### Vidéos embarquées
- Garder les iframes YouTube/Vimeo tels quels
- Ajouter `loading="lazy"` aux iframes

### PDFs et documents
- Copiés depuis `_migration/assets/docs/` → `public/docs/`
- Les liens vers les PDFs pointent vers `/docs/[filename]`

## 6. Formulaires

Tous les formulaires WordPress (Contact Form 7, WPForms, etc.) sont convertis en :
- `components/ContactForm.tsx` (composant client avec validation)
- `app/api/contact/route.ts` (API Route Brevo)

### Champs du formulaire
Reproduire les **mêmes champs** que le formulaire WordPress original :
- Si le formulaire original a "Nom, Prénom, Email, Téléphone, Message" → garder exactement ça
- Si le formulaire original a un champ "Sujet" avec un select → le reproduire
- Si le formulaire original a des champs custom → les reproduire

### Brevo API Route
```typescript
// app/api/contact/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: body.name, email: process.env.SENDER_EMAIL },
      to: [{ email: process.env.CONTACT_EMAIL }],
      subject: `Nouveau message de ${body.name}`,
      htmlContent: `...`, // Formater les champs
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Erreur envoi' }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

## 7. Blog & Pagination

### Articles statiques
Chaque article extrait est stocké en JSON dans `content/blog/`.
Utiliser `generateStaticParams` pour pré-rendre tous les articles.

```typescript
// app/blog/[slug]/page.tsx
import { getAllPosts, getPostBySlug } from '@/lib/blog';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}
```

### Pagination
Si le site original a X articles par page → garder le même nombre.
Pagination via query params ou sous-routes selon l'original :
- Si `/blog/page/2/` → `app/blog/page/[page]/page.tsx`
- Si `/blog/?page=2` → gérer côté client avec searchParams

### Catégories et tags
Reproduire les mêmes pages de catégories et tags.
Chaque catégorie/tag a sa propre page qui liste les articles correspondants.

## 8. SEO Préservation

### Checklist critique
- [ ] Toutes les URLs sont identiques (pas de changement de slug)
- [ ] Meta titles identiques mot pour mot
- [ ] Meta descriptions identiques mot pour mot
- [ ] Canonical URLs pointent vers le bon domaine
- [ ] H1 unique par page, identique à l'original
- [ ] Alt text des images identiques
- [ ] sitemap.xml contient toutes les pages
- [ ] robots.txt autorise le crawl
- [ ] hreflang tags si multilingue
- [ ] Schema.org JSON-LD reproduit (LocalBusiness, BreadcrumbList, Article pour le blog)
- [ ] Pas de pages "noindex" devenues "index" par accident

### Redirections
Si certaines URLs WordPress ne sont pas migrées (pages WP spécifiques comme /cart/, /my-account/) :
- Les lister dans le rapport final
- Proposer des redirections 301 dans `next.config.js` :

```javascript
async redirects() {
  return [
    { source: '/old-path', destination: '/new-path', permanent: true },
  ];
}
```
