# Íslenska Solver — iPad Safari bookmarklet

The product is the one-line `javascript:` URL in `dist/bookmarklet.txt`, not a local webpage. It launches its own floating board/rack solver overlay on an ordinary Safari page. It never reads, modifies, or submits moves to a live game, including malstadur.mideind.is. Board/rack information is entered only in its private editor.

## iPad installation

1. Open an ordinary webpage in Safari.
2. Tap Share.
3. Tap Add Bookmark.
4. Save it.
5. Open Safari bookmarks.
6. Edit the new bookmark.
7. Name it **Íslenska Solver**.
8. Delete its URL.
9. Paste the complete one-line URL printed by `npm run bookmarklet` or found in `dist/bookmarklet.txt`.
10. Save it.
11. Open an ordinary webpage.
12. Tap the bookmark.
13. The solver overlay appears.

First tap opens, second hides, third shows. Close hides without discarding in-memory edits. Collapse reduces the overlay to its header. Drag the header with a finger; viewport changes and drag limits keep the header reachable. Controls need no hover or shortcuts. The board is horizontally scrollable, with 44px touch squares. Pinch zoom remains enabled; the panel adapts to the visual viewport / onscreen keyboard. Portrait and landscape are supported.

Some pages enforce CSP restrictions on external scripts or frames. Safari internal pages and such restricted pages cannot reliably run a bookmarklet. A visible retry message and console diagnostics appear on failure; use another ordinary page. The product cannot override a host's security policy.

## Use

* Tap a rack slot, then tap the Icelandic tile picker. Entry advances through seven slots. `?` is a zero-value blank.
* Tap **Edit board**. Tap a square, then choose its existing letter from the picker. Set **Selected board tile is a blank** for old blanks, which score zero. **Clear square**, **Clear board**, and **Done** are touch controls.
* The default board is the source-verified Netskrafl standard board. Selected-square **Premium** can edit DL/TL/DW/TW for experiments.
* Tap **Recalculate** to search all legal horizontal and vertical moves. The maximum score is prominent; up to 30 sorted top moves are shown. Tap another move to select it and view its score breakdown. New tiles are translucent bright green ghost letters; old letters remain normal.
* **Show move** opens and scrolls to the suggested tiles. **Place move** commits exactly the suggested tiles to this private board and removes consumed rack letters. **Undo placement** restores board/rack.
* **Automatic Moves** defaults OFF. OFF only suggests/highlights. ON automatically places the maximum move after a solve. Preference persists through localStorage on the hosted origin. It never submits an external turn. Changing ON takes effect on the next solve.
* **Settings → Clear dictionary cache** removes the IndexedDB cache. It downloads again on the next new launch. Closing/reopening an existing panel reuses its current dictionary.

## Architecture

The bookmarklet is a small guarded script loader. It loads `solver.bundle.js?v=2.0.0`, exposing `window.__ISLENSKA_SOLVER__` with `version`, `open()`, `close()`, `toggle()`, `solve()`, and `destroy()`. Repeated taps cannot create duplicate UI or concurrent script injections. `solve()` requests recalculation in the isolated GUI.

The loader creates a shadow-DOM header containing a hosted GUI frame. This keeps host CSS/dark pages from affecting the board, prevents access to the host game's state, and lets the dictionary cache live under the stable hosting origin rather than under each visited website. The frame is **the bookmarklet's overlay**, not a replacement workflow that requires visiting the debug page.

The hosted GUI fetches the roughly 3MB Netskrafl `ordalisti` packed DAWG and stores its binary ArrayBuffer in IndexedDB. Later launches use the cached bytes. If browser privacy settings deny persistent storage, it reports that the dictionary is ready without caching. A same-origin Web Worker runs the solver; failure to create a worker falls back to cooperative generator execution, yielding every 2,048 visits so the GUI remains responsive.

`dawg.js` reads the upstream compressed binary directly: node edge counts, single/multi-letter edges, interior terminal bits, and little-endian child offsets. No millions-of-words expansion. API: `dawg.root()`, `dawg.follow(node, 'Þ')`, `dawg.isTerminal(node)`, and `dawg.has(word)`. Only parsed edge descriptors are cached, with an 8,192-node bound.

Move generation uses anchor squares, rack-count-bounded starts, cross-checks, DAWG prefix pruning, both orientations, counted repeated letters and blank assignments, and incremental main/cross scoring. There is no move-count/time cutoff; every legal generated move is sorted by descending score. Equivalent tile placements are deduplicated. Every newly formed main/cross word must exist in the DAWG. Ties retain the first maximum move.

`solve(board, rack, dawg, multipliers)` returns `{bestMove, moves, stats}`. Moves include `{word, score, row, col, direction, placedTiles}`; `column` is a compatibility alias. Tile entries include `{row, col, column, letter, blank}`. Coordinates are zero-based; the GUI displays one-based coordinates. `bestMove` is null if none exists. `stats` includes `ms`, `anchors`, `nodes`, and `legalMoves`. Score breakdowns are attached to the first 100 moves. The pre-existing board is assumed valid; unrelated old words are not revalidated.

## Actual rules

Verified against Netskrafl source commit `452b7fcd147316b3be53e38c0126da2722f141b0`:

* `is_IS` uses `NewTileSet`, `IcelandicAlphabet`, `ordalisti`, and the `standard` board.
* 32 Icelandic letters; seven rack tiles; 100 bag tiles including two blanks.
* New tile values/frequencies are in `src/rules.js`, extracted from `src/languages.py`.
* 15×15 board with 24 DL, 12 TL, 17 DW (including center), and 8 TW squares, extracted from `_LSC` / `_WSC` in `src/skraflmechanics.py`.
* Blanks represent an Icelandic letter and always score zero.
* Premiums apply only when a new tile is placed. Word premiums multiply together, so two DW are ×4.
* Main and perpendicular cross words score separately. A new tile's DL/TL and DW/TW apply in each word independently. Existing premiums never apply again.
* Seven newly placed tiles earn +50, including blank tiles. Emptying a smaller rack earns no bingo.

These defaults are extracted from Icelandic source, not substituted English rules. Tests validate exact values, counts, and layouts. For custom values, edit `src/rules.js` and rebuild; for experimental board premiums use the UI. Attribution and licensing: [ATTRIBUTION.md](ATTRIBUTION.md).

## Build, tests, and hosting

```bash
npm ci
npm run build
npm test
npm run bookmarklet
```

Build minifies production `dist/solver.bundle.js`, `gui.bundle.js`, and `worker.bundle.js`, then copies dictionary/styles/app/debug page and writes the one-line `dist/bookmarklet.txt`. The debug page is optional. No localhost server is needed for the actual product.

`hosting.json` defines the GitHub Pages base URL and release version. Changing hosts requires rebuilding the bookmarklet. Bump the version when changing bundle assets and the cache key in `dictionary-cache.js` when updating the DAWG. `scripts/fetch-dictionary.mjs` downloads the upstream binary; `public/dictionary.sha256` pins the tracked copy. `scripts/extract-rules.py` extracts source values/layouts from a checked-out Netskrafl reference; `src/rules.js` is tracked so ordinary builds need no external repository.

The included `.github/workflows/pages.yml` checks/builds and deploys `dist/` on main. Configure repository Pages to use GitHub Actions. If workflow modification permissions are unavailable, a `gh-pages` branch containing `dist/` can be deployed by Pages' branch publishing mode instead. No secrets are committed.

The production bundle tests require `npm run build` first. For WebKit browser checks: `npx playwright install --with-deps webkit` then `npm run test:browser` on a machine with browser system dependencies. The script intercepts hosting URLs to serve the built artifacts; it verifies the deployment architecture before publishing, not the live hosting endpoint.

Unit tests include the retained independent exhaustive reference solver on 80 small boards; premium, cross, bingo and blank tests; highest score and full sorted output; automatic private-board placement; 828 lookup comparisons with upstream Python DAWG; actual tile/layout checks; and production bookmarklet API, one-line prefix, duplicate injection, visible retry UI, and open/close/toggle tests.

Browser verification scripts are in `scripts/` when available; physical iPad Safari installation remains a manual verification step.
