# Gym App

## Rules

- When editing `index.html`, update the footer date to today's date (YYYY-MM-DD). The footer is near the end of the file inside a `<footer>` tag. Replace the existing date with today's date.
- When you change the day workout tables in `index.html` (exercises, order, sets, reps), update `PROGRAM.md` to match. `PROGRAM.md` is the canonical spec of the current program; read it first instead of parsing the day tables.

## Workflow: TDD by default

For any change beyond a trivial typo or copy tweak, default to test-driven development:

1. **Plan first.** Write the plan in chat — what's changing, the test cases that will prove it works, the edge cases. Wait for explicit agreement before touching code.
2. **Failing tests next.** Add Playwright specs (or unit tests where appropriate) that encode the agreed behavior. Run them and confirm they fail for the expected reason.
3. **Minimum code to green.** Implement just enough to make the new tests pass without breaking the rest of the suite. No drive-by refactors, no speculative abstractions, no scope creep beyond what the plan covered.
4. **Verify the full suite is green** before declaring done. The pre-push hook (`.git/hooks/pre-push`) runs the suite automatically; don't bypass with `--no-verify` unless explicitly told to.

If a plan reveals the change is too small to be worth testing (e.g. a copy fix, dependency bump), say so up front and skip step 2 — but still surface the plan before changing code.

## Architecture (read this before exploring)

Single-file PWA. Everything is in `index.html`: CSS in one `<style>`, HTML `<body>`, JS in one `<script>`. Supporting files: `sw.js`, `manifest.json`, icons. Tests are Playwright in `tests/` (one project, `mobile-safari` / webkit; served via `python3 -m http.server` on `GYM_APP_PORT`, default 8765).

* **Current program:** `PROGRAM.md` is the source of truth (5 days, exercises, sets/reps, muscle map, RIR, progression). Read it instead of parsing the day tables.
* **Days:** five `<div class="tab-content" data-day="A..E">` blocks. A=Mon (push), B=Tue (squat), C=Wed (pull), D=Thu (hinge), E=Fri (arms/carries). Each day has grouped `workout-section` blocks (Warmup / Main lift / Secondary / Accessories / Ab Finisher / Finisher / Cooldown / etc.), each a `<table class="workout-table">` of `<tr>` rows.
* **Exercise identity = the `data-exercise` string** on `<input class="weight-input">`, NOT the visible name (e.g. display "Leg extension machine" but `data-exercise="Leg extension"`). IndexedDB history is keyed by this string. Moving a lift to another day preserves its history; renaming the string orphans the history.
* `data-barbell="true"` on an input turns on the plate calculator; it needs a matching entry in **`PLATE_CONFIG`** (in the `<script>`) or plate buttons won't render.
* **Three JS registries to keep in sync** when adding/moving/renaming exercises: `PLATE_CONFIG` (barbell inputs), `PROGRESS_EXERCISES` (the 6 lifts on the Progress card, in DOM order), `DAY_META` (header title/kind/weekday per day) + `WEEKDAY_TO_DAY`.
* **Tests pin some exercises to a day** — update these when exercises move: `plate-buttons.spec.ts` (barbell lifts, per day), `last-weight-chip.spec.ts` (Day A), `load-weights-coverage.spec.ts` (Day B), `progress-card.spec.ts` (mirrors `PROGRESS_EXERCISES`), `table-layout.spec.ts` (Day A visual snapshot — regenerate with `npx playwright test table-layout --update-snapshots` after any Day A table change).
* Running tests binds a local port; if the sandbox blocks it, run with the sandbox disabled.
