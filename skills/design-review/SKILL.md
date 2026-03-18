---
name: design-review
description: Visual design review and iteration workflow. Takes screenshots of a running Next.js site using Playwright, analyzes the design, identifies improvements, applies fixes via Gemini MCP, and verifies with new screenshots. Use when the user wants to review or improve the visual design of their site.
allowed-tools: Bash(playwright-cli:*), Bash(npx @playwright/cli *)
---

# Design Review — Visual Iteration Workflow

## Overview
Automated visual QA and design iteration loop for Next.js sites using Playwright screenshots + Gemini MCP modifications.

## Prerequisites
- Dev server must be running (check with `pgrep -f "next dev"`)
- `@playwright/cli` package (runs via `npx @playwright/cli`)
- `design-system.md` must exist at project root (required for Gemini MCP calls)

## Workflow

### Step 1 — Open browser & take screenshots
```bash
# Open browser on the site
npx @playwright/cli open http://localhost:3000
# Take initial screenshot
npx @playwright/cli screenshot --filename=/tmp/review-page.png
# Scroll to see more sections
npx @playwright/cli eval "window.scrollTo(0, 900)"
npx @playwright/cli screenshot --filename=/tmp/review-page-s2.png
# Continue scrolling for each section...
npx @playwright/cli eval "window.scrollTo(0, 1800)"
npx @playwright/cli screenshot --filename=/tmp/review-page-s3.png
```

### Step 2 — Analyze screenshots
Read each screenshot with the Read tool and identify:
- Elements that look flat or lack visual depth
- Text that's too dim or too small to read
- Missing hover effects or transitions
- Spacing issues (too tight or too loose)
- Inconsistencies with the design system
- Components that could feel more premium

### Step 3 — Apply improvements via Gemini MCP
For each issue found, use `modify_frontend` with:
- The exact target code to modify
- The full content of `design-system.md` in the `designSystem` parameter
- Clear modification description focused on the visual improvement
- Context explaining the purpose

Launch multiple `modify_frontend` calls in PARALLEL for independent modifications.

### Step 4 — Verify with new screenshots
1. Restart the dev server (kill → trash .next → npm run dev)
2. Wait for "Ready" in logs
3. Open browser and take new screenshots of modified sections
4. Read and compare with the original screenshots
5. Report the before/after differences to the user

### Step 5 — Iterate
Ask the user if they want to:
- Continue iterating on the same page
- Move to another page
- Stop the review

## Commands reference
```bash
# Navigation
npx @playwright/cli open [url]
npx @playwright/cli goto [url]
npx @playwright/cli close

# Screenshots
npx @playwright/cli screenshot --filename=/tmp/name.png
npx @playwright/cli screenshot e5  # screenshot specific element by ref

# Scrolling
npx @playwright/cli eval "window.scrollTo(0, [pixels])"

# Viewport
npx @playwright/cli resize [width] [height]

# Page info
npx @playwright/cli snapshot
npx @playwright/cli eval "document.title"
npx @playwright/cli eval "document.body.scrollHeight"
```

## Arguments
- No arguments: reviews the current page at localhost:3000
- URL path argument (e.g., `/saut-tandem/`): reviews that specific page
- `all`: reviews all pages listed in the site's CLAUDE.md arborescence

## Tips
- Always take screenshots BEFORE and AFTER modifications for comparison
- Use `window.scrollTo` to capture below-the-fold content
- Reset viewport to 1280x800 for consistent screenshots: `npx @playwright/cli resize 1280 800`
- After modifications, always restart the dev server (kill → trash .next → npm run dev)
- Group independent Gemini MCP modifications in parallel calls for efficiency
- Focus improvements on: visual depth, hover states, text readability, spacing, premium feel
