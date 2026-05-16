# History Mobile Slider

## Request
- Make the section intro block darker on phones
- Add back a real vertical slider with a moving dot
- Dot should move while the user scrolls through the history document

## Changes
- Rebuilt `frontend/src/history-page.jsx` and `js/history-page.jsx` with a proper mobile progress component.
- Progress is calculated from the first history section to the last and mapped to a CSS variable.
- Added a fixed vertical mobile slider with a moving golden dot.
- Darkened the mobile `history-section-head-main` block so it sits closer to the card language used elsewhere.

## Notes
- Slider is mobile-only and hidden on desktop.
- Dot position updates on `scroll` and `resize`.

