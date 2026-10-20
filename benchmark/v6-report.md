# V6 versus V5: measured results

80 complete seeded games, both seats per seed: 40 development games and 40 held-out games. No games truncated. Opponent is the actual pre-change V5.2 optimized strategy, not the earlier V4 baseline. V5 learned weights are unchanged. Development run preceded the final principal-move ordering change; held-out run includes it. No weights were tuned on the held-out results.

| Split | V6 wins / losses | Mean V6 final differential | Wilson 95% win interval |
|---|---:|---:|---:|
| Development | 20 / 20 | +3.1 | 35.2%–64.8% |
| Held out | 19 / 21 | +2.9 | 32.9%–62.5% |

Paired seed-block bootstrap intervals are also saved in the raw JSON. Seat pairs are correlated. These data **do not show stronger overall play**; the held-out point estimate is 47.5% wins. No claim of statistically significant strength improvement is made.

The simulator uses a deterministic 500-node endgame budget per decision to keep comparisons reproducible. It has no exchange policy and stops after six passes or rack-out; production wall-clock budgets differ. Exact outplay accounting uses the final score swing convention, so compare score differences rather than raw game scores.

## Latency

| Engine / workload | V5 median | V6 median | V5 P95 | V6 P95 |
|---|---:|---:|---:|---:|
| Node, 42 decisions each | 65.9 ms | 39.3 ms | 247.0 ms | 162.0 ms |
| WebKit Worker, 28 decisions each | 106 ms | 54 ms | 468 ms | 124 ms |

Both use the same 14 fixed positions, alternating version order and cold DAWG caches. WebKit runs on the Linux executor, **not a physical iPad**. Kill-switch network checks are not included in solver CPU timing. Real network or Safari suspension can dominate action latency.

Full per-game results and per-position timings are in `results/v6-train.json`, `results/v6-test.json`, `results/v6-latency.json` and `results/v6-webkit.json`. Reproduce using the commands in `V6-RELEASE.md`.

## Verification coverage

Existing exhaustive scoring oracle, 60 V5/V6 full move-set comparisons with blanks, 200 board-danger equivalence fixtures, independent exact-endgame oracle, dictionary integrity, cache isolation, automation cancellation and mandatory before-submit verification. WebKit covers portrait, landscape, worker fallback, actual-client fixture, strategy UI, duplicate injection, CSP-blocked GitHub verification via a tab, disable/re-enable, malformed responses and network failure.
