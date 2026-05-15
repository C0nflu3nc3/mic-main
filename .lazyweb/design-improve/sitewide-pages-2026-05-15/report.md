# Sitewide Pages Design Harmonization

Date: 2026-05-15
Screen: sitewide-pages

## Context

Goal: bring the rest of the product closer to the visual language of the `История и кодекс` page:

- deeper ceremonial hero blocks
- richer dark-gold card treatment
- more intentional spacing and hierarchy
- consistent “Imperial codex” feeling across pages

Lazyweb MCP references were not available in this session, so this pass used a local design audit and direct implementation in code.

## Main Problems Found

1. `История и кодекс` had a stronger design system than the rest of the site.
2. Page heroes outside history felt flatter and more generic.
3. Cards across `Главная`, `Новости`, `Миссии`, `Подтверждение`, `Студии`, and `Таблица лидеров` did not feel like the same family.
4. Some pages used strong shells, while others fell back to plain cards or looser spacing.
5. Desktop/mobile rhythm varied too much from page to page.

## Improvements Implemented

### 1. Shared ceremonial page system

Introduced a shared `ceremonial-page` wrapper so non-history pages can inherit the same visual family:

- wider centered content shell
- elevated hero treatment
- warmer top glow
- inner frame on desktop heroes
- denser, more intentional spacing

### 2. Hero blocks now feel related to history

Updated non-history hero sections to feel like title plaques rather than generic headers:

- centered title + description
- richer gradient depth
- restrained gold glow at the top
- stronger shadow and inner border

### 3. Card language unified

Applied the same tonal language to page cards:

- `Главная` feature cards
- `Миссии` cards
- `Подтверждение` cards
- `Студии` cards
- placeholder sections
- form cards
- leaderboard panels

The result is more “codex hall / imperial archive” and less “mixed UI kit”.

### 4. Better centering and composition

For the pages that benefit from it, key content is now centered more intentionally:

- card titles
- card descriptions
- studio cards
- mission/approve meta groups and actions
- empty states

### 5. Mobile consistency

Added mobile-specific ceremonial tuning:

- tighter hero padding
- removal of inner frame on small screens
- stronger title scale on compact layouts
- reduced card padding while preserving presence

## Pages Affected

- Главная
- Таблица лидеров
- Новости
- Предложенные новости
- Миссии за валюту
- Подтверждение
- Студии
- Placeholder pages
- Shared page shells used by bank-adjacent sections

## Result

The site should now read less like “one pretty page plus several older pages” and more like a unified product with one coherent art direction.

## Next Good Passes

1. Unify tables further with history-style headers and panel rails.
2. Refine the top navigation shell so it feels as premium as the content area.
3. Give bank/leaderboard rows more ornamental hierarchy without hurting readability.
4. Tune comments/replies so they match the newer editorial news card style.
