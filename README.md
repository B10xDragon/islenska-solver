# Íslenska Solver — iPad Safari bookmarklet

The primary product is the one-line `javascript:` URL in `dist/bookmarklet.txt`. Version **3.0.0** replaces the panel with **one small draggable button** in the top-right corner. It starts **OFF**. Tap **ON** to enable both automatic placement and **Leika** submission. Tap **OFF** to cancel remaining placement/submission steps. Passing, exchanging and resigning stay manual.

## Install on iPad

1. Open an ordinary webpage in Safari.
2. Tap Share → Add Bookmark → Save.
3. Open Safari bookmarks and edit that bookmark.
4. Name it **Íslenska Solver**.
5. Replace its URL with the complete one-line URL in `dist/bookmarklet.txt` (also printed by `npm run bookmarklet`).
6. Save it, return to your loaded Netskrafl game, and tap the bookmark.
7. Tap the **AUTO OFF** button to switch both placement and Leika **ON**.

Drag the button to move it; dragging does not toggle automation. Its 96×48px touch target stays within the visible viewport after rotation, zoom or keyboard changes. There is no panel, move list or additional switch. Tap the bookmark again to hide and switch OFF; tap again to show. Each fresh launch starts OFF, even if an older release saved enabled preferences. The loader upgrades older releases and prevents duplicate buttons.

## Automatic placement and submission

While ON, the solver watches the visible committed board and rack, computes the maximum-scoring legal move, places its tiles and clicks the enabled **Leika** control once after the game reports a ready word state. It then waits for the next turn. The button is green while ON; its dot pulses during work and turns amber on an error. Its accessible label and title include the current status.

* Mutation observation plus a one-second fallback check follows position changes. The position key includes the game, committed board, normalized rack inventory and premiums. Rack shuffling and the solver's own staging do not become a new position.
* Existing unfinished drafts pause automation. The solver does not adopt an unrelated draft. If OFF interrupts its own partial move, ON can resume that exact plan after verifying the tiles.
* Current Málstaður rack selection sends a primary-button `mousedown` to the outer `.netskrafl-tile`, followed synchronously by `mouseup` on its document, then consumes the client's one-shot click stopper. It waits for `.sel` before clicking the destination. Blank-choice dialogs select the intended Icelandic letter. Older click-based clients use native clicks.
* Every tile and the current position are checked before proceeding. Repeated letters consume separate rack slots. Conflicting drafts, rejected inputs, changed positions and opponent turns stop remaining actions.
* Submission verifies the exact staged move, waits for enabled/visible Leika and word validation, then clicks at most once per position. It never retries a submission in the background.
* OFF, hiding and destroying the button cancel remaining actions immediately. Already placed tiles stay on the board. An already dispatched submission cannot be undone. Toggle OFF → ON to retry a failed position.
* The product does not call game API endpoints or read hidden opponent racks. It uses visible client input controls only. A page without a readable board waits instead of using an empty board.

## Hosting and architecture

GitHub Pages: https://b10xdragon.github.io/islenska-solver/

Málstaður allows `cdn.jsdelivr.net` scripts but blocks GitHub Pages scripts/frames. The small bookmarklet therefore loads the immutable GitHub release **v3.0.0** through jsDelivr. The single button uses Shadow DOM and bundled styles, without a hosted iframe.

The dictionary loads lazily when you first enable automation. The original compact DAWG is decoded from the permitted dictionary data script and saved in IndexedDB on the current page origin. Future launches reuse the cache. A bundled-source blob Web Worker handles searches; if unavailable, cooperative execution yields every 2,048 node visits.

`window.__ISLENSKA_SOLVER__` exposes `version`, `enabled`, `setEnabled(boolean)`, `getState()`, `open()`, `close()`, `toggle()`, `solve()`, `detectGame()`, `importGame()`, `getDiagnostics()` and `destroy()`. `getState()` includes phase, status message, best move and search stats. `getDiagnostics()` includes structural detection and placement diagnostics without cookies or hidden game state. `open`/`close`/`toggle` control visibility; `close` also turns automation OFF. `solve`/`importGame` refresh while enabled.

* `bookmarklet.js`: single-button rendering, dragging, viewport clamping and lifecycle.
* `automation.js`: combined ON/OFF state machine, cancellation, exact-plan resume and turn monitoring.
* `search-client.js`: lazy dictionary preparation, worker and cooperative fallback.
* `dictionary-cache.js`, `dawg.js`: IndexedDB and direct compressed DAWG traversal.
* `game-detection.js`, `draft-tiles.js`: visible board/rack/premiums/draft/turn reading.
* `live-game.js`, `submission.js`: position keys, verified tile staging and once-only Leika submission.
* `solver.js`, `scoring.js`, `board.js`, `rules.js`: search, scoring and source-verified game data.

The separate `app.html` remains a manual developer editor, not the bookmarklet interface or primary workflow. In that editor, tile values are defined in `src/rules.js`; selected-square premiums can be changed to Normal, DL, TL, DW or TW. Alternate one-word-per-line text, JSON or JavaScript Set dictionaries can be loaded through the dictionary module for development. The production bookmarklet uses the bundled Netskrafl DAWG and visible board premiums.

Cross-origin/closed frames and page security policies may prevent access. There is no browser-security override. The public client test uses local game state and does not authenticate into a private match.

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

Build produces minified `dist/solver.bundle.js`, worker/developer assets, dictionary data and one-line `dist/bookmarklet.txt`. `hosting.json` specifies the Pages URL, release version and pinned CDN asset base. Publish the matching release tag before distributing the bookmarklet. The main-branch workflow tests, builds and deploys `dist/` to Pages.

For browser checks on a machine with WebKit dependencies:

```bash
npx playwright install --with-deps webkit
npm run test:browser
npm run test:client
# Check published CDN assets:
ISLENSKA_TEST_DEPLOYED=1 npm run test:client
```

The 62 unit tests include an independent exhaustive solver over 80 small boards, 828 upstream Python DAWG comparisons, Icelandic letters, blanks, all premiums, crossing scores, bingo, maximum-score selection, draft detection, adapters, submission readiness/cancellation and the combined automation state machine.

WebKit checks cover iPad portrait/landscape, a 96×48px button, drag without toggling, viewport clamping, ON placement plus Leika, OFF cancellation, default-OFF fresh launches, existing-draft waiting, own-plan resume, opponent waiting, cache reuse, worker fallback, repeated bookmark taps and duplicate prevention.

`test:client` downloads the immutable public chunk named in the user's October 16 diagnostic report and verifies SHA-256 `715399880e8f4c7c4875e4199b75aed27bce7d8d9170c88abd836aa88333481c`. A test-only loader runs its unchanged Mithril renderer, Tile, DropTargetSquare, blank picker, input controller and Leika component against a local model. Authentication, routing, Firebase, analytics and game API calls are not started. The downloaded chunk stays in ignored `.cache/client/` and is not redistributed. Tests verify **UUOKÆNV → KVON**, the matching rack/destination sequence, blank placement, delayed validation, OFF cancellation and exactly one submission per verified move.
