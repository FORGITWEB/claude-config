# Checklist Setup Projet Next.js — Nicolas

## 1. Init projet
```bash
npx create-next-app@latest NOM --typescript --tailwind --eslint --app --src-dir=false
```

## 2. next.config.js

**Vercel (standard) :**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
}
module.exports = nextConfig
```
Pas de `output: 'export'` sur Vercel — les pages sont SSG par défaut, et les API routes (`/api/contact`, `/api/cron/reviews`) tournent en serverless.

**Hébergement classique (fallback) :**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',        // SSG statique pour FTP
  images: { unoptimized: true },
  trailingSlash: true,
}
module.exports = nextConfig
```
Avec `output: 'export'`, pas d'API routes possibles → utiliser le formulaire mailto en fallback.

## 3. Polices locales (WOFF2)
- Placer dans `/public/fonts/`
- Déclarer dans `layout.tsx` via `next/font/local`
- Injecter en CSS variables sur `<html>`
```tsx
import localFont from 'next/font/local'
const heading = localFont({
  src: '../public/fonts/Heading.woff2',
  variable: '--font-heading',
  display: 'swap',
})
const body = localFont({
  src: '../public/fonts/Body.woff2',
  variable: '--font-body',
  display: 'swap',
})
// <html className={`${heading.variable} ${body.variable}`}>
```

## 4. Structure dossiers
```
app/
  layout.tsx              # Shell HTML, fonts, metadata globale
  page.tsx                # Accueil
  not-found.tsx           # Page 404 designée
  globals.css             # Tokens CSS + classes utilitaires
  icon.png                # Favicon (512x512 min)
  opengraph-image.png     # OG Image (1200x630) ou .tsx pour génération dynamique
  sitemap.ts              # Sitemap XML auto-généré
  robots.ts               # robots.txt
  services/page.tsx
  a-propos/page.tsx
  contact/page.tsx
  mentions-legales/page.tsx
  api/cron/reviews/route.ts  # Endpoint cron Vercel (avis Google)
components/
  layout/Header.tsx
  layout/Footer.tsx
  CookieBanner.tsx        # Bandeau cookies RGPD
  Analytics.tsx            # GA4 conditionnel (consent)
  animations/             # Composants d'animation premium
  ui/                     # Composants réutilisables
lib/
  config.ts               # Constantes (tel, email, adresse, GA_ID, PLACE_ID)
scripts/
  fetch-reviews.ts        # Script pre-build avis Google
data/
  reviews.json            # Avis Google (généré automatiquement)
public/
  images/
  fonts/
vercel.json               # Config Vercel (cron)
.env.local                # Variables d'environnement (ne pas commiter)
```

## 5. Config Tailwind (tailwind.config.ts)
```ts
theme: {
  extend: {
    fontFamily: {
      heading: ['var(--font-heading)', 'serif'],
      body: ['var(--font-body)', 'sans-serif'],
    },
    colors: {
      primary: 'var(--color-primary)',
      accent: 'var(--color-accent)',
      'bg-alt': 'var(--color-bg-alt)',
      'text-muted': 'var(--color-text-muted)',
      // etc.
    }
  }
}
```

## 6. SEO minimum par page
```tsx
export const metadata: Metadata = {
  title: 'Titre < 60 chars',
  description: 'Description < 155 chars',
  keywords: ['mot1', 'mot2'],
  alternates: { canonical: 'https://domaine.fr/page' },
  openGraph: { title, description, type: 'website', url, locale: 'fr_FR' },
}
```

## 7. Schema.org JSON-LD (page accueil)
```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'LocalBusiness', name, description, telephone, email, address, geo, areaServed },
    { '@type': 'BreadcrumbList', itemListElement: [...] },
  ]
}
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

## 8. Accessibilité minimum
- Skip link en haut du body
- `aria-label` sur navigation, carrousels, sections
- `aria-current="page"` sur lien actif
- `aria-expanded` sur burger mobile
- `focus-visible` outline sur tous les interactifs
- Touch target minimum 44x44px sur boutons mobile
- `alt` descriptif sur images, `alt=""` sur décoratives

## 9. Header pattern
- Sticky top-0 z-50
- Logo = lien vers accueil avec aria-label
- Nav desktop + burger mobile
- CTA "Demander un devis" visible desktop
- Menu mobile : overlay absolute, pas de push content
- **État actif** : le lien de la page courante doit être visuellement différent (couleur accent, underline, ou font-weight)
- Utiliser `usePathname()` pour détecter la page active
```tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
      {links.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={isActive ? "text-accent font-semibold" : "text-text-muted"}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

## 10. Footer pattern
- Bande gradient top (accent → primary)
- Colonnes : logo + description, liens rapides, coordonnées
- Mentions légales en bas
- Blob ambiant discret

## 11. Smooth scroll
Ajouter dans `globals.css` :
```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```
- S'applique automatiquement à tous les liens d'ancrage (`<a href="#section">`)
- Respecte `prefers-reduced-motion`
- Pas besoin de JS pour ça

## 12. SEO technique — sitemap + robots.txt
**`app/sitemap.ts`** — généré automatiquement :
```ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://[DOMAINE]";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/mentions-legales`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

**`app/robots.ts`** :
```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://[DOMAINE]/sitemap.xml",
  };
}
```

- Adapter les URLs à l'arborescence du projet
- Le domaine est un placeholder `[DOMAINE]` à remplacer au déploiement (ou centraliser dans `lib/config.ts`)

## 13. Performance
- `priority` sur image hero uniquement
- `sizes` attribut sur toutes les images responsive
- `display: 'swap'` sur les fonts
- Pas de JS inutile côté client (`'use client'` seulement si nécessaire)

## 14. Formulaire contact — Brevo (Vercel) ou mailto (fallback)

### Vercel (standard) — Envoi via Brevo API

**API Route — `app/api/contact/route.ts` :**
```ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { prenom, nom, telephone, email, message } = body;

  if (!nom || !email || !message) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: "Site web", email: process.env.SENDER_EMAIL },
      to: [{ email: process.env.CONTACT_EMAIL }],
      replyTo: { email, name: `${prenom} ${nom}` },
      subject: `Nouveau message — ${prenom} ${nom}`,
      htmlContent: `
        <h2>Nouveau message depuis le site</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Prénom</td><td style="padding:8px;border:1px solid #ddd">${prenom}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nom</td><td style="padding:8px;border:1px solid #ddd">${nom}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Téléphone</td><td style="padding:8px;border:1px solid #ddd">${telephone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${message}</td></tr>
        </table>
      `,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Composant — `components/ContactForm.tsx` :**
```tsx
"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (form: FormData) => {
    const errs: Record<string, string> = {};
    const email = form.get("email") as string;
    const tel = form.get("telephone") as string;
    const nom = form.get("nom") as string;
    const message = form.get("message") as string;

    if (!nom || nom.length < 2) errs.nom = "Veuillez entrer votre nom";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalide";
    if (!tel || tel.replace(/\s/g, "").length < 10) errs.telephone = "Numéro invalide";
    if (!message || message.length < 10) errs.message = "Message trop court (10 caractères min.)";

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const errs = validate(form);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.get("prenom"),
          nom: form.get("nom"),
          telephone: form.get("telephone"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">Message envoyé</h3>
        <p className="text-text-muted">
          Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
        </p>
        <button onClick={() => setStatus("idle")} className="mt-6 underline text-sm">
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Champs : prénom, nom, téléphone, email, message */}
      {/* Chaque champ affiche errors.nom / errors.email etc. en rouge sous l'input */}
      {/* Styling : rounded-2xl, focus:ring-accent, border-red-500 si erreur */}
      {/* Bouton submit : disabled pendant "sending", texte "Envoi en cours..." */}
      {status === "error" && (
        <p className="text-red-500 text-sm mt-2">
          Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.
        </p>
      )}
    </form>
  );
}
```

**Variables d'environnement (`.env.local` + Vercel Dashboard) :**
```
BREVO_API_KEY=[CLÉ BREVO — dashboard Brevo → SMTP & API → API Keys]
SENDER_EMAIL=theo@forgitweb.fr
CONTACT_EMAIL=email-du-client@domaine.fr
```
- `BREVO_API_KEY` et `SENDER_EMAIL` → identiques sur tous les projets
- `CONTACT_EMAIL` → change par client (l'email qui reçoit les demandes)

### Hébergement classique (fallback) — mailto

Si `output: 'export'` (pas d'API routes), utiliser le formulaire mailto :
```tsx
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const subject = encodeURIComponent(`Contact depuis le site — ${form.get("nom")}`);
  const body = encodeURIComponent(
    `Nom : ${form.get("nom")}\nPrénom : ${form.get("prenom")}\nTéléphone : ${form.get("telephone")}\nEmail : ${form.get("email")}\n\nMessage :\n${form.get("message")}`
  );
  window.location.href = `mailto:${config.email}?subject=${subject}&body=${body}`;
};
```

**Règles du formulaire (les deux versions) :**
- Validation au submit (pas au blur — moins intrusif)
- Messages d'erreur en français, sous chaque champ concerné
- Input en erreur : bordure rouge + message
- État "sending" : bouton disabled + texte "Envoi en cours..."
- État succès : message de confirmation
- État erreur : message + suggestion de contacter par téléphone
- Le checkmark est du texte, pas un emoji

## 15. Google Maps — Section contact

Pour les business locaux, intégrer une carte Google Maps dans la page contact.

**Méthode : iframe embed (gratuit, sans API key, compatible SSG)**

Générer le lien depuis l'adresse du client :
```tsx
const mapQuery = encodeURIComponent("[ADRESSE COMPLETE DU CLIENT]");
const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${mapQuery}`;
```

**Composant :**
```tsx
interface GoogleMapProps {
  address: string;
  className?: string;
}

export default function GoogleMap({ address, className }: GoogleMapProps) {
  const query = encodeURIComponent(address);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${query}`}
        width="100%"
        height="400"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Localisation — ${address}`}
      />
    </div>
  );
}
```

**Alternative gratuite sans API key — iframe simple :**
```tsx
<iframe
  src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
  width="100%"
  height="400"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  title={`Localisation — ${address}`}
/>
```

**Règles :**
- `loading="lazy"` obligatoire (ne pas bloquer le chargement)
- `rounded-2xl` pour s'intégrer au design
- `title` descriptif pour l'accessibilité
- L'adresse vient de `lib/config.ts`
- Placer dans la section contact, sous ou à côté du formulaire
- Sur mobile : carte pleine largeur sous le formulaire
- Sur desktop : côte à côte avec le formulaire ou en dessous

## 16. Avis Google — Intégration statique + Schema.org

Les avis sont copiés depuis le profil Google du client et intégrés en dur (SSG, rapide, pas de dépendance externe).

**Données à stocker dans `lib/config.ts` :**
```ts
export const reviews = {
  averageRating: 4.8,
  totalCount: 47,
  googleUrl: "https://g.page/r/...", // lien "laisser un avis"
  items: [
    {
      author: "Marie D.",
      rating: 5,
      text: "Travail impeccable, équipe réactive et professionnelle. Je recommande vivement.",
      date: "2025-11",
    },
    {
      author: "Jean-Pierre L.",
      rating: 5,
      text: "Très satisfait de la prestation. Ponctuel, propre, prix correct.",
      date: "2025-09",
    },
    // 3 à 6 avis max
  ],
};
```

**Composant `ReviewCard` :**
```tsx
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} étoiles sur 5`}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

interface ReviewCardProps {
  author: string;
  rating: number;
  text: string;
  date: string;
}

function ReviewCard({ author, rating, text, date }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">{author}</span>
        <StarRating rating={rating} />
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
      <span className="text-xs text-text-muted mt-3 block">{date}</span>
    </div>
  );
}
```

**Lien vers Google en bas de la section :**
```tsx
<a
  href={reviews.googleUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 text-sm font-medium"
>
  Voir tous les avis sur Google ({reviews.averageRating}/5 — {reviews.totalCount} avis)
</a>
```

**Schema.org AggregateRating — dans le JSON-LD de la page accueil :**
```tsx
{
  "@type": "LocalBusiness",
  "name": "[NOM]",
  // ... autres champs LocalBusiness
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": reviews.averageRating,
    "reviewCount": reviews.totalCount,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": reviews.items.map(r => ({
    "@type": "Review",
    "author": { "@type": "Person", "name": r.author },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": r.rating,
      "bestRating": 5
    },
    "reviewBody": r.text,
    "datePublished": r.date
  }))
}
```

### Avis dynamiques — Récupération auto via Google Places API

Les avis sont récupérés automatiquement via l'API Google Places. Seuls les 4-5 étoiles sont affichés, triés par date. La clé API ForgitWeb est réutilisée sur tous les projets.

**Setup :**

1. **`lib/config.ts`** — ajouter :
```ts
export const googlePlaceId = "[PLACE_ID_DU_CLIENT]";
```

2. **Script pre-build `scripts/fetch-reviews.ts`** :
```ts
import { writeFileSync, mkdirSync } from "fs";

const PLACE_ID = process.env.GOOGLE_PLACE_ID!;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const MIN_RATING = 4;
const MAX_REVIEWS = 6;

async function fetchReviews() {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&reviews_sort=newest&language=fr&key=${API_KEY}`
  );
  const data = await res.json();

  if (!data.result) {
    console.error("Erreur API Google Places:", data);
    process.exit(1);
  }

  const filtered = (data.result.reviews || [])
    .filter((r: any) => r.rating >= MIN_RATING)
    .slice(0, MAX_REVIEWS)
    .map((r: any) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      date: new Date(r.time * 1000).toISOString().slice(0, 7),
      profilePhoto: r.profile_photo_url,
    }));

  const output = {
    averageRating: data.result.rating,
    totalCount: data.result.user_ratings_total,
    items: filtered,
    fetchedAt: new Date().toISOString(),
  };

  mkdirSync("data", { recursive: true });
  writeFileSync("data/reviews.json", JSON.stringify(output, null, 2));
  console.log(`${filtered.length} avis récupérés (${MIN_RATING}+ étoiles)`);
}

fetchReviews();
```

3. **`package.json`** — ajouter le script pre-build :
```json
{
  "scripts": {
    "prebuild": "npx tsx scripts/fetch-reviews.ts",
    "build": "next build"
  }
}
```

4. **Lire les avis dans les composants :**
```tsx
import reviewsData from "@/data/reviews.json";
```

5. **`.env.local`** (ne pas commiter) :
```
GOOGLE_PLACES_API_KEY=[CLÉ GOOGLE PLACES — .env.local FORGITWEB]
GOOGLE_PLACE_ID=[PLACE_ID_DU_CLIENT]
```

**Comment trouver le Place ID du client :**
En Discovery, appeler l'API Find Place avec le lien Google Maps du client :
```
https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=[NOM+VILLE]&inputtype=textquery&fields=place_id&key=[API_KEY]
```

**Règles :**
- Les avis sont du contenu statique au moment du build (SSG) — indexés par Google
- Le Schema.org `AggregateRating` fait apparaître les étoiles dans les résultats Google
- Seuls les avis 4 et 5 étoiles sont affichés
- Triés par date (les plus récents d'abord)
- 6 avis max affichés
- Le texte des avis vient directement de Google — jamais modifié
- Toujours inclure le lien vers la fiche Google pour la transparence
- Si le client n'a pas d'avis → ne pas créer de section avis

## 17. Déploiement Vercel (standard)

Tous les sites ForgitWeb sont hébergés sur Vercel Pro (un seul compte pour tous les clients).

### Config `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/reviews",
      "schedule": "0 3 * * 1"
    }
  ]
}
```

### Endpoint cron — `app/api/cron/reviews/route.ts`
```ts
import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const PLACE_ID = process.env.GOOGLE_PLACE_ID!;
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&reviews_sort=newest&language=fr&key=${API_KEY}`
  );
  const data = await res.json();

  if (!data.result) {
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }

  const filtered = (data.result.reviews || [])
    .filter((r: any) => r.rating >= 4)
    .slice(0, 6)
    .map((r: any) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      date: new Date(r.time * 1000).toISOString().slice(0, 7),
    }));

  const output = {
    averageRating: data.result.rating,
    totalCount: data.result.user_ratings_total,
    items: filtered,
    fetchedAt: new Date().toISOString(),
  };

  mkdirSync("data", { recursive: true });
  writeFileSync("data/reviews.json", JSON.stringify(output, null, 2));

  return NextResponse.json({ success: true, count: filtered.length });
}
```

### Variables d'environnement Vercel
Dans le dashboard Vercel → Settings → Environment Variables :
- `GOOGLE_PLACES_API_KEY` = clé API ForgitWeb
- `GOOGLE_PLACE_ID` = Place ID du client
- `CRON_SECRET` = un token aléatoire (sécurité du cron endpoint)

### Workflow déploiement
```bash
# Premier déploiement
npx vercel login                  # une seule fois
npx vercel --prod                 # déploie en production

# Domaine custom
# → Dashboard Vercel → Settings → Domains → ajouter le domaine
# → Modifier les DNS chez le registrar du client (A record ou CNAME)

# Mises à jour futures
# Modifier les fichiers localement puis :
npx vercel --prod                 # re-déploie en 30 secondes
```

### Structure dossier — fichiers ajoutés pour Vercel
```
vercel.json                       # Config cron
app/api/cron/reviews/route.ts     # Endpoint cron avis
scripts/fetch-reviews.ts          # Script pre-build avis
data/reviews.json                 # Avis (généré, ne pas commiter)
.env.local                        # Variables (ne pas commiter)
```

## 18. Fallback hébergement classique (o2switch, Ionos, OVH)

Si le client impose un hébergeur classique au lieu de Vercel :

### Build + upload FTP
```bash
npm run build                     # prebuild fetch les avis + next build
# Uploader le contenu de out/ par FTP
```

### Cron avis Google — `update-reviews.php`
```php
<?php
$API_KEY = '[CLÉ GOOGLE PLACES — .env.local FORGITWEB]';
$PLACE_ID = '[PLACE_ID_DU_CLIENT]';

$url = "https://maps.googleapis.com/maps/api/place/details/json?"
     . "place_id={$PLACE_ID}"
     . "&fields=reviews,rating,user_ratings_total"
     . "&reviews_sort=newest"
     . "&language=fr"
     . "&key={$API_KEY}";

$response = file_get_contents($url);
$data = json_decode($response, true);

if ($data['status'] === 'OK') {
    $reviews = array_filter($data['result']['reviews'] ?? [], function($r) {
        return $r['rating'] >= 4;
    });

    $output = [
        'rating' => $data['result']['rating'],
        'total' => $data['result']['user_ratings_total'],
        'reviews' => array_values(array_slice($reviews, 0, 6)),
        'updated_at' => date('c'),
    ];

    file_put_contents(__DIR__ . '/data/reviews.json', json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "OK - " . count($output['reviews']) . " avis mis à jour";
} else {
    echo "Erreur: " . $data['status'];
}
```

### Config cron (cPanel)
- Fréquence : `0 3 * * 1` (chaque lundi 3h)
- Commande : `php /home/USER/public_html/update-reviews.php`

### Composant client-side pour lire les avis (hébergement classique)
Sur un hébergement classique, les avis sont dans un JSON statique mis à jour par le cron PHP. Le composant les charge côté client :
```tsx
"use client";
import { useEffect, useState } from 'react';

interface ReviewData {
  rating: number;
  total: number;
  reviews: Array<{ author_name: string; rating: number; text: string; time: number }>;
  updated_at: string;
}

export function useGoogleReviews() {
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch('/data/reviews.json')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return data;
}
```
