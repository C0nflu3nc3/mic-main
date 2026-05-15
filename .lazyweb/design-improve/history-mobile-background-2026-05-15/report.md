# Design Improvement: History Mobile Background

## TL;DR
The weak spot on mobile was not the cards, but the text-only section intros between them. They were sitting directly on the page texture, so they looked unfinished compared to the richer codex cards below. The fix was to give those intro zones a softer atmospheric backing instead of leaving them visually naked.

## Improvement Ideas

### 1. Give section intros a soft codex backing
The `Лор / 12 Легионов / Архонты...` intro blocks now have a subtle translucent plate with a vertical accent and a small gold marker. This keeps them lighter than full cards, but still intentional.

### 2. Preserve hierarchy without turning everything into heavy blocks
Instead of adding another big dark rectangle, the intro surface uses a faint glow, low-contrast border, and blur. That keeps the page airy while making text readable and deliberate.

### 3. Keep mobile-specific tuning
The adjustment is mobile-first, with a lighter footprint on the narrowest screens so the page still breathes.

## What Changed In Code
- `css/style.css`

## Reference Note
Lazyweb MCP references were not available in this session, so this was handled as a local visual audit and direct implementation from the provided screenshot.
