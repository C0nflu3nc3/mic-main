# Design Improvement: History & Codex

## TL;DR
The screen already has a strong fantasy-codex direction, but it felt visually flat: too many elements used the same panel weight, the background texture was noisier than the content, and the section hierarchy was not strong enough. The best improvement path was to calm the background down, deepen the hero and tabs, and make section heads and cards feel more editorial.

## Current State
This audit was based on the user-provided desktop screenshot of the `История и кодекс` page.

## Improvement Ideas

### 1. Calm the background and add a vignette
The page had a good olive-stone texture, but it was competing with the content. We shifted it toward a darker olive-stone base, added a soft gold glow at the top center, and introduced a vignette so the eye stays on the cards and headings.

**Why this works:** A codex-style page benefits from a background that feels atmospheric, not busy. Lower-noise textures make text and panels feel more premium.

**Sketch:**
```text
┌──────────────────────────────────────────────┐
│      soft gold glow                          │
│   darker olive stone texture                 │
│      content stays brightest in center       │
│   edges fall off into a subtle vignette      │
└──────────────────────────────────────────────┘
```

### 2. Turn the hero into a real title plate
The hero was readable, but it behaved more like a generic card than a page opener. The updated version has more internal depth, a subtle inner frame, stronger vertical spacing, and tighter title/description balance.

**Why this works:** The top hero should announce the page’s tone. A codex page needs a more ceremonial, anchored entrance.

**Sketch:**
```text
┌──────────────────────────────────────────────┐
│   [inner frame]                              │
│   ИСТОРИЯ И КОДЕКС                           │
│   хроники Империи: лор, архонты...           │
└──────────────────────────────────────────────┘
```

### 3. Make the section tabs feel like a navigation rail
The quick links were useful, but visually too close to the rest of the buttons on the site. The updated tabs now read more like a dedicated section navigator: slightly larger, with stronger lift, blur, and a sticky rail feel.

**Why this works:** When tabs look distinct from ordinary buttons, the user reads them as page navigation, not isolated CTAs.

**Sketch:**
```text
[ ЛОР ] [ 12 ЛЕГИОНОВ ] [ АРХОНТЫ ] [ КОДЕКС ]
  raised chips on a soft dark rail
```

### 4. Strengthen hierarchy inside each section
Section heads now behave more like editorial breaks: kicker, big title, then description, with a left rule and a small marker. Cards got more breathing room and a softer top glow to feel like carved tablets rather than plain repeat panels.

**Why this works:** The screen has a lot of information. Stronger hierarchy reduces cognitive load and makes the page feel intentional.

**Sketch:**
```text
ЛОР
Эпоха Основания
Краткое введение...

┌ card ────────────────────────┐
│ РОЖДЕНИЕ ИМПЕРИИ             │
│ Лор                          │
│ text...                      │
└──────────────────────────────┘
```

## What's Working
The gold-on-deep-green palette is already distinctive and fits the world well.
The menu and tabs are consistent with the fantasy-imperial direction.
The page already had good spacing between major regions, which made it safe to push the visual styling further without hurting readability.
The codex concept itself is strong; it mostly needed clearer visual rank and calmer surroundings.

## Reference Note
Lazyweb MCP references were not available in this session, so this report uses a local visual audit based on the provided screenshot and direct implementation in code.
