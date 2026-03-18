# Memory

## Branding FORGITWEB
- Toujours en MAJUSCULES : FORGITWEB
- Police Montserrat : **FORGIT** en bold + WEB en light/regular
- Ne jamais écrire "ForgitWeb", "Forgitweb", "forgitweb"

## Tailwind CSS v4 — Piège critique
- `@config "tailwind.config.ts"` ne génère PAS les classes utilitaires custom en Tailwind v4
- Toujours utiliser l'approche CSS-first : `@theme {}` + `@utility` + `@keyframes`

## Gemini MCP — Obligatoire pour le frontend
- L'agent-dev ne doit JAMAIS coder manuellement le JSX des sections visuelles
- Toujours utiliser `create_frontend` / `snippet_frontend` / `modify_frontend`
- Passer l'intégralité de `design-system.md` dans le paramètre `designSystem`
- `ui-ux-pro-max` = recherche de style, Gemini MCP = implémentation

## Skills — État actuel
- `/audit-complet` = meta-skill (full-audit + full-secu + maintenance en parallèle)
- `/livraison` = checklist post-deploy (remplace Step 9 de nouveau-projet)
- `/cta-optimizer` = CTAs/headlines/emails uniquement (remplace copywriting)
- `copywriting`, `frontend-design`, `react-best-practices`, `nextjs-best-practices` = DEPRECIES
- `react-best-practices` + `nextjs-best-practices` intégrés dans Step 6.6 de nouveau-projet

## Leçons apprises
- Toujours vérifier les clés API : jamais en dur dans les skills ou le code
- Gemini MCP : appels séquentiels (quota), mais assembly agent-dev en parallèle
- Les numéros de steps dans nouveau-projet doivent rester continus (pas de trous)
