# FORGITWEB — Configuration Claude Code

Configuration complète de l'agence **FORGITWEB** pour Claude Code. Inclut toutes les règles, skills, templates et agents utilisés pour la création de sites web premium.

## Contenu

| Élément | Quantité | Description |
|---------|----------|-------------|
| **CLAUDE.md** | 1 | Règles globales (Tailwind v4, sécurité, SEO, parallélisation, Gemini MCP) |
| **Skills** | 23 | Workflows et outils spécialisés |
| **Templates** | 3 | Mentions légales, design patterns, checklist Next.js |
| **Agents** | 8 | Agents spécialisés (DA, SEO, Rédacteur, Dev, Performance, Accessibilité) |

## Installation

### Prérequis

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installé (`npm install -g @anthropic-ai/claude-code`)
- macOS (testé sur Darwin)
- Python 3 (`brew install python3`)
- trash (`brew install trash`)

### Installer

```bash
git clone [URL_DU_REPO] forgitweb-claude-config
cd forgitweb-claude-config
bash install.sh
```

Le script :
1. Sauvegarde ton CLAUDE.md existant (si tu en as un)
2. Copie toutes les skills, templates et agents dans `~/.claude/`
3. Crée un MEMORY.md vierge (si inexistant)
4. Vérifie les dépendances (Python, trash)

### Vérifier l'installation

```bash
claude  # Lance Claude Code
# Puis tape :
/skills  # Liste toutes les skills installées
```

## Skills principales

### Workflow projet
| Skill | Usage | Description |
|-------|-------|-------------|
| `/nouveau-projet` | Création site | Workflow complet 9 étapes : discovery → dev → livraison |
| `/brief` | Brief client | Collecte ultra-détaillée des besoins |
| `/livraison` | Post-deploy | Checklist complète DNS, GA4, GSC, tests, formation |

### Audit & Maintenance
| Skill | Usage | Description |
|-------|-------|-------------|
| `/audit-complet` | Audit global | Lance full-audit + full-secu + maintenance en parallèle |
| `/full-audit` | Audit fonctionnel | Trace chaque flux UI → API → retour |
| `/full-secu` | Audit sécurité | Secrets, XSS, headers, CORS, deps vulnérables |
| `/maintenance` | Audit technique | Deps, Lighthouse, liens cassés, headers |

### SEO & Contenu
| Skill | Usage | Description |
|-------|-------|-------------|
| `/seo-toolkit` | Boîte SEO | 6 modes : audit, meta, snippets, cannibalisation, planning, refresh |
| `/cta-optimizer` | CTAs/Headlines | Optimisation CTAs, boutons, accroches, emails |
| `/programmatic-seo` | Pages à scale | Pages SEO générées par templates + data |

### Design & Dev
| Skill | Usage | Description |
|-------|-------|-------------|
| `/ui-ux-pro-max` | Recherche design | 97 palettes, 57 typos, 50+ styles — alimente Gemini MCP |
| `/premium-animations` | Animations | GSAP + Framer Motion, SEO-friendly |
| `/design-review` | Review visuelle | Screenshots Playwright → analyse → corrections Gemini |
| `/migration-wp` | Migration WP | WordPress → Next.js (crawl auto, contenu fidèle) |

### Utilitaires
| Skill | Usage | Description |
|-------|-------|-------------|
| `/wcag-audit-patterns` | Accessibilité | Audit WCAG 2.2 complet |
| `/analytics-tracking` | Analytics | Design et audit tracking GA4 |
| `/find-skills` | Découverte | Chercher de nouvelles skills |
| `/skill-creator` | Création | Créer de nouvelles skills |

## Stack technique

- **Framework** : Next.js 14+ App Router, TypeScript strict
- **Styling** : Tailwind CSS v4 (approche CSS-first, pas de `tailwind.config.ts`)
- **Hébergement** : Vercel Pro (SSG + API routes serverless)
- **Formulaires** : Brevo API via `/api/contact`
- **Analytics** : Google Analytics 4
- **Frontend** : Gemini Design MCP (obligatoire pour toute génération visuelle)
- **Fonts** : Locales WOFF2 via `next/font/local`

## Mise à jour

Pour récupérer les dernières modifications :

```bash
cd forgitweb-claude-config
git pull
bash install.sh
```

## Important

- **MEMORY.md** est inclus dans le repo — installé à la première install, pas écrasé ensuite
- **Les clés API** ne sont JAMAIS dans ce repo — chaque dev les met dans `.env.local`
- **Gemini MCP** doit être configuré séparément dans les settings Claude Code
