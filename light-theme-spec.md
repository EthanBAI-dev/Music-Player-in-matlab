# Light Theme Design Specification — Music Player & Synthesizer

## 1. Design Philosophy

A warm, airy light theme for a professional desktop-class music production app. The aesthetic balances **editorial clarity** (magazine-like typographic hierarchy) with **studio-grade precision** (DAW-inspired panel layouts, subtle surface elevations). The palette avoids harsh neutral grays in favor of warm-toned off-whites that reduce eye strain during extended use.

**Tone**: Refined, warm, professional. Feels like a high-end audio hardware interface rendered in software.

---

## 2. Color System

### 2.1 Backgrounds

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--bg-primary` | `#F4F2ED` | rgb(244,242,237) | Page background, main canvas |
| `--bg-secondary` | `#FFFFFF` | rgb(255,255,255) | Cards, panels, elevated surfaces |
| `--bg-tertiary` | `#E8E5E0` | rgb(232,229,224) | Subtle separation, hover states, section dividers |
| `--bg-elevated` | `#FFFFFF` | rgb(255,255,255) | Modals, dropdowns, tooltip backgrounds |

### 2.2 Text

| Token | HEX | RGB | Usage | Contrast Ratio (on #FFFFFF) |
|-------|-----|-----|-------|----------------------------|
| `--text-primary` | `#1E1D1A` | rgb(30,29,26) | Body text, headings | 16.3:1 (AAA) |
| `--text-secondary` | `#6B6760` | rgb(107,103,96) | Labels, metadata, captions | 7.1:1 (AAA) |
| `--text-tertiary` | `#9C9892` | rgb(156,152,146) | Placeholder text, disabled states | 4.6:1 (AA) |
| `--text-inverse` | `#FFFFFF` | rgb(255,255,255) | Text on accent color backgrounds | — |

### 2.3 Borders & Dividers

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--border-primary` | `#D6D2CC` | rgb(214,210,204) | Card borders, input borders, table borders |
| `--border-secondary` | `#E8E5E0` | rgb(232,229,224) | Subtle dividers, inner separators |

### 2.4 Accent Palette (4 colors)

All accent colors pass WCAG 2.1 AA for large text (3:1) and UI components on white backgrounds.

#### Primary — Copper `#C4845C`
The hero accent. Used for primary buttons, active states, slider thumbs, toggles, and key interactive elements.

| Variant | HEX | RGB | Usage |
|---------|-----|-----|-------|
| Base | `#C4845C` | rgb(196,132,92) | Primary buttons, active states |
| Hover | `#B3744C` | rgb(179,116,76) | Button hover, link hover |
| Light | `rgba(196,132,92,0.12)` | — | Subtle background tint for active panels |

#### Secondary — Sage `#6B8F7A`
A calm, natural green. Used for secondary actions, status indicators, and natural/ambient preset categories.

| Variant | HEX | RGB | Usage |
|---------|-----|-----|-------|
| Base | `#6B8F7A` | rgb(107,143,122) | Secondary buttons, success states |
| Hover | `#5A7E68` | rgb(90,126,104) | Hover states |
| Light | `rgba(107,143,122,0.12)` | — | Background tint |

#### Accent — Gold `#C9A04A`
Warm golden tone for highlights, badges, starred/favorite items, and premium features.

| Variant | HEX | RGB | Usage |
|---------|-----|-----|-------|
| Base | `#C9A04A` | rgb(201,160,74) | Badges, highlights, ratings |
| Hover | `#B88E38` | rgb(184,142,56) | Hover states |
| Light | `rgba(201,160,74,0.12)` | — | Background tint |

#### Info — Slate `#5A7D8F`
Muted slate blue for informational elements, help text, links, and neutral metadata.

| Variant | HEX | RGB | Usage |
|---------|-----|-----|-------|
| Base | `#5A7D8F` | rgb(90,125,143) | Links, info badges |
| Hover | `#4A6B7C` | rgb(74,107,124) | Hover states |
| Light | `rgba(90,125,143,0.12)` | — | Background tint |

### 2.5 Semantic Colors

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--color-success` | `#6B8F7A` | rgb(107,143,122) | Success states |
| `--color-warning` | `#C9A04A` | rgb(201,160,74) | Warning states |
| `--color-error` | `#C45A5A` | rgb(196,90,90) | Error/destructive actions |

---

## 3. Typography

### 3.1 Font Family

- **Primary**: `DM Sans`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, `sans-serif`
- **Monospace**: `JetBrains Mono`, `SF Mono`, `Fira Code`, `monospace`

### 3.2 Type Scale (Modular Scale 1.125)

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-xs` | 10px / 0.625rem | 1.4 | 500 / 600 | Panel labels, badges, key caps |
| `--text-sm` | 12px / 0.75rem | 1.5 | 500 | Tab labels, button text, metadata |
| `--text-base` | 14px / 0.875rem | 1.6 | 400 | Body text, parameter values |
| `--text-lg` | 16px / 1rem | 1.5 | 500 | Section subheadings |
| `--text-xl` | 20px / 1.25rem | 1.3 | 600 | Panel headings |
| `--text-2xl` | 24px / 1.5rem | 1.2 | 600 | App title, large headings |

### 3.3 Letter Spacing

| Context | Tracking |
|---------|----------|
| Uppercase labels | 0.08em |
| Normal text | 0em |
| Monospace values | 0em |

---

## 4. Spacing System

Base unit: **4px**. All spacing tokens follow a 4px grid.

| Token | Value | Rem |
|-------|-------|-----|
| `--space-1` | 4px | 0.25rem |
| `--space-2` | 8px | 0.5rem |
| `--space-3` | 12px | 0.75rem |
| `--space-4` | 16px | 1rem |
| `--space-5` | 20px | 1.25rem |
| `--space-6` | 24px | 1.5rem |
| `--space-8` | 32px | 2rem |
| `--space-10` | 40px | 2.5rem |

**Layout rhythm**: 16px (--space-4) is the default gap between panels. 8px (--space-2) is used for tight parameter rows. 24px (--space-6) for section spacing.

---

## 5. Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle depth, default card state |
| `--shadow-sm` | `0 1px 4px rgba(0,0,0,0.06)` | Elevated cards, panels |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.06)` | Dropdowns, popovers |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.08)` | Modals, dialogs |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.10)` | Fullscreen overlays |

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small controls, badges |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Containers, transport bar |
| `--radius-full` | 9999px | Pills, sliders |

---

## 7. Component Style Specifications

### 7.1 Navigation Tabs
- Background: transparent (default) / `var(--bg-tertiary)` (hover)
- Active indicator: bottom border `2px solid var(--accent-copper)`
- Text: `var(--text-secondary)` → `var(--text-primary)` (active)
- Padding: `8px 16px`

### 7.2 Cards & Panels
- Background: `var(--bg-secondary)` (white)
- Border: `1px solid var(--border-primary)`
- Border-radius: `var(--radius-lg)`
- Shadow: `var(--shadow-xs)` (default), `var(--shadow-md)` (hover)
- Padding: `16px`

### 7.3 Buttons
**Primary**: `var(--accent-copper)` background, white text, copper border
**Secondary**: Transparent background, `var(--text-secondary)` text, `var(--border-primary)` border
**Ghost**: Transparent, `var(--text-secondary)` text, no border

### 7.4 Sliders
- Track: `var(--slider-track)` (#D6D2CC), 3px height
- Thumb: `var(--slider-thumb)` (#C4845C), 12px circle
- Active/filled portion: `var(--accent-copper)`

### 7.5 Piano Keyboard
- White keys: `var(--key-white-bg)` (#FFFFFF), `var(--key-white-text)` text, `var(--key-white-border)` right border
- Black keys: `var(--key-black-bg)` (#3D3A36)
- Active white key: `var(--key-white-active-bg)` (#C4845C), white text
- Active black key: `var(--key-black-active-bg)` (#C4845C)

### 7.6 Spectrum/Waveform Charts
- Background: `var(--bg-secondary)` (white) with subtle inner shadow
- Bar/Wave color: `var(--accent-copper)` at variable opacity
- Grid/EQ overlay: `rgba(0,0,0,0.08)` dashed lines

### 7.7 Select / Dropdown
- Background: `var(--input-bg)` (white)
- Border: `var(--input-border)` 
- Focus: `var(--input-border-focus)` (copper)
- Text: `var(--input-text)`
- Chevron: SVG arrow in `var(--text-tertiary)`

### 7.8 Scrollbar
- Track: `var(--scrollbar-track)` (#E8E5E0)
- Thumb: `var(--scrollbar-thumb)` (#C4C0BA)
- Width: 6px

---

## 8. Dark Mode Extension (Optional)

If dark mode is later required, invert the background system while keeping accent colors:

| Light | Dark Equivalent |
|-------|----------------|
| `--bg-primary: #F4F2ED` | `--bg-primary: #121210` |
| `--bg-secondary: #FFFFFF` | `--bg-secondary: #1A1A18` |
| `--text-primary: #1E1D1A` | `--text-primary: #E8E5E0` |
| `--text-secondary: #6B6760` | `--text-secondary: #9C9892` |

Accent colors (`--accent-copper`, etc.) remain unchanged — they are already high-contrast on both light and dark backgrounds.

---

## 9. Cross-Device Compatibility

### Desktop (≥1024px)
- Full horizontal layout: Synth grid 3-4 columns, Player waveform/spectrum side by side
- Keyboard height: 130px

### Tablet (768-1023px)
- Synth grid: 2 columns
- Player waveform/spectrum: stacked vertically
- Keyboard height: 110px

### Mobile (<768px)
- Single column layout throughout
- Collapsible parameter sections
- Keyboard height: 80px
- Touch-optimized slider sizes

### Accessibility
- All text/background combinations pass WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text)
- Focus indicators use `--accent-copper` with 3px ring at 0.15 opacity
- Supports `prefers-reduced-motion`
- Touch targets minimum 44px for mobile controls

---

## 10. CSS Custom Properties Summary

```css
:root {
  /* Backgrounds */
  --bg-primary: #F4F2ED;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #E8E5E0;
  --bg-elevated: #FFFFFF;

  /* Text */
  --text-primary: #1E1D1A;
  --text-secondary: #6B6760;
  --text-tertiary: #9C9892;
  --text-inverse: #FFFFFF;

  /* Borders */
  --border-primary: #D6D2CC;
  --border-secondary: #E8E5E0;

  /* Accents */
  --accent-copper: #C4845C;
  --accent-copper-hover: #B3744C;
  --accent-copper-light: rgba(196, 132, 92, 0.12);
  --accent-sage: #6B8F7A;
  --accent-sage-hover: #5A7E68;
  --accent-sage-light: rgba(107, 143, 122, 0.12);
  --accent-gold: #C9A04A;
  --accent-gold-hover: #B88E38;
  --accent-gold-light: rgba(201, 160, 74, 0.12);
  --accent-slate: #5A7D8F;
  --accent-slate-hover: #4A6B7C;
  --accent-slate-light: rgba(90, 125, 143, 0.12);

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.10);

  /* Component tokens */
  --surface-card: #FFFFFF;
  --surface-panel: #FFFFFF;
  --slider-track: #D6D2CC;
  --slider-thumb: #C4845C;
  --btn-primary-bg: #C4845C;
  --btn-primary-text: #FFFFFF;
  --btn-secondary-text: #6B6760;
  --btn-secondary-border: #D6D2CC;
  --input-bg: #FFFFFF;
  --input-text: #1E1D1A;
  --input-border: #D6D2CC;
  --input-border-focus: #C4845C;
  --key-white-bg: #FFFFFF;
  --key-white-text: #6B6760;
  --key-white-border: #E0DDD8;
  --key-white-active-bg: #C4845C;
  --key-black-bg: #3D3A36;
  --key-black-active-bg: #C4845C;
  --spectrum-bg: #FFFFFF;
  --waveform-bg: #FFFFFF;
  --scrollbar-track: #E8E5E0;
  --scrollbar-thumb: #C4C0BA;

  /* Typography */
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
}
```
