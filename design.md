---
version: alpha
name: Pine Computer
description: A stark, editorial cloud-computing system with a brutalist headline voice and a bright green accent.
colors:
  primary: "#111814"
  secondary: "#1F6B45"
  tertiary: "#E5E9E2"
  neutral: "#D7DDD6"
  surface: "#FFFFFF"
  on-surface: "#111814"
  muted: "#5E665F"
  accent: "#20EFA0"
  border: "#E5E7EB"
  error: "#B8422E"
typography:
  headline-display:
    fontFamily: Plein
    fontSize: 132px
    fontWeight: 900
    lineHeight: 158px
    letterSpacing: -5.94px
  headline-lg:
    fontFamily: Plein
    fontSize: 85px
    fontWeight: 900
    lineHeight: 100px
    letterSpacing: -4.5px
  headline-md:
    fontFamily: Plein
    fontSize: 55px
    fontWeight: 900
    lineHeight: 66px
    letterSpacing: -1.98px
  headline-sm:
    fontFamily: Plein
    fontSize: 36px
    fontWeight: 600
    lineHeight: 43px
    letterSpacing: 0px
  body-lg:
    fontFamily: Plein
    fontSize: 23px
    fontWeight: 400
    lineHeight: 32.2px
    letterSpacing: 0px
  body-md:
    fontFamily: Plein
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: Plein
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: Plein
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  label-md:
    fontFamily: Plein
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  label-sm:
    fontFamily: Plein
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.04em
  nav:
    fontFamily: Plein
    fontSize: 13px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.08em
  caption:
    fontFamily: Plein
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 2px
  sm: 10px
  md: 20px
  lg: 32px
  xl: 64px
  gutter: 24px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
    height: "48px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  chip:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
# Pine Computer

## Overview
Pine Computer feels like a confident, editorial SaaS brand with a strong anti-corporate edge. The tone is professional but playful in the art direction: huge condensed headlines, minimal chrome, and one vivid green accent create a memorable, high-contrast landing page. The layout is spacious and centered, with a calm background that lets the typography do most of the work.

## Colors
- **Primary (#111814):** A near-black ink used for headlines, buttons, icons, and strong UI chrome. It carries most of the visual weight and establishes the brand’s sharp, technical tone.
- **Secondary (#1F6B45):** A deep evergreen accent that supports brand moments and can be used for supportive emphasis without competing with the main neon highlight.
- **Accent (#20EFA0):** A bright electric mint-green used as the signature highlight block. It should be reserved for key promotional emphasis and never overused.
- **Tertiary (#E5E9E2):** The soft sage-gray background/surface tone that gives the interface its airy, matte feel.
- **Neutral (#D7DDD6):** A slightly darker fog-gray for subtle layers, dividers, and muted blocks.
- **On-surface (#111814):** The default foreground color for readable text and interactive affordances on light backgrounds.
- **Muted (#5E665F):** A quieter olive-gray for secondary copy, metadata, and navigation text.
- **Border (#E5E7EB):** A very light line color for gentle separation in cards and UI containers.
- **Surface (#FFFFFF):** Reserved for inset panels, form fields, and any area that must sit clearly above the muted backdrop.
- **Error (#B8422E):** A restrained alert tone for destructive or invalid states; it should remain rare in this system.

## Typography
The type system is dominated by Plein, a bold, geometric sans that reads like a display face even at smaller sizes. Headlines use extreme weight and tight negative tracking for a compressed, poster-like feel, while body copy stays clean and functional with lighter weights and relaxed leading. Navigation and labels should feel compact and precise; the observed UI uses subtle uppercase treatment and wider tracking for top-level navigation, which helps the minimalist header stay readable.

- **Headline tiers:** `headline-display`, `headline-lg`, and `headline-md` are intentionally oversized and heavy for hero statements and section openers.
- **Headline small:** `headline-sm` supports medium-scale titles and subheads with slightly less drama.
- **Body tiers:** `body-lg`, `body-md`, and `body-sm` should keep paragraphs readable without competing with the display typography.
- **Labels and navigation:** `label-lg`, `label-md`, `label-sm`, and `nav` are best for buttons, headers, and utility text; use the tighter letter spacing for navigation and small uppercase-like UI labels.
- **Captions:** `caption` is for metadata, footnotes, and understated helper text.

## Layout
The page uses a centered, fixed-max-width composition with generous vertical breathing room. Large hero sections should be built on a simple column grid with substantial top and bottom padding, allowing the headline to remain the visual anchor. Spacing follows a restrained rhythm based on 10px, 20px, 32px, and 64px increments; cards and modules should usually start at 16px internal padding and expand only when the content demands it.

Use broad section spacing (`section: 96px`) around major content blocks, and keep gutters moderate (`gutter: 24px`) so the interface stays open rather than dense. Alignment should remain crisp and symmetrical, with most content centered or aligned to a strong left edge for contrast against the oversized display type.

## Elevation & Depth
This system is intentionally flat. Instead of relying on shadows, it uses contrast, borders, and layered tonal differences to create hierarchy. The background, cards, and surface panels are distinguished through slight color shifts and 1px strokes, keeping the experience calm and highly legible.

When depth is needed, prefer inset or outline treatment over blur-heavy elevation. The overall effect should feel printed, architectural, and precise rather than soft or glossy.

## Shapes
The shape language is mostly rectilinear and industrial. Interactive elements use sharp corners (`rounded.none`) or very small radii at most, while cards may use only a modest `rounded.md` corner to soften larger content blocks. This creates a disciplined, poster-like feel that matches the brand’s bold typography.

Avoid pill-shaped or overly friendly geometry unless explicitly used for small chips. Buttons, panels, and inputs should remain boxy and utilitarian.

## Components
### Buttons
Primary buttons use `button-primary`: a solid near-black fill with light text, compact padding, and square corners. They are medium-height controls intended for hero CTAs and should feel decisive and weighty. Hover states may shift to `button-primary-hover` for slightly more emphasis, but should preserve the same geometry and sizing.

Secondary buttons use `button-secondary` and should appear visually quieter, often as outline or inverse-style actions depending on context. Link buttons use `button-link` and should be reserved for inline actions like “Developer docs,” with underlining instead of a boxed container.

Buttons should maintain the observed minimum height of `48px` and a compact horizontal padding around `10px 14px`. Use `label-lg` for button text so the rhythm stays consistent across controls.

### Cards
Cards use `card`: a soft light surface, 1px border, `rounded.md`, and `16px` padding. They should feel like simple framed containers rather than elevated panels. Use them for preview modules, feature summaries, and supporting content blocks. Keep internal spacing clean and avoid complex shadows.

### Inputs
Inputs should be plain and utilitarian: white or near-white fill, square corners, a simple border, and `body-md` text. Focus states should be expressed through border or outline contrast, not glow. Labels should stay compact and preferably set in `label-md` or `label-sm`.

### Chips and small tags
Use `chip` for compact metadata, filters, or status pills. They should be subtle, low-contrast, and rounded fully only at this scale. Keep text short and restrained.

### Navigation
Top navigation should use `nav`, with spaced-out letterforms and modest sizing. Items should feel like quiet utility links, not prominent buttons. The header CTA can reuse the primary button style to create a clear action hierarchy.

### Illustrative UI blocks
Any framed mockups or product previews should use thin borders, light surfaces, and no shadows. Let line art, borders, and spacing communicate structure rather than decorative depth.

## Do's and Don'ts
- Do keep the palette restrained and let the near-black primary do most of the work.
- Do use the neon accent sparingly for high-importance moments only.
- Do preserve the oversized, tightly tracked headline style for hero copy.
- Do prefer flat borders and tonal contrast over shadows and gradients.
- Don't round buttons into pills or introduce soft, friendly geometry.
- Don't replace the editorial typography with neutral, generic sans-serif styling.
- Don't overpopulate the layout; negative space is part of the brand.
- Don't introduce decorative effects that dilute the stark, engineered feel.
