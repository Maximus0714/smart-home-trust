---
name: "Smart Home Trust"
description: "A furnished architectural home and a restrained workspace for evidence, access, and learning provenance."
colors:
  accent: "#226b76"
  action-ink: "#20363b"
  action-hover: "#36535a"
  positive: "#35715c"
  negative: "#a34437"
  warning: "#85630c"
  ground: "#edf2f3"
  surface: "#fff"
  raised: "#f5f7f7"
  ink: "#1a2c31"
  muted: "#5d6b70"
  line: "#e2e8e9"
  nav-active: "#dfe7e9"
  scene-ground: "#f0f3f0"
  scene-caption: "#f2f1e9"
  house-wall: "#f0ece1"
  house-wood: "#b18b62"
  house-dark-wood: "#72563c"
  house-sage: "#788774"
  house-fabric: "#d8ddcd"
  house-brass: "#b99758"
typography:
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.25
  label:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
rounded:
  control: "6px"
  navigation: "7px"
  selector: "8px"
  viewport: "10px"
  dialog: "12px"
  panel: "14px"
  sheet: "16px"
spacing:
  compact: "4px"
  control: "8px"
  inline: "12px"
  section: "22px"
  panel: "25px"
  sheet: "30px"
components:
  button-primary:
    backgroundColor: "{colors.action-ink}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-danger:
    backgroundColor: "{colors.negative}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  navigation-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.navigation}"
    padding: "11px 12px"
  status-positive:
    textColor: "{colors.positive}"
    size: "13px"
  module-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "25px"
  room-selector:
    rounded: "{rounded.selector}"
    padding: "4px"
  trust-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "11px 0"
---

# Design System: Smart Home Trust

## Overview

**Creative North Star: "The Furnished Architectural Workspace"**

The furnished architectural workspace makes device state understandable through a familiar home. Warm timber, cream walls, sage upholstery, and daylight belong to the interactive object; pale blue-grey chrome and a white work sheet give its controls a quiet, readable frame.

This is a compact operating interface. Plain language, restrained semantic colour, and progressively revealed evidence keep the home legible before its details are opened. The visual commitment is an original, useful furnished cutaway, with opaque controls and natural page scrolling.

**Key Characteristics:**
- Pale architectural frame around a white work sheet.
- Warm furnished home as an interactive object.
- IBM Plex Sans controls with serif italic descriptive metadata.
- Semantic status colour always paired with text.
- Evidence and history revealed through explicit controls.

Confirmed direction: [PRODUCT.md](PRODUCT.md), [approved specification](docs/superpowers/specs/2026-10-24-smart-home-trust-design.md), and [direction record](docs/design-direction.md). This document records the implemented system. No external gallery or QUALITY BAR comparison was selected.

## Colors

The palette places cool, quiet product chrome around warm material colour in the home. Frontmatter values are normative; scene materials are a distinct application of those primitives, not extra status accents.

### Primary

- **Muted teal** (accent): links, input accents, and the outlined house mark.
- **Deep blue-green ink** (action-ink / action-hover): primary actions and their hover state.
- **Evidence green, contradiction brick, and caution ochre** (positive / negative / warning): semantic status text and dots; they are reserved for state rather than decorative card colour.

### Secondary

- **Cream plaster, warm timber, dark timber, sage, soft upholstery, and brass** (house-*): reused physical materials inside the original house. Keep these assigned to architecture, furnishings, and hardware rather than global actions. The material declaration is in [src/house/HouseModel.tsx](src/house/HouseModel.tsx): `wall: '#f0ece1', wood: '#b18b62', darkWood: '#72563c', sage: '#788774', fabric: '#d8ddcd'`.

### Neutral

- **Pale blue-grey ground** (ground): application frame.
- **White work surface** (surface): main sheet, controls, and module panels.
- **Quiet raised neutral** (raised): the existing root surface token; current panel hierarchy mostly uses white plus borders.
- **Readable dark ink / slate metadata** (ink / muted): primary and secondary text.
- **Fine grey divider / selected navigation** (line / nav-active): separators and current destination.
- **Soft scene ground / warm caption backing** (scene-ground / scene-caption): viewport field and opaque text support over the scene.

**The State Has Words Rule.** Status colour accompanies a written state; a coloured dot never carries the verdict alone.

Source: root custom properties, button and status states in [src/styles.css](src/styles.css). Module views carry local sage-tinted comparison surfaces and slightly warmer dividers in [src/views/modules.css](src/views/modules.css); these are contextual variants, not a competing global accent system.

## Typography

**Display Font:** IBM Plex Sans, sans-serif; there is no oversized decorative display face.
**Body Font:** IBM Plex Sans, sans-serif.
**Label Font:** Libre Baskerville, Georgia, serif, italic.

**Character:** The sans is clear and economical for a working dashboard. The genuine serif italic is a small descriptive voice, never a tracked uppercase eyebrow. Both families are locally served through [src/main.tsx](src/main.tsx).

### Hierarchy

- **Headline:** medium (500), compact page heading (26px), line height (1.25), with tight spacing (-0.025em). Module headings use a slightly closer line height (1.2); phone headings reduce to (24px).
- **Title:** module section heading (19px / 500 / 1.35). Overview section titles use (17px), and the trust summary uses (16px).
- **Body:** normal (400), general supporting copy (14px / 1.5); module intro copy uses (15px / 1.65), becoming (14px) on small phones. Supporting descriptions commonly stop at (65ch).
- **Control:** compact action text (13px / 400 / 1.25); primary actions use (500). The final phone overrides retain (13px) for room selection, inspect action, and trust-summary controls.
- **Label:** serif italic (400 / 1.6), untracked and sentence case. Existing descriptive metadata spans (11–12px); the module metadata selector uses (11px). Font size is deliberately omitted from the normative label token because the small-size review warning remains; do not carry that size into new primary controls.
- **Data:** numeric times, counts, and table values use tabular figures where defined; data values stay in the sans face.

**The Two Voices Rule.** IBM Plex Sans carries headings, actions, and data values. Libre Baskerville italic carries descriptive metadata in sentence case with no tracking.

Evidence: [src/views/modules.css](src/views/modules.css) defines `font-family: 'Libre Baskerville', Georgia, serif; font-style: italic; font-weight: 400; ... letter-spacing: 0` for metadata and table headings. [src/styles.css](src/styles.css) applies the same character to table headings and viewport metadata; ordinary button labels remain sans. Current 11–12px metadata and some sans secondary labels are documented as observed limitations, not expanded into a mandatory small-text style.

## Layout

The desktop application uses a sticky sidebar (220px) and a flexible workspace. A top bar (64px) sits above a white rounded sheet with padding (28px 30px 20px) and a narrow outer margin. The sidebar narrows to (190px) at (1200px). Module workspaces are centered with a maximum width (1320px).

Overview follows the confirmed sequence: heading, centered room selector, full-width home, compact selected-device row, three trust rows, then collapsed activity. Inspecting adds a right-hand column (285px, or 250px below 1200px); at (1000px) the inspector becomes an inline section beneath the scene. At (1650px) sheet padding increases and the inspector column becomes (320px).

At (740px), the sidebar becomes a labelled modal navigation drawer, the top bar becomes (55px), and sheet padding becomes (24px 17px 18px). The selector spans the sheet. The home viewport is (438px) high by default, (420px) at intermediate widths, (350px) on phones, and (490px) above 1650px. Scene fitting must preserve the whole default home at these sizes.

Module two-column and comparison layouts stack at (800px). At (560px), panels use (20px) padding, guided controls and policy rows reflow, and free-play sections become one column. Evidence tables retain local horizontal scrolling rather than forcing page overflow. Native page scrolling remains the scroll owner; the home has explicit camera controls.

Spacing is contextual, not a rigid global four-pixel grid: compact gaps (4–12px), section gaps (22–28px), and sheet padding establish density. Preserve the relationship between compact controls, grouped evidence, and broad scene space.

Sources: [src/App.tsx](src/App.tsx), [src/views/Overview.tsx](src/views/Overview.tsx), [src/styles.css](src/styles.css), and [src/views/modules.css](src/views/modules.css). The selector source uses `justify-content: center; width: fit-content; margin: 0 auto 20px` and becomes full-width on phones.

## Elevation & Depth

The interface is flat at rest. White surfaces, restrained tonal fills, fine borders, and spacing separate product layers. The modal is the deliberate CSS elevation exception; the furnished home uses actual geometry, rough material response, and bounded cast/received shadows. Physical depth belongs to the useful house rather than decorative UI effects.

### Shadow Vocabulary

- **Modal separation:** `box-shadow: 0 16px 60px #172d3533`, with backdrop `#253f4970`, in [src/styles.css](src/styles.css).

**The Flat Workspace Rule.** Resting controls and panels use tone and fine borders. Reserve ambient CSS shadow for modal separation; the house supplies its own physical depth.

Ordinary colour and border transitions use (160ms ease). Reduced motion shortens CSS transitions to (.01ms) and disables smooth scrolling; house changes receive the reduced-motion preference separately.

## Shapes

Controls have softly rounded corners (6px); navigation and callouts are gently rounded (7px), with a broader selector tray (8px). The scene (10px), dialog/disclosure (12px), module panels (14px), and enclosing sheet (16px) step outward in scale. The room selector's individual buttons use (5px). Status dots remain circular (6px) rather than becoming pills. Fine borders define panels and states without hard offset shadows.

House geometry uses coherent room outlines, dimensional furniture, rounded upholstery, and crisp joinery. Preserve material-specific edge treatment rather than copying UI radii into world units.

## Components

### Buttons

Quiet, compact, and explicit. [src/components/ui.tsx](src/components/ui.tsx) exposes primary, secondary (default), quiet, and danger variants.

- **Shape and spacing:** control radius, minimum height (36px), padding (8px 12px), icon/text gap (7px).
- **Primary:** deep action ink, white text, medium weight; lighter action ink on hover.
- **Secondary:** white with a fine grey border; pale neutral fill on hover.
- **Quiet:** transparent with muted text; a soft neutral hover fill.
- **Danger:** contradiction brick with white text; deeper brick on hover. Reserved for reset/removal context.
- **Focus and disabled:** visible (3px) focus ring with (4px) offset; disabled controls use opacity (.48) and a not-allowed cursor. Module focus rings use a muted sage variant.

### Chips

The status primitive is an inline text-and-dot indicator, not a filled badge. It uses (13px / 1.5), a (7px) gap, and a (6px) dot. Neutral, positive, negative, and warning tones pair colour with a written status. Do not turn semantic states into decorative pill clusters.

### Cards / Containers

Module surfaces are restrained white containers with a fine border, panel radius, and panel padding. Comparison columns share an enclosing border, with a subtle sage-tinted guarded variant. On phones, padding reduces to (20px). Overview uses open sections and divider rows rather than a dense card grid. Callouts use low-contrast semantic backgrounds, while explanatory text stays readable.

### Inputs / Fields

White fields use a thin grey border, control radius, padding (9px 11px), and minimum height (39px). Module selects use (10px 12px) and (43px) minimum height. Focus remains visible; accent and caret use muted teal. The selected-device picker is a deliberate compact borderless select with a DOM label; it is not a generic text input.

### Navigation

Sidebar destinations have (43px) minimum height, (11px 12px) padding, and navigation radius. Muted text and line icons become dark over a quiet selected fill for the current route, which also has `aria-current="page"`. Phone navigation is a labelled modal drawer with a close control and return focus; its items grow to (47px) minimum height.

### Centered room selector

A soft neutral tray groups four plain buttons. The pressed room is a white inset surface with a fine border and dark text; `aria-pressed` supplies state beyond colour. It is centered and content-width on desktop, full-width with equal flex items on phones.

### Interactive home and trust rows

The home is the signature useful object. View controls occupy the upper right, room/device metadata uses opaque warm backing, and the roof action sits in the footer. Selection updates the compact device dock; the explicit Inspect device action reveals the panel and close returns focus. Accessible DOM selection and the fallback home plan remain available independently of WebGL.

Device locations use 34px camera-facing icon pins in 44px native button targets. All four remain visible, with solid leaders to their physical anchors and screen spacing for the entry cluster. The selected pin uses muted teal, a white inner border, a teal outer ring, and a 12px serif-italic name callout. Callout placement avoids the icon targets; a dashed selected-only connector links displaced labels to their pin. Selection scales the face briefly over 200ms, then stays static; reduced motion skips it. Empty overlay space remains transparent to orbit gestures. Projection follows existing demand-rendered frames and animated device anchors, without an extra render loop. See [DeviceMarkers.tsx](src/house/DeviceMarkers.tsx) and [device-markers.css](src/house/device-markers.css).

Trust summaries are flat, three-part rows: module name, written state plus dot, and arrow. Their hover fill is subtle, dividers are fine, and their names remain readable on phones. Recent activity is an initially collapsed native disclosure. These patterns are evidenced by [src/views/Overview.tsx](src/views/Overview.tsx), not a new arrangement proposal.

## Do's and Don'ts

### Do:
- **Do** keep the house warm and furnished while keeping surrounding product controls pale and restrained.
- **Do** retain the approved sidebar and centered room-selector arrangement on wide screens; adapt navigation to a labelled modal drawer on phones.
- **Do** expose selection, state, and device actions in DOM controls as well as the canvas.
- **Do** give short metadata a real serif italic voice, sentence case, and zero tracking; retain readable contrast backings over the scene.
- **Do** pair evidence, access, and learning states with explicit text and preserve visible keyboard focus.

### Don't:
- **Don't** replace the approved workspace with terminal styling, gradients, decorative glass, or ambient visual effects.
- **Don't** make colour the only way to distinguish supported, contradicted, warning, or neutral states.
- **Don't** treat the current 11–12px metadata as a target for new primary controls or dense explanatory copy.
- **Don't** move detailed device evidence or the full activity history into the default Overview state.
- **Don't** present the browser simulation as live device security enforcement.

Observed review evidence: [.impeccable/review/phone-final.png](.impeccable/review/phone-final.png) and [.impeccable/review/desktop-initial.png](.impeccable/review/desktop-initial.png). Source values take precedence over a stale resized drawing buffer. The small metadata warning is not canonized as a requirement and is not repaired by this documentation pass.

