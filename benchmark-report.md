# Strategy benchmark — v5.0.0

This is a completed, measured optimization experiment, not proof of optimal play. **776 complete games** entered the baseline/search/tournament/validation/final-test experiment. No truncated games are treated as wins. The selected configuration is **random-5**.

The paired final-test interval includes zero: this experiment does not establish a statistically reliable win-rate improvement.

## Final untouched test: old versus selected

| Strategy | Games | W/L/D | Win rate¹ | Wilson 95% | Avg score | Avg opponent | Avg differential | Median differential | Median ms | P95 ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Old v4 | 100 | 57/43/0 | 57.00% | 47.22%–66.27% | 543.83 | 538.32 | 5.51 | 15.00 | 73.71 | 755.59 |
| Selected v5 | 100 | 53/47/0 | 53.00% | 43.29%–62.49% | 504.79 | 505.70 | -0.91 | 8.00 | 64.92 | 760.90 |

¹ Draws count as half a win. Paired seed/opponent bootstrap intervals: old 48.00%–66.00%, selected 44.00%–61.00%. The matched win-rate difference is **-4.00%**, 95% paired interval **-17.00%–9.00%**; final-score differential change **-6.42 points**, interval **-34.80 to 21.52**. These are 2,000-resample paired-block intervals; Wilson intervals alone assume independent Bernoulli trials and are only descriptive here.

## Separate splits and actual volume

| Stage | Games | Selected win rate | Selected average differential |
| --- | --- | --- | --- |
| Baseline TRAIN | 100 | Old: 52.00% | Old: 8.24 |
| Parameter TRAIN | 120 | 40.00% (10 selected games) | 23.50 |
| Round-robin TRAIN | 56 | 57.14% (14 selected games) | See standings |
| VALIDATION | 300 | 42.50% (100 selected games) | -30.30 |
| Untouched FINAL TEST | 200 | 53.00% (100 selected games) | -0.91 |

TRAIN baseline seeds 18473921–18473930; proposal seed 18473931; tournament seed 18474000. VALIDATION 29473921–29473930. FINAL TEST 39473921–39473930. All are declared in [benchmark/seeds.json](benchmark/seeds.json). The selection lock was recorded at 2026-10-16T16:25:39.927Z; final tests were run only after weights/presets were frozen. Baseline game throughput: 0.58 games/sec; average solve 155.81ms. Final old/selected throughput: 0.45 / 0.52 games/sec. A stopped pre-cache pilot, retained separately, is excluded from these counts.

Only 100 validation games per finalist and 100 test games per strategy were practical in this run, not 1,000 per finalist. Small screening sets can overfit; validation uncertainty remains substantial. The five-opponent pool contains Greedy, frozen Existing, frozen Defensive, frozen Aggressive and the current Best-so-far. Both seat orders use the same shuffled bag per seed. Different moves consume different numbers of tiles, so future racks can diverge naturally. No hidden rack is read in production.

## Search, tournament and selection

Twelve configurations (reference, seven wide random proposals, four local proposals) each played ten training games. Selection optimizes win rate first, average final differential second. Eight entered the round robin on a fresh TRAIN seed.

| Configuration | W | L | D | Win rate |
| --- | --- | --- | --- | --- |
| random-6 | 11 | 3 | 0 | 78.57% |
| reference | 10 | 4 | 0 | 71.43% |
| random-5 | 8 | 6 | 0 | 57.14% |
| random-0 | 8 | 6 | 0 | 57.14% |
| local-2 | 5 | 9 | 0 | 35.71% |
| random-2 | 5 | 9 | 0 | 35.71% |
| local-3 | 5 | 9 | 0 | 35.71% |
| random-3 | 4 | 10 | 0 | 28.57% |

Validation finalists:

| Configuration | Games | Win rate | Average differential | Median ms | P95 ms |
| --- | --- | --- | --- | --- | --- |
| reference | 100 | 48.00% | -9.43 | 85.39 | 850.37 |
| random-6 | 100 | 43.00% | -12.54 | 95.83 | 941.40 |
| random-5 | 100 | 42.50% | -30.30 | 60.99 | 631.45 |

Win rate, then final differential. Paired 95% CI of win-rate differences including zero treated as indistinguishable; prefer median latency when different by >10%, then fewer learned pair terms, then lower score-difference variance. This chose random-5; it did not have the largest validation point estimate. Sampling weights cannot be identified by zero-sample games, so expected-score/P90 weights were restored to v4 priors before final testing.

## Production configuration

Core weights:

```json
{
  "immediateScoreWeight": 0.992,
  "opponentScoreWeight": 0.55,
  "opponentP90Weight": 0.12,
  "rackLeaveWeight": 0.39,
  "boardControlWeight": 1,
  "dangerousPremiumWeight": 1.045,
  "bingoLaneWeight": 1.463,
  "parallelWeight": 1.146,
  "hookWeight": 0.949,
  "closingWeight": 0.272,
  "openingWeight": 1.335,
  "premium": {
    "TW": 2.801,
    "DW": 0.403,
    "TL": 1.553,
    "DL": 1.477
  },
  "leadThreshold": 45,
  "aheadRisk": 1.25,
  "aheadClosing": 1.3,
  "behindRisk": 0.8,
  "behindOpening": 0.5,
  "blankValue": 9.145,
  "duplicatePenalty": 0.573,
  "balancePenalty": 2.868,
  "awkwardPenalty": 0.3,
  "frequencyWeight": 0.6,
  "dictionaryUsefulnessWeight": 0.08,
  "targetVowelRatio": 0.43,
  "earlyLeaveMultiplier": 1.1,
  "endgameLeaveMultiplier": 0.15,
  "sampleConfidencePrior": 4
}
```

Phase multipliers:

```json
{
  "EARLY": {
    "rackLeaveWeight": 1.397,
    "blankValue": 0.908,
    "dangerousPremiumWeight": 0.517,
    "opponentScoreWeight": 1
  },
  "MIDGAME": {
    "rackLeaveWeight": 0.743,
    "blankValue": 0.518,
    "dangerousPremiumWeight": 1.372,
    "opponentScoreWeight": 1
  },
  "LATE": {
    "rackLeaveWeight": 0.537,
    "blankValue": 1.233,
    "dangerousPremiumWeight": 0.864,
    "opponentScoreWeight": 1
  },
  "ENDGAME": {
    "rackLeaveWeight": 1.108,
    "blankValue": 1.294,
    "dangerousPremiumWeight": 1.033,
    "opponentScoreWeight": 1
  }
}
```

Lead buckets:

```json
{
  "slightThreshold": 10,
  "farThreshold": 62,
  "farAhead": {
    "opponentScoreWeight": 1.484,
    "dangerousPremiumWeight": 1.091,
    "openingDelta": 0.391
  },
  "ahead": {
    "opponentScoreWeight": 0.944,
    "dangerousPremiumWeight": 1.47,
    "openingDelta": 0.393
  },
  "even": {},
  "behind": {
    "opponentScoreWeight": 1.055,
    "dangerousPremiumWeight": 0.816,
    "openingDelta": 0.477
  },
  "farBehind": {
    "opponentScoreWeight": 0.802,
    "dangerousPremiumWeight": 1.473,
    "openingDelta": 0.019
  }
}
```

Learned leave multiplier: 0.308. Full letter/pair values and presets are in [benchmark/results/optimized-strategy.json](benchmark/results/optimized-strategy.json) and [src/optimized-strategy.js](src/optimized-strategy.js). Legacy lead/phase constants remain centralized for compatibility; configured strategies use the phase and lead maps above.

## Learned Icelandic leave and opportunity features

2230 next-own-turn observations from 100 TRAIN games. Ridge regression on next-turn score residuals within phase/leave-size strata; pair residuals shrink by n/(n+200), n>=30, bounded +/-2. Observational associations, not causal tile values. Blank retention is included in the same fitted model and tuned phase weights; sparse contexts are reported, not claimed as precise estimates.

| Tile | Learned residual coefficient |
| --- | --- |
| A | 0.01 |
| Á | -0.24 |
| B | 4.10 |
| D | 0.00 |
| Ð | -3.27 |
| E | -1.33 |
| É | -0.32 |
| F | -2.62 |
| G | -2.42 |
| H | 0.68 |
| I | -1.37 |
| Í | -0.89 |
| J | 1.06 |
| K | 1.07 |
| L | 0.67 |
| M | -0.48 |
| N | 0.94 |
| O | 2.83 |
| Ó | 4.50 |
| P | -0.27 |
| R | 2.80 |
| S | 0.65 |
| T | -0.14 |
| U | -1.99 |
| Ú | 1.07 |
| V | -0.39 |
| X | 0.17 |
| Y | 1.64 |
| Ý | -1.34 |
| Þ | -2.55 |
| Æ | -0.88 |
| Ö | 0.67 |
| ? | 5.38 |

Correlation with the actual next opponent score on selected TRAIN moves:

| Feature | Observations | Pearson r |
| --- | --- | --- |
| TW | 2320 | 0.01 |
| DW | 2320 | 0.11 |
| TL | 2320 | 0.08 |
| DL | 2320 | -0.00 |
| hooks | 2320 | -0.07 |
| frontHooks | 2320 | -0.08 |
| backHooks | 2320 | -0.00 |
| parallel | 2320 | 0.13 |
| anchors | 2320 | 0.14 |
| longLanes | 2320 | 0.05 |

These correlations are selection-confounded and mostly weak. For example, low TW correlation does not mean exposing TW is harmless: prior move selection may already avoid its worst cases. We did not remove premium penalties based solely on these correlations. Search evaluates their combined playing outcomes.

## Sampling and candidate cost

Two real TRAIN positions, seed 76019 for without-replacement rack samples. Counterfactual actual replies use only the simulator's ground truth for offline measurement, never production hidden tiles. Sweeps reuse measured individual reply costs, not independent whole-game trials per preset. They are latency/prediction probes, not sampled-mode win-rate validation.

### seed-18473921-seat-0-turn-6

Generation 31.88ms; heuristic 84.08ms.

| Samples | Candidate cap | Actual candidates | Composition | Total ms | Reply prediction MAE | Chosen score minus actual reply |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | 10 | 10 | diverse | 8304.91 | 38.96 | 8 |
| 16 | 10 | 10 | diverse | 12526.54 | 32.92 | 8 |
| 32 | 10 | 10 | diverse | 19198.52 | 34.46 | 8 |
| 64 | 10 | 10 | diverse | 33165.22 | 31.90 | 8 |
| 128 | 10 | 10 | diverse | 75986.02 | 31.47 | 8 |
| 8 | 10 | 10 | diverse | 8304.91 | 38.96 | 8 |
| 8 | 10 | 10 | score-only | 7967.08 | 42.69 | 8 |
| 8 | 20 | 20 | diverse | 15516.53 | 37.20 | 8 |
| 8 | 20 | 20 | score-only | 15189.83 | 40.21 | 8 |
| 8 | 30 | 30 | diverse | 22285.82 | 38.46 | 8 |
| 8 | 30 | 30 | score-only | 23129.60 | 39.64 | 8 |
| 8 | 40 | 40 | diverse | 29824.62 | 38.21 | 8 |
| 8 | 40 | 40 | score-only | 30895.62 | 38.36 | 8 |
| 8 | 60 | 60 | diverse | 44392.64 | 38.11 | 8 |
| 8 | 60 | 60 | score-only | 45106.96 | 37.85 | 8 |
| 8 | 100 | 83 | diverse | 63083.51 | 37.02 | 8 |
| 8 | 100 | 83 | score-only | 63083.51 | 37.02 | 8 |

### seed-18473921-seat-1-turn-6

Generation 50.40ms; heuristic 201.52ms.

| Samples | Candidate cap | Actual candidates | Composition | Total ms | Reply prediction MAE | Chosen score minus actual reply |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | 10 | 10 | diverse | 7938.97 | 13.18 | -39 |
| 16 | 10 | 10 | diverse | 15359.51 | 16.42 | -32 |
| 32 | 10 | 10 | diverse | 25123.82 | 14.99 | -32 |
| 64 | 10 | 10 | diverse | 41812.36 | 15.77 | -37 |
| 128 | 10 | 10 | diverse | 101707.58 | 15.75 | -37 |
| 8 | 10 | 10 | diverse | 7938.97 | 13.18 | -39 |
| 8 | 10 | 10 | score-only | 8132.13 | 11.72 | -36 |
| 8 | 20 | 20 | diverse | 15028.31 | 13.87 | -36 |
| 8 | 20 | 20 | score-only | 18048.71 | 12.32 | -36 |
| 8 | 30 | 30 | diverse | 22414.16 | 14.79 | -36 |
| 8 | 30 | 30 | score-only | 27364.32 | 12.13 | -36 |
| 8 | 40 | 40 | diverse | 31328.66 | 15.38 | -36 |
| 8 | 40 | 40 | score-only | 36074.04 | 13.17 | -36 |
| 8 | 60 | 60 | diverse | 49783.05 | 15.61 | -36 |
| 8 | 60 | 60 | score-only | 53339.17 | 12.58 | -36 |
| 8 | 100 | 100 | diverse | 85100.52 | 15.33 | -36 |
| 8 | 100 | 100 | score-only | 87171.94 | 11.95 | -36 |

Larger sample counts did not consistently reduce error on these two positions. Balanced therefore ranks every legal move heuristically with zero samples. Fast also evaluates all moves, but has a 500ms endgame budget rather than 1500ms. Deep targets 16 samples × 10 diverse candidates within 12 seconds; incomplete common rounds are discarded. Deep is exploratory, not a demonstrated stronger preset. Memory before/after the sweep: 18.23 / 154.79 MiB (heap snapshots, not a peak-memory measurement). DAWG cache hits/misses/clears: {"hits":110060753,"misses":10791808,"clears":658}.

## Position suite

Names cover 14 scenarios; lead comparisons deliberately share the same board/rack. Complete positions, selected/raw placements, breakdowns and eight post-hoc reply samples are recorded in positions.json. These are diagnostic training positions, not additional independent holdout wins. The safe/danger label describes the feature being probed, not an assertion that every case must sacrifice points.

| Case | Raw move / score | Chosen move / score | Evaluation | Sampled reply |
| --- | --- | --- | --- | --- |
| safe-vs-dangerous | EISKRAÐ / 78 | SKEIÐAR / 78 | 51.03 | 64.63 |
| TW-exposure | GRIPAR / 54 | GRIPAR / 54 | 40.67 | 39.75 |
| DW-exposure | ÓLEKKERU / 122 | ÓLEKKERU / 122 | 109.22 | 60.13 |
| parallel-lane | DÁR / 31 | DÁR / 31 | 15.81 | 44.50 |
| front-hook | VITJI / 42 | VITJIR / 34 | 29.21 | 49.63 |
| back-hook | HEXUÐ / 41 | HEXUÐ / 41 | 32.56 | 58.63 |
| blank-preservation | NAFNANS / 68 | NAFNANS / 68 | 56.02 | 48.00 |
| rack-leave | GIMI / 34 | GIMI / 34 | 30.15 | 42.50 |
| ahead-80 | GIMI / 34 | GIMI / 34 | 30.15 | 42.50 |
| behind-80 | GIMI / 34 | GIMI / 34 | 27.93 | 42.50 |
| early | ÖXULS / 50 | ÖXULS / 50 | 29.51 | 33.25 |
| midgame | ÝJAN / 32 | ÝJAN / 32 | 24.71 | 60.25 |
| late | FÍIN / 30 | ÚFNIÐ / 30 | 27.81 | 80.75 |
| near-exact-endgame | GASÆÐANNA / 45 | GASÆÐANNA / 45 | 38.02 | 36.00 |

## Endgame and performance limits

An initial unbounded 50,000-node stress attempt exhausted a roughly 2GB Node heap. It is not a successful measurement. The production search now bounds cached moves and transposition entries and checks the time deadline inside legal generation. The independent exhaustive endgame oracle remains the correctness reference.

| Seed / seat / turn | Node cap | Visited | ms | Completed depth | Exact | Move-cache size | TT hits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 18473921/0/20 | 500 | 501 | 452.95 | 0 | false | 3609 | 0 |
| 18473921/0/20 | 5000 | 3619 | 1001.78 | 1 | false | 13977 | 0 |
| 18473921/0/20 | 50000 | 3623 | 1040.13 | 1 | false | 15480 | 0 |
| 18473921/1/18 | 500 | 501 | 263.69 | 1 | false | 5189 | 0 |
| 18473921/1/18 | 5000 | 5001 | 332.43 | 1 | false | 5189 | 0 |
| 18473921/1/18 | 50000 | 5205 | 1002.44 | 1 | false | 18115 | 0 |
| 18473921/0/24 | 500 | 501 | 67.09 | 0 | false | 858 | 0 |
| 18473921/0/24 | 5000 | 1131 | 1000.73 | 1 | false | 2630 | 0 |
| 18473921/0/24 | 50000 | 1129 | 1003.87 | 1 | false | 2620 | 0 |
| 18473921/1/24 | 500 | 501 | 35.98 | 0 | false | 858 | 0 |
| 18473921/1/24 | 5000 | 1153 | 1001.84 | 1 | false | 2847 | 0 |
| 18473921/1/24 | 50000 | 1053 | 1000.68 | 1 | false | 2088 | 0 |

An incomplete endgame is explicitly labeled incomplete and does not replace the heuristic choice with a claimed exact result. Full-game weight comparisons use a deterministic 500-node cap with no clock cutoff. Production permits more nodes within the selected time budget, so full-game results isolate the weights rather than validate every production budget setting.

Final-test decision latency (all candidate turns):

| Strategy | Median | P90 | P95 | Worst |
| --- | --- | --- | --- | --- |
| Old | 73.71ms | 523.84ms | 755.59ms | 10108.14ms |
| Selected | 64.92ms | 484.40ms | 760.90ms | 20294.54ms |

Measurements came from a two-CPU-quota Linux container with some concurrent checks. They are not physical-iPad latency measurements. Browser validation uses touch/mobile WebKit fixtures. No exchanges, challenges, resignation or time penalties are modeled in self-play; this limits competitive-strength claims. Old v4 evaluation is frozen under benchmark/legacy; both strategies share the exact legal generator and semantics-preserving bounded DAWG transition cache.

Reproduce using the commands in README.md. The committed experiment is sealed; use fresh holdout seeds before further optimization. The production default is Optimized, Max points still returns the highest actual score, and automation uses the selected strategic bestMove.

## Interleaved position timing check

42 decisions per strategy, cold DAWG transition cache per solve, interleaved order over 14 TRAIN scenarios, three repeats, after other CPU-heavy jobs completed; no physical iPad claim.

| Strategy / component | Median ms | P90 ms | P95 ms | Worst ms |
| --- | --- | --- | --- | --- |
| old / generationMs | 9.96 | 28.47 | 29.29 | 71.44 |
| old / strategyMs | 51.62 | 196.08 | 225.61 | 470.85 |
| old / simulationMs | 0.00 | 0.00 | 0.00 | 0.00 |
| old / totalMs | 63.75 | 223.16 | 254.22 | 537.65 |
| optimized / generationMs | 10.08 | 27.73 | 29.00 | 70.80 |
| optimized / strategyMs | 51.65 | 203.36 | 254.26 | 456.65 |
| optimized / simulationMs | 0.00 | 0.01 | 0.01 | 0.02 |
| optimized / totalMs | 61.86 | 231.49 | 283.28 | 527.45 |

This smaller interleaved check shows little median speed difference and a worse selected P95. The validation latency tie-break was made before test evaluation; timing under shared CPU load is noisy and is not evidence of a large performance advantage.

## Verification

86 Node tests passed with no failures. Production build succeeded. Local mobile WebKit passed portrait, landscape, worker fallback, default Optimized settings, strategic automatic choice, visible-client staging/Leika, and duplicate/toggle checks. The independent exact endgame oracle and exhaustive small-board legal generator checks remain passing. Deployment verification is reported with the release commit and bookmarklet.
