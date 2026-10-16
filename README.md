# Íslenska Solver — iPad Safari bookmarklet

The primary product is the one-line `javascript:` URL in `dist/bookmarklet.txt`. Version **4.0.0** adds strategic ranking behind **one small draggable button** in the top-right corner. Hold the button for settings and explanations. It starts **OFF**. Tap **ON** to enable both automatic placement and **Leika** submission. Tap **OFF** to cancel remaining placement/submission steps. Passing, exchanging and resigning stay manual.

## Install on iPad

1. Open an ordinary webpage in Safari.
2. Tap Share → Add Bookmark → Save.
3. Open Safari bookmarks and edit that bookmark.
4. Name it **Íslenska Solver**.
5. Replace its URL with the complete one-line URL in `dist/bookmarklet.txt` (also printed by `npm run bookmarklet`).
6. Save it, return to your loaded Netskrafl game, and tap the bookmark.
7. Tap the **AUTO OFF** button to switch both placement and Leika **ON**.

Drag the button to move it; dragging does not toggle automation. Its 96×48px touch target stays within the visible viewport after rotation, zoom or keyboard changes. The strategy panel stays collapsed until you hold the button; its Top moves list is separately expandable. Tap the bookmark again to hide and switch OFF; tap again to show. Each fresh launch starts OFF, even if an older release saved enabled preferences. The loader upgrades older releases and prevents duplicate buttons.

## Automatic placement and submission

While ON, the solver watches the visible committed board and rack, computes the selected strategy’s best move, briefly highlights its new tiles, places its tiles and clicks the enabled **Leika** control once after the game reports a ready word state. It then waits for the next turn. The button is green while ON; its dot pulses during work and turns amber on an error. Its accessible label and title include the current status.

* Mutation observation plus a one-second fallback check follows position changes. The position key includes the game, committed board, normalized rack inventory and premiums. Rack shuffling and the solver's own staging do not become a new position.
* Existing unfinished drafts pause automation. The solver does not adopt an unrelated draft. If OFF interrupts its own partial move, ON can resume that exact plan after verifying the tiles.
* Current Málstaður rack selection sends a primary-button `mousedown` to the outer `.netskrafl-tile`, followed synchronously by `mouseup` on its document, then consumes the client's one-shot click stopper. It waits for `.sel` before clicking the destination. Blank-choice dialogs select the intended Icelandic letter. Older click-based clients use native clicks.
* Every tile and the current position are checked before proceeding. Repeated letters consume separate rack slots. Conflicting drafts, rejected inputs, changed positions and opponent turns stop remaining actions.
* Submission verifies the exact staged move, waits for enabled/visible Leika and word validation, then clicks at most once per position. It never retries a submission in the background.
* OFF, hiding and destroying the button cancel remaining actions immediately. Already placed tiles stay on the board. An already dispatched submission cannot be undone. Toggle OFF → ON to retry a failed position.
* The product does not call game API endpoints or read hidden opponent racks. It uses visible client input controls only. A page without a readable board waits instead of using an empty board.

## Strategy and explanations

Tap the button to toggle both Auto place and Leika. **Hold it for about half a second** to open Strategy. Settings are saved per page origin; changing them stops automation. Tap AUTO again to resume. **Analyze without playing** leaves automation OFF and displays the result, actual points, strategic rating, component contributions, highest raw-scoring alternative, estimated opponent mean/P90, sample count, timings and a board preview. Only suggested new tiles are highlighted. Tapping Top moves changes the preview, not the automated choice.

* **Max points:** previous behavior, `evaluation === score`.
* **Balanced (default):** points, Icelandic rack quality, board control, premium/hook/lane risk and sampled opponent replies.
* **Defensive:** increases opponent-risk and opening penalties.
* **Aggressive:** increases immediate-score and openness incentives and reduces risk penalties.

Opponent analysis is independent of strategy mode: **Fast** uses board heuristics and zero samples; **Balanced** targets 16 sampled racks over 30 diverse candidates with a 3-second analysis budget; **Deep** targets 64 racks over 40 candidates with a 12-second budget. Targets and candidate counts are configurable. Completed sample rounds use the same racks for every candidate. An interrupted round is discarded for all candidates; incomplete searches never count as zero-score replies. The panel reports the actual sample count and budget limit. Fewer samples reduce the estimate's weight using a configurable confidence factor. P90 from a small sample is explicitly low confidence.

Performance depends heavily on blanks and board complexity. In the WebKit opening fixture, Balanced completed one full sampled round within approximately 3 seconds, rather than the target 16. Fast remains available for immediate heuristic analysis. These are measured container/WebKit results, not physical-iPad timing guarantees. Search uses a worker; cooperative fallback yields during move generation and heuristic evaluation. Without workers, endgame search gets a shorter 100ms default budget.

`move.score` always remains the actual Netskrafl score. `move.evaluation` ranks the strategy shortlist. The heuristic evaluates every legal move. The shortlist combines strategic rating, raw score, rack quality and defensive board shape, so selection is not just the top scores. Expensive replies use the existing legal move generator with cached cross checks and best-only collection. Sampled candidates are ranked against other sampled candidates; unanalysed heuristic ratings are not mixed into that final list.

Weights live in `src/strategy.js` (`STRATEGY`, `MODE_PROFILES`, `ANALYSIS`). **Score override / weights** accepts a JSON object, for example `{"opponentScoreWeight":0.65,"premium":{"TW":4,"DW":2}}`. The programmatic `setStrategy()` accepts mode, analysis, weight overrides and analysis configuration. `getState().result` exposes the structured result. `solveStrategic(board, rack, dictionary, multipliers, options)` is independent of the UI.

Icelandic rack leave starts from Icelandic tile frequencies, tile values and actual dictionary two-letter connectivity, with vowel balance, duplicate penalties and blank retention. These are initial estimated values, not English leave tables or a fully trained Icelandic leave database. Early play values flexibility; near-empty bags reduce leave value. Public score markers identify the local player's score without assuming left/right order. Unknown scores use neutral strategy; manual score overrides are available.

### Public tile tracking and endgame

`getUnseenTileBag()` subtracts committed board tiles and your normalized rack from the source-verified distribution. An assigned blank subtracts `?`, not its displayed letter. Unseen tiles include the opponent rack **and** the draw bag. Exchanges return tiles and must not be subtracted again. Optional known out-of-play tiles can be supplied explicitly. No hidden rack objects or game APIs are read. Inconsistent counts disable sampled and exact searches.

With at most seven unseen tiles and a valid standard inventory, the opponent rack can be inferred without hidden information. `solveEndgame()` performs iterative alpha-beta minimax with transposition and legal-move caches, optimizing final score difference. Going out earns twice the opponent's remaining tile value; six consecutive passes end the game with rack deductions. Search includes passes even when a placement exists. Time/node budgets and depth/completeness are reported. If a search cannot finish, its result is labeled incomplete and the strategic heuristic remains the choice. Unknown visible pass history also prevents an exact claim. An exact recommendation to pass is shown for manual action; automation does not click pass/exchange/resign.

The inference assumes the standard Icelandic bag and a complete, correctly detected board. Endgame supports no-draw positions; uncertain late-game positions continue sampled analysis. It does not claim full-game optimal play or know future draws.

### Self-play and tuning

```bash
npm run benchmark -- --games=20 --seed=1000 --analysis=fast
TUNING_GAMES=20 npm run benchmark:tune
npm run test:strategy-browser
```

The benchmark uses the actual Icelandic DAWG, complete tile distribution and paired seats/seeds against PureScoreBot. It tracks wins/losses/draws, final scores/differential, opponent response scores, bingos and newly accessible premium concessions. Both bots may pass; neither exchanges, so this is a controlled benchmark rather than full competitive-play validation. Tuning ranks profiles by win rate and then final score differential, never average immediate score. Separate seeds validate the selected profile.

Reports are in `benchmarks/`. Initial 12-game paired training runs favored the baseline (9 wins, +55.1 average differential) over a more conservative profile (7 wins, +16.8). The baseline weights were retained. On 12 held-out games they won 7 and lost 5, with **−21.9 average score differential**. This mixed result does not establish superiority over pure score. These Fast-mode training runs preceded the final late-game phase refinement; held-out results validate the final implementation separately. The small samples are preliminary evidence, not a reliable win-rate estimate or validation of Balanced/Deep sampling strength.

New modules: `strategy.js`, `board-danger.js`, `tile-tracking.js`, `endgame.js`, `strategy-panel.js`. Tests cover legal lower-score strategic choices, real hooks, premium exposure, parallel lanes, blank preservation, lead/deficit adjustments, unbiased sample-round cancellation, endgame agreement with an independent exhaustive oracle, public score detection, strategic automatic selection, expandable settings and ghost highlights.

## Hosting and architecture

GitHub Pages: https://b10xdragon.github.io/islenska-solver/

Málstaður allows `cdn.jsdelivr.net` scripts but blocks GitHub Pages scripts/frames. The small bookmarklet therefore loads the immutable GitHub release **v4.0.0** through jsDelivr. The single button uses Shadow DOM and bundled styles, without a hosted iframe.

The dictionary loads lazily when you first enable automation. The original compact DAWG is decoded from the permitted dictionary data script and saved in IndexedDB on the current page origin. Future launches reuse the cache. A bundled-source blob Web Worker handles searches; if unavailable, cooperative execution yields every 2,048 node visits.

`window.__ISLENSKA_SOLVER__` exposes `version`, `enabled`, `setEnabled(boolean)`, `getState()`, `open()`, `close()`, `toggle()`, `solve()`, `detectGame()`, `importGame()`, `getDiagnostics()` and `destroy()`. `getState()` includes phase, status message, best move, search stats and the strategic result. `openStrategy()`, `setStrategy(options)` and `getStrategy()` expose settings. `getDiagnostics()` includes structural detection and placement diagnostics without cookies or hidden game state. `open`/`close`/`toggle` control visibility; `close` also turns automation OFF. `solve`/`importGame` refresh while enabled.

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

The 78 unit tests include an independent exhaustive solver over 80 small boards, 828 upstream Python DAWG comparisons, Icelandic letters, blanks, all premiums, crossing scores, bingo, maximum-score selection, draft detection, adapters, submission readiness/cancellation and the combined automation state machine.

WebKit checks cover iPad portrait/landscape, a 96×48px button, drag without toggling, viewport clamping, ON placement plus Leika, OFF cancellation, default-OFF fresh launches, existing-draft waiting, own-plan resume, opponent waiting, cache reuse, worker fallback, repeated bookmark taps and duplicate prevention.

`test:client` downloads the immutable public chunk named in the user's October 16 diagnostic report and verifies SHA-256 `715399880e8f4c7c4875e4199b75aed27bce7d8d9170c88abd836aa88333481c`. A test-only loader runs its unchanged Mithril renderer, Tile, DropTargetSquare, blank picker, input controller and Leika component against a local model. Authentication, routing, Firebase, analytics and game API calls are not started. The downloaded chunk stays in ignored `.cache/client/` and is not redistributed. Tests verify **UUOKÆNV → KVON**, the matching rack/destination sequence, blank placement, delayed validation, OFF cancellation and exactly one submission per verified move.
