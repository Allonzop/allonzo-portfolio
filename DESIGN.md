---
name: The Plant
description: A building automation and energy engineer's portfolio, presented as a plant being commissioned at night.
colors:
  night: "#050a14"
  night-2: "#0b1424"
  plate: "#141414"
  plate-edge: "#2c2c2c"
  engrave: "#f1ede2"
  engrave-dim: "#c9c3b4"
  engrave-faint: "#a59f92"
  screw: "#5d5d5d"
  tag: "#ece6d6"
  tag-2: "#e2dbc8"
  tag-line: "#c9c0aa"
  ink: "#141414"
  ink-2: "#4a463d"
  ink-hover: "#2a2a2a"
  go: "#1f6b43"
  go-hover: "#28825a"
  go-ink: "#f4f1e6"
  go-signal: "#8ee0b0"
  sodium: "#ffb04a"
  reading: "#ffcf8a"
  line: "#5ec8ff"
  line-dim: "#2f6f95"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo Fallback, Arial Narrow, sans-serif"
    fontSize: "clamp(1.25rem, 3.6vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "Archivo Variable, Archivo Fallback, Arial Narrow, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 75"
  body:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Archivo Variable, Archivo Fallback, Arial Narrow, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 75"
  reading:
    fontFamily: "B612 Mono, B612 Fallback, ui-monospace, monospace"
    fontSize: "0.86rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum'"
rounded:
  control: "3px"
  plate: "6px"
  tag: "8px"
  sheet: "10px"
spacing:
  band-y: "6px"
  plate-y: "10px"
  tag-y: "20px"
  tag-x: "24px"
  plate-x: "28px"
components:
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.engrave}"
    typography: "{typography.label}"
    rounded: "{rounded.plate}"
    padding: "10px 28px"
  tag:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.tag}"
    padding: "20px 24px"
  tag-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tag}"
    typography: "{typography.label}"
    padding: "6px 24px"
  button-commission:
    backgroundColor: "{colors.go}"
    textColor: "{colors.go-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  button-commission-hover:
    backgroundColor: "{colors.go-hover}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tag}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  button-ink-hover:
    backgroundColor: "{colors.ink-hover}"
  button-ivory:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.plate}"
    padding: "8px 16px"
  chip:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.engrave}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  toast-commissioned:
    backgroundColor: "{colors.go}"
    textColor: "{colors.go-ink}"
    typography: "{typography.label}"
    padding: "10px 10px 10px 44px"
---

# Design System: The Plant

## Overview

**Creative North Star: "The Commissioning Board"**

The site is a plant at night being commissioned room by room, and every piece of interface is hardware you would find bolted to that plant: engraved equipment nameplates and commissioning tags. Persistent chrome is black phenolic plate with ivory engraved condensed caps and a screw at each end. Content arrives on one ivory lamacoid tag with reversed black bands and an eyelet, hung from the plant. Events arrive as a die-cut green commissioning tag on a wire.

Density is that of a labelled control panel: small, heavy, upper-case legends on the HUD; generous, readable body on the tags where the CV lives. Figures are the loudest thing on any tag, set at the same size as the title. Data (readings, XP, dates, email) is the only place a monospace appears. The scene behind it is sodium-warm inside and cold blue night outside, and the interface borrows exactly those two temperatures: sodium for live values and focus, night for the ground.

Offline, the plant is not dark but drawn: every room is cyan linework on blueprint blue, and commissioning hands the drawing over to warm light, the lines flickering out as the tubes flicker on. The visitor sees the whole portfolio as a technical drawing first, and turns it into a lit building room by room.

The world explicitly refuses the category default of a dark SCADA dashboard with neon accents and monospace everywhere. State is carried by a mark, not by a glow.

**Key Characteristics:**
- Black phenolic plates with ivory engraved condensed caps and centred end screws for all HUD chrome.
- One ivory lamacoid tag with reversed black bands and an eyelet for every body of content (room panel, handover, list cards).
- Offline is a drawing (cyan linework), live is light (sodium and warm surfaces).
- State as a mark: hollow square offline, filled square commissioned.
- Two type sizes on a content tag; one size per HUD plate; rank by weight, case and reversal.
- Archivo condensed for engraving, Archivo normal width for reading, B612 Mono only for data.
- Tags drop and swing on a wire; rooms flicker on; reduced motion collapses all of it.

## Colors

Two material families (black phenolic and ivory lamacoid) on a blue-night ground, with one commissioning green and one sodium amber as the only hues that act.

### Primary
- **Commissioning Green** (go): the commissioning tag itself. The room-commissioned toast, the primary call to action on the intro tag ("Start commissioning"), the CV action, and the Copy button's confirmed state. Text on it is Green-Tag Ivory (go-ink). Hover deepens to Hover Green (go-hover).

### Secondary
- **Sodium Amber** (sodium): live energy. XP figures, the commissioning progress fill, the active lift level, the focus ring, text selection, and the bullet dash on the night ground. Never a surface colour.
- **Warm Reading** (reading): live BMS values on the readings plate, the lit-filament tint of sodium.
- **Blueprint Line** (line) and **Line Dim** (line-dim): the drawing. 3D edges of offline rooms, offline mini-map cells, empty progress segments, the drafting grid behind the list page. Never used for text on ivory.
- **Signal Green** (go-signal): the word "Commissioned" on a black tag band, beside the filled mark.

### Neutral
- **Night Ground** (night) and **Night Shelf** (night-2): the page and the sky behind the plant; the list page header sits on night at 92% with a light blur.
- **Phenolic Black** (plate): every HUD plate, chips, the achievement toast. **Plate Edge** (plate-edge) is its 2px rim.
- **Engraved Ivory** (engrave): the white core cut through the phenolic; primary text on plates. **Dim Engraving** (engrave-dim) for second lines and units; **Faint Engraving** (engrave-faint) for plate legends and reading keys.
- **Screw Grey** (screw): screw heads, the eyelet ring on tag bands.
- **Tag Ivory** (tag), **Tag Shade** (tag-2, photo placeholders) and **Tag Rim** (tag-line, the 2px tag border): the lamacoid face.
- **Tag Ink** (ink) for text, bands and rules on the tag; **Ink Second** (ink-2) for context lines, labels under figures and dates; **Ink Hover** (ink-hover) for hovered black controls.

### Named Rules
**The Mark Not Hue Rule.** State is a square mark: hollow is offline, filled (with an inset rim) is commissioned. Colour may accompany a mark; it never carries state alone.

**The Three Signals Rule.** Cyan means drawn, not yet live; sodium amber means live; commissioning green means done or do. No other accent enters, and the hazard band on the opening tag is sodium on ink.

## Typography

**Display Font:** Archivo Variable, condensed to 75% width (with Archivo Fallback, a metric-matched Arial, then Arial Narrow)
**Body Font:** Archivo Variable at normal width (with Archivo Fallback, system-ui)
**Label/Mono Font:** B612 Mono 400/700 (with B612 Fallback, a size-adjusted Courier New), data only

**Character:** One family doing two jobs: squeezed into tight engraved caps it reads as a machined legend, opened to normal width it reads as plain technical prose. The cockpit mono is reserved for numbers a machine would print.

### Hierarchy
- **Display** (800, clamp(1.25rem, 3.6vw, 2rem), condensed caps): the list page's main nameplate only, where the name is a reversed ivory field cut through the black face.
- **Title** (800, 2rem, 1.7rem under 640px, line-height 0.95, condensed, sentence case): room titles, the handover heading, and every figure in a rating plate. Title and figures share one size.
- **Body** (400, 0.92rem, line-height 1.625): everything else on a content tag, including band labels, chips, context lines and the tag-head code. Bold (700) for the hook line, semibold for leads.
- **Label** (800, condensed caps, 0.04em): HUD plate text and controls, 0.8 to 0.88rem, one size per plate; weight and the dim/faint engraving colours do the ranking.
- **Reading** (B612 Mono 700, tabular figures): XP, the n/8 count, BMS values, years in the path list, the email address.

### Named Rules
**The Two Sizes Rule.** A content tag carries exactly two sizes: TITLE (2rem) for the title and every figure, BODY (0.92rem) for the rest. This is a recorded adaptation of the one-size-per-tag doctrine, made because the tags carry CV-length content. Rank inside a size by weight, caps and reversal.

**The One Plate One Size Rule.** Each HUD plate uses a single size. A second line on a plate is ranked by colour and weight, never by size.

**The Data Only Mono Rule.** B612 Mono sets readings, XP, dates, the email address and figures in readouts, and nothing else. Labels and prose are Archivo.

## Layout

The 3D view is full-bleed; the HUD pins plates to its edges with a 16px inset (12px under 640px): identity top-left, commissioning plate top-centre (it drops to its own row under 1024px and moves below the identity under 640px), sound and "Skip the game" top-right, readings and Contact bottom-left, the synoptic mini-map bottom-right. Toasts hang top-centre beneath the commissioning plate.

The room panel is a right-hand tag (min(30rem, 42vw)) from 5.4rem below the top to 16px above the bottom; under 760px it becomes a bottom sheet at 58svh that expands to full height. The handover is a centred tag up to 46rem, two columns (1.15fr / 1fr) from 768px, a bottom sheet on phones. The list page is a single 60rem column on the night ground with a fixed-height 64px sticky header so font swap never shifts it.

Spacing rhythm: plates pad 10px by 28px (room for the screws); tags pad 20px by 24px (20px sides on phones); reversed bands bleed to the tag edges at 6px vertical; bands open sections with a 28px gap above.

## Elevation & Depth

Depth is physical and soft: things hang in front of the scene and cast diffuse shadows onto it. Plates carry a faint top highlight (the bevel of a machined edge) plus a short drop shadow. Tags cast longer, softer shadows the larger and closer they hang. There are no hard offset shadows and no glows.

### Shadow Vocabulary
- **Plate** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 6px 18px -6px rgb(0 0 0 / 0.7)`): every phenolic plate and the ivory "Skip the game" button.
- **Hung tag** (`box-shadow: 0 12px 26px -10px rgb(0 0 0 / 0.85)`): the toast tag.
- **Intro tag** (`box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.8)`): the opening tag.
- **Panel tag** (`box-shadow: 0 24px 60px -18px rgb(0 0 0 / 0.85)`): the room panel.
- **Certificate** (`box-shadow: 0 30px 80px -20px rgb(0 0 0 / 0.9)`): the handover, over a night scrim at 55%.

### Named Rules
**The Hung Not Floating Rule.** Shadows are soft, negative-spread and fall downward, as from hardware hung in front of the scene. A hard offset shadow or a coloured glow does not belong to this world.

## Shapes

Machined, barely-softened rectangles. Controls are 3px, plates 6px, tags 8px, the phone bottom sheet 10px on its top corners. Borders are 2px and solid: the plate edge, the tag rim, the 2px black rules of a rating plate. Round forms appear only where hardware is round: screw heads (7px, slotted), the eyelet on every tag band (a ring of screw grey around ivory), and the reinforced eyelet on the toast (a ring around night). The toast is die-cut, its eyelet end clipped at 45 degrees by 16px.

## Components

### Buttons
Engraved controls: condensed caps, extra-bold, flat colour, no shadow of their own except the ivory HUD button.
- **Shape:** squared (3px); the ivory HUD button follows the plate (6px).
- **Commission (primary):** commissioning green with green-tag ivory text; hover to hover green.
- **Ink:** tag ink with ivory text on a tag ("LinkedIn", "Copy", "Next room" with an arrow); hover to ink hover.
- **Outline:** 2px ink border, ink text, inverting to ink on hover ("Read it as a list").
- **Ivory HUD:** tag ivory with a 2px light rim on the night scene ("Skip the game", "Play the 3D plant"); hover to white.
- **Lift keys:** outlined engraved keys on a plate; the current level is outlined and lettered in sodium and disabled.
- **Focus:** a 3px sodium outline offset 3px, everywhere.

### Chips
- **Style:** small phenolic plates on the ivory tag: plate black, engraved ivory, semibold condensed caps, 3px corners, BODY size. Used only for the room's stack.

### Cards / Containers
- **Plate:** phenolic black, 2px plate-edge rim, 6px corners, plate shadow, slotted screws centred at each end 9px in.
- **Tag:** ivory face, 2px tag rim, 8px corners, a reversed black head band carrying the eyelet, the room code, the state word and the mark.
- **Rating plate:** a grid of 2px black-ruled cells, two columns, each holding a TITLE-size figure over a BODY-size ink-second label; an odd last cell spans both columns.
- **Reversed band:** a full-bleed ink band with ivory condensed caps that opens each section of a tag.

### Inputs / Fields
- **Copy email:** a 2px ink-ruled field with the address in B612 Mono and a joined "Copy" ink button that turns commissioning green with "Copied" for 2.2s.

### Navigation
- **Synoptic mini-map:** a plate holding an SVG plan; rooms are hit areas whose focus ring is sodium.
- **List room index:** small phenolic plates with the state mark, the code in caps and the title in faint sentence case; hover lights the rim sodium.

### Lockout Tag (opening)
The first screen is one tag, alone, over the dimmed blueprint: a sodium-and-ink hazard band, an ink band reading "Locked out · do not operate", the title "Plant offline" in Archivo at 62% width, weight 900, clamp(3.4rem, 13vw, 6.4rem), a short brief, and "Isolated by" with the name. It drops and swings in from the hasp; its lines rise in sequence. The primary action is press-and-hold for 0.7s ("Hold to energise"), a breaker closing; a short press answers "Keep holding", and Enter or Space act at once, as does any press under reduced motion. On release the tag falls away, a sodium flash crosses the screen, the yard's lamps strike, the camera dollies from the establishing shot to the engineer, and the HUD plates bolt on one after another. The HUD is absent until then.

### Evidence prints
Real figures from the source documents sit under the feature they prove, in 2px ink frames on white with a "FIG 01" mono stub; the lead print hugs its own shape, the others share 4:3 frames. Each opens full size on tap; on the static list page each is a plain link to the image.

### Commissioning Tag (signature)
A die-cut tag hung on a wire drawn from above through a reinforced eyelet. Green for a commissioned room, phenolic black for an achievement. It carries the filled mark, a condensed caps line and an XP stub (B612 Mono in sodium on an ink chip). It drops 36px from a -10 degree tilt and swings (-10, 5, -2.5, 1, 0 degrees) to rest on the wire over 0.9s with an exponential ease-out, pivoting on its eyelet; it lifts off in 0.25s. At most three hang at once.

### State Mark
A 10 to 14px square with a 2px border in the surface's text colour. Hollow is offline; filled with a 1.5 to 2px inset rim is commissioned. Achievements in the handover use the same mark. List bullets are engraved dashes (a 10px by 2px bar), never squares, so a bullet is never mistaken for a state.

### Motion
Tags enter on an exponential ease-out (cubic-bezier(0.16, 1, 0.3, 1)): the room panel swings in from the side with a 2.5 degree tilt over 0.75s and leaves on an ease-in in 0.35s; the handover rises with a -1.5 degree tilt; list cards settle onto their hooks as they scroll in (GSAP expo.out, -1.2 degrees, 28px). Rooms flicker their lights on when commissioned; the camera and the lift travel via GSAP. Under reduced motion every tag fades instead, camera moves are near-instant, and CSS animation and transition durations collapse to 0.01ms.

## Do's and Don'ts

### Do:
- **Do** put persistent chrome on phenolic plates with centred end screws, and content on one ivory tag with reversed bands and an eyelet.
- **Do** show state with the square mark: hollow offline, filled commissioned.
- **Do** keep content tags to two sizes, TITLE 2rem for the title and every figure, BODY 0.92rem for the rest, and each HUD plate to one size.
- **Do** set engraved text in Archivo condensed to 75% width, caps, 0.04em tracking; set reading prose in Archivo at normal width.
- **Do** reserve B612 Mono for readings, XP, dates, the email address and figures in readouts.
- **Do** use the 3px sodium outline for every focus state.
- **Do** collapse every swing, drop, flicker and camera move under reduced motion.

### Don't:
- **Don't** use squares as list bullets; bullets are engraved dashes.
- **Don't** carry state by colour alone, or add accents beyond commissioning green and sodium amber.
- **Don't** set labels, headings or prose in the monospace.
- **Don't** use hard offset shadows or coloured glows; depth is soft and hung.
- **Don't** show an empty photo frame; a room without real figures has no evidence block.
- **Don't** show client names in evidence: crop them out or leave the figure out.
