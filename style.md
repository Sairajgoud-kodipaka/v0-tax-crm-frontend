# TaxFiley Design System

Design tokens derived from the marketing landing page (`components/marketing/landing-page.tsx`, `app/marketing.css`). Use these values across the CRM, auth flows, and dashboard so the product feels continuous with the public site.

---

## Brand palette

| Token | Hex | Role |
|-------|-----|------|
| **Brand Deep** | `#0b5c6f` | Primary actions, logo wordmark, stats, links, featured borders |
| **Brand Ocean** | `#117d87` | Hover on primary, icons, step labels, checkmarks |
| **Brand Mint** | `#71c89a` | Accents, LIVE badges, CTA on dark, icon hover fills |
| **Brand Mint Strong** | `#57bb91` | Mint button hover (e.g. footer CTA) |
| **Brand Soft** | `#eaf7f4` | Page background tint, hero radial base |

CSS variables (defined in `app/globals.css`):

```css
--brand-deep: #0b5c6f;
--brand-ocean: #117d87;
--brand-mint: #71c89a;
--brand-mint-strong: #57bb91;
--brand-soft: #eaf7f4;
```

---

## Semantic mapping (app / shadcn)

Light theme maps landing colors to Tailwind/shadcn tokens in `app/globals.css`:

| App token | Source | Usage |
|-----------|--------|--------|
| `--primary` | Brand Deep | Buttons, active nav, headings |
| `--secondary` | Brand Ocean | Secondary buttons, emphasis |
| `--background` | `#f4fbfa` | App shell (near hero wash) |
| `--foreground` | Slate 950 | Body text, titles |
| `--muted` | Slate 100 | Subtle fills |
| `--muted-foreground` | Slate 600 | Descriptions, labels |
| `--accent` | Brand Soft | Hover chips, highlights |
| `--border` | Slate 200 | Cards, inputs, dividers |
| `--ring` | Brand Ocean | Focus rings |
| `--destructive` | (unchanged) | Errors, delete |

Dark theme keeps **slate-950** shells with **brand-mint** accents (matches landing CTA / contact panels).

---

## Neutrals (Tailwind slate)

Used heavily on the landing page for typography and surfaces:

| Name | Hex | Typical use |
|------|-----|-------------|
| Slate 950 | `#020617` | Headlines, dark cards |
| Slate 900 | `#0f172a` | Compare table header |
| Slate 700 | `#334155` | Secondary body on cards |
| Slate 600 | `#475569` | Paragraphs |
| Slate 500 | `#64748b` | Captions, trust strip |
| Slate 200 | `#e2e8f0` | Borders |
| Slate 100 | `#f1f5f9` | Active nav pill |
| Slate 50 | `#f8fafc` | Alternate row / form bg |

---

## Section gradients

Background washes used between landing sections (reuse for marketing blocks or optional auth hero):

| Name | CSS gradient |
|------|----------------|
| Hero radial | `radial-gradient(circle at top left, var(--brand-soft), white 38%, #eef8f8 100%)` |
| Mint fade | `linear-gradient(180deg, #ffffff 0%, #dff6ec 100%)` |
| Sky fade | `linear-gradient(180deg, #e9f4ff 0%, #d8ecff 100%)` |
| Trust strip | `linear-gradient(90deg, #d9f5e9 0%, #e9fbf3 45%, #d8f0ff 100%)` |
| Card image | `linear-gradient(135deg, #ffffff 0%, #dff6ec 65%, #d8ecff 100%)` |
| Dark CTA | `background: #020617` (slate-950) |

Utility classes (optional): `bg-brand-gradient-mint`, `bg-brand-gradient-sky` in `globals.css`.

---

## Accent colors

| Color | Hex / class | Use |
|-------|-------------|-----|
| Teal badge | `teal-50` / `teal-200` / `teal-700` | Section labels (“Service offerings”) |
| Amber | `amber-500` | Star ratings |
| White @ 10–20% | on Brand Deep panels | Glass pills on dark cards |

---

## Typography

| Context | Family | Weights | Notes |
|---------|--------|---------|-------|
| Marketing | **Manrope** | 400–800 | Loaded in `app/marketing.css` |
| App (CRM) | **Geist Sans** | default | `app/layout.tsx` — consider Manrope later for full parity |

| Style | Landing pattern | App equivalent |
|-------|-----------------|----------------|
| Display | `text-5xl md:text-7xl font-black tracking-[-0.055em]` | Page titles: `text-4xl font-bold tracking-tight` |
| Section | `text-4xl md:text-5xl font-black tracking-[-0.04em]` | `text-3xl font-semibold` |
| Body | `text-lg leading-8 text-slate-600` | `text-muted-foreground` |
| Label pill | `text-xs font-bold uppercase tracking-[0.18em]` | Badge component |
| Button | `text-sm font-bold` | Button default |

---

## Radius & elevation

| Element | Landing | App default |
|---------|---------|---------------|
| Buttons | `rounded-full` | `rounded-md` (shadcn) — auth/marketing may use `rounded-full` |
| Cards | `rounded-[2rem]` (~32px) | `--radius: 0.25rem` (4px) |
| Inputs (marketing) | `rounded-2xl` | Input uses `--radius` |
| Shadow (primary btn) | `shadow-lg shadow-cyan-900/20` | `shadow-sm` on cards |

---

## Components (landing patterns)

### Primary button
- Background: Brand Deep → hover Brand Ocean
- Text: white
- Shape: `rounded-full px-5 py-3`
- Motion: `hover:-translate-y-0.5`

### Secondary button
- White bg, `border-slate-200`
- Hover: border Brand Mint, text Brand Deep

### On-dark button
- `border-white/70 bg-white/10`
- Hover: stronger white border/fill

### Cards
- White bg, `border-slate-200`, `shadow-sm`
- Featured: `border-brand-deep`, `shadow-cyan-900/10`

### Focus (inputs)
- `outline-none focus:border-[var(--brand-mint)]`

---

## Logo

- Asset: `/TF.svg`
- Wordmark color: Brand Deep
- Minimum display: ~44px mark (`h-11 w-11`)

---

## Implementation checklist

- [x] Brand CSS variables in `app/globals.css` `:root`
- [x] shadcn semantic colors aligned to brand
- [x] Auth pages: hero gradient background + logo
- [ ] Dashboard sidebar: active item = slate-100 + brand-deep text (landing nav)
- [ ] Charts: series colors from brand-ocean / brand-mint
- [x] Unify marketing `.marketing-site` vars with global `:root` (single source)

---

## File reference

| File | Purpose |
|------|---------|
| `app/globals.css` | App-wide tokens + Tailwind `@theme` |
| `app/marketing.css` | Manrope + `.marketing-site` scope |
| `components/marketing/landing-page.tsx` | Reference UI patterns |
| `style.md` | This document |

When adding UI, prefer semantic classes (`bg-primary`, `text-muted-foreground`) over raw hex so theme and dark mode stay consistent.
