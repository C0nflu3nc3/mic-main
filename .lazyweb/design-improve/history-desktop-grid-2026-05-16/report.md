# History Desktop Grid

## Request
- Fit multiple history cards in one row on desktop
- Remove broken mojibake labels on expand/collapse buttons

## Changes
- Kept `history-grid-2` and `history-grid-3` as real desktop grids with wider `minmax(...)` columns.
- Moved the one-column collapse breakpoint down to `820px` so laptop and desktop widths no longer collapse too early.
- Rebuilt `frontend/src/history-page.jsx` and `js/history-page.jsx` in clean UTF-8.
- Restored readable labels:
  - `Подробнее`
  - `Скрыть подробности`
  - `Читать полностью`
  - `Свернуть`
  - `Показать текст гимна`

## Design intent
- Desktop should feel like an encyclopedia wall with paired and triple cards.
- Mobile still stacks to one column for readability.

