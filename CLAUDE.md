# Etincelle — Project Guide for Claude

## Overview

Family learning platform. 100% static site (pure HTML/CSS/JS, ES modules, no bundler, no build step). Three portals for three family members.

## Portals

| Portal | User | Path | Structure |
|--------|------|------|-----------|
| Felix Academy | Felix (12yo) | `felix/` | Modular — separate HTML/JS/JSON per activity |
| Lili la Licorne | Zoe (5yo) | `zoe/` | Monolithic — single `app.html` (~3200 lines) |
| Dasha | Dasha (mother) | `dasha/` | Modular — same pattern as Felix |

## Shared Modules (`shared/`)

| Module | Purpose |
|--------|---------|
| `db.js` | IndexedDB layer — user-scoped databases per portal |
| `spaced-repetition.js` | SM-2 variant — mastery tracking, session queue builder |
| `gamification.js` | XP, badges, streaks, confetti |
| `helpers.js` | DOM utils, shuffle, date helpers, screen transitions |
| `sfx.js` | Sound effects via Web Audio API |
| `confetti.js` | Confetti animation |
| `stt-service.js` | Speech-to-text (Web Speech API) |
| `bug-report/bug-widget.js` | In-app bug/feature request widget → GitHub Issues |

## Felix & Dasha — Activity Architecture

Each activity lives in its own subdirectory (e.g. `felix/english/`, `dasha/citizenship/`):
- `index.html` — Activity page with level select, session, and results screens
- `games/` — Game mode modules (flashcard, translate, match-pairs, etc.)
- Data files — JSON arrays of items with word/translation/emoji/level fields
- Portal page (`felix/index.html`) links to each activity

When adding a new activity for Felix or Dasha:
1. Create the activity directory with `index.html` and data files
2. Add a card/link on the portal page (`felix/index.html` or `dasha/index.html`)
3. Follow an existing activity as template (e.g. `felix/english/` or `dasha/french/`)

## Zoe — Game Architecture (IMPORTANT)

`zoe/app.html` is a single-file app. Every game follows the same pattern with 5 required parts:

### 1. Data Array
Hardcoded at the top of the `<script>` block. Examples:
```js
const LETTERS = [{ letter:'A', example:'avion', emoji:'✈️', level:1 }, ...];
const WORDS   = [{ word:'chat', emoji:'🐱', syllables:['chat'], level:1 }, ...];
```

### 2. HTML Screen
A `<div>` inside `#app` with class `screen` and a unique id:
```html
<div id="screen-mygame" class="screen">
  <div class="top-bar">
    <button class="back-btn" onclick="goHome()">←</button>
    <h2>Mon Jeu</h2>
    <div class="star-counter">⭐ <span id="mygame-stars">0</span></div>
  </div>
  <!-- game content here -->
</div>
```

### 3. Menu Button on Home Screen
Added inside `#screen-home .menu-grid`:
```html
<div class="menu-btn pink" onclick="goTo('mygame')">
  <span class="menu-icon">🎮</span>
  <span class="menu-label">Mon Jeu</span>
</div>
```
Available color classes: `pink`, `blue`, `green`, `orange`, `purple`, `cyan`, `ice`, `coral`.

### 4. Game Logic Function
A `showMyGameRound()` function that:
- Picks an item using the adaptive selection algorithm (or a simpler approach for the game type)
- Renders the question/prompt in the screen
- Sets up click/touch handlers for answers
- On correct: calls `sfxSuccess()`, `showRewardStar()`, records to mastery, then calls itself for next round
- On wrong: calls `sfxWrong()`, shows feedback, lets user retry

### 5. Navigation Integration
Register the screen in `goTo()`:
```js
// Inside goTo() switch or if-chain:
if (screen === 'mygame') initMyGame();
```
Add to `VALID_SCREENS` array. The `initMyGame()` function typically resets state and calls `showMyGameRound()`.

### Progression System
- **Stars**: +1 per correct answer, stored in `localStorage` as `lili-stars`
- **Tiers** (per game): 4 levels (Apprentie → Exploratrice → Experte → Championne)
- **Tier unlock**: 50% of current tier items mastered
- **Mastery**: tracked via IndexedDB — new → learning → mastered (5 consecutive correct + 7-day interval)
- **Adaptive selection**: 60% learning (weakest first), 20% new (max 3/session), 20% mastered (least recent)

### Study Existing Games First
Before adding a new game, read at least one existing game's full implementation (data + HTML + JS) to match the patterns. Good references:
- **Simple quiz**: `showLetterRound()` — letter identification with audio
- **Drag & drop**: `showBuildRound()` — drag syllables to build words
- **Drawing**: `showDrawRound()` — canvas drawing with AI recognition
- **Match pairs**: `showMatchRound()` — match letter forms

## Bug Widget & Issues

Issues are submitted via the in-app widget. They may be **bug reports** or **feature requests**. The description is often in French. The Page URL in the issue context tells you which portal/page is affected.

## Tests (`tests/`)

Puppeteer-based smoke tests. Each test file loads a page and checks for JS errors.
- `smoke-harness.mjs` — shared test runner
- When adding new pages/activities, add a smoke test and register it in CI

## CI (`.github/workflows/ci.yml`)

- JSON syntax validation
- JS syntax checking (node --check)
- Smoke tests via Puppeteer

## Key Conventions

- No build step — all code runs directly in the browser
- ES modules (`import`/`export`) — no CommonJS
- French UI text — code comments and variable names in English
- IndexedDB for persistence, localStorage for quick values
- CSS variables for theming (defined in `:root`)
- Screen-based SPA navigation via `goTo()` / `showScreen()` with slide animations
