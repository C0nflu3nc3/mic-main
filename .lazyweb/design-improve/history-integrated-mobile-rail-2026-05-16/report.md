# History Integrated Mobile Rail

## Request
- Make the mobile progress slider part of the section blocks
- Remove the floating standalone slider
- Keep the dot moving while reading

## Changes
- Removed the floating progress widget from the React history page and fallback history page.
- Added an embedded vertical rail inside each mobile `history-section-head-main`.
- Dot position is driven by the current overall reading progress and mapped per section.
- Each section gets its own local progress state, so the dot appears in a different place on each block.

## Visual result
- The rail now feels attached to the content block instead of overlaying the page.
- Mobile history sections read more like a guided codex sequence.

