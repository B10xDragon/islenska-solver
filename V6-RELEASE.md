# Íslenska Solver V6.0.0

V6 preserves the compact draggable AUTO button, placement and Leika verification,
Icelandic packed DAWG, blanks, scoring, strategic settings and Max points mode.
Discord reporting remains removed.

## What changed

- Cross-check generation shares DAWG prefix traversal; board coordinates use numeric keys in the hot path.
- Board danger uses four linear sweeps instead of repeated premium-square ray walks. A 200-board randomized regression compares all features with V5, including blanks.
- Cross-check caches are scoped by dictionary and tile values and capped at 128 entries. Blank status is included in danger-cache keys. Best-only searches now report the actual legal move count.
- Endgames reuse cross checks, skip unnecessary score-breakdown construction, and order moves using the previous iteration's principal move. Completed searches at depth two or deeper can guide a move even if the full game is not solved; these are labeled bounded lookahead, not exact. Unknown pass histories never claim exactness.
- Worker searches no longer yield to browser timers unnecessarily. UI results retain 50 moves while the solver still generates/ranks all legal moves. OFF, changed positions and the kill switch cancel in-flight searches; workers have a response watchdog.
- Cached and downloaded dictionaries are checked against the pinned SHA-256. Corrupt cached data is rejected and downloaded again.
- Position/submission verification still prevents duplicate clicks. A fresh kill-switch check occurs before placement and immediately before Leika, followed by another position/enable-state check.
- The strategy panel follows the visual viewport on rotation and keyboard resizing. It shows move coordinates and actual main/cross/bonus point breakdowns. Hidden ancestor elements no longer falsely identify opponent-turn/game-over indicators.

## Measurements and limits

See [V6 benchmark report](benchmark/v6-report.md) and machine-readable results in
`benchmark/results/v6-*.json`. The V5 source snapshot in `benchmark/v5/` comes
from `v5.2.0` (`0af88980bb37a8b2a1871c686a4443e026a7e561`).

The existing learned V5 strategy weights are retained. This release has measured
speed improvements and targeted endgame/correctness fixes, but self-play does
**not establish a win-rate improvement**. It is not claimed to be a newly trained
stronger strategy. No hidden opponent data is used.

## GitHub kill switch — V6 only

Edit [config/v6.json on main](https://github.com/B10xDragon/islenska-solver/edit/main/config/v6.json).

Disable:

```json
{"enabled":false}
```

Enable:

```json
{"enabled":true}
```

Commit directly to `main` (or merge the change there). No version bump, bookmark
change, or Pages deployment is needed to change this flag. V6 fetches the raw
**main-branch** file with a unique URL and `cache: no-store`, at startup, every
15 seconds, on page visibility/resume, before placement, and immediately before
submission. Invalid JSON, a missing boolean, extra properties, HTTP/network
failure, timeout, or expired verification pauses V6. Requests time out after five
seconds; an enabled response expires after 21 seconds. Changes take effect when
the new response is received, normally within the polling interval, not with
zero network latency. There is no persistent cached permission to run.

The game site's CSP blocks direct GitHub requests. If the button says **VERIFY**,
tap it once to open the visible GitHub Pages verification tab. Keep that tab open,
return to the game, and tap **AUTO**. It receives only the enabled/disabled setting;
no board, rack, usernames or moves are sent. If Safari suspends the verifier,
V6 pauses; return to that tab and then the game to re-verify. Popup blocking also
fails closed. Verification restores availability, but automation stays OFF until
you explicitly turn it back on. Already staged tiles are left for review; V6 does
not recall or submit them while disabled.

Older releases do not read this file and are unaffected. This is a **client-side
operational control, not a security boundary**: someone who modifies the code can
bypass it. An already completed submission cannot be undone by flipping the flag.

## Reproduction

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run test:client
npm run test:strategy-browser
npm run test:v6-control
npm run benchmark:v6 -- train 20
npm run benchmark:v6 -- test 20
npm run benchmark:v6-latency
npm run benchmark:v6-webkit
npm run bookmarklet
```

Browser checks use controlled fixtures, including the shipped client interaction
model; they do not play a live match. Benchmarks use the real Icelandic dictionary
and full 15×15 games. Actual iPad hardware timing is not available here.
