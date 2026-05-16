# Bank Balance Strip Pass

Date: 2026-05-16
Screen: bank-balance-strip

## Goal

Reduce empty space and make the top bank status area feel more intentional.

## Problems Found

1. The balance title and the transfer button felt disconnected.
2. There was too much vertical space between the balance line and the action button.
3. The composition read as “text somewhere above a button” instead of a compact control block.

## Fixes Implemented

### 1. Added a dedicated balance strip

Wrapped the user balance title into its own layout container so it behaves like a composed header element instead of plain text.

### 2. Tightened spacing

Reduced the gap between the balance line and the transfer button.

### 3. Improved proportions

Adjusted the badge and button padding so the whole area feels more balanced and intentional.

## Result

The bank header should now feel more compact, more premium, and less like a loose stack of unrelated elements.
