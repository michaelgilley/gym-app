# Gym App

## Rules

- When editing `index.html`, update the footer date to today's date (YYYY-MM-DD). The footer is near the end of the file inside a `<footer>` tag. Replace the existing date with today's date.

## Workflow: TDD by default

For any change beyond a trivial typo or copy tweak, default to test-driven development:

1. **Plan first.** Write the plan in chat — what's changing, the test cases that will prove it works, the edge cases. Wait for explicit agreement before touching code.
2. **Failing tests next.** Add Playwright specs (or unit tests where appropriate) that encode the agreed behavior. Run them and confirm they fail for the expected reason.
3. **Minimum code to green.** Implement just enough to make the new tests pass without breaking the rest of the suite. No drive-by refactors, no speculative abstractions, no scope creep beyond what the plan covered.
4. **Verify the full suite is green** before declaring done. The pre-push hook (`.git/hooks/pre-push`) runs the suite automatically; don't bypass with `--no-verify` unless explicitly told to.

If a plan reveals the change is too small to be worth testing (e.g. a copy fix, dependency bump), say so up front and skip step 2 — but still surface the plan before changing code.
