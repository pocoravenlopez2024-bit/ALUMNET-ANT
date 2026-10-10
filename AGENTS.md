# AGENTS.md — Design Taste & Frontend Craftsmanship Guidelines

> Injected from `Leonxlnx/taste-skill` (Anti-Slop Frontend Skill & Visual Polish Engine).
> Applies to all UI generation, refactoring, styling, and layout decisions across this project.

---

## 1. The Design Read & Three Dials
Before writing UI code, calibrate against the specific domain context:
- **Audience & Vibe**: Institutional, academic, modern collegiate alumni network for St. Cecilia's College - Cebu, Inc.
- **Dials Baseline**:
  - `DESIGN_VARIANCE: 7` (Balanced, purposeful rhythm; no cookie-cutter grids)
  - `MOTION_INTENSITY: 5` (Subtle, purposeful transitions with cubic-bezier timing; no dizzying loops)
  - `VISUAL_DENSITY: 4` (High-end spacing, breathable cards, clear optical hierarchy)

---

## 2. Surfaces, Color & Lighting
- **Sophisticated Neutrals**:
  - Never use pure `#000000`. Use rich charcoal (`#121316`, `#1c1917`, or stone-900).
  - Backgrounds: Use warm or clean neutrals (`#F9FAFB`, `#FAF9F6`, `bg-stone-50/50`) instead of harsh pure whites everywhere.
- **Accents & Institutional Branding**:
  - Primary Accent: St. Cecilia's signature deep crimson (`#8B181B` / `#721316`), kept restrained with <80% saturation to blend naturally with stone/slate neutrals.
  - Secondary Accents: Rich amber/gold (`#D97706` / `#B45309`), deep emerald for verified states, subtle sky/indigo for communication tags.
- **Diffusion Shadows & Materiality**:
  - Never use harsh black 1px dropshadows or generic `shadow-md` rectangles.
  - Use soft diffusion shadows: `shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]`.
  - Borders: Crisp, ultra-subtle `border-stone-200/80` or `border-slate-200/70`.
  - Nested Corner Radius Math: `Inner Radius = Outer Radius - Padding`.

---

## 3. Typography & Hierarchy
- **Scale & Contrast**:
  - Display headings: High optical presence with tight tracking (`tracking-tight` or `tracking-tighter`, `font-semibold` to `font-bold`).
  - Body text: Crisp legibility at 14px–16px with balanced leading (`leading-relaxed` 1.5–1.6).
  - High typographic hierarchy: Use size, weight, and tonal value (e.g. `text-stone-900` vs `text-stone-500`) rather than arbitrary colorful borders.
- **Anti-Emoji Policy**:
  - Do not use raw emojis in titles, badges, buttons, or technical metrics.
  - Always use clean, sharp SVG iconography from `lucide-react` with standardized stroke widths (`strokeWidth={1.75}`).

---

## 4. Layout Discipline & Anti-Slop Rules
- **No AI Clichés**:
  - No purple-to-blue gradients or neon cyan text on dark cards.
  - No identical 3-column feature cards with centered icons.
  - No full-width hero text over arbitrary dark blurry meshes.
  - Avoid arbitrary left-border accents on cards.
- **Breathing Room & Optical Rhythms**:
  - Generous padding on structural containers (minimum 16px–24px).
  - Optical bottom padding: Card bottoms have slightly more breathing room than tops (`pt-5 pb-6`).
  - Keep button padding proportional: horizontal padding = ~2x vertical padding (`px-4 py-2` or `px-5 py-2.5`).
- **Responsive Precision**:
  - Mobile touch targets ≥ 44px.
  - Prevent viewport jumps with `min-h-[100dvh]`.
  - Contain wide layouts with `max-w-7xl mx-auto`.

---

## 5. Micro-Interactions & Transitions
- Interactive elements feature smooth feedback states (`transition-all duration-200 ease-out`).
- Active and hover states shift elevation subtly without jarring layout reflows.
- Dialogs and modals use spring-like scale enters (`scale-[0.98]` to `scale-100`) and soft backdrop blurs (`backdrop-blur-sm`).
