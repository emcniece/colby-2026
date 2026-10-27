# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository holds theme assets for a **NationBuilder website** built from a **Figma design**. Use the Figma MCP server (`mcp__figma-desktop__*` tools) to read design context, extract component specs, variables, and screenshots directly from Figma.

## Workflow

Design lives in Figma. Code artifacts (HTML, CSS, Liquid templates) live here and are deployed to NationBuilder.

1. Use Figma MCP tools to inspect designs before writing any code.
2. Extract design tokens (colors, typography, spacing) from Figma variables (`mcp__figma-desktop__get_variable_defs`).
3. Implement as NationBuilder-compatible Liquid templates + CSS.

## NationBuilder Theme Structure

NationBuilder themes use **Liquid** templating (similar to Shopify). Key conventions:
- Templates live in `templates/` and use `.html` extension with Liquid syntax.
- Stylesheets go in `stylesheets/`.
- JavaScript goes in `javascripts/`.
- Static assets (images, fonts) go in `files/`.
- `theme.json` defines theme metadata.

NationBuilder Liquid exposes site/page variables like `{{ site.name }}`, `{{ page.headline }}`, `{{ request.current_user }}`.

## Stylesheet Architecture

```
stylesheets/
  tokens.css      — all CSS custom properties (design tokens)
  base.css        — reset, typography classes, containers, section colour variants
  components.css  — all UI components
  main.css        — @import chain (load this one in templates)
```

### Design Tokens (tokens.css)

Colors: `--color-pink-{50,100,500,600,700}`, `--color-blue-{500,600,700,900}`, `--color-yellow-300`, `--color-white`

Section backgrounds: `.section-1` (#ffeaf5) · `.section-2` (#efc30c) · `.section-3` (#113ec4) · `.section-4` (#dd147a)

Button token pattern: `--btn-v{1-4}-{solid|outline}-{bg|text}[-hover|-pressed]`

Fonts (load via Google Fonts in layout template `<head>`):
- Outfit (300/400/500/600/700) — body, buttons, inputs, menu
- Lexend (700/800) — logo
- Quattrocento (400) — h4 headings
- Questrial (400) — large counters
- Font Awesome 6 Free Solid — icons (load via CDN)

### Components (components.css)

| Class | Figma node | Notes |
|---|---|---|
| `.btn .btn-v{1-4}` | `button` | Solid variants. Add `--outline` suffix for outline. States via `:hover`/`:active`. `[disabled]` = opacity 40% |
| `.btn-mini` | `mini-button` | Icon-only, used in accordion toggle |
| `.btn-hamburger` | mobile header | Blue solid, 48×48px square-pill |
| `.site-header` | `header` | Use `.hide-mobile`/`.hide-desktop` to toggle nav vs hamburger |
| `.menu-link` | `menu-link` | Uppercase semibold, color variants via states |
| `.form-group` | `form-input` | Add `--bordered` to field, `--error`/`--success` to group |
| `.form-msg--{info|error|success}[-reverse]` | `form-message` | FA icons: circle-info, circle-xmark, circle-check |
| `.checkbox-group` | `checkbox` | CSS-only checked state via `input:checked + .checkbox-group__control` |
| `.signup-form` | `sign-up` | Desktop inline / mobile stacked via media query |
| `.accordion-item` | `accordion-item` | Toggle `.accordion-item--open` with JS |
| `.progress-counter` | `progress-counter` | 200×188px card, dark blue bg |
| `.feature-icon .feature-icon--{md|lg} .feature-icon--c{1-4}` | `feature-icon` | Circle icon container |
| `.priority-card` | `priority-card` | 239×318px card, pink bg |
| `.colby-logo .colby-logo--v{1-4} .colby-logo--{default|small}` | `colby-logo` | Use inline SVG or logo image asset |
| `.social-icons .social-icon` | facebook/insta/tiktok | FA brand icons |

### Breakpoints (from Figma Responsiveness section)
- Mobile: `< 767px`
- Tablet: `768–1279px`
- Laptop: `1280–1920px`
- Desktop: `> 1920px`

## Source file organisation

```
downloaded-from-nb/   READ-ONLY reference — the original theme as downloaded from NationBuilder
templates/            Modified HTML/Liquid templates (partials use _ prefix)
stylesheets/          theme.scss (NB raise base + our Colby 2026 CSS appended at bottom)
javascripts/          JS files
files/                Images, fonts, SVGs
upload-to-nb/         Deploy target — populated by deploy.sh, drag-and-drop into NB
```

Do not edit files in `downloaded-from-nb/`. Copy the file you want to change into the appropriate source directory, edit it there, then run `deploy.sh`.

### Key templates

| File | Role |
|---|---|
| `templates/layout.html` | Master layout — for homepage renders `_homepage.html` only; for all other pages uses NB's standard header/footer/content flow |
| `templates/_homepage.html` | **Full custom homepage** — owns everything from nav to footer |
| `templates/_header.html` | NB site header (used on non-homepage pages) |
| `templates/_footer.html` | NB site footer (used on non-homepage pages) |

The homepage detection in `layout.html` is `{% if page.is_homepage? and page.type_slug == 'basic' %}`.

## Deploying to NationBuilder

NationBuilder admin: `https://langford2026electioncampaign.nationbuilder.com/admin/themes`

### Committing changes

Use `commit.sh` instead of `git commit` directly — it commits, writes the new hash to `.last-deploy-sha`, and clears `upload-to-nb/`:

```bash
bash commit.sh "your commit message"
```

`git add -u` is called automatically; manually `git add` any new untracked files first.

### Prepare a deploy

Update the datestamp comment in `stylesheets/theme.scss` (the `COLBY 2026 CUSTOM STYLES — DATE` line near the bottom), then run:

```bash
bash deploy.sh
```

This seeds `upload-to-nb/` with the complete NB theme baseline, then overwrites with all our modified files.

### CRITICAL: Two separate upload paths

**Template files** (all `.html` files) → paste into the **NationBuilder template code editor** (admin → Theme → Edit → click the file in the left-hand list). Drag-and-drop uploads `.html` as a static asset — NationBuilder ignores those as templates.

**Static assets** (`theme.scss`, JS files, images, fonts) → drag-and-drop from `upload-to-nb/` into the NationBuilder theme file manager.

### File reference rules (NationBuilder Liquid)

- CSS in `<link>`: `href="theme.scss"` (bare filename — NB rewrites to CDN URL)
- JS in `<script>`: bare filename — e.g. `src="vcs-nav.js"`
- Images in templates: `{{ theme['filename.ext'] }}` — e.g. `{{ theme['hero-background.png'] }}`
- Do **not** use `| asset_url`, `| theme_stylesheet_url`, or `| theme_javascript_url` — not valid NB filters
- Do **not** use `{% extends %}` / `{% block %}` — Django/Jinja2 syntax, invalid in NB Liquid

## Static site (self-hosted)

`site/` is a self-hostable static mirror of the live NationBuilder site, generated by `tools/nb-to-static.py` (stdlib Python):

```bash
python3 tools/nb-to-static.py https://www.colbyharder.ca   # crawl live site → site/
npx serve@14.2.4 site                # preview locally (clean URLs + 404.html)
```

- Pages are `site/<slug>/index.html` (clean URLs); `site/404.html` is the not-found page. Deploy the `site/` folder to any static host.
- `site/assets/theme/` — theme CSS/JS/images (compiled `theme.css`); `site/assets/content/` — images uploaded through NB admin.
- `site/assets/static/` is hand-written and never overwritten by the script: `nb-shim.js` stubs the NB globals the theme JS expects; `static-forms.js` makes every form inert (no submissions are sent). Replace `static-forms.js` when a form backend exists.
- Re-running the script re-pulls content from NationBuilder and overwrites hand edits to `site/**/*.html`, so stop using it once the static site becomes the source of truth.

## Figma MCP Usage

Use these tools to read the design before implementing anything:
- `mcp__figma-desktop__get_design_context` — full design context for a node
- `mcp__figma-desktop__get_variable_defs` — design tokens (colors, spacing, type)
- `mcp__figma-desktop__get_screenshot` — visual reference for a component or frame
- `mcp__figma-desktop__get_metadata` — file/node metadata
