# Strategy audit and protocol

Source baseline: v4.0.0, `876e751242deb12b0389689c1484089750c404a1`. The original scoring strategy is preserved in `benchmark/legacy/strategy.js` and its original endgame search in `benchmark/legacy/endgame.js`. Cooperative UI waits are omitted in headless games; legality and evaluation are unchanged.

Central production structures:
- `src/strategy-config.js`: score, expected reply, P90, leave, board control, premium/lane/hook/parallel penalties; vowel target, frequency/usefulness/awkwardness, duplicates, blanks; lead thresholds and multipliers; phase scaling; analysis samples/candidates/budgets; geometric feature constants and search limits.
- `src/optimized-strategy.js`: selected weights, four phase maps, five lead buckets, regularized Icelandic letter/pair model and analysis presets. Generated only after validation.
- `benchmark/search.js`: declared broad search ranges and seeded proposals. Unidentifiable parameters in zero-sample full-game trials (opponent score/P90) are not claimed to be calibrated by those trials; sampling is measured separately on positions.

Protocol fixed before search:
1. 100 baseline games, 10 seeds × five opponents × two seats. Pool: Greedy, frozen Existing, frozen Defensive, frozen Aggressive, initial Best-so-far (Existing until search provides a better challenger).
2. Fit leave model only from baseline TRAIN traces. Ridge penalty 120; phase/leave-size residuals; pairs require 30 observations, shrinkage n/(n+200), capped ±2.
3. Reference plus seven seeded wide random proposals, then four bounded local proposals around the top two. Ten games per proposal across both seats and the full pool. Local search replaces Best-so-far with the training leader. This is a screening budget, not proof of strength.
4. Top eight enter a full paired-seat round robin: 56 games on a fresh TRAIN seed.
5. Three tournament finalists play 100 VALIDATION games each against a fixed pool including the tournament leader. Win rate dominates differential. Paired 95% confidence intervals of win-rate differences including zero are treated conservatively as uncertain; practical speed, simplicity and variance break ties.
6. Lock configuration and fixed opponent pool before touching FINAL TEST. Old and selected strategies each play 100 games on the same ten untouched test seeds and both seats. No retuning from those games.

Full-game comparisons use zero sampled racks and the same deterministic 500-node endgame cap, with no wall-clock cutoff. This isolates strategy weights and makes decisions reproducible. Production sampling presets are selected using independent TRAIN-position cost/accuracy sweeps. No claim is made that sampled-mode win rates were measured by zero-sample games. Standard 15×15 board, actual Icelandic DAWG and tile distribution. No bot exchanges tiles; it passes when it has no chosen placement. Six passes terminate with rack deductions. Time penalties, challenges and resignation are excluded. This is controlled self-play, not a complete model of human play.

Draws use one fixed shuffled bag per paired seed. Different choices can consume different numbers of tiles, so subsequent player racks can diverge; the shuffled draw order remains identical. Rack samples use a separate seed derived from game seed and turn, never the draw PRNG.

Confidence: Wilson intervals are shown alongside a paired seed/opponent block bootstrap (2,000 resamples). The latter acknowledges seat correlation. Final old/new differences use matched block bootstrap. Screening and round-robin sample counts are intentionally small under a two-CPU budget; no claim of mathematical optimality is made.

An initial pre-cache pilot was stopped at a saved checkpoint and retained separately. Baseline was restarted from scratch after equivalent DAWG caching; pilot outcomes do not enter optimization, model fitting or final results.

Production analysis presets were fixed before FINAL TEST: Fast and Balanced use zero samples and all-move heuristic ranking, with 500ms and 1500ms endgame budgets respectively. Deep targets 16 samples across 10 diverse candidates within 12 seconds. Sampling priors are restored to v4 because zero-sample games cannot identify them. Production endgame has bounded caches and a deadline checked inside generation; the separate deterministic full-game experiment retains its 500-node cap.
