# Íslenska Solver — iPad Safari bookmarklet

The primary product is the one-line `javascript:` URL in `dist/bookmarklet.txt`. Version **5.1.0** adds optional Discord notifications while retaining the v5 strategy behind **one small draggable button** in the top-right corner. Hold the button for settings and explanations. It starts **OFF**. Tap **ON** to enable both automatic placement and **Leika** submission. Tap **OFF** to cancel remaining placement/submission steps. Passing, exchanging and resigning stay manual.

## Install on iPad

1. Open an ordinary webpage in Safari.
2. Tap Share → Add Bookmark → Save.
3. Open Safari bookmarks and edit that bookmark.
4. Name it **Íslenska Solver**.
5. Replace its URL with the complete one-line URL in `dist/bookmarklet.txt` (also printed by `npm run bookmarklet`).
6. Save it, return to your loaded Netskrafl game, and tap the bookmark.
7. Tap the **AUTO OFF** button to switch both placement and Leika **ON**.

Drag the button to move it; dragging does not toggle automation. Its 96×48px touch target stays within the visible viewport after rotation, zoom or keyboard changes. The strategy panel stays collapsed until you hold the button; its Top moves list is separately expandable. Tap the bookmark again to hide and switch OFF; tap again to show. Each fresh launch starts OFF, even if an older release saved enabled preferences. The loader upgrades older releases and prevents duplicate buttons.

## Optional Discord reporting

Hold AUTO to open settings → **Discord reporting**. Reporting starts **OFF on every launch**. Check the consent box to enable it for this session. Safari opens a visible reporting tab on GitHub Pages; keep that tab open and return to your game. Málstaður's CSP blocks direct Discord requests and external frames, so the separate tab performs the opted-in delivery. No server-side proxy is involved. If Safari blocks the tab, tap **Open reporting tab**. `AUTO · R` indicates reporting is enabled.

Only when either displayed username equals `jonsolvi12` (case-insensitive, exact after trimming display whitespace), a confirmed bot move can send: bot user, opponent, which role matched, word, actual move points, UTC timestamp and bot version. Local/opponent roles follow the client's public player-color markers, not left/right order. Missing or ambiguous names suppress real reporting. Detection uses visible DOM text only. No account identifiers, game URL, cookies, rack, board or hidden player data are included in the Discord embed.

The hook runs after a verified Leika click and waits up to 20 seconds for the move's new tiles to appear committed in the same game. Staged, rejected and unconfirmed moves are not reported. Reporting errors never interrupt solving, placement or submission. Turning reporting OFF, hiding or destroying the bookmarklet cancels future reports; a request already dispatched cannot be recalled. Closing the reporting tab stops delivery. Safari suspension may delay or prevent delivery; the UI does not claim success without a successful Discord response.

**Test with mock usernames** has an explicit test-mode checkbox, editable mock names, Bot matches / Opponent matches / Neither matches presets, and **Send test notification**. Consent is still required. Tests use PRÓF / 0 points with a TEST label; mock names never replace real detected names. Neither-matches tests send nothing. Automated browser checks mock Discord unless `ISLENSKA_DISCORD_REAL=1` is explicitly set.

Duplicate prevention reserves a move-event hash in the reporting origin's IndexedDB before dispatch, including across helper reloads and tabs. It stores no player names or board contents. Failed/uncertain deliveries are not automatically retried, favoring at-most-once delivery over duplicates. If that storage is unavailable, reporting fails closed. Clearing site storage also clears deduplication history. The visible reporting tab includes its own OFF button. Messages between the tabs validate the opener, origin and random session token; Discord embeds disable mentions.

The owner-provided webhook is embedded in `src/reporting-config.js` and the production bookmarklet bundle. It is extractable by anyone able to read that code; this is accepted client-side configuration, not encryption or secret storage. To rotate it, replace that constant and publish a new release. Reporting itself remains opt-in.

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
* **Optimized (default):** the configuration selected by seeded multi-opponent self-play, validation and a latency tie-break. Actual points remain separate from strategic evaluation. See [benchmark-report.md](benchmark-report.md) for the measured evidence and uncertainty.
* **Defensive:** increases opponent-risk and opening penalties.
* **Aggressive:** increases immediate-score and openness incentives and reduces risk penalties.

Opponent analysis is independent of strategy mode. **Fast** and **Balanced** evaluate all legal moves with zero sampled racks; their endgame time budgets are 500ms and 1500ms. **Deep** targets 16 sampled racks across 10 diverse candidates within 12 seconds. Balanced is the default: two measured training positions took about eight seconds for just eight racks × ten candidates, with no consistent accuracy improvement from larger sweeps. These are container measurements, not physical-iPad guarantees.

Completed sample rounds use identical racks for every candidate. Interrupted rounds are discarded for every candidate, and incomplete searches never become zero-score replies. The panel reports actual completed samples and the budget limit. Search uses a worker; fallback yields during move generation and heuristic evaluation and limits endgame search to 100ms.

`move.score` always remains the actual Netskrafl score. `move.evaluation` ranks the strategy shortlist. The heuristic evaluates every legal move. The shortlist combines strategic rating, raw score, rack quality and defensive board shape, so selection is not just the top scores. Expensive replies use the existing legal move generator with cached cross checks and best-only collection. Sampled candidates are ranked against other sampled candidates; unanalysed heuristic ratings are not mixed into that final list.

Central weights and geometry/search limits live in `src/strategy-config.js`. Selected production weights, four phase maps, five lead buckets and learned Icelandic leave terms live in `src/optimized-strategy.js`. **Score override / weights** accepts a JSON object, for example `{"opponentScoreWeight":0.65,"premium":{"TW":4,"DW":2}}`. The programmatic `setStrategy()` accepts mode, analysis, weight overrides and analysis configuration. `getState().result` exposes the structured result. `solveStrategic(board, rack, dictionary, multipliers, options)` is independent of the UI.

Icelandic rack leave combines source tile frequency, dictionary connectivity, balance and duplicates with a regularized model fitted to 2,230 next-turn observations from 100 training games. Per-letter and sufficiently supported pair terms use strong shrinkage. These are observational associations, not causal tile values or an English leave table. Four game phases and five lead buckets modify the configured weights. Public score markers identify the local player's score; unknown scores use neutral strategy and manual overrides remain available.

### Public tile tracking and endgame

`getUnseenTileBag()` subtracts committed board tiles and your normalized rack from the source-verified distribution. An assigned blank subtracts `?`, not its displayed letter. Unseen tiles include the opponent rack **and** the draw bag. Exchanges return tiles and must not be subtracted again. Optional known out-of-play tiles can be supplied explicitly. No hidden rack objects or game APIs are read. Inconsistent counts disable sampled and exact searches.

With at most seven unseen tiles and a valid standard inventory, the opponent rack can be inferred without hidden information. `solveEndgame()` performs iterative alpha-beta minimax with transposition and legal-move caches, optimizing final score difference. Going out earns twice the opponent's remaining tile value; six consecutive passes end the game with rack deductions. Search includes passes even when a placement exists. Time/node budgets and depth/completeness are reported. If a search cannot finish, its result is labeled incomplete and the strategic heuristic remains the choice. Unknown visible pass history also prevents an exact claim. An exact recommendation to pass is shown for manual action; automation does not click pass/exchange/resign.

The inference assumes the standard Icelandic bag and a complete, correctly detected board. Endgame supports no-draw positions; uncertain late-game positions continue sampled analysis. It does not claim full-game optimal play or know future draws.

### Self-play and tuning

```bash
npm run benchmark
npm run optimize-strategy
npm run strategy-tournament
npm run benchmark:performance
npm run benchmark:positions
npm run benchmark-final
npm run benchmark:report
```

The committed experiment is sealed after final-test evaluation. To tune again, use a separate experiment checkout/directory and new untouched test seeds; do not repeatedly optimize against this release's test set. Commands use the real Icelandic DAWG without rendering a browser. `benchmark/seeds.json` declares deterministic train, validation and final-test splits. Full games use paired seats against Greedy, frozen Existing, Defensive, Aggressive and Best-so-far opponents. The optimizer performs wide random proposals, local proposals, an eight-way round robin and three finalist evaluations. Win rate dominates final score differential; paired uncertainty and latency break ties. Configuration is locked before final testing.

All raw games, traces, confidence intervals, learned leave values, prediction/candidate sweeps and position results are in `benchmark/results/`; [benchmark-report.md](benchmark-report.md) gives the measured before/after comparison. Controlled games do not exchange, resign or model time penalties. They use zero reply samples and a deterministic 500-node endgame cap; production's time-bounded endgame may search further. Sampled-mode playing strength and physical-iPad latency have not been established by this experiment. The report makes those limits explicit.

## Hosting and architecture

GitHub Pages: https://b10xdragon.github.io/islenska-solver/

Málstaður allows `cdn.jsdelivr.net` scripts but blocks GitHub Pages scripts/frames. The small bookmarklet therefore loads the immutable GitHub release **v5.1.0** through jsDelivr. The single button uses Shadow DOM and bundled styles, without a hosted iframe.

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

The unit tests include an independent exhaustive solver over 80 small boards, 828 upstream Python DAWG comparisons, Icelandic letters, blanks, all premiums, crossing scores, bingo, maximum-score selection, draft detection, adapters, submission readiness/cancellation and the combined automation state machine.

WebKit checks cover iPad portrait/landscape, a 96×48px button, drag without toggling, viewport clamping, ON placement plus Leika, OFF cancellation, default-OFF fresh launches, existing-draft waiting, own-plan resume, opponent waiting, cache reuse, worker fallback, repeated bookmark taps and duplicate prevention.

`test:client` downloads the immutable public chunk named in the user's October 16 diagnostic report and verifies SHA-256 `715399880e8f4c7c4875e4199b75aed27bce7d8d9170c88abd836aa88333481c`. A test-only loader runs its unchanged Mithril renderer, Tile, DropTargetSquare, blank picker, input controller and Leika component against a local model. Authentication, routing, Firebase, analytics and game API calls are not started. The downloaded chunk stays in ignored `.cache/client/` and is not redistributed. Tests verify **UUOKÆNV → KVON**, the matching rack/destination sequence, blank placement, delayed validation, OFF cancellation and exactly one submission per verified move.
