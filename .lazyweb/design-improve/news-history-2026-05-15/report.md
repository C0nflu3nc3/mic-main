# Design Improvement: News + History Navigation

## TL;DR
The news cards looked structurally correct but visually flat: the image, text, and comments all sat on one level. The history page had a stronger tone, but the section rail and card alignment still felt uneven. The best fix was to make news feel editorial and layered, then make history feel more ceremonial and centered.

## Improvement Ideas

### 1. Turn news into an editorial card
Each news item now has a clearer stack:
- meta row
- centered title
- framed media stage
- separate text panel
- separate comments panel

This gives the eye a much easier path through the content.

### 2. Make comments feel like part of a discussion layer
Instead of plain lines of text under the post, comments now sit in softer nested surfaces. This makes the comment area feel intentional rather than appended.

### 3. Make history cards feel centered and ceremonial
The `Лор / Ноктюрн / Архонты` cards now center their content, buttons, and expanded sections so the page feels more like a codex and less like generic dashboard cards.

### 4. Upgrade the history tab rail
The `Лор / 12 Легионов / Архонты / Кодекс...` row now behaves more like a navigation rail than a string of unrelated buttons:
- tighter shell
- soft glass/dark backing
- stronger chip elevation
- better desktop centering

## What Changed In Code
- `frontend/src/pages-main.jsx`
- `js/react-app.jsx`
- `css/style.css`

## Reference Note
Lazyweb MCP references were not available in this session, so this pass was done as a local design audit and direct implementation from the provided screenshot.
