# Íslenska Solver — iPad Safari bookmarklet

The primary product is the one-line `javascript:` URL in `dist/bookmarklet.txt`. Version **2.3.0** automatically follows the visible Netskrafl position and can stage a move by clicking each rack tile and then its destination. **It never clicks Submit, ends a turn, passes, exchanges, or resigns.** You review and submit the turn yourself.

## Install on iPad

1. Open an ordinary webpage in Safari.
2. Tap Share → Add Bookmark → Save.
3. Open Safari bookmarks and edit that bookmark.
4. Name it **Íslenska Solver**.
5. Replace its URL with the complete one-line URL in `dist/bookmarklet.txt` (also printed by `npm run bookmarklet`).
6. Save it, return to your loaded Netskrafl game, and tap the bookmark.

First tap opens; another hides; another shows. The bookmarklet upgrades an older version automatically. A narrow panel, Result/Board/Rack tabs, fixed actions, full-board overview, 44px editor controls, safe-area padding, touch dragging, collapse, zoom and portrait/landscape support keep it usable on iPad.

## Live position updates

On a game page, the reader imports the visible board, rack, blank meanings, and premiums. Mutation observation with debouncing plus a one-second fallback check keeps the position current. It automatically recalculates when the committed position or available rack changes; it does not need a Refresh tap after each turn.

The game URL, committed board, sorted rack inventory, and premiums form the position key. Rack shuffling does not require another search. Pending tiles are distinguished from committed tiles and included in the normalized rack, so the solver's own staging does not become a new position or trigger a placement loop. Stale worker results are discarded, and queued updates solve the latest position.

The source line shows imported board/rack counts and staged tiles. **Refresh game** remains available. If a game layout cannot be read, solving is disabled instead of silently using an empty board. Settings → Copy detection report provides structural diagnostics without cookies or account credentials.

Closing/hiding the panel pauses live monitoring and cancels any remaining placement clicks. Reopening reads the latest position and resumes. Editing a board/rack/premium manually switches to the local editor and pauses live sync; Refresh game reconnects to the game.

## Automatic Moves and placement

Automatic Moves defaults **OFF**. Version 2.3 uses a new saved preference so an old local-only ON setting does not silently turn on game clicking.

* **OFF:** follow the game, solve, and highlight the best move. **Place in game** stages the selected move when you press it.
* **ON:** solve a new position and stage the highest-scoring move automatically, once per position. The preference is saved in localStorage on the current page origin.
* Placement clicks only a matching rack tile, its exact destination square, and (for a blank) the requested Icelandic letter in the game's blank-choice dialog.
* The adapter rereads the live position before every click step and verifies each staged tile. Repeated letters consume distinct rack slots. Matching tiles already staged are left in place; conflicting staged tiles cause a clear stop message.
* The reader recognizes Netskrafl's opponent-turn/game-over indicators and waits. A changed board/rack or rejected click stops the sequence; it does not keep clicking or automatically undo user actions.
* **Stop**, switching Automatic Moves OFF, hiding, or destroying the panel cancels remaining clicks. Already staged tiles remain for review; use the game's own recall control if needed. Recalculate explicitly permits trying again after a recall or stopped attempt.
* No action submits a turn. Click the game's own Submit button yourself.

On an ordinary page or in explicit **Use manual board** mode, placement continues to update only the private editor. **Undo** restores local placement; it is not a live-game recall button.

## Manual editor

Rack has seven slots and an Icelandic picker; `?` is a blank. Board shows a compact full-position preview and a separate scrollable editor with 44px squares. Choose a square, then **Choose letter**. Existing blanks score zero. Selected-square premiums support Normal, DL, TL, DW, TW. Top moves are sorted by score and selectable; score breakdown shows main, crosses, bonus and total. Only newly suggested tiles have bright translucent highlights.

## Hosting and architecture

GitHub Pages: https://b10xdragon.github.io/islenska-solver/

Málstaður allows `cdn.jsdelivr.net` scripts but blocks GitHub Pages scripts/frames. The small bookmarklet therefore loads the immutable GitHub release **v2.3.0** through jsDelivr. The GUI is mounted directly in a Shadow DOM panel, with bundled CSS/layout and no hosted iframe. The separate dictionary data script is loaded from the same permitted CDN, decoded to its original binary ArrayBuffer, and cached in IndexedDB. Later launches on that page origin reuse the cache. Settings → Clear dictionary cache removes it.

A bundled-source blob Web Worker handles search under Málstaður's permitted `worker-src 'self' blob:` policy. If workers are unavailable, cooperative generator execution yields every 2,048 node visits. The product does not request any game API endpoints or read hidden opponent racks. Game actions use the visible client's existing click handlers.

Public API: `window.__ISLENSKA_SOLVER__` exposes `version`, `open()`, `close()`, `toggle()`, `solve()`, `detectGame()`, `importGame()` and `destroy()`. Repeated taps cannot inject duplicate panels. Source modules:

* `dawg.js`: direct cursor traversal of Netskrafl packed DAWG.
* `dictionary-cache.js`: IndexedDB and dictionary data loader.
* `game-detection.js`: board/rack/premiums/pending-tile/turn reader across coordinate cells, tables, CSS grids, open shadow roots and same-origin frames.
* `live-game.js`: position keys, debounced monitoring, verified rack/destination click sequence and cancellation.
* `solver.js`: anchor/cross-check/DAWG move generation with incremental scoring.
* `scoring.js`, `board.js`, `rules.js`: scoring and source-verified game data.
* `gui.js`, `bookmarklet.js`: panel interaction and lifecycle.

Cross-origin or closed frames cannot be read by a bookmarklet on their parent page. Some unrelated pages block permitted scripts differently. Inaccessible positions are reported explicitly; there is no browser-security override.

## Dictionary, solver and actual Icelandic rules

The bundled ~3MB `ordalisti` DAWG is Netskrafl's game vocabulary, not the earlier Hunspell spelling list. It is read directly, including compressed multi-letter edges, interior terminal markers and little-endian child pointers; no millions-of-words JavaScript Set is built. API: `dawg.root()`, `dawg.follow(node, 'Þ')`, `dawg.isTerminal(node)`, `dawg.has(word)`.

Move generation uses anchors, rack-count-bounded starts, perpendicular cross-checks, DAWG prefix pruning, both directions, repeated letters and blank assignments. There is no search cutoff; every generated legal move is scored and sorted descending. Equivalent tile placements are deduplicated. `solve(board, rack, dawg, multipliers)` returns `{bestMove, moves, stats}` with zero-based `{word, score, row, col, direction, placedTiles}`. `column` is a compatibility alias. `stats` has `ms`, `anchors`, `nodes`, and `legalMoves`. The pre-existing board is assumed valid; all newly formed words are checked.

Rules are extracted from Netskrafl source commit `452b7fcd147316b3be53e38c0126da2722f141b0`: Icelandic `NewTileSet`, 32 letters, seven rack tiles, 100 bag tiles including two zero-value blanks; 15×15 standard board with 24 DL, 12 TL, 17 DW including center, and 8 TW squares. Seven newly placed tiles earn +50. Existing premiums never score again. New letter and word premiums apply independently in the main and crossing words, with multiple word premiums multiplying together. Tile values and counts are in `src/rules.js`.

Dictionary and source attribution/license terms are in [ATTRIBUTION.md](ATTRIBUTION.md).

## Build, deploy and tests

```bash
npm ci
npm run build
npm test
npm run bookmarklet
```

Build produces minified `dist/solver.bundle.js`, GUI/worker assets, dictionary data, and a one-line `dist/bookmarklet.txt`. `hosting.json` defines the Pages URL, release version, and pinned jsDelivr asset base. Publish the matching release tag before sharing the bookmarklet. The workflow tests/builds and deploys `dist/` to Pages on main.

For browser tests on a machine with WebKit dependencies:

```bash
npx playwright install --with-deps webkit
npm run test:browser
npm run test:live
```

Unit tests include the independent exhaustive reference solver over 80 small boards, 828 upstream Python DAWG comparisons, all premium/blank/cross/bingo cases, sorted maximum scoring, game adapters, cache-independent bootstrap/API behavior, live click order and repeated letters, blank dialogs, stale/opponent/conflicting positions, partial moves, cancellation, and watcher cleanup.

WebKit tests cover iPad portrait/landscape layout, manual placement and caching, and an interactive Netskrafl-shaped fixture under Málstaður-equivalent CSP. The live fixture checks automatic rack/board updates, exact game staging, no repeated-click loop, waiting for the opponent, a new turn, hide/resume, and zero submit-button activations. It simulates the existing client handlers; it does not authenticate into a private match.
