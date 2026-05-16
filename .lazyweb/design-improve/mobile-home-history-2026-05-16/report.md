# Mobile Home + History Pass

Date: 2026-05-16
Screen: mobile-home-history

## Goal

Fix three mobile/UI issues:

1. Homepage cards were still breaking into a cramped multi-column layout on phones.
2. Bank transfer wording needed to use `фракция` and a clearer comment placeholder.
3. History page needed a simple “where am I now” progress indicator for beginning / middle / end.

## Fixes Implemented

### 1. Homepage stacked vertically on phones

Forced the homepage feature cards into a single-column mobile layout so each section reads as a proper card instead of a squeezed strip.

### 2. Transfer wording clarified

Updated transfer UI text and generated operation comments:

- sender/receiver labels now use `фракция`
- comment label now reads `Комментарий фракции`
- placeholder now reads `Введите сообщение легиону`
- generated transfer history now uses `Передача GRZ фракции ...`

### 3. History progress indicator

Added a compact progress row to the history page with three stages:

- Начало
- Середина
- Финал

The active stage updates from scroll position so the reader has orientation while moving through long sections.

## Result

The phone experience is less cramped, bank transfer language is clearer and more thematic, and the history page now gives readers a better sense of progression.
