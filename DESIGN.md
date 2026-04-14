# Design System Document: Urban Rail Manufacturing Intelligence

## 1. Overview & Creative North Star
The **Creative North Star** for this design system is **"The Kinetic Command."** 

Unlike traditional flat dashboards, this system is designed to evoke the precision of high-speed rail engineering and the cinematic authority of a modern mission control center. We move beyond "template" UI by embracing a **High-Tech Industrial** aesthetic—where data isn't just displayed, it is orchestrated. 

The experience is characterized by high-contrast typography, intentional asymmetry that mirrors the layout of complex machinery, and a layered depth that suggests sophisticated glass-and-steel construction. We prioritize a "heads-up display" (HUD) feel, ensuring that the CRRC Red is used sparingly but with maximum impact to signal critical manufacturing status.

---

## 2. Colors
Our palette is rooted in the heritage of rail manufacturing, balanced with modern digital sophistication.

- **Primary & Alerts:** `primary_container` (#C70019). This is the "Pulse" of the workshop. Use it exclusively for critical data points, active alerts, and primary calls to action.
- **Surface Hierarchy (The Ink Tones):** 
    - **Base:** `background` (#131313) provides the infinite depth of a dark command center.
    - **Nesting:** `surface_container_low` (#1B1B1B) and `surface_container_high` (#2A2A2A) create structural depth without the need for borders.
- **Accents & Text:** `on_surface` (#E2E2E2) and `Pure White` (#FFFFFF) provide maximum legibility against the dark void.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface_container_highest` module sitting on a `surface_container` background defines its own boundary through tonal contrast, creating a cleaner, more premium aesthetic.

### Signature Textures: Glass & Gradient
To move beyond a "flat" feel, use **Glassmorphism** for floating telemetry panels.
- **Effect:** Background Blur (20px–40px) combined with a semi-transparent `surface_variant` (#353535 at 40% opacity).
- **Gradients:** Use subtle linear gradients on primary buttons, transitioning from `primary_container` (#C70019) to `on_primary_fixed_variant` (#93000F) to provide a "metallic sheen" consistent with industrial rail surfaces.

---

## 3. Typography
We utilize a dual-font strategy to balance industrial character with data precision.

- **Display & Headlines (Space Grotesk):** This typeface brings a technical, futuristic edge. Use `display-lg` (3.5rem) for hero metrics (e.g., total workshop output) and `headline-md` (1.75rem) for major section titles.
- **Body & Labels (Inter):** Chosen for its exceptional legibility at small sizes. Use `body-md` (0.875rem) for secondary data descriptions and `label-sm` (0.6875rem) for technical metadata and timestamps.

**Identity through Scale:** High-contrast sizing (e.g., a `display-lg` number next to a `label-sm` unit) conveys a sense of "Advanced Telemetry" seen in high-end industrial interfaces.

---

## 4. Elevation & Depth
Depth in this system is a simulation of layered light and material, not just a "shadow."

### The Layering Principle
Stack tiers to create natural lift. Place a `surface_container_lowest` (#0E0E0E) card on a `surface_container_low` (#1B1B1B) section to create a "recessed" industrial look, or a `surface_container_highest` card on a `surface` background to create "projection."

### Ambient Shadows
For floating UI components (Modals, Hover states):
- **Color:** Use a tinted version of `on_surface` at 6% opacity.
- **Blur:** Large, diffused values (30px–60px) to mimic natural ambient light.
- **Ghost Border Fallback:** If accessibility requires a border, use `outline_variant` (#5D3F3C) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** High-gloss `primary_container` (#C70019) with a 0.2rem (`spacing-1`) inner glow.
- **Secondary:** `secondary_container` (#494646) with `Pure White` text.
- **Shape:** Strictly 0px roundedness (`rounded-none`). Sharp corners emphasize industrial precision.

### Industrial Cards
- **Construction:** Use the **No-Line Rule**. Separation is achieved via background shifts between `surface_container_low` and `surface_container_high`.
- **Content:** Cards should utilize `spacing-6` (1.3rem) for internal padding to ensure "breathing room" amidst dense manufacturing data.

### Input Fields
- **State:** Unfocused inputs are `surface_container_lowest`. On focus, the bottom edge glows with a 2px `primary_container` (#C70019) "underline" rather than a full border.

### Telemetry Chips
- **Usage:** For status indicators (e.g., "Active," "Stalled").
- **Style:** Semi-transparent backgrounds with a "Subtle Glow" effect. An "Active" chip should have a soft outer glow of `CRRC Red` at 20% opacity.

---

## 6. Do's and Don'ts

### Do
- **DO** use the Spacing Scale (specifically `spacing-8` and `spacing-10`) to create intentional asymmetry in the layout.
- **DO** use vertical whitespace to separate list items instead of divider lines.
- **DO** leverage `surface_bright` (#393939) for hover states on dark containers.
- **DO** ensure the CRRC Red (#C70019) always has a contrast ratio that meets AA standards against the `background`.

### Don't
- **DON'T** use any rounded corners (`0px` only). This is an industrial environment; softness is off-brand.
- **DON'T** use traditional 1px dividers. They clutter the technical "HUD" feel.
- **DON'T** use CRRC Red for decorative elements. It is reserved for **Criticality** and **Action**.
- **DON'T** use standard "Drop Shadows" with black (#000000) at high opacity. It breaks the "Glass & Steel" illusion.