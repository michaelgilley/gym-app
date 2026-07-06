GYM WORKOUT TRACKER PWA
=======================

A single-file Progressive Web App for tracking gym workouts. Weights persist
in IndexedDB; works offline once cached.

This README stays short on purpose. The two things that change often live in
their own files, so update those, not this:

  PROGRAM.md   The current workout program (days, exercises, sets/reps, muscle
               map, RIR, progression). Source of truth for the program.
  CLAUDE.md    Architecture + conventions (how index.html is structured, the
               data-exercise identity key, the JS registries to keep in sync,
               which tests pin which exercises). Read before editing code.

RUN
---
  python3 -m http.server 8765
  open http://localhost:8765/index.html

  (PWA install needs HTTPS, except on localhost.)

TEST
----
  npx playwright test              # full suite (webkit / mobile-safari)
  npx playwright test <file>       # one spec
  npx playwright test table-layout --update-snapshots   # after a Day A change

FILES
-----
  index.html      The whole app: HTML + CSS (<style>) + JS (<script>) inline.
  sw.js           Service worker (cache-first). Bump CACHE_VERSION to push updates.
  manifest.json   PWA manifest.
  icon-*.png      App icons.
  tests/          Playwright specs.
  PROGRAM.md      Current program (see above).
  CLAUDE.md       Architecture + conventions (see above).

DATA
----
  IndexedDB, keyed by the input's data-exercise string. Moving an exercise
  between days keeps its history; renaming that string orphans it.
